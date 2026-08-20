const express = require('express');
const router = express.Router();
const AdRequest = require('../models/AdRequest');
const Ad = require('../models/Ad');
const User = require('../models/User');
const AdPricing = require('../models/AdPricing');
const AdRevenue = require('../models/AdRevenue');
const { protect, authorize } = require('../middleware/auth');
const { calculateAdPricing } = require('../utils/adPricingEngine');
const AdAreaPricing = require('../models/AdAreaPricing');
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

const activateAdForRequest = async (adRequest) => {
  let linkedAdId = adRequest.linkedAdId;
  let existingAd = null;
  if (linkedAdId) {
    existingAd = await Ad.findByPk(linkedAdId);
  }

  const dims = SLOT_DIMENSIONS[adRequest.slot] || { width: 728, height: 90 };

  if (!existingAd) {
    linkedAdId = `${adRequest.slot}_${Date.now()}`;
    await Ad.create({
      id: linkedAdId,
      slot: adRequest.slot,
      imageUrl: adRequest.imageUrl || '',
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
    adRequest.linkedAdId = linkedAdId;
    await adRequest.save();
  } else {
    await Ad.update({
      active: true,
      imageUrl: adRequest.imageUrl || '',
      link: adRequest.link || '',
      advertiser: adRequest.companyName || 'Corporate Partner',
      targetState: adRequest.targetState || null,
      targetCity: adRequest.targetCity || null,
      startDate: adRequest.startDate || null,
      endDate: adRequest.endDate || null,
      ...dims
    }, { where: { id: linkedAdId } });
  }
  return linkedAdId;
};


/* POST /api/ad-requests */
router.post('/', protect, authorize('corporate', 'author'), async (req, res) => {
  const { adTitle, adDescription, slot, imageUrl, link, duration, budget, companyName, contactEmail, phone, targetState, targetCity, startDate, endDate } = req.body;

  const ALLOWED_PRIVATE_SLOTS = ['leaderboard', 'right-half-page', 'article-inline'];
  if (req.user.role !== 'superadmin' && !ALLOWED_PRIVATE_SLOTS.includes(slot)) {
    return res.status(403).json({ message: 'You are not authorized to request advertisements for Google Ad slots.' });
  }

  if (!adTitle) return res.status(400).json({ message: 'Ad title is required' });
  if (!targetState || !targetCity) return res.status(400).json({ message: 'Target state and city are required' });
  if (!startDate || !endDate) return res.status(400).json({ message: 'Start date and end date are required' });

  try {
    const overlappingAd = await Ad.findOne({
      where: {
        slot, targetState, targetCity, active: true,
        startDate: { [Op.lte]: endDate },
        endDate: { [Op.gte]: startDate }
      }
    });

    if (overlappingAd) {
      return res.status(409).json({ message: 'This slot is already booked for the selected location and dates.' });
    }

    const overlappingRequest = await AdRequest.findOne({
      where: {
        slot, targetState, targetCity,
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
      adTitle, adDescription: adDescription || '',
      slot: slot || 'leaderboard',
      imageUrl: imageUrl || '', link: link || '',
      duration: duration || '1 month', budget: budget || '',
      targetState: targetState || '', targetCity: targetCity || '',
      startDate: startDate || null, endDate: endDate || null,
      status: 'pending'
    });

    let pricingResult = null;
    try {
      const adminPrice = await AdAreaPricing.lookupPrice(adRequest.targetState, adRequest.targetCity || '', adRequest.slot, req.user.role);

      if (adminPrice !== null) {
        const start = new Date(adRequest.startDate);
        const end = new Date(adRequest.endDate);
        const durationDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
        const baseAmount = Math.round(adminPrice * durationDays);
        const gstRate = 18;
        const gstAmount = Math.round(baseAmount * (gstRate / 100));
        const totalAmount = baseAmount + gstAmount;

        pricingResult = await AdPricing.create({
          adRequestId: adRequest.id,
          userId: req.user.id,
          baseAmount, gstRate, gstAmount, totalAmount,
          pricingFactors: {
            source: 'admin_area_pricing',
            pricePerDay: adminPrice,
            durationDays,
            state: adRequest.targetState,
            slot: adRequest.slot
          },
          status: 'pending_review',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      } else {
        const priceCalc = await calculateAdPricing({
          slot: adRequest.slot, startDate: adRequest.startDate, endDate: adRequest.endDate,
          targetState: adRequest.targetState, targetCity: adRequest.targetCity,
          imageUrl: adRequest.imageUrl, link: adRequest.link
        });

        pricingResult = await AdPricing.create({
          adRequestId: adRequest.id,
          userId: req.user.id,
          baseAmount: priceCalc.baseAmount, gstRate: priceCalc.gstRate,
          gstAmount: priceCalc.gstAmount, totalAmount: priceCalc.totalAmount,
          pricingFactors: priceCalc.factors,
          status: 'pending_review',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      }
    } catch (pricingErr) {
      console.error('Auto-pricing failed (non-blocking):', pricingErr.message);
    }

    res.status(201).json({ adRequest, pricing: pricingResult });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* GET /api/ad-requests/my */
router.get('/my', protect, async (req, res) => {
  try {
    const requests = await AdRequest.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    const enriched = await Promise.all(requests.map(async (r) => {
      const plain = r.get({ plain: true });
      try {
        const pricing = await AdPricing.findOne({ where: { adRequestId: r.id } });
        plain.pricing = pricing ? pricing.get({ plain: true }) : null;
      } catch (err) {
        console.error(`Error loading pricing for request ${r.id}:`, err.message);
        plain.pricing = null;
      }

      try {
        const user = await User.findByPk(r.userId, { attributes: ['role'] });
        plain.userRole = user ? user.role : 'corporate';
      } catch (err) {
        console.error(`Error loading user for request ${r.id}:`, err.message);
        plain.userRole = 'corporate';
      }

      if (r.linkedAdId) {
        try {
          const activeAd = await Ad.findByPk(r.linkedAdId);
          plain.ad = activeAd ? activeAd.get({ plain: true }) : null;
        } catch (err) {
          console.error(`Error loading active ad for request ${r.id}:`, err.message);
          plain.ad = null;
        }
      } else {
        plain.ad = null;
      }
      return plain;
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* GET /api/ad-requests/pending-count — lightweight count for dashboard badge */
router.get('/pending-count', protect, authorize('superadmin', 'ad_requests'), async (req, res) => {
  try {
    const count = await AdRequest.count({
      where: {
        [Op.or]: [
          { status: 'pending' },
          { status: 'paid', linkedAdId: null }
        ]
      }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* GET /api/ad-requests/all */
router.get('/all', protect, authorize('superadmin', 'ad_requests'), async (req, res) => {
  try {
    const requests = await AdRequest.findAll({
      order: [['createdAt', 'DESC']]
    });

    const enriched = await Promise.all(requests.map(async (r) => {
      const plain = r.get({ plain: true });
      try {
        const pricing = await AdPricing.findOne({ where: { adRequestId: r.id } });
        plain.pricing = pricing ? pricing.get({ plain: true }) : null;
      } catch (err) {
        console.error(`Error loading pricing for request ${r.id}:`, err.message);
        plain.pricing = null;
      }

      try {
        if (r.userId) {
          const user = await User.findByPk(r.userId, { attributes: ['name', 'email', 'companyName', 'role'] });
          plain.userRole = user ? user.role : 'corporate';
        } else {
          plain.userRole = 'corporate';
        }
      } catch (err) {
        console.error(`Error loading user for request ${r.id}:`, err.message);
        plain.userRole = 'corporate';
      }
      return plain;
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* PATCH /api/ad-requests/:id/approve */
router.patch('/:id/approve', protect, authorize('superadmin', 'ad_requests'), async (req, res) => {
  const { adminNotes, finalAmount } = req.body;

  try {
    const adRequest = await AdRequest.findByPk(req.params.id);
    if (!adRequest) return res.status(404).json({ message: 'Ad request not found' });

    if (adRequest.targetState && adRequest.targetCity && adRequest.startDate && adRequest.endDate) {
      const overlappingAd = await Ad.findOne({
        where: {
          id: { [Op.ne]: adRequest.linkedAdId || '' },
          slot: adRequest.slot, targetState: adRequest.targetState, targetCity: adRequest.targetCity,
          active: true,
          startDate: { [Op.lte]: adRequest.endDate },
          endDate: { [Op.gte]: adRequest.startDate }
        }
      });
      if (overlappingAd) {
        return res.status(409).json({ message: 'Cannot approve: An active ad already exists for this slot, location, and dates.' });
      }
    }

    const oldStatus = adRequest.status;
    adRequest.status = oldStatus === 'paid' ? 'paid' : 'approved';
    adRequest.adminNotes = adminNotes || (oldStatus === 'paid' ? 'Synced with live site' : 'Approved by admin');

    if (adRequest.status === 'paid') {
      await activateAdForRequest(adRequest);
    }

    await adRequest.save();

    let pricing = await AdPricing.findOne({ where: { adRequestId: adRequest.id } });
    if (pricing) {
      const baseVal = finalAmount !== undefined ? parseFloat(finalAmount) : parseFloat(pricing.baseAmount);
      const gstVal = Math.round(baseVal * (parseFloat(pricing.gstRate) / 100));
      const totalVal = Math.round(baseVal) + gstVal;
      pricing.adminFinalAmount = Math.round(baseVal);
      pricing.adminGstAmount = gstVal;
      pricing.adminTotalAmount = totalVal;
      pricing.adminConfirmedAt = new Date();
      pricing.adminNotes = adminNotes || 'Price confirmed by admin';
      pricing.status = pricing.status === 'user_accepted' ? 'user_accepted' : 'admin_confirmed';
      await pricing.save();
    } else if (finalAmount !== undefined) {
      const baseVal = parseFloat(finalAmount);
      const gstVal = Math.round(baseVal * 0.18);
      const totalVal = Math.round(baseVal) + gstVal;
      pricing = await AdPricing.create({
        adRequestId: adRequest.id, userId: adRequest.userId,
        baseAmount: baseVal, gstRate: 18, gstAmount: gstVal, totalAmount: totalVal,
        pricingFactors: {}, status: 'admin_confirmed',
        adminFinalAmount: baseVal, adminGstAmount: gstVal, adminTotalAmount: totalVal,
        adminConfirmedAt: new Date(),
        adminNotes: adminNotes || 'Price set and confirmed by admin',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }

    const msg = adRequest.status === 'paid' 
      ? 'Ad request approved and campaign is now live!' 
      : 'Ad request approved. Awaiting user payment.';

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Approve Ad Request', `Approved ad request ID: ${adRequest.id} for "${adRequest.companyName}" (${adRequest.slot})`);

    // Send "Ad is Live" email notification to the user only if it actually went live
    if (adRequest.status === 'paid') {
      try {
        const { sendEmail } = require('../utils/email');
        const adUser = await User.findByPk(adRequest.userId);
        if (adUser) {
          const startFormatted = adRequest.startDate ? new Date(adRequest.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
          const endFormatted = adRequest.endDate ? new Date(adRequest.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
          const emailBody = `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <h2 style="color: #10b981; margin-top: 0;">🎉 Your Ad Campaign is Now Live!</h2>
              <p>Hi ${adUser.name},</p>
              <p>Great news! Your ad campaign <strong>"${adRequest.adTitle || 'Untitled'}"</strong> has been reviewed and approved by our team. It is now <strong style="color: #10b981;">LIVE</strong> on Industrial Times!</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr style="background: #f9fafb;"><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 700; width: 35%;">Ad Slot</td><td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${adRequest.slot || 'N/A'}</td></tr>
                <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 700;">Location</td><td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${adRequest.targetCity || ''}, ${adRequest.targetState || ''}</td></tr>
                <tr style="background: #f9fafb;"><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 700;">Live From</td><td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${startFormatted}</td></tr>
                <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 700;">Live Until</td><td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${endFormatted}</td></tr>
              </table>
              <p>You can check your live ad on the website now:</p>
              <br/>
              <a href="https://industrialtimes.in" style="background: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View on Industrial Times</a>
              <br/><br/>
              <p>You can also track your campaign status from your dashboard at any time.</p>
              <br/>
              <p>Best regards,</p>
              <p><strong>Industrial Times Advertising Team</strong></p>
            </div>
          `;
          sendEmail(adUser.email, "🎉 Your Ad Campaign is Now Live! - Industrial Times", emailBody).catch(console.error);
        }
      } catch (emailErr) {
        console.error('Failed to send ad approval email:', emailErr.message);
      }
    }

    res.json({ message: msg, adRequest, pricing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* PATCH /api/ad-requests/:id/revoke */
router.patch('/:id/revoke', protect, authorize('superadmin', 'ad_requests'), async (req, res) => {
  const { adminNotes } = req.body;
  try {
    const adRequest = await AdRequest.findByPk(req.params.id);
    if (!adRequest) return res.status(404).json({ message: 'Ad request not found' });
    if (adRequest.status !== 'approved' && adRequest.status !== 'paid') return res.status(400).json({ message: 'Only approved or paid requests can be revoked' });

    if (adRequest.linkedAdId) {
      await Ad.destroy({ where: { id: adRequest.linkedAdId } });
    }

    adRequest.status = 'disabled';
    adRequest.adminNotes = adminNotes || 'Ad has been disabled/removed by superadmin';
    await adRequest.save();

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Revoke Ad Request', `Revoked approved ad request ID: ${adRequest.id} for "${adRequest.companyName}"`);

    res.json({ message: 'Ad request disabled and ad removed from live site.', adRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* PATCH /api/ad-requests/:id/enable */
router.patch('/:id/enable', protect, authorize('superadmin', 'ad_requests'), async (req, res) => {
  const { adminNotes } = req.body;
  try {
    const adRequest = await AdRequest.findByPk(req.params.id);
    if (!adRequest) return res.status(404).json({ message: 'Ad request not found' });
    if (adRequest.status !== 'disabled') return res.status(400).json({ message: 'Only disabled requests can be enabled' });

    // Re-create the live ad
    await activateAdForRequest(adRequest);

    adRequest.status = 'paid';
    adRequest.adminNotes = adminNotes || 'Ad has been re-enabled by superadmin';
    await adRequest.save();

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Enable Ad Request', `Re-enabled ad request ID: ${adRequest.id} for "${adRequest.companyName}"`);

    res.json({ message: 'Ad request re-enabled and campaign is now live.', adRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* PATCH /api/ad-requests/:id/reject */
router.patch('/:id/reject', protect, authorize('superadmin', 'ad_requests'), async (req, res) => {
  const { adminNotes } = req.body;
  try {
    const adRequest = await AdRequest.findByPk(req.params.id);
    if (!adRequest) return res.status(404).json({ message: 'Ad request not found' });

    adRequest.status = 'rejected';
    adRequest.adminNotes = adminNotes || 'Rejected by admin';
    await adRequest.save();

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Reject Ad Request', `Rejected ad request ID: ${adRequest.id} for "${adRequest.companyName}". Reason: ${adminNotes || 'N/A'}`);

    res.json({ message: 'Ad request rejected.', adRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* DELETE /api/ad-requests/:id (Superadmin hard delete) */
router.delete('/:id', protect, authorize('superadmin', 'ad_requests'), async (req, res) => {
  try {
    const adRequest = await AdRequest.findByPk(req.params.id);
    if (!adRequest) return res.status(404).json({ message: 'Ad request not found' });

    if (adRequest.linkedAdId) {
      await Ad.destroy({ where: { id: adRequest.linkedAdId } });
    }
    await AdPricing.destroy({ where: { adRequestId: adRequest.id } });
    const adId = adRequest.id;
    const company = adRequest.companyName;
    await adRequest.destroy();

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Delete Ad Request', `Deleted ad request ID: ${adId} for "${company}"`);

    res.json({ message: 'Ad request and all associated records completely deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* PUT /api/ad-requests/:id (User edit) */
router.put('/:id', protect, async (req, res) => {
  try {
    const adRequest = await AdRequest.findByPk(req.params.id);
    if (!adRequest) return res.status(404).json({ message: 'Ad request not found' });
    if (adRequest.userId !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to edit this request' });
    }

    const { adTitle, adDescription, link, imageUrl, targetState, targetCity, startDate, endDate, slot } = req.body;
    
    adRequest.adTitle = adTitle || adRequest.adTitle;
    adRequest.adDescription = adDescription !== undefined ? adDescription : adRequest.adDescription;
    adRequest.link = link !== undefined ? link : adRequest.link;
    if (imageUrl) adRequest.imageUrl = imageUrl;
    adRequest.targetState = targetState || adRequest.targetState;
    adRequest.targetCity = targetCity || adRequest.targetCity;
    adRequest.startDate = startDate || adRequest.startDate;
    adRequest.endDate = endDate || adRequest.endDate;
    adRequest.slot = slot || adRequest.slot;

    // If it was already live/approved, it must go back to pending for review
    if (adRequest.status === 'approved' || adRequest.status === 'paid' || adRequest.status === 'active') {
      adRequest.status = 'pending';
      adRequest.adminNotes = 'User edited this ad request. Awaiting superadmin review.';
      // Hide the live ad if it exists
      if (adRequest.linkedAdId) {
        await Ad.update({ active: false }, { where: { id: adRequest.linkedAdId } });
      }
    }

    await adRequest.save();
    res.json({ message: 'Ad request updated successfully. It has been sent back for admin review.', adRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
