const express = require('express');
const router = express.Router();
const AdRequest = require('../models/AdRequest');
const Ad = require('../models/Ad');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

/* ─────────────────────────────────────────────────────────────────
   SLOT → dimension mapping (mirrors adRoutes.js)
───────────────────────────────────────────────────────────────── */
const SLOT_DIMENSIONS = {
  'leaderboard':      { width: 728,  height: 90  },
  'left-skyscraper':  { width: 160,  height: 600 },
  'right-half-page':  { width: 300,  height: 600 },
  'popup':            { width: 300,  height: 250 },
};

/* ─────────────────────────────────────────────────────────────────
   POST /api/ad-requests
   Corporate user submits an ad request
───────────────────────────────────────────────────────────────── */
router.post('/', protect, authorize('corporate'), async (req, res) => {
  const { adTitle, adDescription, slot, imageUrl, link, duration, budget, companyName, contactEmail, phone } = req.body;

  if (!adTitle) {
    return res.status(400).json({ message: 'Ad title is required' });
  }

  try {
    const adRequest = await AdRequest.create({
      userId: req.user.id,
      companyName: companyName || req.user.companyName || '',
      contactEmail: contactEmail || req.user.email,
      phone: phone || req.user.phone || '',
      adTitle,
      adDescription: adDescription || '',
      slot: slot || 'leaderboard',
      imageUrl: imageUrl || '',
      link: link || '',
      duration: duration || '1 month',
      budget: budget || '',
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

    // Update request status
    adRequest.status = 'approved';
    adRequest.adminNotes = adminNotes || 'Approved by admin';
    await adRequest.save();

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
        startDate: null,
        endDate: null,
        active: true,
        ...dims
      });
    }

    res.json({ message: 'Ad request approved and ad published!', adRequest });
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
