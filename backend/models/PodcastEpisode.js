const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PodcastEpisode = sequelize.define('PodcastEpisode', {
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
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  audioUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  guestName: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  episodeNumber: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = PodcastEpisode;
