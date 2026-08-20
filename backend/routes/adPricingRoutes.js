const express = require('express');
const router = express.Router();
const AdPricing = require('../models/AdPricing');
const AdRequest = require('../models/AdRequest');
const AdRevenue = require('../models/AdRevenue');
const User = require('../models/User');
const Ad = require('../models/Ad');
const { protect, authorize } = require('../middleware/auth');
const { calculateAdPricing } = require('../utils/adPricingEngine');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const AdAreaPricing = require('../models/AdAreaPricing');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
});

const activateAdForRequest = async (adRequest) => {
  let linkedAdId = adRequest.linkedAdId;
  let existingAd = null;
  if (linkedAdId) {
    existingAd = await Ad.findByPk(linkedAdId);
  }

  const SLOT_DIMS = {
    'leaderboard': { width: 728, height: 90 },
    'article-inline': { width: 728, height: 90 },
    'left-skyscraper': { width: 160, height: 600 },
    'right-half-page': { width: 300, height: 600 },
    'mobile-banner': { width: 300, height: 50 },
    'mobile-rectangle': { width: 300, height: 250 },
    'mobile-inline': { width: 300, height: 200 },
    'top-bottom-banner': { width: 970, height: 90 },
    'in-feed-rectangle': { width: 336, height: 280 },
    'inline-news-footer': { width: 728, height: 90 },
    'popup': { width: 300, height: 250 },
    'colombia-ad': { width: 728, height: 90 },
    'mobile-leaderboard': { width: 300, height: 100 }
  };
  const dims = SLOT_DIMS[adRequest.slot] || { width: 728, height: 90 };

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


/* POST /api/ad-pricing/calculate */
router.post('/calculate', protect, authorize('corporate', 'author'), async (req, res) => {
  const { adRequestId, slot, startDate, endDate, targetState, targetCity, imageUrl, link, imageFileSize, imageFormat } = req.body;
  if (!slot || !startDate || !endDate) {
    return res.status(400).json({ message: 'Slot, start date, and end date are required for pricing calculation.' });
  }
  try {
    if (adRequestId) {
      const adRequest = await AdRequest.findByPk(adRequestId);
      if (!adRequest) return res.status(404).json({ message: 'Ad request not found.' });
      if (String(adRequest.userId) !== String(req.user.id)) return res.status(403).json({ message: 'Not authorized.' });
      const existingPricing = await AdPricing.findOne({ where: { adRequestId } });
      if (existingPricing && existingPricing.status !== 'expired' && existingPricing.status !== 'user_rejected') {
        return res.json(existingPricing);
      }
    }

    const result = await calculateAdPricing({
      slot, startDate, endDate, targetState, targetCity,
      imageUrl, link, imageFileSize: imageFileSize || 0, imageFormat: imageFormat || 'jpg'
    });

    const pricing = await AdPricing.create({
      adRequestId: adRequestId || null, userId: req.user.id,
      baseAmount: result.baseAmount, gstRate: result.gstRate,
      gstAmount: result.gstAmount, totalAmount: result.totalAmount,
      pricingFactors: result.factors, status: 'pending_review',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    res.status(201).json(pricing);
  } catch (error) {
    console.error('Pricing calculation error:', error);
    res.status(500).json({ message: error.message });
  }
});

/* POST /api/ad-pricing/preview */
router.post('/preview', protect, authorize('corporate', 'author'), async (req, res) => {
  const { slot, startDate, endDate, targetState, targetCity, imageUrl, link, imageFileSize, imageFormat } = req.body;
  if (!slot || !startDate || !endDate) {
    return res.status(400).json({ message: 'Slot, start date, and end date are required.' });
  }
  try {
    const result = await calculateAdPricing({
      slot, startDate, endDate, targetState, targetCity,
      imageUrl, link, imageFileSize: imageFileSize || 0, imageFormat: imageFormat || 'jpg'
    });
    res.json(result);
  } catch (error) {
    console.error('Pricing preview error:', error);
    res.status(500).json({ message: error.message });
  }
});

/* GET /api/ad-pricing/:adRequestId */
router.get('/:adRequestId', protect, async (req, res) => {
  try {
    const pricing = await AdPricing.findOne({ where: { adRequestId: req.params.adRequestId } });
    if (!pricing) return res.status(404).json({ message: 'No pricing found for this ad request.' });
    if (String(pricing.userId) !== String(req.user.id) && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    res.json(pricing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* GET /api/ad-pricing/all/pending */
router.get('/all/pending', protect, authorize('superadmin', 'ad_pricing'), async (req, res) => {
  try {
    const pricings = await AdPricing.findAll({
      where: { status: 'pending_review' },
      order: [['createdAt', 'DESC']]
    });
    const enriched = await Promise.all(pricings.map(async (p) => {
      const plain = p.get({ plain: true });
      try {
        const adReq = p.adRequestId ? await AdRequest.findByPk(p.adRequestId) : null;
        const user = await User.findByPk(p.userId, { attributes: ['name', 'email', 'companyName', 'role'] });
        plain.adRequest = adReq ? adReq.get({ plain: true }) : null;
        plain.user = user ? user.get({ plain: true }) : null;
      } catch { }
      return plain;
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* GET /api/ad-pricing/all/list */
router.get('/all/list', protect, authorize('superadmin', 'ad_pricing'), async (req, res) => {
  try {
    const pricings = await AdPricing.findAll({ order: [['createdAt', 'DESC']] });
    const enriched = await Promise.all(pricings.map(async (p) => {
      const plain = p.get({ plain: true });
      try {
        const adReq = p.adRequestId ? await AdRequest.findByPk(p.adRequestId) : null;
        const user = await User.findByPk(p.userId, { attributes: ['name', 'email', 'companyName', 'role'] });
        plain.adRequest = adReq ? adReq.get({ plain: true }) : null;
        plain.user = user ? user.get({ plain: true }) : null;
      } catch { }
      return plain;
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* PATCH /api/ad-pricing/:id/admin-confirm */
router.patch('/:id/admin-confirm', protect, authorize('superadmin', 'ad_pricing'), async (req, res) => {
  const { finalAmount, adminNotes } = req.body;
  try {
    const pricing = await AdPricing.findByPk(req.params.id);
    if (!pricing) return res.status(404).json({ message: 'Pricing not found.' });
    if (pricing.status !== 'pending_review') {
      return res.status(400).json({ message: 'This pricing has already been processed.' });
    }

    const adminBase = finalAmount ? parseFloat(finalAmount) : parseFloat(pricing.baseAmount);
    const gstAmount = Math.round(adminBase * (parseFloat(pricing.gstRate) / 100));
    const totalAmount = Math.round(adminBase) + gstAmount;

    await pricing.update({
      adminFinalAmount: Math.round(adminBase),
      adminGstAmount: gstAmount,
      adminTotalAmount: totalAmount,
      adminConfirmedAt: new Date(),
      adminNotes: adminNotes || 'Price confirmed by admin',
      status: 'admin_confirmed'
    });

    res.json({ message: 'Price confirmed successfully.', pricing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* POST /api/ad-pricing/:id/create-razorpay-order */
router.post('/:id/create-razorpay-order', protect, authorize('corporate', 'author'), async (req, res) => {
  try {
    const { promoCode } = req.body;
    const pricing = await AdPricing.findByPk(req.params.id);
    if (!pricing) return res.status(404).json({ message: 'Pricing not found.' });
    if (String(pricing.userId) !== String(req.user.id)) return res.status(403).json({ message: 'Not authorized.' });
    if (pricing.status !== 'admin_confirmed' && pricing.status !== 'pending_review') {
      return res.status(400).json({ message: 'Invalid pricing status for payment.' });
    }

    let finalTotal = parseFloat(pricing.status === 'admin_confirmed' ? (pricing.adminTotalAmount || pricing.totalAmount) : pricing.totalAmount);

    if (promoCode) {
      const PromoCode = require('../models/PromoCode');
      const promo = await PromoCode.findOne({ where: { code: promoCode.trim().toUpperCase() } });
      if (promo && promo.isActive) {
        const now = new Date();
        const isStarted = !promo.startDate || new Date(promo.startDate) <= now;
        const isNotExpired = !promo.endDate || new Date(promo.endDate) >= now;
        const hasUsesLeft = promo.maxUses === null || promo.usedCount < promo.maxUses;
        const isApplicable = promo.applicableTo === 'all' || promo.applicableTo === 'ad';
        const isAboveMin = finalTotal >= parseFloat(promo.minOrderAmount);

        if (isStarted && isNotExpired && hasUsesLeft && isApplicable && isAboveMin) {
          let discount = 0.00;
          if (promo.discountType === 'percentage') {
            discount = finalTotal * (parseFloat(promo.discountValue) / 100);
          } else {
            discount = parseFloat(promo.discountValue);
          }
          finalTotal = Math.max(0, Math.round(finalTotal - discount));
        }
      }
    }

    const options = {
      amount: Math.round(finalTotal * 100),
      currency: "INR",
      receipt: `ad_receipt_${pricing.id}_${Date.now()}`,
      notes: {
        promoCode: promoCode || ''
      }
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    const detail = error?.error?.description || error?.description || error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
    res.status(500).json({ message: `Could not create Razorpay order: ${detail}` });
  }
});

/* PATCH /api/ad-pricing/:id/user-accept */
router.patch('/:id/user-accept', protect, authorize('corporate', 'author'), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, promoCode } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification details missing.' });
    }

    const pricing = await AdPricing.findByPk(req.params.id);
    if (!pricing) return res.status(404).json({ message: 'Pricing not found.' });
    if (String(pricing.userId) !== String(req.user.id)) return res.status(403).json({ message: 'Not authorized.' });
    if (pricing.status !== 'admin_confirmed' && pricing.status !== 'pending_review') {
      return res.status(400).json({ message: 'Invalid pricing status for payment.' });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: "Invalid payment signature." });
    }

    pricing.status = 'user_accepted';
    await pricing.save();

    let linkedAdId = null;
    if (pricing.adRequestId) {
      const adRequest = await AdRequest.findByPk(pricing.adRequestId);
      if (adRequest) {
        const wasApproved = adRequest.status === 'approved';
        adRequest.status = 'paid';
        if (wasApproved) {
          linkedAdId = await activateAdForRequest(adRequest);

          // Send "Ad is Live" email notification to the user
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
                  <p>Great news! Your payment for ad campaign <strong>"${adRequest.adTitle || 'Untitled'}"</strong> has been processed successfully. Your ad is now <strong style="color: #10b981;">LIVE</strong> on Industrial Times!</p>
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
                  <p>Best regards,</p>
                  <p><strong>Industrial Times Advertising Team</strong></p>
                </div>
              `;
              sendEmail(adUser.email, "🎉 Your Ad Campaign is Now Live! - Industrial Times", emailBody).catch(console.error);
            }
          } catch (emailErr) {
            console.error('Failed to send ad live email from pricing payment verification:', emailErr.message);
          }
        }
        await adRequest.save();
      }
    }

    let finalBase = parseFloat(pricing.adminFinalAmount || pricing.baseAmount);
    let finalGst = parseFloat(pricing.adminGstAmount || pricing.gstAmount);
    let finalTotal = parseFloat(pricing.adminTotalAmount || pricing.totalAmount);

    if (promoCode) {
      const PromoCode = require('../models/PromoCode');
      const promo = await PromoCode.findOne({ where: { code: promoCode.trim().toUpperCase() } });
      if (promo && promo.isActive) {
        const now = new Date();
        const isStarted = !promo.startDate || new Date(promo.startDate) <= now;
        const isNotExpired = !promo.endDate || new Date(promo.endDate) >= now;
        const hasUsesLeft = promo.maxUses === null || promo.usedCount < promo.maxUses;
        const isApplicable = promo.applicableTo === 'all' || promo.applicableTo === 'ad';
        const isAboveMin = finalTotal >= parseFloat(promo.minOrderAmount);

        if (isStarted && isNotExpired && hasUsesLeft && isApplicable && isAboveMin) {
          let discount = 0.00;
          if (promo.discountType === 'percentage') {
            discount = finalTotal * (parseFloat(promo.discountValue) / 100);
          } else {
            discount = parseFloat(promo.discountValue);
          }
          const actualTotal = Math.max(0, Math.round(finalTotal - discount));
          
          if (finalTotal > 0) {
            const ratio = actualTotal / finalTotal;
            finalBase = parseFloat((finalBase * ratio).toFixed(2));
            finalGst = parseFloat((finalGst * ratio).toFixed(2));
            finalTotal = actualTotal;
          }

          // Increment usedCount
          promo.usedCount += 1;
          await promo.save();
        }
      }
    }

    await AdRevenue.create({
      userId: pricing.userId, adRequestId: pricing.adRequestId,
      adPricingId: pricing.id, amount: finalBase, gstAmount: finalGst,
      totalAmount: finalTotal, type: 'ad_payment', status: 'completed',
      description: `Ad payment for request #${pricing.adRequestId || 'N/A'}`
    });

    res.json({ message: 'Payment verified and accepted! Ad published live.', pricing, linkedAdId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* PATCH /api/ad-pricing/:id/user-reject */
router.patch('/:id/user-reject', protect, authorize('corporate', 'author'), async (req, res) => {
  try {
    const pricing = await AdPricing.findByPk(req.params.id);
    if (!pricing) return res.status(404).json({ message: 'Pricing not found.' });
    if (String(pricing.userId) !== String(req.user.id)) return res.status(403).json({ message: 'Not authorized.' });
    
    pricing.status = 'user_rejected';
    await pricing.save();
    
    res.json({ message: 'Price rejected.', pricing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
