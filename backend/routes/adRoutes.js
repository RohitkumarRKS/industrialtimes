const express = require('express');
const router = express.Router();
const Ad = require('../models/Ad');
const { Op } = require('sequelize');
const { protect, authorize } = require('../middleware/auth');

/* ─────────────────────────────────────────────────────────────────
   SLOT → dimension mapping (single source of truth)
───────────────────────────────────────────────────────────────── */
const SLOT_DIMENSIONS = {
  'leaderboard':      { width: 728,  height: 90  },
  'left-skyscraper':  { width: 160,  height: 600 },
  'right-half-page':  { width: 300,  height: 600 },
  'popup':            { width: 300,  height: 250 },
};

/* ─────────────────────────────────────────────────────────────────
   GET /api/ads
   Public — returns active ads, filtered by slot and/or category
   Query params: ?slot=leaderboard  ?category=Manufacturing
───────────────────────────────────────────────────────────────── */
router.get('/', async (req, res) => {
  const { slot, category } = req.query;
  try {
    const today = new Date().toISOString().slice(0, 10);

    const where = {
      active: true,
      [Op.and]: [
        { [Op.or]: [{ startDate: null }, { startDate: { [Op.lte]: today } }] },
        { [Op.or]: [{ endDate:   null }, { endDate:   { [Op.gte]: today } }] },
      ]
    };

    if (slot) where.slot = slot;

    // Category targeting: match exact category OR global (null)
    if (category) {
      where[Op.or] = [{ category }, { category: null }];
    }

    const ads = await Ad.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(ads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/ads/all   (Admin only — returns all ads incl. inactive)
───────────────────────────────────────────────────────────────── */
router.get('/all', protect, authorize('superadmin'), async (req, res) => {
  try {
    const ads = await Ad.findAll({ order: [['slot', 'ASC'], ['createdAt', 'DESC']] });
    res.json(ads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   POST /api/ads   (Admin only — create or update)
───────────────────────────────────────────────────────────────── */
router.post('/', protect, authorize('superadmin'), async (req, res) => {
  const { id, slot, imageUrl, link, label, advertiser, category, startDate, endDate, active } = req.body;

  // Auto-set dimensions based on slot
  const dims = SLOT_DIMENSIONS[slot] || { width: 728, height: 90 };

  try {
    let ad = id ? await Ad.findByPk(id) : null;
    if (ad) {
      ad = await ad.update({ slot, imageUrl, link, label, advertiser, category, startDate: startDate || null, endDate: endDate || null, active, ...dims });
      res.json(ad);
    } else {
      const newId = `${slot}_${Date.now()}`;
      ad = await Ad.create({ id: newId, slot, imageUrl, link, label, advertiser, category, startDate: startDate || null, endDate: endDate || null, active, ...dims });
      res.status(201).json(ad);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   PATCH /api/ads/:id/toggle   (Admin — toggle active)
───────────────────────────────────────────────────────────────── */
router.patch('/:id/toggle', protect, authorize('superadmin'), async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Ad not found' });
    await ad.update({ active: !ad.active });
    res.json(ad);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   DELETE /api/ads/:id   (Admin only)
───────────────────────────────────────────────────────────────── */
router.delete('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Ad not found' });
    await ad.destroy();
    res.json({ message: 'Ad deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   POST /api/ads/:id/impression  (Public — count impression)
───────────────────────────────────────────────────────────────── */
router.post('/:id/impression', async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    if (ad) await ad.increment('impressions');
    res.json({ ok: true });
  } catch { res.json({ ok: false }); }
});

/* ─────────────────────────────────────────────────────────────────
   POST /api/ads/:id/click  (Public — count click)
───────────────────────────────────────────────────────────────── */
router.post('/:id/click', async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    if (ad) await ad.increment('clicks');
    res.json({ ok: true });
  } catch { res.json({ ok: false }); }
});

module.exports = router;
