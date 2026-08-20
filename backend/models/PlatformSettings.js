const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PlatformSettings = sequelize.define('PlatformSettings', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'PlatformSettings'
});

PlatformSettings.getSetting = async function (key, defaultValue = null) {
  const setting = await this.findOne({ where: { key } });
  return setting ? setting.value : defaultValue;
};

PlatformSettings.setSetting = async function (key, value, description = null, updatedBy = null) {
  let setting = await this.findOne({ where: { key } });

  if (setting) {
    setting.value = value;
    if (description !== null) setting.description = description;
    if (updatedBy !== null) setting.updatedBy = updatedBy;
    await setting.save();
  } else {
    setting = await this.create({
      key,
      value,
      description,
      updatedBy
    });
  }
  return setting;
};

PlatformSettings.seedDefaults = async function () {
  const defaults = [
    { key: 'min_withdrawal_amount', value: '5000', description: 'Minimum balance required to request withdrawal (in INR)' },
    { key: 'gst_rate', value: '18', description: 'GST percentage applied on ad pricing' },
    { key: 'base_rate_leaderboard', value: '500', description: 'Base rate per day for Header Leaderboard slot (INR)' },
    { key: 'base_rate_right_half_page', value: '400', description: 'Base rate per day for Right Sidebar slot (INR)' },
    { key: 'base_rate_article_inline', value: '300', description: 'Base rate per day for Article Inline slot (INR)' },
    { key: 'base_rate_left_skyscraper', value: '350', description: 'Base rate per day for Left Skyscraper slot (INR)' },
    { key: 'base_rate_top_bottom_banner', value: '600', description: 'Base rate per day for Top-Bottom Banner slot (INR)' },
    { key: 'base_rate_in_feed_rectangle', value: '250', description: 'Base rate per day for In-Feed Rectangle slot (INR)' },
    { key: 'base_rate_inline_news_footer', value: '200', description: 'Base rate per day for Inline News Footer slot (INR)' },
    { key: 'base_rate_popup', value: '350', description: 'Base rate per day for Popup slot (INR)' },
    { key: 'base_rate_mobile_banner', value: '150', description: 'Base rate per day for Mobile Banner slot (INR)' },
    { key: 'base_rate_mobile_rectangle', value: '200', description: 'Base rate per day for Mobile Rectangle slot (INR)' },
    { key: 'base_rate_mobile_inline', value: '180', description: 'Base rate per day for Mobile Inline slot (INR)' },
    { key: 'base_rate_colombia_ad', value: '250', description: 'Base rate per day for Colombia Ad Footer slot (INR)' },
    { key: 'base_rate_mobile_leaderboard', value: '300', description: 'Base rate per day for Mobile Leaderboard slot (INR)' },
    { key: 'withdrawal_processing_hours', value: '24', description: 'Hours to process withdrawal after admin approval' },
    { key: 'reporter_level_silver_followers', value: '10', description: 'Followers needed to reach Silver Level' },
    { key: 'reporter_level_gold_followers', value: '50', description: 'Followers needed to reach Gold Level' },
    { key: 'reporter_level_diamond_followers', value: '100', description: 'Followers needed to reach Diamond Level' },
    { key: 'webinar_is_enabled', value: 'true', description: 'Enable or disable the Webinars navigation and page' },
    { key: 'webinar_gst_rate', value: '18', description: 'GST rate in percentage applied on webinars (included in fee)' },
    { key: 'reporter_registration_fee', value: '999', description: 'One-time registration fee for reporters (in INR)' },
    { key: 'reporter_gst_rate', value: '18', description: 'GST rate in percentage applied on reporter registration fee' },
    { key: 'reporter_benefits', value: '["Earn up to 50% revenue share per article view","Build your personal brand with customized profile and followers","Access advanced analytics dashboard to track engagement","Gain recognition from top industrial leaders"]', description: 'Benefits displayed in the reporter payment popup (JSON list)' },
    { key: 'podcast_entry_fee', value: '999', description: 'Base registration fee for podcast guest application (in INR)' },
    { key: 'podcast_gst_rate', value: '18', description: 'GST rate in percentage applied on podcast registration fee' },
    { key: 'podcast_payment_enabled', value: 'true', description: 'Enable or disable payment for podcast guest applications' }
  ];

  for (const d of defaults) {
    const exists = await this.findOne({ where: { key: d.key } });
    if (!exists) {
      await this.create(d);
    }
  }
};

module.exports = PlatformSettings;
