const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Webinar = sequelize.define('Webinar', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  speaker: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  dateTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  dateTimeEnd: {
    type: DataTypes.DATE,
    allowNull: true
  },
  schedule: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]'
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  paymentButtonText: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Pay Registration Fee'
  },
  paymentLink: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  isPaymentEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  entryFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 99.00
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  meetingLink: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  whatsAppGroupLink: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  isRecordedVideo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Webinar;

