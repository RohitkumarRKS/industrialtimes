const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BreakingNews = sequelize.define('BreakingNews', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  text: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'breaking_news',
  timestamps: true
});

module.exports = BreakingNews;
