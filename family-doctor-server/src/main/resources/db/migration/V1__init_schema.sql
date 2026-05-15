-- ==========================================================
-- V1: 初始化数据库 Schema
-- ==========================================================

-- 用户表
CREATE TABLE IF NOT EXISTS `user` (
    `id`          BIGINT PRIMARY KEY AUTO_INCREMENT,
    `phone`       VARCHAR(20) UNIQUE NOT NULL,
    `nickname`    VARCHAR(50),
    `avatar_url`  VARCHAR(512),
    `gender`      INT DEFAULT 0 COMMENT '0=未知 1=男 2=女',
    `birth_date`  DATE,
    `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户地址表
CREATE TABLE IF NOT EXISTS `user_address` (
    `id`          BIGINT PRIMARY KEY AUTO_INCREMENT,
    `user_id`     BIGINT NOT NULL,
    `name`        VARCHAR(50) NOT NULL COMMENT '联系人',
    `phone`       VARCHAR(20) NOT NULL,
    `province`    VARCHAR(50),
    `city`        VARCHAR(50),
    `district`    VARCHAR(50),
    `detail`      VARCHAR(255) NOT NULL COMMENT '详细地址',
    `latitude`    DECIMAL(10,7),
    `longitude`   DECIMAL(10,7),
    `is_default`  TINYINT DEFAULT 0,
    INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 医生表
CREATE TABLE IF NOT EXISTS `doctor` (
    `id`              BIGINT PRIMARY KEY AUTO_INCREMENT,
    `name`            VARCHAR(50) NOT NULL,
    `title`           VARCHAR(50) COMMENT '职称',
    `department`      VARCHAR(50) COMMENT '科室',
    `hospital`        VARCHAR(100),
    `avatar_url`      VARCHAR(512),
    `rating`          DECIMAL(2,1) DEFAULT 5.0,
    `service_count`   INT DEFAULT 0,
    `introduction`    TEXT,
    `can_home_visit`  TINYINT DEFAULT 0,
    `latitude`        DECIMAL(10,7),
    `longitude`       DECIMAL(10,7),
    `status`          INT DEFAULT 1 COMMENT '1=在线 0=离线',
    `created_at`      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_department` (`department`),
    INDEX `idx_location` (`latitude`, `longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 医生排班表
CREATE TABLE IF NOT EXISTS `doctor_schedule` (
    `id`          BIGINT PRIMARY KEY AUTO_INCREMENT,
    `doctor_id`   BIGINT NOT NULL,
    `date`        DATE NOT NULL,
    `time_slot`   VARCHAR(20) NOT NULL COMMENT '如 09:00-10:00',
    `is_booked`   TINYINT DEFAULT 0,
    UNIQUE KEY `uk_schedule` (`doctor_id`, `date`, `time_slot`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 服务订单表
CREATE TABLE IF NOT EXISTS `service_order` (
    `id`              BIGINT PRIMARY KEY AUTO_INCREMENT,
    `order_no`        VARCHAR(32) UNIQUE NOT NULL,
    `user_id`         BIGINT NOT NULL,
    `doctor_id`       BIGINT NOT NULL,
    `service_type`    VARCHAR(30) NOT NULL COMMENT 'HOME_VISIT/VIDEO/NURSING',
    `status`          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `amount`          DECIMAL(10,2) NOT NULL,
    `address_id`      BIGINT,
    `schedule_date`   DATE,
    `schedule_time`   VARCHAR(20),
    `remark`          VARCHAR(500),
    `pay_method`      VARCHAR(20) COMMENT 'WECHAT/ALIPAY',
    `pay_time`        DATETIME,
    `cancel_reason`   VARCHAR(255),
    `created_at`      DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_doctor` (`doctor_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 支付记录表
CREATE TABLE IF NOT EXISTS `payment_record` (
    `id`              BIGINT PRIMARY KEY AUTO_INCREMENT,
    `order_no`        VARCHAR(32) NOT NULL,
    `trade_no`        VARCHAR(64) COMMENT '第三方交易号',
    `pay_method`      VARCHAR(20) NOT NULL,
    `amount`          DECIMAL(10,2) NOT NULL,
    `status`          VARCHAR(20) NOT NULL COMMENT 'PENDING/SUCCESS/FAILED/REFUNDED',
    `callback_data`   JSON,
    `created_at`      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 通知表
CREATE TABLE IF NOT EXISTS `notification` (
    `id`          BIGINT PRIMARY KEY AUTO_INCREMENT,
    `user_id`     BIGINT NOT NULL,
    `title`       VARCHAR(100) NOT NULL,
    `content`     VARCHAR(500),
    `type`        VARCHAR(20) COMMENT 'ORDER/SYSTEM/PROMOTION',
    `is_read`     TINYINT DEFAULT 0,
    `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_unread` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI 对话表
CREATE TABLE IF NOT EXISTS `ai_conversation` (
    `id`          BIGINT PRIMARY KEY AUTO_INCREMENT,
    `user_id`     BIGINT NOT NULL,
    `title`       VARCHAR(100),
    `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI 消息表
CREATE TABLE IF NOT EXISTS `ai_message` (
    `id`              BIGINT PRIMARY KEY AUTO_INCREMENT,
    `conversation_id` BIGINT NOT NULL,
    `role`            VARCHAR(10) NOT NULL COMMENT 'user/assistant',
    `content`         TEXT NOT NULL,
    `created_at`      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_conv` (`conversation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
