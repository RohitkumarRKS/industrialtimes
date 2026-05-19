const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const EmailLog = sequelize.define('EmailLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  toEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('sent', 'failed'),
    allowNull: false
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING, // e.g., 'podcast_submission', 'podcast_reply', 'podcast_admin_notification'
    allowNull: true
  }
});

module.exports = EmailLog;
