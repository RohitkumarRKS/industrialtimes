const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AdRequest = sequelize.define('AdRequest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  adTitle: {
    type: DataTypes.STRING,
    allowNull: false
  },
  adDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  slot: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'leaderboard'
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '1 month'
  },
  budget: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = AdRequest;
