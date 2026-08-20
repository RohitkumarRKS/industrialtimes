const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
});

// @route   POST /api/membership/create-order
// @desc    Create a new Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, planId, billingCycle, promoCode } = req.body;
    let finalAmount = amount;

    if (promoCode) {
      const PromoCode = require('../models/PromoCode');
      const promo = await PromoCode.findOne({ where: { code: promoCode.trim().toUpperCase() } });
      if (promo && promo.isActive) {
        const now = new Date();
        const isStarted = !promo.startDate || new Date(promo.startDate) <= now;
        const isNotExpired = !promo.endDate || new Date(promo.endDate) >= now;
        const hasUsesLeft = promo.maxUses === null || promo.usedCount < promo.maxUses;
        const isApplicable = promo.applicableTo === 'all' || promo.applicableTo === 'membership';
        const isAboveMin = amount >= parseFloat(promo.minOrderAmount);

        if (isStarted && isNotExpired && hasUsesLeft && isApplicable && isAboveMin) {
          let discount = 0.00;
          if (promo.discountType === 'percentage') {
            discount = amount * (parseFloat(promo.discountValue) / 100);
          } else {
            discount = parseFloat(promo.discountValue);
          }
          finalAmount = Math.max(0, amount - discount);
        }
      }
    }

    const options = {
      amount: Math.round(finalAmount * 100), // In paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        planId,
        billingCycle,
        promoCode: promoCode || ''
      }
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    const detail = error?.error?.description || error?.description || error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
    res.status(500).json({ error: `Could not create order: ${detail}` });
  }
});

router.post('/verify-payment', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId,
      planId,
      billingCycle,
      promoCode
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      if (promoCode) {
        const PromoCode = require('../models/PromoCode');
        const promo = await PromoCode.findOne({ where: { code: promoCode.trim().toUpperCase() } });
        if (promo && promo.isActive) {
          const now = new Date();
          const isStarted = !promo.startDate || new Date(promo.startDate) <= now;
          const isNotExpired = !promo.endDate || new Date(promo.endDate) >= now;
          const hasUsesLeft = promo.maxUses === null || promo.usedCount < promo.maxUses;
          const isApplicable = promo.applicableTo === 'all' || promo.applicableTo === 'membership';

          if (isStarted && isNotExpired && hasUsesLeft && isApplicable) {
            promo.usedCount += 1;
            await promo.save();
          }
        }
      }

      user.membershipPlan = planId;
      
      const expiry = new Date();
      if (billingCycle === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
      else if (billingCycle === 'quarterly') expiry.setMonth(expiry.getMonth() + 3);
      else if (billingCycle === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1);
      
      user.planExpiry = expiry;
      await user.save();

      // Send admin notification
      try {
        const { sendEmail } = require('../utils/email');
        const EmailSettings = require('../models/EmailSettings');
        let adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
        const settings = await EmailSettings.findOne();
        if (settings && settings.adminEmail) adminEmail = settings.adminEmail;

        if (adminEmail) {
          const adminContent = `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border: 1px solid #e5e7eb;">
              <h2 style="color: #da251d;">💳 New Membership Payment Received</h2>
              <p>A user has subscribed to a membership plan on <strong>Industrial Times</strong>.</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr><td style="padding: 6px 0; font-weight: bold;">User Name:</td><td>${user.name || 'N/A'}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">User Email:</td><td>${user.email}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Plan:</td><td>${planId} (${billingCycle})</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Transaction ID:</td><td>${razorpay_payment_id || 'FREE_PROMO'}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Expiry:</td><td>${expiry.toLocaleDateString()}</td></tr>
              </table>
            </div>
          `;
          sendEmail(adminEmail, `🔔 New Membership Payment: ${user.email}`, adminContent).catch(console.error);
        }
      } catch (adminEmailErr) {
        console.error('Failed to send admin membership notification:', adminEmailErr);
      }

      return res.json({ message: "Payment verified and plan updated successfully", plan: planId });
    } else {
      return res.status(400).json({ error: "Invalid signature" });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

module.exports = router;
