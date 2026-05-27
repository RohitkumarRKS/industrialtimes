const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SiteAnalytics = sequelize.define('SiteAnalytics', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true // Ensure only one record per day
  },
  totalViews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  uniqueVisitors: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = SiteAnalytics;
