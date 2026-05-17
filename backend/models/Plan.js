const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  planKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  priceMonthly: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  priceQuarterly: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  priceYearly: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  features: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    get() {
      const rawValue = this.getDataValue('features');
      try {
        return JSON.parse(rawValue);
      } catch (e) {
        return [];
      }
    },
    set(value) {
      this.setDataValue('features', JSON.stringify(value));
    }
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '#3b82f6'
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'bi-briefcase'
  },
  recommended: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Plan;
