# KẾ HOẠCH ĐỒ ÁN: WEB BÁN BÌNH GIỮ NHIỆT
Môn: Lập trình web nâng cao — Thời gian: 4 tuần — Công cụ: VS Code

---

## 1. CÔNG NGHỆ (đã đánh giá và quyết định)

**Stack: Node.js + Express + EJS + MySQL**

Lý do chọn thay vì ASP.NET Core:
- Chạy hoàn hảo trên VS Code, không cần Visual Studio 2022
- Một ngôn ngữ duy nhất (JavaScript) cho cả backend lẫn frontend → học nhanh, debug dễ
- Kết nối MySQL native, đúng yêu cầu môn học
- Claude/AI code Node.js cực mạnh → vibe coding hiệu quả nhất
- EJS render server-side → giao diện HTML/CSS thuần, Taste Skill phát huy tối đa

Chi tiết:
| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js 20 + Express 4 |
| View engine | EJS |
| Database | MySQL 8 + Sequelize ORM |
| CSS | Tailwind CSS (CDN hoặc CLI) |
| Auth | express-session + bcrypt |
| Upload ảnh | multer |
| Thanh toán | VNPay Sandbox |
| Biểu đồ thống kê | Chart.js |

---

## 2. CHỨC NĂNG

### Người dùng (khách + thành viên)
1. Trang chủ: banner, sản phẩm nổi bật, sản phẩm mới
2. Danh sách sản phẩm + tìm kiếm + lọc (giá, dung tích, màu, thương hiệu) + phân trang
3. Chi tiết sản phẩm: ảnh, mô tả, chọn màu/dung tích, đánh giá
4. Giỏ hàng (session): thêm/sửa/xóa số lượng
5. Đăng ký / Đăng nhập / Quên mật khẩu
6. Đặt hàng: nhập địa chỉ, áp mã giảm giá, chọn thanh toán (COD / VNPay sandbox)
7. Đánh giá sản phẩm (sao + bình luận, chỉ khi đã mua)
8. Lịch sử đơn hàng, theo dõi trạng thái, hủy đơn

### Admin
9. Dashboard: thống kê doanh thu theo ngày/tháng (Chart.js), đơn mới, sản phẩm bán chạy
10. CRUD sản phẩm (upload nhiều ảnh, biến thể màu/dung tích)
11. CRUD danh mục, thương hiệu
12. Quản lý đơn hàng: duyệt, đổi trạng thái (chờ xác nhận → đang giao → hoàn thành)
13. Quản lý mã giảm giá (%, số tiền, hạn dùng, số lượt)
14. Quản lý người dùng, khóa tài khoản
15. Quản lý đánh giá (ẩn/hiện)

---

## 3. DATABASE (MySQL)

Bảng chính:
- `users` (id, name, email, password_hash, phone, address, role, is_locked)
- `categories` (id, name, slug)
- `brands` (id, name)
- `products` (id, category_id, brand_id, name, slug, description, thumbnail, is_featured, created_at)
- `product_variants` (id, product_id, color, capacity, price, stock, image)
- `product_images` (id, product_id, url)
- `coupons` (id, code, type[percent/fixed], value, min_order, quantity, expires_at)
- `orders` (id, user_id, coupon_id, total, discount, status, payment_method, payment_status, address, phone, created_at)
- `order_items` (id, order_id, variant_id, quantity, price)
- `reviews` (id, user_id, product_id, rating, comment, is_hidden, created_at)

Quan hệ: products 1-n variants; orders 1-n order_items; users 1-n orders/reviews.

---

## 4. CẤU TRÚC THƯ MỤC

```
binh-giu-nhiet/
├── src/
│   ├── config/        # db.js, vnpay.js
│   ├── models/        # Sequelize models
│   ├── controllers/   # home, product, cart, order, auth, admin/*
│   ├── routes/        # web.js, admin.js
│   ├── middlewares/   # auth, isAdmin, upload
│   └── views/
│       ├── layouts/   # main.ejs, admin.ejs
│       ├── pages/     # home, products, product-detail, cart, checkout...
│       └── admin/     # dashboard, products, orders...
├── public/            # css, js, images, uploads
├── .claude/skills/    # taste-skill (cài ở bước setup)
├── .env
└── server.js
```

---

## 5. LỘ TRÌNH 4 TUẦN

### Tuần 1 — Nền móng + Database
- Ngày 1: Cài Node.js, MySQL, tạo project Express, cài skill giao diện:
  `npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"`
- Ngày 2-3: Thiết kế database, viết Sequelize models, seed dữ liệu mẫu (20+ sản phẩm bình giữ nhiệt: Lock&Lock, Elmich, Thermos...)
- Ngày 4-5: Layout chung (header, footer, navbar) — dùng taste-skill để Claude làm giao diện đẹp
- Ngày 6-7: Trang chủ + danh sách sản phẩm + chi tiết sản phẩm

### Tuần 2 — Chức năng người dùng
- Ngày 1-2: Đăng ký/đăng nhập (session + bcrypt), middleware phân quyền
- Ngày 3-4: Giỏ hàng (session), trang checkout
- Ngày 5: Đặt hàng COD + áp mã giảm giá
- Ngày 6-7: Tìm kiếm, lọc, phân trang

### Tuần 3 — Admin + Tính năng nâng cao
- Ngày 1-2: Layout admin + CRUD sản phẩm (upload ảnh multer)
- Ngày 3: CRUD danh mục, thương hiệu, mã giảm giá
- Ngày 4: Quản lý đơn hàng, đổi trạng thái
- Ngày 5: Dashboard thống kê doanh thu (Chart.js)
- Ngày 6-7: Đánh giá sản phẩm + quản lý đánh giá, lịch sử đơn hàng

### Tuần 4 — Thanh toán + Hoàn thiện
- Ngày 1-2: Tích hợp VNPay Sandbox
- Ngày 3: Quản lý người dùng, quên mật khẩu
- Ngày 4-5: Rà soát giao diện toàn bộ (dùng redesign-skill nếu cần), responsive mobile
- Ngày 6: Test toàn bộ luồng: đăng ký → mua → thanh toán → admin duyệt đơn
- Ngày 7: Viết báo cáo, chuẩn bị demo, backup database (file .sql)

---

## 6. SKILL GIAO DIỆN — CÁCH DÙNG

Cài trong thư mục project (terminal VS Code):
```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
```

Nên cài thêm:
```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "redesign-existing-projects"
```
(dùng ở tuần 4 để nâng cấp giao diện đã có)

Nếu làm việc với Claude ngoài Claude Code (như Cowork): mở file `SKILL.md`, copy nội dung dán vào đầu cuộc trò chuyện kèm yêu cầu làm giao diện.

Mẹo prompt giao diện đẹp: mô tả rõ phong cách ("giao diện shop bình giữ nhiệt cao cấp, tông xanh lá/trắng, nhiều khoảng trắng, ảnh sản phẩm lớn"), yêu cầu tham khảo Lock&Lock hoặc Hydro Flask.

---

## 7. TIÊU CHÍ CHẤM ĐIỂM THƯỜNG GẶP (để không mất điểm)

- Database chuẩn hóa, có quan hệ khóa ngoại ✓ (mục 3)
- Phân quyền user/admin ✓
- Validate dữ liệu cả client + server (dùng express-validator)
- Bảo mật: hash password, chống SQL injection (Sequelize tự xử lý), session
- Giao diện responsive
- Demo chạy được từ đầu đến cuối không lỗi
- Báo cáo: sơ đồ ERD, use case, hình chụp màn hình từng chức năng
