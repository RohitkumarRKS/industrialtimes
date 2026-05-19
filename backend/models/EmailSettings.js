const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const EmailSettings = sequelize.define('EmailSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1 // We only need one settings record
  },
  adminEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'admin@industrialtimes.com'
  },
  emailSignature: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'Best regards,\nIndustrial Times Team'
  }
});

module.exports = EmailSettings;
