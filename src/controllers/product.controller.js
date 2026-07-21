const { Op } = require('sequelize');
const { Product, ProductVariant, ProductImage, Category, Brand, Review, User, Order, OrderItem } = require('../models');

const PER_PAGE = 9;

// Danh sách + tìm kiếm + lọc + phân trang
exports.list = async (req, res, next) => {
  try {
    const { q, category, brand, color, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const priceMin = parseInt(req.query.price_min) || 0;
    const priceMax = parseInt(req.query.price_max) || 0;
    const capacity = req.query.capacity; // 'lt500' | '500-750' | 'gt750'

    const where = {};
    if (q) where.name = { [Op.like]: `%${q}%` };
    if (category) {
      const cat = await Category.findOne({ where: { slug: category } });
      if (cat) where.category_id = cat.id;
    }
    if (brand) where.brand_id = brand;

    // Lọc theo biến thể (giá, dung tích, màu)
    const variantWhere = {};
    if (priceMin) variantWhere.price = { ...(variantWhere.price || {}), [Op.gte]: priceMin };
    if (priceMax) variantWhere.price = { ...(variantWhere.price || {}), [Op.lte]: priceMax };
    if (color) variantWhere.color = color;
    if (capacity === 'lt500') variantWhere.capacity = { [Op.lt]: 500 };
    else if (capacity === '500-750') variantWhere.capacity = { [Op.gte]: 500, [Op.lte]: 750 };
    else if (capacity === 'gt750') variantWhere.capacity = { [Op.gt]: 750 };

    const hasVariantFilter = Object.keys(variantWhere).length > 0;

    // Lấy id sản phẩm khớp bộ lọc biến thể trước để phân trang chính xác
    if (hasVariantFilter) {
      const matched = await ProductVariant.findAll({ where: variantWhere, attributes: ['product_id'], group: ['product_id'] });
      where.id = { [Op.in]: matched.map((v) => v.product_id) };
    }

    let order = [['created_at', 'DESC']];
    if (sort === 'name') order = [['name', 'ASC']];

    const { rows, count } = await Product.findAndCountAll({
      where, order, distinct: true,
      include: [{ model: ProductVariant, as: 'variants' }, Brand, Category],
      limit: PER_PAGE, offset: (page - 1) * PER_PAGE,
    });

    // Sắp xếp theo giá (giá thấp nhất của biến thể) thực hiện trên trang hiện tại
    let products = rows;
    const minPrice = (p) => Math.min(...p.variants.map((v) => v.price));
    if (sort === 'price_asc') products = [...rows].sort((a, b) => minPrice(a) - minPrice(b));
    if (sort === 'price_desc') products = [...rows].sort((a, b) => minPrice(b) - minPrice(a));

    const [brands, colors] = await Promise.all([
      Brand.findAll({ order: [['name', 'ASC']] }),
      ProductVariant.findAll({ attributes: ['color', 'color_code'], group: ['color', 'color_code'] }),
    ]);

    res.render('pages/products', {
      title: 'Sản phẩm',
      products, brands, colors,
      totalPages: Math.ceil(count / PER_PAGE), page, total: count,
    });
  } catch (e) { next(e); }
};

// Chi tiết sản phẩm
exports.detail = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { slug: req.params.slug },
      include: [
        { model: ProductVariant, as: 'variants' },
        { model: ProductImage, as: 'images' },
        Category, Brand,
        { model: Review, as: 'reviews', where: { is_hidden: false }, required: false, include: [User] },
      ],
      order: [[{ model: Review, as: 'reviews' }, 'created_at', 'DESC']],
    });
    if (!product) return res.status(404).render('pages/404', { title: 'Không tìm thấy' });

    const related = await Product.findAll({
      where: { category_id: product.category_id, id: { [Op.ne]: product.id } },
      include: [{ model: ProductVariant, as: 'variants' }, Brand],
      limit: 4,
    });

    // Chỉ người đã mua (đơn hoàn thành) mới được đánh giá
    let canReview = false;
    let hasReviewed = false;
    if (req.session.user) {
      const bought = await OrderItem.findOne({
        include: [
          { model: Order, where: { user_id: req.session.user.id, status: 'completed' } },
          { model: ProductVariant, as: 'variant', where: { product_id: product.id } },
        ],
      });
      canReview = Boolean(bought);
      hasReviewed = Boolean(await Review.findOne({ where: { user_id: req.session.user.id, product_id: product.id } }));
    }

    const ratings = product.reviews.map((r) => r.rating);
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;

    res.render('pages/product-detail', { title: product.name, product, related, canReview, hasReviewed, avgRating });
  } catch (e) { next(e); }
};
