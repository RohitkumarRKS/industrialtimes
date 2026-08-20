const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PromoCode = sequelize.define('PromoCode', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  discountType: {
    type: DataTypes.STRING, // 'percentage' or 'flat_amount'
    allowNull: false,
    defaultValue: 'percentage'
  },
  discountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  applicableTo: {
    type: DataTypes.STRING, // 'all', 'membership', 'podcast', 'webinar', 'reporter', 'ad'
    allowNull: false,
    defaultValue: 'all'
  },
  maxUses: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  usedCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  minOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'PromoCodes',
  timestamps: true
});

module.exports = PromoCode;
