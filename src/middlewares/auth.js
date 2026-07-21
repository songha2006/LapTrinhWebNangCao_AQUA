// Chỉ cho phép user đã đăng nhập
function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Vui lòng đăng nhập để tiếp tục' };
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  next();
}

// Chỉ cho phép admin
function requireAdmin(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Vui lòng đăng nhập' };
    return res.redirect('/login');
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('pages/403', { title: 'Không có quyền truy cập' });
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
