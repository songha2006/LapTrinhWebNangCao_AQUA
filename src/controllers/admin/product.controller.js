const { Op } = require('sequelize');
const { Product, ProductVariant, ProductImage, Category, Brand } = require('../../models');

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const PER_PAGE = 10;

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const where = {};
    if (req.query.q) where.name = { [Op.like]: `%${req.query.q}%` };
    const { rows, count } = await Product.findAndCountAll({
      where, distinct: true,
      include: [Category, Brand, { model: ProductVariant, as: 'variants' }],
      order: [['id', 'DESC']],
      limit: PER_PAGE, offset: (page - 1) * PER_PAGE,
    });
    res.render('admin/products/index', {
      title: 'Quản lý sản phẩm', layout: 'layouts/admin',
      products: rows, page, totalPages: Math.ceil(count / PER_PAGE),
    });
  } catch (e) { next(e); }
};

async function formData() {
  const [categories, brands] = await Promise.all([
    Category.findAll({ order: [['name', 'ASC']] }),
    Brand.findAll({ order: [['name', 'ASC']] }),
  ]);
  return { categories, brands };
}

exports.showCreate = async (req, res, next) => {
  try {
    res.render('admin/products/form', {
      title: 'Thêm sản phẩm', layout: 'layouts/admin',
      product: null, ...(await formData()),
    });
  } catch (e) { next(e); }
};

// Đọc mảng biến thể từ form: variants[0][color], variants[0][capacity]...
function parseVariants(body) {
  const out = [];
  const v = body.variants || {};
  for (const key of Object.keys(v)) {
    const row = v[key];
    if (!row || !row.color || !row.capacity || !row.price) continue;
    out.push({
      id: row.id ? parseInt(row.id) : null,
      color: row.color.trim(),
      color_code: row.color_code || '#888888',
      capacity: parseInt(row.capacity) || 0,
      price: parseInt(row.price) || 0,
      stock: parseInt(row.stock) || 0,
    });
  }
  return out;
}

exports.create = async (req, res, next) => {
  try {
    let slug = slugify(req.body.name);
    if (await Product.findOne({ where: { slug } })) slug = `${slug}-${Date.now()}`;
    const thumbFile = (req.files || []).find((f) => f.fieldname === 'thumbnail');
    const product = await Product.create({
      name: req.body.name.trim(),
      slug,
      description: req.body.description || '',
      category_id: parseInt(req.body.category_id),
      brand_id: parseInt(req.body.brand_id),
      is_featured: req.body.is_featured === 'on',
      thumbnail: thumbFile ? `/uploads/${thumbFile.filename}` : null,
    });
    for (const v of parseVariants(req.body)) {
      await ProductVariant.create({ ...v, product_id: product.id });
    }
    for (const f of (req.files || []).filter((f) => f.fieldname === 'images')) {
      await ProductImage.create({ product_id: product.id, url: `/uploads/${f.filename}` });
    }
    if (!product.thumbnail) {
      const firstImg = await ProductImage.findOne({ where: { product_id: product.id } });
      if (firstImg) await product.update({ thumbnail: firstImg.url });
    }
    req.session.flash = { type: 'success', message: 'Đã thêm sản phẩm' };
    res.redirect('/admin/products');
  } catch (e) { next(e); }
};

exports.showEdit = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: ProductVariant, as: 'variants' }, { model: ProductImage, as: 'images' }],
    });
    if (!product) return res.redirect('/admin/products');
    res.render('admin/products/form', {
      title: 'Sửa sản phẩm', layout: 'layouts/admin',
      product, ...(await formData()),
    });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, { include: [{ model: ProductVariant, as: 'variants' }] });
    if (!product) return res.redirect('/admin/products');

    const thumbFile = (req.files || []).find((f) => f.fieldname === 'thumbnail');
    await product.update({
      name: req.body.name.trim(),
      description: req.body.description || '',
      category_id: parseInt(req.body.category_id),
      brand_id: parseInt(req.body.brand_id),
      is_featured: req.body.is_featured === 'on',
      ...(thumbFile ? { thumbnail: `/uploads/${thumbFile.filename}` } : {}),
    });

    // Đồng bộ biến thể: cập nhật cái có id, tạo cái mới, xóa cái bị bỏ
    const incoming = parseVariants(req.body);
    const keepIds = incoming.filter((v) => v.id).map((v) => v.id);
    await ProductVariant.destroy({ where: { product_id: product.id, id: { [Op.notIn]: keepIds.length ? keepIds : [0] } } });
    for (const v of incoming) {
      if (v.id) {
        await ProductVariant.update(
          { color: v.color, color_code: v.color_code, capacity: v.capacity, price: v.price, stock: v.stock },
          { where: { id: v.id, product_id: product.id } },
        );
      } else {
        await ProductVariant.create({ ...v, product_id: product.id });
      }
    }
    for (const f of (req.files || []).filter((f) => f.fieldname === 'images')) {
      await ProductImage.create({ product_id: product.id, url: `/uploads/${f.filename}` });
    }
    req.session.flash = { type: 'success', message: 'Đã cập nhật sản phẩm' };
    res.redirect('/admin/products');
  } catch (e) { next(e); }
};

exports.destroy = async (req, res, next) => {
  try {
    await ProductVariant.destroy({ where: { product_id: req.params.id } });
    await ProductImage.destroy({ where: { product_id: req.params.id } });
    await Product.destroy({ where: { id: req.params.id } });
    req.session.flash = { type: 'success', message: 'Đã xóa sản phẩm' };
    res.redirect('/admin/products');
  } catch (e) {
    req.session.flash = { type: 'error', message: 'Không thể xóa: sản phẩm đã có trong đơn hàng' };
    res.redirect('/admin/products');
  }
};

exports.deleteImage = async (req, res, next) => {
  try {
    const img = await ProductImage.findByPk(req.params.imageId);
    if (img) await img.destroy();
    res.redirect(`/admin/products/${req.params.id}/edit`);
  } catch (e) { next(e); }
};
