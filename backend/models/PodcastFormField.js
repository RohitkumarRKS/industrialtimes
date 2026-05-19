const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PodcastFormField = sequelize.define('PodcastFormField', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('text', 'textarea', 'date', 'select', 'checkbox', 'url', 'tel', 'email'),
    allowNull: false,
    defaultValue: 'text'
  },
  required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  options: {
    type: DataTypes.JSON, // For select options like ["Option 1", "Option 2"]
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = PodcastFormField;
