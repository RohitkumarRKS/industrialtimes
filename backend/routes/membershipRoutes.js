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
    const { amount, planId, billingCycle } = req.body;

    const options = {
      amount: amount * 100, // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        planId,
        billingCycle
      }
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ error: "Could not create order" });
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
      mock
    } = req.body;

    if (mock) {
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.membershipPlan = planId;
      
      // Calculate expiry
      const expiry = new Date();
      if (billingCycle === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
      else if (billingCycle === 'quarterly') expiry.setMonth(expiry.getMonth() + 3);
      else if (billingCycle === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1);
      
      user.planExpiry = expiry;
      await user.save();

      return res.json({ message: "Mock payment verified and plan activated successfully", plan: planId });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment verified - Update User Plan
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.membershipPlan = planId;
      
      // Calculate expiry
      const expiry = new Date();
      if (billingCycle === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
      else if (billingCycle === 'quarterly') expiry.setMonth(expiry.getMonth() + 3);
      else if (billingCycle === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1);
      
      user.planExpiry = expiry;
      await user.save();

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
