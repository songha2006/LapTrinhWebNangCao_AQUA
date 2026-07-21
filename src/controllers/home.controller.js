const fs = require('fs');
const path = require('path');
const { Product, ProductVariant, Brand, Setting } = require('../models');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');

// Tìm ảnh tùy chỉnh trong public/images/ (thử nhiều đuôi file). Không có -> null.
function customImage(name) {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'avif']) {
    const rel = `/images/${name}.${ext}`;
    if (fs.existsSync(path.join(PUBLIC_DIR, 'images', `${name}.${ext}`))) return rel;
  }
  return null;
}

exports.index = async (req, res, next) => {
  try {
    const include = [{ model: ProductVariant, as: 'variants' }, Brand];
    const [featured, newest] = await Promise.all([
      Product.findAll({ where: { is_featured: true }, include, limit: 8, order: [['id', 'ASC']] }),
      Product.findAll({ include, limit: 8, order: [['created_at', 'DESC']] }),
    ]);

    // Ảnh banner: ưu tiên ảnh admin upload (bảng settings) -> file trong public/images/ -> ảnh sản phẩm.
    const slotKeys = ['hero_1_image', 'hero_2_image', 'banner_image'];
    const allKeys = [];
    slotKeys.forEach((k) => allKeys.push(k, `${k}_pos`, `${k}_zoom`));
    const rows = await Setting.findAll({ where: { key: allKeys } });
    const s = {};
    rows.forEach((r) => { s[r.key] = r.value; });

    // CSS căn chỉnh ảnh theo điểm lấy nét + mức phóng admin đã lưu
    const styleFor = (k) => {
      const pos = s[`${k}_pos`] || '50% 50%';
      const zoom = s[`${k}_zoom`] || '1';
      return `object-position:${pos};transform:scale(${zoom});transform-origin:${pos};`;
    };

    const heroImages = [
      s.hero_1_image || customImage('hero-1'),
      s.hero_2_image || customImage('hero-2'),
    ];
    const heroStyles = [styleFor('hero_1_image'), styleFor('hero_2_image')];
    const bannerImage = s.banner_image || customImage('banner');
    const bannerStyle = styleFor('banner_image');

    res.render('pages/home', {
      title: 'AQUA — Bình giữ nhiệt chính hãng',
      featured, newest, heroImages, heroStyles, bannerImage, bannerStyle,
    });
  } catch (e) { next(e); }
};
