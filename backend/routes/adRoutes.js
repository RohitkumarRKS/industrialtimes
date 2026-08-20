const express = require('express');
const router = express.Router();
const Ad = require('../models/Ad');
const { protect, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

const SLOT_DIMENSIONS = {
  'leaderboard':        { width: 728, height: 90  },
  'article-inline':     { width: 728, height: 90  },
  'left-skyscraper':    { width: 160, height: 600 },
  'right-half-page':    { width: 300, height: 600 },
  'mobile-banner':      { width: 300, height: 50 },
  'mobile-rectangle':   { width: 300, height: 250 },
  'mobile-inline':      { width: 300, height: 200 },
  'top-bottom-banner':  { width: 970, height: 90  },
  'in-feed-rectangle':  { width: 336, height: 280 },
  'inline-news-footer': { width: 728, height: 90  },
  'popup':              { width: 300, height: 250 },
  'colombia-ad':        { width: 728, height: 90  },
  'mobile-leaderboard': { width: 300, height: 100 },
};

/* GET /api/ads — Public, returns active ads */
router.get('/', async (req, res) => {
  const { slot, category, state, city } = req.query;
  try {
    const today = new Date().toISOString().slice(0, 10);

    const where = {
      active: true,
      [Op.and]: [
        { [Op.or]: [{ startDate: null }, { startDate: { [Op.lte]: today } }] },
        { [Op.or]: [{ endDate:   null }, { endDate:   { [Op.gte]: today } }] }
      ]
    };

    if (slot) where.slot = slot;
    if (category) {
      where[Op.or] = [{ category }, { category: null }];
    }

    const ads = await Ad.findAll({ where });

    const shuffle = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    let stateCityAds = [];
    let stateOnlyAds = [];
    let globalAds = [];

    if (state || city) {
      if (state && city) {
        stateCityAds = ads.filter(a => 
          a.targetState && a.targetState.toLowerCase() === state.toLowerCase() &&
          a.targetCity && a.targetCity.toLowerCase() === city.toLowerCase()
        );
      }
      if (state) {
        stateOnlyAds = ads.filter(a => 
          a.targetState && a.targetState.toLowerCase() === state.toLowerCase() &&
          (!a.targetCity || a.targetCity.trim() === '')
        );
      }
    }

    globalAds = ads.filter(a => !a.targetState || a.targetState.trim() === '');

    shuffle(stateCityAds);
    shuffle(stateOnlyAds);
    shuffle(globalAds);

    let matchedAds = [];
    if (stateCityAds.length > 0) {
      matchedAds = stateCityAds;
    } else if (stateOnlyAds.length > 0) {
      matchedAds = stateOnlyAds;
    } else {
      matchedAds = globalAds;
    }
    res.json(matchedAds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* GET /api/ads/availability */
router.get('/availability', async (req, res) => {
  const { slot, state, city } = req.query;
  try {
    const where = {};
    if (slot) where.slot = slot;
    if (state) where.targetState = state;
    if (city) where.targetCity = city;

    const ads = await Ad.findAll({
      where,
      attributes: ['id', 'slot', 'targetState', 'targetCity', 'startDate', 'endDate', 'active', 'advertiser', 'label'],
      order: [['startDate', 'ASC']]
    });

    let pendingRequests = [];
    try {
      const AdRequest = require('../models/AdRequest');
      const pendingWhere = { status: 'pending' };
      if (slot) pendingWhere.slot = slot;
      if (state) pendingWhere.targetState = state;
      if (city) pendingWhere.targetCity = city;
      const reqs = await AdRequest.findAll({
        where: pendingWhere,
        attributes: ['id', 'slot', 'targetState', 'targetCity', 'startDate', 'endDate', 'adTitle', 'companyName', 'status'],
        order: [['startDate', 'ASC']]
      });
      pendingRequests = reqs.map(r => ({ ...r.get({ plain: true }), type: 'pending' }));
    } catch (e) { /* AdRequest table may not exist yet */ }

    const bookings = [
      ...ads.map(a => ({ ...a.get({ plain: true }), type: a.active ? 'booked' : 'inactive' })),
      ...pendingRequests
    ];

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* GET /api/ads/all (Admin) */
router.get('/all', protect, authorize('superadmin'), async (req, res) => {
  try {
    const ads = await Ad.findAll({ order: [['slot', 'ASC'], ['createdAt', 'DESC']] });
    res.json(ads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* POST /api/ads (Admin — create or update) */
router.post('/', protect, authorize('superadmin', 'corporate', 'author'), async (req, res) => {
  const { id, slot, imageUrl, link, label, advertiser, category, targetState, targetCity, startDate, endDate, active, isGoogleAd, googleAdCode, isSponsored } = req.body;

  const ALLOWED_PRIVATE_SLOTS = ['leaderboard', 'right-half-page', 'article-inline'];
  if (req.user.role !== 'superadmin' && !ALLOWED_PRIVATE_SLOTS.includes(slot)) {
    return res.status(403).json({ message: 'You are not authorized to upload advertisements for Google Ad slots.' });
  }

  const dims = SLOT_DIMENSIONS[slot] || { width: 728, height: 90 };

  try {
    if (active && targetState && targetCity && startDate && endDate) {
      const overlappingAd = await Ad.findOne({
        where: {
          slot,
          targetState,
          targetCity,
          active: true,
          id: { [Op.ne]: id || 'nonexistent' },
          startDate: { [Op.lte]: endDate },
          endDate: { [Op.gte]: startDate }
        }
      });

      if (overlappingAd) {
        return res.status(409).json({ message: 'Cannot save: An active ad already exists for this slot, location, and dates.' });
      }
    }

    let ad = id ? await Ad.findByPk(id) : null;
    if (ad) {
      await ad.update({ slot, imageUrl, link, label, advertiser, category, targetState: targetState || null, targetCity: targetCity || null, startDate: startDate || null, endDate: endDate || null, active, isGoogleAd: !!isGoogleAd, googleAdCode: googleAdCode || '', isSponsored: !!isSponsored, ...dims });
      res.json(ad);
    } else {
      const newId = `${slot}_${Date.now()}`;
      ad = await Ad.create({ id: newId, slot, imageUrl, link, label, advertiser, category, targetState: targetState || null, targetCity: targetCity || null, startDate: startDate || null, endDate: endDate || null, active, isGoogleAd: !!isGoogleAd, googleAdCode: googleAdCode || '', isSponsored: !!isSponsored, ...dims });
      res.status(201).json(ad);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* PATCH /api/ads/:id/toggle */
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

/* DELETE /api/ads/:id */
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

/* POST /api/ads/:id/impression */
router.post('/:id/impression', async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    if (ad) await ad.increment('impressions');
    res.json({ ok: true });
  } catch { res.json({ ok: false }); }
});

/* POST /api/ads/:id/click */
router.post('/:id/click', async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    if (ad) await ad.increment('clicks');
    res.json({ ok: true });
  } catch { res.json({ ok: false }); }
});

module.exports = router;
