const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AdPricing = sequelize.define('AdPricing', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  adRequestId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  baseAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  gstRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 18.00
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
  adminFinalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null
  },
  adminGstAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null
  },
  adminTotalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null
  },
  adminConfirmedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  pricingFactors: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending_review'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'AdPricing'
});

module.exports = AdPricing;
