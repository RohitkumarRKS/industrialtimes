const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PodcastGuest = sequelize.define('PodcastGuest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  background: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  earliestAvailability: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  customData: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
});

module.exports = PodcastGuest;
