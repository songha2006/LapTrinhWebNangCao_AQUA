const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
  brand_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
  thumbnail: { type: DataTypes.STRING(255) },
  is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'products', underscored: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Product;
