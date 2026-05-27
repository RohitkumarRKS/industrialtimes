const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Follower = sequelize.define('Follower', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reporterId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['userId', 'reporterId']
    }
  ]
});

module.exports = Follower;
