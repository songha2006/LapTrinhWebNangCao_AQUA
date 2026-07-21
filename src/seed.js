/**
 * Seed dữ liệu mẫu: node src/seed.js
 * - Tạo bảng (xóa dữ liệu cũ), tạo ảnh SVG sản phẩm trong public/images/products
 * - Admin: admin@shop.com / admin123 — Khách: an@example.com / user123
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const {
  sequelize, User, Category, Brand, Product, ProductVariant, ProductImage,
  Coupon, Order, OrderItem, Review,
} = require('./models');

const IMG_DIR = path.join(__dirname, '..', 'public', 'images', 'products');

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Vẽ ảnh bình giữ nhiệt SVG theo màu — dùng làm ảnh sản phẩm demo
function svgBottle(color, bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
<defs>
  <linearGradient id="body" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${color}" stop-opacity=".72"/>
    <stop offset=".35" stop-color="${color}"/>
    <stop offset=".62" stop-color="${color}" stop-opacity=".82"/>
    <stop offset="1" stop-color="${color}" stop-opacity=".6"/>
  </linearGradient>
  <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/>
    <stop offset=".5" stop-color="#fff" stop-opacity=".45"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
</defs>
<rect width="600" height="600" fill="${bg}"/>
<ellipse cx="300" cy="520" rx="150" ry="22" fill="#000" opacity=".08"/>
<rect x="255" y="88" width="90" height="34" rx="10" fill="#2c3138"/>
<rect x="248" y="118" width="104" height="18" rx="9" fill="#3a4048"/>
<path d="M225 150 h150 a0 0 0 0 1 0 0 v22 q0 14 8 24 q14 18 14 44 v240 q0 40 -40 40 h-114 q-40 0 -40 -40 v-240 q0 -26 14 -44 q8 -10 8 -24 v-22 z" fill="url(#body)"/>
<rect x="272" y="150" width="26" height="360" rx="13" fill="url(#shine)"/>
<rect x="203" y="332" width="194" height="58" fill="#fff" opacity=".92"/>
<text x="300" y="368" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#2c3138" text-anchor="middle" letter-spacing="3">AQUA</text>
</svg>`;
}

const COLORS = {
  'Đen': ['#23272e', '#f2f4f6'],
  'Trắng': ['#d8dde3', '#eef1f4'],
  'Bạc': ['#9aa4ae', '#f2f4f6'],
  'Xanh lá': ['#2f7d5d', '#eef4f0'],
  'Xanh rêu': ['#4a5d43', '#f0f3ee'],
  'Xanh dương': ['#2b5d8f', '#eef2f6'],
  'Xanh navy': ['#243a5e', '#eef1f6'],
  'Đỏ': ['#b03a3a', '#f6efef'],
  'Đỏ đô': ['#7c2d3e', '#f6eff1'],
  'Hồng': ['#d98aa3', '#f8f1f3'],
  'Cam': ['#d97f3e', '#f8f2ec'],
  'Vàng': ['#d9b23e', '#f8f5ea'],
  'Tím': ['#7d5ba6', '#f3f0f7'],
  'Be': ['#c9b899', '#f7f4ee'],
};

// Vẽ ảnh SVG dự phòng (khi chưa có PIXABAY_KEY hoặc tải ảnh thật lỗi)
function makeImage(slug, colorName) {
  const [color, bg] = COLORS[colorName] || COLORS['Bạc'];
  const file = `${slug}-${slugify(colorName)}.svg`;
  fs.writeFileSync(path.join(IMG_DIR, file), svgBottle(color, bg));
  return `/images/products/${file}`;
}

// ===== Ảnh thật từ Pixabay (tùy chọn) =====
const PIXABAY_KEY = process.env.PIXABAY_KEY || '';

// Từ khóa tìm ảnh (tiếng Anh) theo danh mục để ra ảnh sát nhất
const CATEGORY_QUERY = {
  'Bình giữ nhiệt': 'thermos vacuum flask bottle',
  'Ly giữ nhiệt': 'tumbler insulated cup',
  'Bình thể thao': 'sport water bottle',
  'Bình cho bé': 'kids water bottle',
  'Ca cốc giữ nhiệt': 'coffee travel mug',
};

// Gọi API Pixabay, trả về mảng URL ảnh (rỗng nếu lỗi)
async function pixabaySearch(query, count) {
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}` +
    `&q=${encodeURIComponent(query)}&image_type=photo&orientation=vertical` +
    `&per_page=${Math.max(3, Math.min(count, 30))}&safesearch=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Pixabay HTTP ' + res.status);
  const data = await res.json();
  return (data.hits || []).map((h) => h.webformatURL);
}

async function downloadImage(url, fileName) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Tải ảnh HTTP ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(IMG_DIR, fileName), buf);
  return `/images/products/${fileName}`;
}

// [tên, danh mục, thương hiệu, mô tả, nổi bật, [[màu, dung tích ml, giá, tồn kho]...]]
const PRODUCTS = [
  ['Bình giữ nhiệt Lock&Lock Vienna', 'Bình giữ nhiệt', 'Lock&Lock',
    'Bình giữ nhiệt inox 304 hai lớp chân không, giữ nóng 12 giờ, giữ lạnh 24 giờ. Nắp xoay kín tuyệt đối, phù hợp mang đi làm, đi học.', true,
    [['Đen', 500, 385000, 40], ['Trắng', 500, 385000, 35], ['Xanh rêu', 500, 399000, 25]]],
  ['Bình giữ nhiệt Lock&Lock Metro Tumbler', 'Ly giữ nhiệt', 'Lock&Lock',
    'Ly giữ nhiệt có tay cầm và ống hút, dung tích lớn, thích hợp cho dân văn phòng. Lòng ly inox 304 không mùi.', true,
    [['Be', 750, 425000, 30], ['Đen', 750, 425000, 28], ['Hồng', 750, 439000, 20]]],
  ['Bình giữ nhiệt Thermos FFX-501', 'Bình thể thao', 'Thermos',
    'Bình thể thao cao cấp Nhật Bản, siêu nhẹ chỉ 280g, giữ lạnh 18 giờ. Nắp bật một chạm, khóa an toàn.', true,
    [['Xanh navy', 500, 690000, 15], ['Đỏ', 500, 690000, 12], ['Bạc', 500, 675000, 18]]],
  ['Bình giữ nhiệt Thermos JNL-504', 'Bình giữ nhiệt', 'Thermos',
    'Dòng bán chạy nhất của Thermos, nhỏ gọn bỏ vừa túi xách, giữ nóng 6 giờ trên 68°C.', false,
    [['Trắng', 500, 720000, 22], ['Đen', 500, 720000, 19]]],
  ['Bình giữ nhiệt Elmich EL-3145', 'Bình giữ nhiệt', 'Elmich',
    'Bình giữ nhiệt inox 304 chuẩn châu Âu, công nghệ hút chân không kép, bảo hành 24 tháng.', true,
    [['Bạc', 750, 315000, 45], ['Xanh dương', 750, 329000, 38], ['Đỏ đô', 750, 329000, 26]]],
  ['Bình giữ nhiệt Elmich Compact 350', 'Bình giữ nhiệt', 'Elmich',
    'Phiên bản nhỏ gọn 350ml dành cho trẻ em và người mang cà phê sáng. Nắp chống rò rỉ tuyệt đối.', false,
    [['Hồng', 350, 259000, 33], ['Xanh lá', 350, 259000, 29], ['Vàng', 350, 259000, 27]]],
  ['Bình giữ nhiệt Zojirushi SM-SF48', 'Bình giữ nhiệt', 'Zojirushi',
    'Thương hiệu số 1 Nhật Bản. Lớp phủ trong lòng bình chống bám mùi, miệng bình rộng dễ vệ sinh.', true,
    [['Đen', 480, 890000, 14], ['Xanh navy', 480, 890000, 11], ['Be', 480, 905000, 9]]],
  ['Bình giữ nhiệt Zojirushi Tuff SM-KC', 'Bình giữ nhiệt', 'Zojirushi',
    'Siêu nhẹ 170g, thành bình mỏng 1mm nhưng giữ nhiệt vượt trội, top bình mang đi du lịch.', false,
    [['Trắng', 360, 830000, 16], ['Hồng', 360, 830000, 13]]],
  ['Bình giữ nhiệt Tiger MMZ-K501', 'Bình giữ nhiệt', 'Tiger',
    'Công nghệ Super Clean Plus chống bám bẩn, khử mùi. Giữ nóng 71°C sau 6 giờ.', false,
    [['Đỏ', 500, 745000, 17], ['Bạc', 500, 745000, 21]]],
  ['Ly giữ nhiệt Tiger MCB-H048', 'Ly giữ nhiệt', 'Tiger',
    'Ly giữ nhiệt văn phòng có nắp trượt thông minh, chống đổ khi va chạm nhẹ.', false,
    [['Trắng', 480, 560000, 24], ['Xanh dương', 480, 560000, 18]]],
  ['Bình thể thao Hydro Flask Wide Mouth', 'Bình thể thao', 'Hydro Flask',
    'Biểu tượng bình giữ nhiệt Mỹ, công nghệ TempShield, giữ lạnh 24 giờ. Miệng rộng bỏ đá viên thoải mái.', true,
    [['Xanh lá', 946, 950000, 20], ['Đen', 946, 950000, 25], ['Cam', 946, 965000, 15], ['Tím', 946, 965000, 12]]],
  ['Bình thể thao Hydro Flask Standard', 'Bình thể thao', 'Hydro Flask',
    'Phiên bản miệng tiêu chuẩn 621ml, kèm nắp Sport Cap uống trực tiếp khi vận động.', false,
    [['Vàng', 621, 850000, 18], ['Xanh navy', 621, 850000, 22]]],
  ['Ly giữ nhiệt Stanley Quencher H2.0', 'Ly giữ nhiệt', 'Stanley',
    'Hot trend toàn cầu — ly 1.18L có tay cầm, ống hút, để vừa khay nước ô tô. Giữ lạnh cả ngày dài.', true,
    [['Be', 1180, 1150000, 10], ['Hồng', 1180, 1180000, 8], ['Xanh rêu', 1180, 1150000, 14]]],
  ['Bình giữ nhiệt Stanley Classic Legendary', 'Bình giữ nhiệt', 'Stanley',
    'Huyền thoại 100 năm của Mỹ, thân bình chịu va đập, giữ nóng 24 giờ, dành cho dã ngoại.', false,
    [['Xanh rêu', 1000, 1290000, 9], ['Đen', 1000, 1290000, 11]]],
  ['Bình giữ nhiệt cho bé Lock&Lock Kids', 'Bình cho bé', 'Lock&Lock',
    'Bình cho bé có ống hút silicone mềm, dây đeo vai, họa tiết dễ thương, an toàn tuyệt đối.', false,
    [['Hồng', 350, 345000, 30], ['Xanh dương', 350, 345000, 27], ['Vàng', 350, 345000, 24]]],
  ['Bình giữ nhiệt cho bé Zojirushi SC-ZT', 'Bình cho bé', 'Zojirushi',
    'Bình 2 nắp: nắp cốc và nắp ống hút, kèm túi đựng cách nhiệt, chuẩn an toàn Nhật Bản.', false,
    [['Xanh lá', 450, 990000, 8], ['Đỏ', 450, 990000, 10]]],
  ['Ca giữ nhiệt Elmich Office Mug', 'Ca cốc giữ nhiệt', 'Elmich',
    'Ca giữ nhiệt để bàn có tay cầm, nắp kính cường lực, giữ nóng cà phê suốt buổi sáng.', false,
    [['Đen', 400, 285000, 36], ['Trắng', 400, 285000, 31]]],
  ['Ca giữ nhiệt Lock&Lock Coffee Mug', 'Ca cốc giữ nhiệt', 'Lock&Lock',
    'Ca cà phê hai lớp chống bỏng tay, nắp trượt chống bụi, phong cách tối giản.', false,
    [['Be', 580, 315000, 26], ['Đen', 580, 315000, 29]]],
  ['Bình thể thao Thermos Sport TS-4379', 'Bình thể thao', 'Thermos',
    'Bình tập gym có vạch đo lượng nước, van uống nhanh, thân chống trượt.', false,
    [['Đen', 710, 590000, 23], ['Xanh dương', 710, 590000, 19]]],
  ['Bình giữ nhiệt Tiger MTA-T048', 'Bình giữ nhiệt', 'Tiger',
    'Thiết kế vintage sang trọng, giữ nhiệt kép nóng/lạnh, quà tặng doanh nghiệp được ưa chuộng.', false,
    [['Đỏ đô', 480, 810000, 12], ['Be', 480, 810000, 15]]],
  ['Ly giữ nhiệt Hydro Flask Tumbler', 'Ly giữ nhiệt', 'Hydro Flask',
    'Ly tumbler 828ml kèm ống hút, màu sắc trẻ trung, giữ lạnh trà sữa 12 giờ.', false,
    [['Tím', 828, 720000, 17], ['Cam', 828, 720000, 14], ['Trắng', 828, 705000, 21]]],
  ['Bình giữ nhiệt Elmich Travel 1L', 'Bình giữ nhiệt', 'Elmich',
    'Dung tích 1 lít cho cả gia đình, kèm 2 cốc nhỏ, phù hợp picnic và đi xa.', false,
    [['Bạc', 1000, 415000, 20], ['Xanh navy', 1000, 429000, 16]]],
];

async function main() {
  console.log('Dang tao bang...');
  await sequelize.sync({ force: true });

  fs.mkdirSync(IMG_DIR, { recursive: true });

  // ===== Users =====
  const [adminHash, userHash] = await Promise.all([bcrypt.hash('admin123', 10), bcrypt.hash('user123', 10)]);
  const admin = await User.create({ name: 'Quản trị viên', email: 'admin@shop.com', password_hash: adminHash, role: 'admin', phone: '0900000000', address: 'TP.HCM' });
  const userAn = await User.create({ name: 'Nguyễn Văn An', email: 'an@example.com', password_hash: userHash, phone: '0911111111', address: '12 Nguyễn Trãi, Q.1, TP.HCM' });
  const userBinh = await User.create({ name: 'Trần Thị Bình', email: 'binh@example.com', password_hash: userHash, phone: '0922222222', address: '45 Lê Lợi, Hải Châu, Đà Nẵng' });

  // ===== Categories & Brands =====
  const catNames = ['Bình giữ nhiệt', 'Ly giữ nhiệt', 'Bình thể thao', 'Bình cho bé', 'Ca cốc giữ nhiệt'];
  const cats = {};
  for (const name of catNames) cats[name] = await Category.create({ name, slug: slugify(name) });

  const brandNames = ['Lock&Lock', 'Thermos', 'Elmich', 'Zojirushi', 'Tiger', 'Hydro Flask', 'Stanley'];
  const brands = {};
  for (const name of brandNames) brands[name] = await Brand.create({ name });

  // ===== Products =====
  if (PIXABAY_KEY) console.log('Có PIXABAY_KEY -> tải ảnh thật từ Pixabay...');
  else console.log('Chưa có PIXABAY_KEY -> dùng ảnh SVG tự vẽ (điền key vào .env để có ảnh thật).');

  const allVariants = [];
  const allProducts = [];
  for (const [name, cat, brand, desc, featured, variants] of PRODUCTS) {
    const slug = slugify(name);

    // Thử lấy danh sách ảnh thật cho sản phẩm (mỗi biến thể 1 ảnh khác nhau)
    let photoUrls = [];
    if (PIXABAY_KEY) {
      try {
        photoUrls = await pixabaySearch(CATEGORY_QUERY[cat] || 'thermos bottle', variants.length + 1);
      } catch (e) {
        console.warn(`  ! Pixabay lỗi cho "${name}": ${e.message} (dùng SVG)`);
      }
    }

    // Ảnh đại diện
    let thumb;
    if (photoUrls[0]) {
      try { thumb = await downloadImage(photoUrls[0], `${slug}-thumb.jpg`); }
      catch { thumb = makeImage(slug, variants[0][0]); }
    } else {
      thumb = makeImage(slug, variants[0][0]);
    }

    const p = await Product.create({
      name, slug, description: desc, thumbnail: thumb, is_featured: featured,
      category_id: cats[cat].id, brand_id: brands[brand].id,
    });
    allProducts.push(p);

    for (let vi = 0; vi < variants.length; vi++) {
      const [color, capacity, price, stock] = variants[vi];
      // Mỗi biến thể lấy 1 ảnh trong danh sách; hết ảnh thì quay lại ảnh đầu; lỗi thì SVG
      let img;
      const purl = photoUrls[vi + 1] || photoUrls[vi] || photoUrls[0];
      if (purl) {
        try { img = await downloadImage(purl, `${slug}-${slugify(color)}.jpg`); }
        catch { img = makeImage(slug, color); }
      } else {
        img = makeImage(slug, color);
      }
      const v = await ProductVariant.create({
        product_id: p.id, color, color_code: (COLORS[color] || COLORS['Bạc'])[0],
        capacity, price, stock, image: img,
      });
      allVariants.push(v);
      await ProductImage.create({ product_id: p.id, url: img });
    }
  }

  // ===== Coupons =====
  const in30days = new Date(Date.now() + 30 * 864e5);
  const coupons = await Coupon.bulkCreate([
    { code: 'WELCOME10', type: 'percent', value: 10, min_order: 300000, quantity: 100, expires_at: in30days },
    { code: 'GIAM50K', type: 'fixed', value: 50000, min_order: 500000, quantity: 50, expires_at: in30days },
    { code: 'VIP20', type: 'percent', value: 20, min_order: 1500000, quantity: 20, expires_at: in30days },
    { code: 'HETHAN', type: 'percent', value: 15, min_order: 0, quantity: 10, expires_at: new Date(Date.now() - 864e5) },
  ]);

  // ===== Đơn hàng mẫu (rải 30 ngày gần nhất để dashboard có số liệu) =====
  const statuses = ['completed', 'completed', 'completed', 'shipping', 'confirmed', 'pending'];
  const buyers = [userAn, userBinh];
  for (let i = 0; i < 24; i++) {
    const buyer = buyers[i % 2];
    const created = new Date(Date.now() - Math.floor(Math.random() * 30) * 864e5 - Math.floor(Math.random() * 86400) * 1000);
    const nItems = 1 + Math.floor(Math.random() * 3);
    let subtotal = 0;
    const chosen = [];
    for (let j = 0; j < nItems; j++) {
      const v = allVariants[Math.floor(Math.random() * allVariants.length)];
      const qty = 1 + Math.floor(Math.random() * 2);
      chosen.push([v, qty]);
      subtotal += v.price * qty;
    }
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const method = Math.random() > 0.5 ? 'vnpay' : 'cod';
    const order = await Order.create({
      user_id: buyer.id, subtotal, discount: 0, total: subtotal,
      status,
      payment_method: method,
      payment_status: status === 'completed' || method === 'vnpay' ? 'paid' : 'unpaid',
      receiver_name: buyer.name, address: buyer.address, phone: buyer.phone,
      created_at: created, updated_at: created,
    });
    for (const [v, qty] of chosen) {
      await OrderItem.create({ order_id: order.id, variant_id: v.id, quantity: qty, price: v.price });
    }
  }

  // ===== Reviews =====
  const comments = [
    [5, 'Bình đẹp, giữ nhiệt tốt hơn mong đợi. Sáng pha cà phê chiều vẫn còn nóng!'],
    [4, 'Chất lượng ổn so với giá, giao hàng nhanh. Trừ 1 sao vì hộp hơi móp.'],
    [5, 'Mua tặng mẹ, mẹ rất thích. Màu sắc y hình, đóng gói cẩn thận.'],
    [3, 'Giữ nhiệt tạm được, khoảng 5-6 tiếng là nguội. Đổi lại thiết kế đẹp.'],
    [5, 'Đáng tiền! Mang đi tập gym cả ngày nước vẫn mát lạnh.'],
    [4, 'Nắp đóng chắc chắn, không rò rỉ khi bỏ balo. Sẽ ủng hộ shop tiếp.'],
  ];
  for (let i = 0; i < 14; i++) {
    const p = allProducts[Math.floor(Math.random() * allProducts.length)];
    const [rating, comment] = comments[i % comments.length];
    await Review.create({
      user_id: buyers[i % 2].id, product_id: p.id, rating, comment,
      is_hidden: i === 13, // 1 review bị ẩn để demo chức năng quản lý
    });
  }

  console.log('Seed xong!');
  console.log('  Admin : admin@shop.com / admin123');
  console.log('  Khách : an@example.com / user123');
  console.log(`  ${PRODUCTS.length} sản phẩm, ${allVariants.length} biến thể, ${coupons.length} mã giảm giá`);
  await sequelize.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
