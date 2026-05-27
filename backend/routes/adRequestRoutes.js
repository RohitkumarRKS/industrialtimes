const express = require('express');
const router = express.Router();
const AdRequest = require('../models/AdRequest');
const Ad = require('../models/Ad');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

/* ─────────────────────────────────────────────────────────────────
   SLOT → dimension mapping (mirrors adRoutes.js)
───────────────────────────────────────────────────────────────── */
const SLOT_DIMENSIONS = {
  'leaderboard':        { width: 728, height: 90  },
  'article-inline':     { width: 728, height: 90  },
  'left-skyscraper':    { width: 160, height: 600 },
  'right-half-page':    { width: 300, height: 600 },
  'mobile-banner':      { width: 300, height: 100 },
  'mobile-rectangle':   { width: 300, height: 250 },
  'mobile-inline':      { width: 300, height: 200 },
  'top-bottom-banner':  { width: 970, height: 90  },
  'in-feed-rectangle':  { width: 336, height: 280 },
  'inline-news-footer': { width: 728, height: 90  },
  'popup':              { width: 300, height: 250 },
};

/* ─────────────────────────────────────────────────────────────────
   POST /api/ad-requests
   Corporate user submits an ad request
───────────────────────────────────────────────────────────────── */
router.post('/', protect, authorize('corporate', 'author'), async (req, res) => {
  const { adTitle, adDescription, slot, imageUrl, link, duration, budget, companyName, contactEmail, phone, targetState, targetCity, startDate, endDate } = req.body;

  const ALLOWED_PRIVATE_SLOTS = ['leaderboard', 'right-half-page', 'article-inline'];
  if (req.user.role !== 'superadmin' && !ALLOWED_PRIVATE_SLOTS.includes(slot)) {
    return res.status(403).json({ message: 'You are not authorized to request advertisements for Google Ad slots.' });
  }

  if (!adTitle) {
    return res.status(400).json({ message: 'Ad title is required' });
  }
  if (!targetState || !targetCity) {
    return res.status(400).json({ message: 'Target state and city are required' });
  }
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required' });
  }

  try {
    // Check for overlaps in active Ads
    const overlappingAd = await Ad.findOne({
      where: {
        slot,
        targetState,
        targetCity,
        active: true,
        startDate: { [Op.lte]: endDate },
        endDate: { [Op.gte]: startDate }
      }
    });

    if (overlappingAd) {
      return res.status(409).json({ message: 'This slot is already booked for the selected location and dates.' });
    }

    // Check for overlaps in pending/approved AdRequests
    const overlappingRequest = await AdRequest.findOne({
      where: {
        slot,
        targetState,
        targetCity,
        status: { [Op.in]: ['pending', 'approved'] },
        startDate: { [Op.lte]: endDate },
        endDate: { [Op.gte]: startDate }
      }
    });

    if (overlappingRequest) {
      return res.status(409).json({ message: 'There is already a pending or approved request for this slot, location, and dates.' });
    }

    const adRequest = await AdRequest.create({
      userId: req.user.id,
      companyName: companyName || req.user.companyName || req.user.name || '',
      contactEmail: contactEmail || req.user.email,
      phone: phone || req.user.phone || '',
      adTitle,
      adDescription: adDescription || '',
      slot: slot || 'leaderboard',
      imageUrl: imageUrl || '',
      link: link || '',
      duration: duration || '1 month',
      budget: budget || '',
      targetState: targetState || '',
      targetCity: targetCity || '',
      startDate: startDate || null,
      endDate: endDate || null,
      status: 'pending'
    });

    res.status(201).json(adRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/ad-requests/my
   Get current user's ad requests
───────────────────────────────────────────────────────────────── */
router.get('/my', protect, async (req, res) => {
  try {
    const requests = await AdRequest.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/ad-requests/all
   Superadmin gets all ad requests
───────────────────────────────────────────────────────────────── */
router.get('/all', protect, authorize('superadmin'), async (req, res) => {
  try {
    const requests = await AdRequest.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   PATCH /api/ad-requests/:id/approve
   Superadmin approves — creates a real Ad from the request data
───────────────────────────────────────────────────────────────── */
router.patch('/:id/approve', protect, authorize('superadmin'), async (req, res) => {
  const { adminNotes } = req.body;

  try {
    const adRequest = await AdRequest.findByPk(req.params.id);
    if (!adRequest) {
      return res.status(404).json({ message: 'Ad request not found' });
    }

    // Check for overlapping active Ads before approving
    if (adRequest.targetState && adRequest.targetCity && adRequest.startDate && adRequest.endDate) {
      const overlappingAd = await Ad.findOne({
        where: {
          slot: adRequest.slot,
          targetState: adRequest.targetState,
          targetCity: adRequest.targetCity,
          active: true,
          startDate: { [Op.lte]: adRequest.endDate },
          endDate: { [Op.gte]: adRequest.startDate }
        }
      });

      if (overlappingAd) {
        return res.status(409).json({ message: 'Cannot approve: An active ad already exists for this slot, location, and dates.' });
      }
    }

    // Update request status
    adRequest.status = 'approved';
    adRequest.adminNotes = adminNotes || 'Approved by admin';
    
    // Create a real Ad from the request data (only if imageUrl is available)
    if (adRequest.imageUrl) {
      const dims = SLOT_DIMENSIONS[adRequest.slot] || { width: 728, height: 90 };
      const newAdId = `${adRequest.slot}_${Date.now()}`;
      await Ad.create({
        id: newAdId,
        slot: adRequest.slot,
        imageUrl: adRequest.imageUrl,
        link: adRequest.link || '',
        label: 'Sponsored',
        advertiser: adRequest.companyName || 'Corporate Partner',
        category: null,
        targetState: adRequest.targetState || null,
        targetCity: adRequest.targetCity || null,
        startDate: adRequest.startDate || null,
        endDate: adRequest.endDate || null,
        active: true,
        ...dims
      });
      
      adRequest.linkedAdId = newAdId;
    }
    
    await adRequest.save();

    res.json({ message: 'Ad request approved and ad published!', adRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   PATCH /api/ad-requests/:id/revoke
   Superadmin revokes an approved ad - deletes from Ad table and sets status
───────────────────────────────────────────────────────────────── */
router.patch('/:id/revoke', protect, authorize('superadmin'), async (req, res) => {
  const { adminNotes } = req.body;

  try {
    const adRequest = await AdRequest.findByPk(req.params.id);
    if (!adRequest) {
      return res.status(404).json({ message: 'Ad request not found' });
    }
    
    if (adRequest.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved requests can be revoked' });
    }

    if (adRequest.linkedAdId) {
      await Ad.destroy({ where: { id: adRequest.linkedAdId } });
    }

    adRequest.status = 'disabled';
    adRequest.adminNotes = adminNotes || 'Ad has been disabled/removed by superadmin';
    await adRequest.save();

    res.json({ message: 'Ad request disabled and ad removed from live site.', adRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   PATCH /api/ad-requests/:id/reject
   Superadmin rejects with notes
───────────────────────────────────────────────────────────────── */
router.patch('/:id/reject', protect, authorize('superadmin'), async (req, res) => {
  const { adminNotes } = req.body;

  try {
    const adRequest = await AdRequest.findByPk(req.params.id);
    if (!adRequest) {
      return res.status(404).json({ message: 'Ad request not found' });
    }

    adRequest.status = 'rejected';
    adRequest.adminNotes = adminNotes || 'Rejected by admin';
    await adRequest.save();

    res.json({ message: 'Ad request rejected.', adRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
