-- =====================================================================
-- AQUA SHOP - Web bán bình giữ nhiệt
-- Schema MySQL 8 (đồ án Lập trình web nâng cao)
-- Cách dùng:
--   1) Mở MySQL:  mysql -u root -p
--   2) Chạy file: source đường/dẫn/schema-mysql.sql
--   Hoặc dùng phpMyAdmin > Import > chọn file này.
-- Sau đó đổi DB_DIALECT=mysql trong .env và chạy: npm run seed
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `binh_giu_nhiet`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `binh_giu_nhiet`;

SET FOREIGN_KEY_CHECKS = 0;

-- ===== users =====
CREATE TABLE `users` (
  `id`                  INT AUTO_INCREMENT PRIMARY KEY,
  `name`                VARCHAR(100) NOT NULL,
  `email`               VARCHAR(150) NOT NULL UNIQUE,
  `password_hash`       VARCHAR(255) NOT NULL,
  `phone`               VARCHAR(20),
  `address`             VARCHAR(255),
  `role`                ENUM('user','admin') DEFAULT 'user',
  `is_locked`           TINYINT(1) DEFAULT 0,
  `reset_token`         VARCHAR(100),
  `reset_token_expires` DATETIME,
  `created_at`          DATETIME NOT NULL,
  `updated_at`          DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== categories =====
CREATE TABLE `categories` (
  `id`   INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== brands =====
CREATE TABLE `brands` (
  `id`   INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== products =====
CREATE TABLE `products` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `brand_id`    INT NOT NULL,
  `name`        VARCHAR(200) NOT NULL,
  `slug`        VARCHAR(220) NOT NULL UNIQUE,
  `description` TEXT,
  `thumbnail`   VARCHAR(255),
  `is_featured` TINYINT(1) DEFAULT 0,
  `created_at`  DATETIME NOT NULL,
  `updated_at`  DATETIME NOT NULL,
  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`),
  CONSTRAINT `fk_product_brand`    FOREIGN KEY (`brand_id`)    REFERENCES `brands`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== product_variants =====
CREATE TABLE `product_variants` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `color`      VARCHAR(50) NOT NULL,
  `color_code` VARCHAR(20),
  `capacity`   INT NOT NULL COMMENT 'dung tich (ml)',
  `price`      INT NOT NULL COMMENT 'gia (VND)',
  `stock`      INT NOT NULL DEFAULT 0,
  `image`      VARCHAR(255),
  CONSTRAINT `fk_variant_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== product_images =====
CREATE TABLE `product_images` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `url`        VARCHAR(255) NOT NULL,
  CONSTRAINT `fk_image_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== coupons =====
CREATE TABLE `coupons` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `code`       VARCHAR(50) NOT NULL UNIQUE,
  `type`       ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
  `value`      INT NOT NULL,
  `min_order`  INT DEFAULT 0,
  `quantity`   INT NOT NULL DEFAULT 0,
  `expires_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== orders =====
CREATE TABLE `orders` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`        INT NOT NULL,
  `coupon_id`      INT,
  `subtotal`       INT NOT NULL DEFAULT 0,
  `discount`       INT NOT NULL DEFAULT 0,
  `total`          INT NOT NULL DEFAULT 0,
  `status`         ENUM('pending','confirmed','shipping','completed','cancelled') DEFAULT 'pending',
  `payment_method` ENUM('cod','vnpay') DEFAULT 'cod',
  `payment_status` ENUM('unpaid','paid') DEFAULT 'unpaid',
  `receiver_name`  VARCHAR(100) NOT NULL,
  `address`        VARCHAR(255) NOT NULL,
  `phone`          VARCHAR(20)  NOT NULL,
  `note`           VARCHAR(500),
  `created_at`     DATETIME NOT NULL,
  `updated_at`     DATETIME NOT NULL,
  CONSTRAINT `fk_order_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`),
  CONSTRAINT `fk_order_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== order_items =====
CREATE TABLE `order_items` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `order_id`   INT NOT NULL,
  `variant_id` INT NOT NULL,
  `quantity`   INT NOT NULL,
  `price`      INT NOT NULL COMMENT 'gia tai thoi diem mua',
  CONSTRAINT `fk_item_order`   FOREIGN KEY (`order_id`)   REFERENCES `orders`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_item_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== reviews =====
CREATE TABLE `reviews` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `product_id` INT NOT NULL,
  `rating`     INT NOT NULL COMMENT '1..5 sao',
  `comment`    TEXT,
  `is_hidden`  TINYINT(1) DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  CONSTRAINT `fk_review_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`),
  CONSTRAINT `fk_review_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== settings (cấu hình giao diện: ảnh banner trang chủ...) =====
CREATE TABLE `settings` (
  `id`    INT AUTO_INCREMENT PRIMARY KEY,
  `key`   VARCHAR(80) NOT NULL UNIQUE,
  `value` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Ghi chú: dữ liệu mẫu (20+ sản phẩm, tài khoản admin/khách, mã giảm giá, đơn hàng)
-- được sinh tự động bằng lệnh:  npm run seed  (sau khi đặt DB_DIALECT=mysql).
