const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  coupon_id: { type: DataTypes.INTEGER },
  subtotal: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  discount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  total: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'shipping', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  payment_method: { type: DataTypes.ENUM('cod', 'vnpay'), defaultValue: 'cod' },
  payment_status: { type: DataTypes.ENUM('unpaid', 'paid'), defaultValue: 'unpaid' },
  receiver_name: { type: DataTypes.STRING(100), allowNull: false },
  address: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  note: { type: DataTypes.STRING(500) },
}, { tableName: 'orders', underscored: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Order;
