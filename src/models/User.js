const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  address: { type: DataTypes.STRING(255) },
  role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
  is_locked: { type: DataTypes.BOOLEAN, defaultValue: false },
  reset_token: { type: DataTypes.STRING(100) },
  reset_token_expires: { type: DataTypes.DATE },
}, { tableName: 'users', underscored: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = User;
