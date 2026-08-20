const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ManagerActivity = sequelize.define('ManagerActivity', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  managerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  managerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = ManagerActivity;
