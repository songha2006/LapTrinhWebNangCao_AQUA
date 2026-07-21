# AQUA Shop — Web bán bình giữ nhiệt

Đồ án môn **Lập trình web nâng cao**. Website thương mại điện tử bán bình giữ nhiệt, có đầy đủ trang bán hàng cho khách và trang quản trị cho admin.

**Công nghệ:** Node.js + Express + EJS + Sequelize (MySQL / SQLite) + Tailwind CSS + Chart.js.

> 🔰 **Người mới / bạn bè muốn chạy thử?** Xem hướng dẫn từng bước cho Windows & Mac (kể cả khi chưa cài Node.js): [HUONG-DAN-CHAY.md](HUONG-DAN-CHAY.md)

---

## 1. Chạy nhanh (không cần cài MySQL)

Dự án mặc định dùng **SQLite** để chạy được ngay, không cần cài đặt database. Mở terminal trong thư mục dự án:

```bash
npm install        # cài thư viện (đã cài sẵn nếu có node_modules)
npm run seed       # tạo bảng + đổ dữ liệu mẫu (22 sản phẩm, tài khoản demo)
npm start          # chạy server
```

Mở trình duyệt: **http://localhost:3000**

### Tài khoản demo
| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị (admin) | `admin@shop.com` | `admin123` |
| Khách hàng | `an@example.com` | `user123` |
| Khách hàng | `binh@example.com` | `user123` |

Trang quản trị: **http://localhost:3000/admin** (đăng nhập bằng tài khoản admin).

---

## 2. Chuyển sang MySQL (để nộp đồ án)

Nếu giáo viên yêu cầu MySQL, làm theo 3 bước:

1. **Tạo database** — chạy file SQL kèm sẵn (dùng MySQL CLI hoặc phpMyAdmin > Import):
   ```
   database/schema-mysql.sql
   ```
   File này tạo database `binh_giu_nhiet` cùng toàn bộ 10 bảng và khóa ngoại.

2. **Sửa file `.env`** — đổi dòng đầu và điền thông tin MySQL của bạn:
   ```env
   DB_DIALECT=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=binh_giu_nhiet
   DB_USER=root
   DB_PASS=          # điền mật khẩu MySQL của bạn
   ```

3. **Đổ dữ liệu mẫu rồi chạy:**
   ```bash
   npm run seed
   npm start
   ```

> `npm run seed` tự tạo lại bảng (`sync force`) và sinh dữ liệu mẫu, nên chạy được cả với SQLite lẫn MySQL.

---

## 3. Chức năng

### Người dùng
- Trang chủ: banner, sản phẩm nổi bật, sản phẩm mới
- Danh sách sản phẩm: **tìm kiếm, lọc** (thương hiệu / giá / dung tích / màu), **sắp xếp**, **phân trang**
- Chi tiết sản phẩm: chọn biến thể màu/dung tích, gallery ảnh, đánh giá sao
- Giỏ hàng (lưu session): thêm / sửa số lượng / xóa
- Đăng ký / Đăng nhập / **Quên mật khẩu** (session + bcrypt)
- Đặt hàng: nhập địa chỉ, **áp mã giảm giá**, chọn **COD** hoặc **VNPay**
- Đánh giá sản phẩm bằng sao + bình luận (chỉ khi đã mua và đơn hoàn thành)
- Lịch sử đơn hàng, theo dõi tiến trình, **hủy đơn** (tự hoàn kho)

### Admin
- **Dashboard:** doanh thu hôm nay/tháng, biểu đồ 14 ngày & 6 tháng (Chart.js), đơn mới, top sản phẩm bán chạy
- **CRUD sản phẩm:** upload nhiều ảnh (multer), quản lý biến thể màu/dung tích/giá/kho
- CRUD **danh mục**, **thương hiệu**, **mã giảm giá**
- **Quản lý đơn hàng:** lọc theo trạng thái, đổi trạng thái theo luồng (chờ → xác nhận → giao → hoàn thành)
- **Quản lý người dùng:** khóa / mở khóa tài khoản
- **Quản lý đánh giá:** ẩn / hiện bình luận

---

## 4. Cấu trúc thư mục

```
├── server.js                 # điểm khởi động, cấu hình Express
├── .env                      # cấu hình DB, session, VNPay
├── database/
│   └── schema-mysql.sql      # schema MySQL để import
├── docs/
│   └── ERD.md                # sơ đồ quan hệ dữ liệu (cho báo cáo)
├── src/
│   ├── config/               # db.js (sqlite/mysql), vnpay.js
│   ├── models/               # 10 Sequelize models + quan hệ (index.js)
│   ├── controllers/          # home, product, cart, auth, order, review
│   │   └── admin/            # dashboard, product, catalog, coupon, order, user, review
│   ├── middlewares/          # auth (phân quyền), upload (multer), locals
│   ├── routes/               # web.js (khách), admin.js (quản trị)
│   ├── views/                # EJS: layouts, pages, admin, partials
│   └── seed.js               # sinh dữ liệu mẫu
└── public/                   # css, ảnh sản phẩm, thư mục uploads
```

## 5. Cơ sở dữ liệu

10 bảng: `users`, `categories`, `brands`, `products`, `product_variants`, `product_images`, `coupons`, `orders`, `order_items`, `reviews`.

Quan hệ chính:
- `products` 1–n `product_variants` / `product_images`
- `categories` / `brands` 1–n `products`
- `users` 1–n `orders` / `reviews`
- `orders` 1–n `order_items`, mỗi item trỏ tới 1 `product_variant`
- `coupons` 1–n `orders`

Xem sơ đồ ERD chi tiết trong [docs/ERD.md](docs/ERD.md).

---

## 6. Điểm kỹ thuật nổi bật (cho phần trình bày)

- **Bảo mật:** hash mật khẩu bằng bcrypt, phân quyền user/admin bằng middleware, chống SQL injection (Sequelize tham số hóa), session HTTP-only.
- **Validate 2 lớp:** client (HTML5 + pattern) và server (express-validator).
- **Giao dịch (transaction):** đặt hàng / hủy đơn dùng transaction để trừ kho, hoàn kho, giảm lượt coupon một cách nhất quán.
- **VNPay:** ký HMAC-SHA512 chuẩn v2.1.0. Khi chưa có tài khoản sandbox, hệ thống tự chuyển sang trang **giả lập cổng thanh toán** để demo được ngay (xem mục cấu hình trong `.env`).
- **Responsive:** giao diện Tailwind, chạy tốt trên cả điện thoại và máy tính.

### Ảnh sản phẩm thật (tùy chọn)
Mặc định seed tự vẽ ảnh bình giữ nhiệt bằng SVG (không cần mạng). Muốn dùng **ảnh chụp thật**:
1. Lấy API key miễn phí tại https://pixabay.com/api/docs/ (đăng nhập, key nằm ở mục "Your API key").
2. Dán vào `.env`: `PIXABAY_KEY=key_cua_ban`
3. Chạy lại `npm run seed` — mỗi sản phẩm sẽ tự tải ảnh thật, tự quay về SVG nếu tải lỗi.

### Cấu hình VNPay thật (tùy chọn)
Đăng ký tài khoản sandbox tại https://sandbox.vnpayment.vn/devreg/ rồi điền `VNP_TMN_CODE` và `VNP_HASH_SECRET` vào `.env`. Bỏ trống thì hệ thống chạy chế độ giả lập.
