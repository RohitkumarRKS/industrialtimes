const express = require('express');
const router = express.Router();
const Withdrawal = require('../models/Withdrawal');
const AdRevenue = require('../models/AdRevenue');
const User = require('../models/User');
const PlatformSettings = require('../models/PlatformSettings');
const { protect, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

/* POST /api/withdrawals/request */
router.post('/request', protect, authorize('corporate', 'author'), async (req, res) => {
  const { amount, paymentMethod, paymentDetails } = req.body;

  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'Invalid withdrawal amount.' });
  }

  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId);
    if (!user || user.bankVerificationStatus !== 'approved') {
      return res.status(403).json({ message: 'Only bank verified users can request a withdrawal.' });
    }

    const requestedAmount = parseFloat(amount);

    const minWithdrawalStr = await PlatformSettings.getSetting('min_withdrawal_amount', '5000');
    const minWithdrawal = parseInt(minWithdrawalStr);

    const revenues = await AdRevenue.findAll({
      where: { userId, type: 'article_reward', status: 'completed' }
    });
    const totalRevenue = revenues.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

    const completedWithdrawals = await Withdrawal.findAll({
      where: { userId, status: 'completed' }
    });
    const totalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);

    const pendingWithdrawals = await Withdrawal.findAll({
      where: {
        userId,
        status: { [Op.in]: ['pending', 'approved', 'processing'] }
      }
    });
    const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);

    const availableBalance = totalRevenue - totalWithdrawn - pendingAmount;

    if (availableBalance < minWithdrawal) {
      return res.status(400).json({
        message: `Minimum withdrawable balance is ₹${minWithdrawal.toLocaleString('en-IN')}. Your current balance is ₹${Math.round(availableBalance).toLocaleString('en-IN')}.`
      });
    }

    if (requestedAmount > availableBalance) {
      return res.status(400).json({
        message: `Insufficient balance. Available: ₹${Math.round(availableBalance).toLocaleString('en-IN')}.`
      });
    }

    if (requestedAmount < minWithdrawal) {
      return res.status(400).json({
        message: `Minimum withdrawal amount is ₹${minWithdrawal.toLocaleString('en-IN')}.`
      });
    }

    const existingPending = await Withdrawal.findOne({
      where: { userId, status: 'pending' }
    });
    if (existingPending) {
      return res.status(400).json({
        message: 'You already have a pending withdrawal request. Please wait for it to be processed.'
      });
    }

    const withdrawal = await Withdrawal.create({
      userId,
      amount: requestedAmount,
      status: 'pending',
      requestedAt: new Date(),
      paymentMethod: paymentMethod || 'bank_transfer',
      paymentDetails: paymentDetails || null,
      userName: req.user.name,
      userEmail: req.user.email
    });

    res.status(201).json({
      message: `Withdrawal request of ₹${requestedAmount.toLocaleString('en-IN')} submitted successfully! It will be processed within 24 hours after admin approval.`,
      withdrawal
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ message: error.message });
  }
});

/* GET /api/withdrawals/my */
router.get('/my', protect, authorize('corporate', 'author'), async (req, res) => {
  try {
    const withdrawals = await Withdrawal.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* GET /api/withdrawals/all */
router.get('/all', protect, authorize('superadmin', 'revenue'), async (req, res) => {
  try {
    const withdrawals = await Withdrawal.findAll({
      order: [['createdAt', 'DESC']]
    });

    const enriched = await Promise.all(withdrawals.map(async (w) => {
      const plain = w.get({ plain: true });
      try {
        const user = await User.findByPk(w.userId, { attributes: ['name', 'email', 'companyName', 'role'] });
        plain.user = user ? user.get({ plain: true }) : null;
      } catch { }
      return plain;
    }));

    const totalPending = withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + parseFloat(w.amount), 0);
    const totalApproved = withdrawals.filter(w => w.status === 'approved' || w.status === 'processing').reduce((s, w) => s + parseFloat(w.amount), 0);
    const totalCompleted = withdrawals.filter(w => w.status === 'completed').reduce((s, w) => s + parseFloat(w.amount), 0);

    res.json({
      withdrawals: enriched,
      summary: {
        totalPending: Math.round(totalPending),
        totalApproved: Math.round(totalApproved),
        totalCompleted: Math.round(totalCompleted),
        pendingCount: withdrawals.filter(w => w.status === 'pending').length,
        totalCount: withdrawals.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* PATCH /api/withdrawals/:id/approve */
router.patch('/:id/approve', protect, authorize('superadmin', 'revenue'), async (req, res) => {
  const { adminNotes } = req.body;
  try {
    const withdrawal = await Withdrawal.findByPk(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal request not found.' });
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending withdrawals can be approved.' });
    }

    await withdrawal.update({
      status: 'approved',
      adminNotes: adminNotes || 'Approved by admin',
      adminActionAt: new Date()
    });

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Approve Withdrawal', `Approved withdrawal ID: ${withdrawal.id} for amount ₹${withdrawal.amount} (User ID: ${withdrawal.userId})`);

    res.json({ message: 'Withdrawal approved. It will be processed within 24 hours.', withdrawal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* PATCH /api/withdrawals/:id/reject */
router.patch('/:id/reject', protect, authorize('superadmin', 'revenue'), async (req, res) => {
  const { adminNotes } = req.body;
  try {
    const withdrawal = await Withdrawal.findByPk(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal request not found.' });
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending withdrawals can be rejected.' });
    }

    await withdrawal.update({
      status: 'rejected',
      adminNotes: adminNotes || 'Rejected by admin',
      adminActionAt: new Date()
    });

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Reject Withdrawal', `Rejected withdrawal ID: ${withdrawal.id} for amount ₹${withdrawal.amount} (User ID: ${withdrawal.userId}). Reason: ${adminNotes || 'N/A'}`);

    res.json({ message: 'Withdrawal request rejected.', withdrawal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* PATCH /api/withdrawals/:id/complete */
router.patch('/:id/complete', protect, authorize('superadmin', 'revenue'), async (req, res) => {
  const { adminNotes } = req.body;
  try {
    const withdrawal = await Withdrawal.findByPk(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal request not found.' });
    if (withdrawal.status !== 'approved' && withdrawal.status !== 'processing') {
      return res.status(400).json({ message: 'Only approved/processing withdrawals can be marked as completed.' });
    }

    const updateData = {
      status: 'completed',
      completedAt: new Date()
    };
    if (adminNotes) updateData.adminNotes = adminNotes;

    await withdrawal.update(updateData);

    const { logManagerActivity } = require('../utils/activityLogger');
    await logManagerActivity(req, 'Complete Withdrawal', `Completed withdrawal ID: ${withdrawal.id} for amount ₹${withdrawal.amount} (User ID: ${withdrawal.userId})`);

    res.json({ message: 'Withdrawal marked as completed.', withdrawal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
