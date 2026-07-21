const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProductVariant = sequelize.define('ProductVariant', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  color: { type: DataTypes.STRING(50), allowNull: false },
  color_code: { type: DataTypes.STRING(20) },
  capacity: { type: DataTypes.INTEGER, allowNull: false, comment: 'ml' },
  price: { type: DataTypes.INTEGER, allowNull: false, comment: 'VND' },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  image: { type: DataTypes.STRING(255) },
}, { tableName: 'product_variants', underscored: true, timestamps: false });

module.exports = ProductVariant;
