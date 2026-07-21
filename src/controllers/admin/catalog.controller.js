// CRUD danh mục + thương hiệu (gộp chung vì cấu trúc giống nhau)
const { Category, Brand, Product } = require('../../models');

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ===== Danh mục =====
exports.categories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      include: [Product],
      order: [['id', 'ASC']],
    });
    res.render('admin/categories', { title: 'Danh mục', layout: 'layouts/admin', categories });
  } catch (e) { next(e); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim();
    if (name) {
      let slug = slugify(name);
      if (await Category.findOne({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
      await Category.create({ name, slug });
    }
    req.session.flash = { type: 'success', message: 'Đã thêm danh mục' };
    res.redirect('/admin/categories');
  } catch (e) {
    req.session.flash = { type: 'error', message: 'Tên danh mục đã tồn tại' };
    res.redirect('/admin/categories');
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim();
    if (name) await Category.update({ name, slug: slugify(name) }, { where: { id: req.params.id } });
    req.session.flash = { type: 'success', message: 'Đã cập nhật danh mục' };
    res.redirect('/admin/categories');
  } catch (e) { next(e); }
};

exports.deleteCategory = async (req, res) => {
  try {
    const count = await Product.count({ where: { category_id: req.params.id } });
    if (count > 0) {
      req.session.flash = { type: 'error', message: `Không thể xóa: còn ${count} sản phẩm thuộc danh mục này` };
    } else {
      await Category.destroy({ where: { id: req.params.id } });
      req.session.flash = { type: 'success', message: 'Đã xóa danh mục' };
    }
  } catch {
    req.session.flash = { type: 'error', message: 'Không thể xóa danh mục' };
  }
  res.redirect('/admin/categories');
};

// ===== Thương hiệu =====
exports.brands = async (req, res, next) => {
  try {
    const brands = await Brand.findAll({ include: [Product], order: [['id', 'ASC']] });
    res.render('admin/brands', { title: 'Thương hiệu', layout: 'layouts/admin', brands });
  } catch (e) { next(e); }
};

exports.createBrand = async (req, res) => {
  const name = (req.body.name || '').trim();
  if (name) await Brand.create({ name });
  req.session.flash = { type: 'success', message: 'Đã thêm thương hiệu' };
  res.redirect('/admin/brands');
};

exports.updateBrand = async (req, res) => {
  const name = (req.body.name || '').trim();
  if (name) await Brand.update({ name }, { where: { id: req.params.id } });
  req.session.flash = { type: 'success', message: 'Đã cập nhật thương hiệu' };
  res.redirect('/admin/brands');
};

exports.deleteBrand = async (req, res) => {
  try {
    const count = await Product.count({ where: { brand_id: req.params.id } });
    if (count > 0) {
      req.session.flash = { type: 'error', message: `Không thể xóa: còn ${count} sản phẩm thuộc thương hiệu này` };
    } else {
      await Brand.destroy({ where: { id: req.params.id } });
      req.session.flash = { type: 'success', message: 'Đã xóa thương hiệu' };
    }
  } catch {
    req.session.flash = { type: 'error', message: 'Không thể xóa thương hiệu' };
  }
  res.redirect('/admin/brands');
};
