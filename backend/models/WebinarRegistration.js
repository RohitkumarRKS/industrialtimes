const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WebinarRegistration = sequelize.define('WebinarRegistration', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  webinarId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  paymentStatus: {
    type: DataTypes.STRING,
    defaultValue: 'pending' // 'pending', 'completed'
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  }
});

module.exports = WebinarRegistration;
