const express = require('express');
const router = express.Router();
const AdRevenue = require('../models/AdRevenue');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const PlatformSettings = require('../models/PlatformSettings');
const { protect, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

/* GET /api/revenue/dashboard */
router.get('/dashboard', protect, authorize('corporate', 'author'), async (req, res) => {
  try {
    const userId = req.user.id;

    const revenues = await AdRevenue.findAll({
      where: { userId, type: 'article_reward', status: 'completed' }
    });
    const totalRevenue = revenues.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const totalGst = revenues.reduce((sum, r) => sum + parseFloat(r.gstAmount || 0), 0);
    const totalGross = revenues.reduce((sum, r) => sum + parseFloat(r.totalAmount || 0), 0);

    const spentPayments = await AdRevenue.findAll({
      where: { userId, type: 'ad_payment', status: 'completed' }
    });
    const totalSpent = spentPayments.reduce((sum, r) => sum + parseFloat(r.totalAmount || 0), 0);
    const totalSpentGst = spentPayments.reduce((sum, r) => sum + parseFloat(r.gstAmount || 0), 0);
    const totalSpentBase = spentPayments.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

    const pendingRevenues = await AdRevenue.findAll({
      where: { userId, type: 'article_reward', status: 'pending' }
    });
    const pendingRevenue = pendingRevenues.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

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
    const pendingWithdrawal = pendingWithdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);

    const withdrawableBalance = Math.max(0, totalRevenue - totalWithdrawn - pendingWithdrawal);

    const minWithdrawal = await PlatformSettings.getSetting('min_withdrawal_amount', '5000');
    const gstRate = await PlatformSettings.getSetting('gst_rate', '18');

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentRevenues = await AdRevenue.findAll({
      where: {
        userId,
        type: 'article_reward',
        status: 'completed',
        createdAt: { [Op.gte]: sixMonthsAgo }
      },
      order: [['createdAt', 'ASC']]
    });

    const monthlyBreakdown = {};
    recentRevenues.forEach(r => {
      const month = new Date(r.createdAt).toISOString().slice(0, 7);
      if (!monthlyBreakdown[month]) {
        monthlyBreakdown[month] = { revenue: 0, gst: 0, total: 0, count: 0 };
      }
      monthlyBreakdown[month].revenue += parseFloat(r.amount || 0);
      monthlyBreakdown[month].gst += parseFloat(r.gstAmount || 0);
      monthlyBreakdown[month].total += parseFloat(r.totalAmount || 0);
      monthlyBreakdown[month].count += 1;
    });

    res.json({
      totalRevenue: Math.round(totalRevenue),
      totalGst: Math.round(totalGst),
      totalGross: Math.round(totalGross),
      totalSpent: Math.round(totalSpent),
      totalSpentGst: Math.round(totalSpentGst),
      totalSpentBase: Math.round(totalSpentBase),
      pendingRevenue: Math.round(pendingRevenue),
      totalWithdrawn: Math.round(totalWithdrawn),
      pendingWithdrawal: Math.round(pendingWithdrawal),
      withdrawableBalance: Math.round(withdrawableBalance),
      minWithdrawalAmount: parseInt(minWithdrawal),
      gstRate: parseFloat(gstRate),
      canWithdraw: withdrawableBalance >= parseInt(minWithdrawal),
      transactionCount: revenues.length + spentPayments.length,
      monthlyBreakdown
    });
  } catch (error) {
    console.error('Revenue dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
});

/* GET /api/revenue/my */
router.get('/my', protect, authorize('corporate', 'author'), async (req, res) => {
  try {
    const revenues = await AdRevenue.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(revenues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* GET /api/revenue/all */
router.get('/all', protect, authorize('superadmin', 'revenue'), async (req, res) => {
  try {
    const revenues = await AdRevenue.findAll({
      order: [['createdAt', 'DESC']]
    });

    const enriched = await Promise.all(revenues.map(async (r) => {
      const plain = r.get({ plain: true });
      try {
        const user = await User.findByPk(r.userId, { attributes: ['name', 'email', 'companyName', 'role'] });
        plain.user = user ? user.get({ plain: true }) : null;
      } catch { }
      return plain;
    }));

    const adPayments = revenues.filter(r => r.type === 'ad_payment' && r.status === 'completed');
    const articleRewards = revenues.filter(r => r.type === 'article_reward' && r.status === 'completed');

    const totalRevenue = adPayments.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const totalGst = adPayments.reduce((sum, r) => sum + parseFloat(r.gstAmount || 0), 0);
    const totalGross = adPayments.reduce((sum, r) => sum + parseFloat(r.totalAmount || 0), 0);
    const totalPayouts = articleRewards.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

    res.json({
      revenues: enriched,
      totals: {
        totalRevenue: Math.round(totalRevenue),
        totalGst: Math.round(totalGst),
        totalGross: Math.round(totalGross),
        totalPayouts: Math.round(totalPayouts),
        transactionCount: revenues.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
