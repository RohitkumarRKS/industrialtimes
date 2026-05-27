const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SeoSettings = sequelize.define('SeoSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1 // We only need one global SEO record
  },
  siteTitle: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Industrial Times'
  },
  metaDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'Your reliable source for the latest industrial news and trends.'
  },
  metaKeywords: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'industry, news, manufacturing, trending'
  },
  googleAnalyticsId: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  podcastHeaderTitle: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Podcast Guest Application'
  },
  podcastHeaderDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'Join industry leaders on the Industrial Times podcast. Share your insights, experiences, and vision with our global audience of manufacturing professionals.'
  },
  breakingNewsSpeed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 35 // default speed in seconds
  }
});

module.exports = SeoSettings;
