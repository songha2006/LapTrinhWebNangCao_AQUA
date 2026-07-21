const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Lưu cấu hình giao diện dạng key-value (ảnh banner trang chủ...)
const Setting = sequelize.define('Setting', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  value: { type: DataTypes.TEXT },
}, { tableName: 'settings', underscored: true, timestamps: false });

module.exports = Setting;
