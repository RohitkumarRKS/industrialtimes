const express = require('express');
const router = express.Router();
const EmailSettings = require('../models/EmailSettings');
const EmailLog = require('../models/EmailLog');

// @desc    Get email settings
// @route   GET /api/settings/email
router.get('/email', async (req, res) => {
  try {
    const [settings] = await EmailSettings.findOrCreate({
      where: { id: 1 },
      defaults: {
        adminEmail: process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@industrialtimes.com',
        emailSignature: 'Best regards,\nIndustrial Times Team'
      }
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update email settings
// @route   PUT /api/settings/email
router.put('/email', async (req, res) => {
  const { adminEmail, emailSignature } = req.body;
  
  try {
    const [settings] = await EmailSettings.findOrCreate({
      where: { id: 1 }
    });
    
    settings.adminEmail = adminEmail || settings.adminEmail;
    settings.emailSignature = emailSignature || settings.emailSignature;
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get email logs
// @route   GET /api/settings/email-logs
router.get('/email-logs', async (req, res) => {
  try {
    const logs = await EmailLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50 // Get last 50 logs
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
