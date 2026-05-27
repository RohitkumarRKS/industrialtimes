const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const dialect = process.env.DB_DIALECT || 'sqlite';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'database',
  process.env.DB_USER || 'username',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: dialect,
    storage: dialect === 'sqlite' ? require('path').join(__dirname, '..', 'database.sqlite') : undefined,
    logging: false,
    port: process.env.DB_PORT || 3306
  }
);

module.exports = sequelize;
