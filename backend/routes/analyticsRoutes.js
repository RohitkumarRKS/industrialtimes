const express = require('express');
const router = express.Router();
const SiteAnalytics = require('../models/SiteAnalytics');
const { Op } = require('sequelize');

// @desc    Get 7-day traffic analytics
// @route   GET /api/analytics/7days
router.get('/7days', async (req, res) => {
  try {
    const today = new Date();
    const past7Days = new Date(today);
    past7Days.setDate(today.getDate() - 6);

    const dateStr = past7Days.toISOString().split('T')[0];

    const analytics = await SiteAnalytics.findAll({
      where: {
        date: {
          [Op.gte]: dateStr
        }
      },
      order: [['date', 'ASC']]
    });

    // Create a complete 7-day map ensuring missing days are populated with 0
    const sevenDayMap = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i <= 6; i++) {
      const d = new Date(past7Days);
      d.setDate(past7Days.getDate() + i);
      const ds = d.toISOString().split('T')[0];
      const dayName = daysOfWeek[d.getDay()];

      const existingRecord = analytics.find(a => a.date === ds);
      
      sevenDayMap.push({
        date: ds,
        day: dayName,
        totalViews: existingRecord ? existingRecord.totalViews : 0,
        uniqueVisitors: existingRecord ? existingRecord.uniqueVisitors : 0
      });
    }

    res.json(sevenDayMap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
