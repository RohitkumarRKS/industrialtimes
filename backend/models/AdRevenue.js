const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AdRevenue = sequelize.define('AdRevenue', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  adRequestId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  adPricingId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  gstAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'ad_payment'
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'completed'
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'AdRevenue'
});

module.exports = AdRevenue;
