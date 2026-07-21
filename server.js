require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');

const { sequelize } = require('./src/models');
const locals = require('./src/middlewares/locals');
const webRoutes = require('./src/routes/web');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 7 * 24 * 3600e3 },
}));
app.use(locals);

// Routes
app.use('/admin', adminRoutes);
app.use('/', webRoutes);

// 404
app.use((req, res) => res.status(404).render('pages/404', { title: 'Không tìm thấy trang' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('pages/500', { title: 'Lỗi hệ thống', error: err });
});

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // tạo bảng nếu chưa có
    app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));
  } catch (e) {
    console.error('Không kết nối được database:', e.message);
    process.exit(1);
  }
})();
