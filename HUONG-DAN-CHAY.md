# 🚀 Hướng dẫn chạy dự án AQUA Shop

Dành cho người mới. Làm lần lượt từ trên xuống. Có 2 phần theo tình trạng máy của bạn:
- **Chưa có Node.js** → làm từ Bước 1.
- **Đã có Node.js** → nhảy tới Bước 3.

---

## Bước 1 — Kiểm tra máy đã có Node.js chưa

Mở **Terminal** (Mac) hoặc **PowerShell/CMD** (Windows), gõ:

```bash
node -v
```

- Nếu hiện ra số phiên bản (ví dụ `v20.11.0`) → **đã có Node.js**, bỏ qua Bước 2, sang **Bước 3**.
- Nếu báo lỗi kiểu *"không phải là lệnh" / "not recognized" / "command not found"* → **chưa có**, làm tiếp Bước 2.

---

## Bước 2 — Cài Node.js (nếu chưa có)

### 🪟 Trên Windows
1. Vào **https://nodejs.org**
2. Tải bản **LTS** (nút bên trái, file `.msi`)
3. Mở file vừa tải, bấm **Next → Next → Install** (để mặc định hết)
4. Cài xong, **đóng hết PowerShell/CMD đang mở và mở lại** (bắt buộc, để máy nhận lệnh mới)
5. Gõ `node -v` kiểm tra lại, thấy số phiên bản là được

### 🍎 Trên macOS
1. Vào **https://nodejs.org**
2. Tải bản **LTS** (file `.pkg`)
3. Mở file, bấm **Continue → Install** (nhập mật khẩu máy nếu được hỏi)
4. Cài xong, **đóng Terminal và mở lại**
5. Gõ `node -v` kiểm tra lại, thấy số phiên bản là được

---

## Bước 3 — Tải dự án về máy

Chọn **1 trong 2 cách**:

### Cách A — Tải file ZIP (dễ nhất, không cần biết git)
1. Vào trang repo: **https://github.com/songha2006/LapTrinhWebNangCao_AQUA**
2. Bấm nút xanh **`< > Code`** → **Download ZIP**
3. Giải nén file ZIP ra một thư mục (ví dụ Desktop)

### Cách B — Dùng git (nếu đã cài git)
```bash
git clone https://github.com/songha2006/LapTrinhWebNangCao_AQUA.git
```

---

## Bước 4 — Mở Terminal ngay trong thư mục dự án

### 🪟 Windows
- Mở thư mục dự án bằng File Explorer
- Bấm vào **thanh địa chỉ** ở trên cùng, gõ `powershell` rồi Enter
  *(hoặc: giữ Shift + chuột phải vào vùng trống trong thư mục → "Open PowerShell window here")*

### 🍎 macOS
- Mở **Terminal**
- Gõ `cd ` (có dấu cách), rồi **kéo thả thư mục dự án** vào cửa sổ Terminal, bấm Enter

> Cách kiểm tra đã đúng thư mục: gõ `ls` (Mac) hoặc `dir` (Windows), phải thấy file `package.json` và `server.js`.

---

## Bước 5 — Cài đặt và chạy

Gõ **lần lượt** từng lệnh (chờ lệnh trước xong mới gõ lệnh sau):

### 🪟 Windows (PowerShell hoặc CMD)
```bash
npm install
copy .env.example .env
npm run seed
npm start
```

### 🍎 macOS (Terminal)
```bash
npm install
cp .env.example .env
npm run seed
npm start
```

> Khác nhau duy nhất giữa Win và Mac là lệnh sao chép file: Windows dùng `copy`, Mac dùng `cp`.

Khi thấy dòng chữ **`Server chạy tại http://localhost:3000`** là thành công 🎉

---

## Bước 6 — Mở web

Mở trình duyệt (Chrome, Edge...) vào địa chỉ:

**http://localhost:3000**

### Tài khoản có sẵn
| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị (admin) | `admin@shop.com` | `admin123` |
| Khách hàng | `an@example.com` | `user123` |

Trang quản trị: **http://localhost:3000/admin** (đăng nhập bằng tài khoản admin).

---

## Dừng và chạy lại

- **Dừng server:** bấm `Ctrl + C` trong cửa sổ Terminal.
- **Chạy lại lần sau:** chỉ cần mở Terminal trong thư mục dự án và gõ **`npm start`** (không cần cài lại từ đầu).

---

## ❓ Lỗi thường gặp

| Lỗi | Cách xử lý |
|---|---|
| `npm`/`node` không phải là lệnh | Chưa cài Node.js, hoặc chưa đóng/mở lại Terminal sau khi cài. Làm lại Bước 2. |
| `Error: listen EADDRINUSE ... 3000` | Cổng 3000 đang bị chiếm. Tắt ứng dụng đang dùng cổng đó, hoặc mở file `.env` sửa `PORT=3000` thành `PORT=3001` rồi chạy lại, vào `http://localhost:3001`. |
| `copy`/`cp` báo lỗi | Bỏ qua cũng được — dự án vẫn chạy với cấu hình mặc định. Cứ gõ tiếp `npm run seed` và `npm start`. |
| `npm install` chạy lâu / lỗi mạng | Kiểm tra internet rồi gõ lại `npm install`. |
| Trang trắng / thiếu dữ liệu | Chạy lại `npm run seed` để tạo lại dữ liệu mẫu. |

---

## Ghi chú
- Dự án **mặc định dùng SQLite** nên **không cần cài MySQL**, chạy được ngay.
- Nếu cần chạy bằng **MySQL** (khi nộp bài), xem hướng dẫn trong file [README.md](README.md).
