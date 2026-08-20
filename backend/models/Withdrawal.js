const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Withdrawal = sequelize.define('Withdrawal', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  requestedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  adminActionAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'bank_transfer'
  },
  paymentDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'Withdrawal'
});

module.exports = Withdrawal;
