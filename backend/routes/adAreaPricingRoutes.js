const express = require('express');
const router = express.Router();
const AdAreaPricing = require('../models/AdAreaPricing');
const { protect, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

/* GET /api/ad-area-pricing */
router.get('/', protect, authorize('superadmin'), async (req, res) => {
  try {
    const records = await AdAreaPricing.findAll({
      order: [['state', 'ASC'], ['city', 'ASC'], ['slot', 'ASC']]
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* POST /api/ad-area-pricing */
router.post('/', protect, authorize('superadmin'), async (req, res) => {
  const { state, city, slot, reporterPricePerDay, corporatePricePerDay } = req.body;

  if (!state || !slot || reporterPricePerDay === undefined || corporatePricePerDay === undefined) {
    return res.status(400).json({ message: 'State, slot, reporterPricePerDay, and corporatePricePerDay are required.' });
  }

  const reporterPrice = parseFloat(reporterPricePerDay);
  const corporatePrice = parseFloat(corporatePricePerDay);

  if (isNaN(reporterPrice) || reporterPrice < 0 || isNaN(corporatePrice) || corporatePrice < 0) {
    return res.status(400).json({ message: 'Prices must be non-negative numbers.' });
  }

  const cityVal = city || '';

  try {
    let record = await AdAreaPricing.findOne({
      where: { state, city: cityVal, slot }
    });
    let created = false;

    if (!record) {
      record = await AdAreaPricing.create({
        state, city: cityVal, slot,
        reporterPricePerDay: reporterPrice,
        corporatePricePerDay: corporatePrice,
        isActive: true, updatedBy: req.user.id
      });
      created = true;
    } else {
      await record.update({
        reporterPricePerDay: reporterPrice,
        corporatePricePerDay: corporatePrice,
        isActive: true,
        updatedBy: req.user.id
      });
    }

    res.status(created ? 201 : 200).json({
      message: created ? 'Pricing created.' : 'Pricing updated.',
      record
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* POST /api/ad-area-pricing/bulk */
router.post('/bulk', protect, authorize('superadmin'), async (req, res) => {
  const { state, city, slots } = req.body;

  if (!state || !slots || typeof slots !== 'object') {
    return res.status(400).json({ message: 'State and slots object are required.' });
  }

  const cityVal = city || '';

  try {
    const results = [];

    for (const [slot, pricingObj] of Object.entries(slots)) {
      if (!pricingObj || typeof pricingObj !== 'object') continue;

      const reporterPrice = parseFloat(pricingObj.reporterPricePerDay);
      const corporatePrice = parseFloat(pricingObj.corporatePricePerDay);

      if (isNaN(reporterPrice) || reporterPrice < 0 || isNaN(corporatePrice) || corporatePrice < 0) {
        continue;
      }

      let record = await AdAreaPricing.findOne({
        where: { state, city: cityVal, slot }
      });
      let created = false;

      if (!record) {
        record = await AdAreaPricing.create({
          state, city: cityVal, slot,
          reporterPricePerDay: reporterPrice,
          corporatePricePerDay: corporatePrice,
          isActive: true, updatedBy: req.user.id
        });
        created = true;
      } else {
        await record.update({
          reporterPricePerDay: reporterPrice,
          corporatePricePerDay: corporatePrice,
          isActive: true,
          updatedBy: req.user.id
        });
      }

      results.push({ slot, reporterPrice, corporatePrice, created });
    }

    res.json({
      message: `Updated pricing for ${results.length} slot(s) in ${cityVal ? `${cityVal}, ` : ''}${state}.`,
      results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* DELETE /api/ad-area-pricing/:id */
router.delete('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const record = await AdAreaPricing.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: 'Pricing record not found.' });
    await record.destroy();
    res.json({ message: 'Pricing record deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* GET /api/ad-area-pricing/lookup */
router.get('/lookup', protect, async (req, res) => {
  const { state, city, slot } = req.query;
  if (!state || !slot) {
    return res.status(400).json({ message: 'State and slot are required query parameters.' });
  }
  try {
    const role = req.user.role;
    const pricePerDay = await AdAreaPricing.lookupPrice(state, city || '', slot, role);
    if (pricePerDay === null) {
      return res.status(404).json({ 
        message: `No pricing configured for ${city ? `${city}, ` : ''}${state} — ${slot}. Please contact admin.`,
        pricePerDay: null 
      });
    }
    res.json({ state, city: city || '', slot, pricePerDay });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* GET /api/ad-area-pricing/state/:state */
router.get('/state/:state', protect, async (req, res) => {
  try {
    const where = { state: req.params.state, isActive: true };
    if (req.query.city) where.city = req.query.city;
    const records = await AdAreaPricing.findAll({
      where,
      order: [['city', 'ASC'], ['slot', 'ASC']]
    });
    res.json({ state: req.params.state, records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
