const express = require('express');
const router = express.Router();
const PromoCode = require('../models/PromoCode');
const { protect, authorize } = require('../middleware/auth');

// ── ADMIN: Get all promo codes ──
router.get('/', protect, authorize('superadmin'), async (req, res) => {
  try {
    const promos = await PromoCode.findAll({ order: [['createdAt', 'DESC']] });
    res.json(promos);
  } catch (err) {
    console.error('Fetch promo codes error:', err);
    res.status(500).json({ error: 'Failed to fetch promo codes.' });
  }
});

// ── ADMIN: Create a promo code ──
router.post('/', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { code, discountType, discountValue, applicableTo, maxUses, minOrderAmount, startDate, endDate, isActive } = req.body;

    if (!code || !discountValue) {
      return res.status(400).json({ error: 'Code and discount value are required.' });
    }

    const existing = await PromoCode.findOne({ where: { code: code.trim().toUpperCase() } });
    if (existing) {
      return res.status(409).json({ error: 'A promo code with this code already exists.' });
    }

    const promo = await PromoCode.create({
      code: code.trim().toUpperCase(),
      discountType: discountType || 'percentage',
      discountValue: parseFloat(discountValue),
      applicableTo: applicableTo || 'all',
      maxUses: maxUses === '' || maxUses === undefined ? null : parseInt(maxUses),
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0.00,
      startDate: startDate || null,
      endDate: endDate || null,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json(promo);
  } catch (err) {
    console.error('Create promo code error:', err);
    res.status(500).json({ error: `Failed to create promo code: ${err.message}` });
  }
});

// ── ADMIN: Update a promo code ──
router.put('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { code, discountType, discountValue, applicableTo, maxUses, minOrderAmount, startDate, endDate, isActive } = req.body;
    const promo = await PromoCode.findByPk(req.params.id);

    if (!promo) {
      return res.status(404).json({ error: 'Promo code not found.' });
    }

    if (code && code.trim().toUpperCase() !== promo.code) {
      const existing = await PromoCode.findOne({ where: { code: code.trim().toUpperCase() } });
      if (existing) {
        return res.status(409).json({ error: 'A promo code with this code already exists.' });
      }
      promo.code = code.trim().toUpperCase();
    }

    if (discountType !== undefined) promo.discountType = discountType;
    if (discountValue !== undefined) promo.discountValue = parseFloat(discountValue);
    if (applicableTo !== undefined) promo.applicableTo = applicableTo;
    promo.maxUses = maxUses === '' || maxUses === undefined || maxUses === null ? null : parseInt(maxUses);
    if (minOrderAmount !== undefined) promo.minOrderAmount = parseFloat(minOrderAmount);
    promo.startDate = startDate || null;
    promo.endDate = endDate || null;
    if (isActive !== undefined) promo.isActive = isActive;

    await promo.save();
    res.json(promo);
  } catch (err) {
    console.error('Update promo code error:', err);
    res.status(500).json({ error: `Failed to update promo code: ${err.message}` });
  }
});

// ── ADMIN: Delete a promo code ──
router.delete('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const promo = await PromoCode.findByPk(req.params.id);
    if (!promo) {
      return res.status(404).json({ error: 'Promo code not found.' });
    }
    await promo.destroy();
    res.json({ message: 'Promo code deleted successfully.' });
  } catch (err) {
    console.error('Delete promo code error:', err);
    res.status(500).json({ error: 'Failed to delete promo code.' });
  }
});

// ── PUBLIC: Validate promo code ──
router.post('/validate', async (req, res) => {
  try {
    const { code, platform, originalAmount } = req.body;
    if (!code) {
      return res.status(400).json({ valid: false, error: 'Promo code is required.' });
    }
    if (!platform) {
      return res.status(400).json({ valid: false, error: 'Platform target is required.' });
    }
    if (originalAmount === undefined || isNaN(parseFloat(originalAmount))) {
      return res.status(400).json({ valid: false, error: 'Original amount is required and must be a number.' });
    }

    const promo = await PromoCode.findOne({
      where: {
        code: code.trim().toUpperCase()
      }
    });

    if (!promo) {
      return res.status(400).json({ valid: false, error: 'Invalid promo code.' });
    }

    if (!promo.isActive) {
      return res.status(400).json({ valid: false, error: 'This promo code is currently inactive.' });
    }

    const now = new Date();
    if (promo.startDate && new Date(promo.startDate) > now) {
      return res.status(400).json({ valid: false, error: 'This promo code is not active yet.' });
    }

    if (promo.endDate && new Date(promo.endDate) < now) {
      return res.status(400).json({ valid: false, error: 'This promo code has expired.' });
    }

    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ valid: false, error: 'Usage limit reached for this promo code.' });
    }

    const amount = parseFloat(originalAmount);
    if (amount < parseFloat(promo.minOrderAmount)) {
      return res.status(400).json({ valid: false, error: `Minimum order amount to use this code is ₹${parseFloat(promo.minOrderAmount).toFixed(2)}.` });
    }

    // Check scope applicability ('all', 'membership', 'podcast', 'webinar', 'reporter', 'ad')
    if (promo.applicableTo !== 'all' && promo.applicableTo !== platform) {
      return res.status(400).json({ valid: false, error: 'This promo code is not applicable for this service.' });
    }

    // Calculate discount
    let discountAmount = 0.00;
    if (promo.discountType === 'percentage') {
      discountAmount = amount * (parseFloat(promo.discountValue) / 100);
    } else {
      discountAmount = parseFloat(promo.discountValue);
    }

    // Cap discount to original amount
    if (discountAmount > amount) {
      discountAmount = amount;
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    res.json({
      valid: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: parseFloat(promo.discountValue),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2))
    });
  } catch (error) {
    console.error('Validate promo code error:', error);
    res.status(500).json({ valid: false, error: 'Internal server validation error.' });
  }
});

module.exports = router;
