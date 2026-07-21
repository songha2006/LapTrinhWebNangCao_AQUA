const { Setting } = require('../../models');

// Các vị trí ảnh banner cho phép admin tùy chỉnh
const SLOTS = ['hero_1_image', 'hero_2_image', 'banner_image'];

// Ghi 1 setting (tạo mới nếu chưa có)
async function set(key, value) {
  const [row] = await Setting.findOrCreate({ where: { key }, defaults: { value } });
  await row.update({ value });
}

exports.show = async (req, res, next) => {
  try {
    const keys = [];
    SLOTS.forEach((k) => keys.push(k, `${k}_pos`, `${k}_zoom`));
    const rows = await Setting.findAll({ where: { key: keys } });
    const settings = {};
    rows.forEach((r) => { settings[r.key] = r.value; });
    res.render('admin/banner', { title: 'Giao diện trang chủ', layout: 'layouts/admin', settings });
  } catch (e) { next(e); }
};

exports.upload = async (req, res, next) => {
  try {
    const slot = req.body.slot;
    if (!SLOTS.includes(slot) || !req.file) {
      req.session.flash = { type: 'error', message: 'Vui lòng chọn ảnh hợp lệ' };
      return res.redirect('/admin/banner');
    }
    await set(slot, `/uploads/${req.file.filename}`);
    // Đặt lại vị trí/zoom về mặc định khi thay ảnh mới
    await set(`${slot}_pos`, '50% 50%');
    await set(`${slot}_zoom`, '1');
    req.session.flash = { type: 'success', message: 'Đã cập nhật ảnh. Kéo thả để căn chỉnh nếu cần.' };
    res.redirect('/admin/banner');
  } catch (e) { next(e); }
};

// Lưu điểm lấy nét (object-position) + mức phóng (scale)
exports.savePosition = async (req, res, next) => {
  try {
    const slot = req.body.slot;
    if (!SLOTS.includes(slot)) return res.redirect('/admin/banner');
    // Chuẩn hóa để tránh dữ liệu rác
    const clampPct = (v) => Math.min(100, Math.max(0, parseFloat(v) || 50));
    const x = clampPct(req.body.pos_x);
    const y = clampPct(req.body.pos_y);
    const zoom = Math.min(2.5, Math.max(1, parseFloat(req.body.zoom) || 1));
    await set(`${slot}_pos`, `${x}% ${y}%`);
    await set(`${slot}_zoom`, String(zoom));
    req.session.flash = { type: 'success', message: 'Đã lưu vị trí ảnh' };
    res.redirect('/admin/banner');
  } catch (e) { next(e); }
};

exports.reset = async (req, res, next) => {
  try {
    const slot = req.body.slot;
    if (SLOTS.includes(slot)) {
      await Setting.destroy({ where: { key: [slot, `${slot}_pos`, `${slot}_zoom`] } });
      req.session.flash = { type: 'success', message: 'Đã khôi phục ảnh mặc định' };
    }
    res.redirect('/admin/banner');
  } catch (e) { next(e); }
};
