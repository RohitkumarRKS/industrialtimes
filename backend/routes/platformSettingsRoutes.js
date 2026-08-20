const express = require('express');
const router = express.Router();
const PlatformSettings = require('../models/PlatformSettings');
const { protect, authorize } = require('../middleware/auth');

/* GET /api/platform-settings (SuperAdmin) */
router.get('/', protect, authorize('superadmin'), async (req, res) => {
  try {
    const settings = await PlatformSettings.findAll({ order: [['key', 'ASC']] });

    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = {
        value: s.value,
        description: s.description,
        updatedAt: s.updatedAt
      };
    });

    res.json({ settings: settingsMap, raw: settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* PUT /api/platform-settings (SuperAdmin) */
router.put('/', protect, authorize('superadmin'), async (req, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ message: 'Settings object is required.' });
  }

  try {
    const updatedKeys = [];

    for (const [key, value] of Object.entries(settings)) {
      await PlatformSettings.setSetting(key, String(value), null, req.user.id);
      updatedKeys.push(key);
    }

    res.json({
      message: `Updated ${updatedKeys.length} setting(s) successfully.`,
      updatedKeys
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* GET /api/platform-settings/public */
router.get('/public', async (req, res) => {
  try {
    const gstRate = await PlatformSettings.getSetting('gst_rate', '18');
    const minWithdrawal = await PlatformSettings.getSetting('min_withdrawal_amount', '5000');
    const silverFollowers = await PlatformSettings.getSetting('reporter_level_silver_followers', '10');
    const goldFollowers = await PlatformSettings.getSetting('reporter_level_gold_followers', '50');
    const diamondFollowers = await PlatformSettings.getSetting('reporter_level_diamond_followers', '100');
    const webinarIsEnabled = await PlatformSettings.getSetting('webinar_is_enabled', 'true');
    const webinarGstRate = await PlatformSettings.getSetting('webinar_gst_rate', '18');
    const reporterRegistrationFee = await PlatformSettings.getSetting('reporter_registration_fee', '999');
    const reporterGstRate = await PlatformSettings.getSetting('reporter_gst_rate', '18');
    const reporterBenefits = await PlatformSettings.getSetting('reporter_benefits', '["Earn up to 50% revenue share per article view","Build your personal brand with customized profile and followers","Access advanced analytics dashboard to track engagement","Gain recognition from top industrial leaders"]');
    const podcastEntryFee = await PlatformSettings.getSetting('podcast_entry_fee', '999');
    const podcastGstRate = await PlatformSettings.getSetting('podcast_gst_rate', '18');
    const podcastPaymentEnabled = await PlatformSettings.getSetting('podcast_payment_enabled', 'true');

    res.json({
      gstRate: parseFloat(gstRate),
      minWithdrawalAmount: parseInt(minWithdrawal),
      reporterLevels: {
        silver: parseInt(silverFollowers),
        gold: parseInt(goldFollowers),
        diamond: parseInt(diamondFollowers)
      },
      webinarIsEnabled: webinarIsEnabled === 'true',
      webinarGstRate: parseFloat(webinarGstRate),
      reporterRegistrationFee: parseFloat(reporterRegistrationFee),
      reporterGstRate: parseFloat(reporterGstRate),
      reporterBenefits: JSON.parse(reporterBenefits),
      podcastEntryFee: parseFloat(podcastEntryFee),
      podcastGstRate: parseFloat(podcastGstRate),
      podcastPaymentEnabled: podcastPaymentEnabled === 'true'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
