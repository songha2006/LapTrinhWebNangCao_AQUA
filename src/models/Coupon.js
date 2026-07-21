const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Coupon = sequelize.define('Coupon', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  type: { type: DataTypes.ENUM('percent', 'fixed'), allowNull: false, defaultValue: 'percent' },
  value: { type: DataTypes.INTEGER, allowNull: false },
  min_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  expires_at: { type: DataTypes.DATE },
}, { tableName: 'coupons', underscored: true, timestamps: false });

module.exports = Coupon;
