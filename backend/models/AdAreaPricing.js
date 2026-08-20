const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AdAreaPricing = sequelize.define('AdAreaPricing', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  slot: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'leaderboard'
  },
  pricePerDay: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  reporterPricePerDay: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  corporatePricePerDay: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'AdAreaPricing',
  indexes: [
    {
      unique: true,
      fields: ['state', 'city', 'slot']
    }
  ]
});

AdAreaPricing.lookupPrice = async function (state, city, slot, role) {
  let record = null;
  if (city) {
    record = await this.findOne({
      where: { state, city, slot, isActive: true }
    });
  }

  if (!record) {
    record = await this.findOne({
      where: { state, city: '', slot, isActive: true }
    });
  }

  if (!record) return null;

  if (role === 'author' || role === 'reporter') {
    return parseFloat(record.reporterPricePerDay);
  }
  return parseFloat(record.corporatePricePerDay);
};

module.exports = AdAreaPricing;
