# Sơ đồ quan hệ dữ liệu (ERD) — AQUA Shop

Sơ đồ dưới đây vẽ bằng Mermaid. Xem trực tiếp trên GitHub/VS Code (có cài extension Mermaid),
hoặc dán vào https://mermaid.live để xuất ảnh đưa vào báo cáo.

```mermaid
erDiagram
    users ||--o{ orders : "đặt"
    users ||--o{ reviews : "viết"
    categories ||--o{ products : "phân loại"
    brands ||--o{ products : "thuộc"
    products ||--o{ product_variants : "có biến thể"
    products ||--o{ product_images : "có ảnh"
    products ||--o{ reviews : "được đánh giá"
    coupons ||--o{ orders : "áp dụng"
    orders ||--o{ order_items : "gồm"
    product_variants ||--o{ order_items : "được đặt"

    users {
        int id PK
        string name
        string email UK
        string password_hash
        string phone
        string address
        enum role "user|admin"
        bool is_locked
        string reset_token
        datetime reset_token_expires
    }
    categories {
        int id PK
        string name
        string slug UK
    }
    brands {
        int id PK
        string name
    }
    products {
        int id PK
        int category_id FK
        int brand_id FK
        string name
        string slug UK
        text description
        string thumbnail
        bool is_featured
    }
    product_variants {
        int id PK
        int product_id FK
        string color
        string color_code
        int capacity "ml"
        int price "VND"
        int stock
        string image
    }
    product_images {
        int id PK
        int product_id FK
        string url
    }
    coupons {
        int id PK
        string code UK
        enum type "percent|fixed"
        int value
        int min_order
        int quantity
        datetime expires_at
    }
    orders {
        int id PK
        int user_id FK
        int coupon_id FK
        int subtotal
        int discount
        int total
        enum status "pending|confirmed|shipping|completed|cancelled"
        enum payment_method "cod|vnpay"
        enum payment_status "unpaid|paid"
        string receiver_name
        string address
        string phone
        string note
    }
    order_items {
        int id PK
        int order_id FK
        int variant_id FK
        int quantity
        int price "giá lúc mua"
    }
    reviews {
        int id PK
        int user_id FK
        int product_id FK
        int rating "1..5"
        text comment
        bool is_hidden
    }
```

## Mô tả quan hệ

| Quan hệ | Loại | Ý nghĩa |
|---|---|---|
| users → orders | 1–n | Một khách có nhiều đơn hàng |
| users → reviews | 1–n | Một khách viết nhiều đánh giá |
| categories → products | 1–n | Một danh mục chứa nhiều sản phẩm |
| brands → products | 1–n | Một thương hiệu có nhiều sản phẩm |
| products → product_variants | 1–n | Một sản phẩm có nhiều biến thể (màu/dung tích) |
| products → product_images | 1–n | Một sản phẩm có nhiều ảnh |
| products → reviews | 1–n | Một sản phẩm nhận nhiều đánh giá |
| coupons → orders | 1–n | Một mã giảm giá dùng cho nhiều đơn |
| orders → order_items | 1–n | Một đơn gồm nhiều dòng sản phẩm |
| product_variants → order_items | 1–n | Một biến thể xuất hiện ở nhiều dòng đơn |
