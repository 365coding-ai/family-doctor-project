-- ==========================================================
-- V4: 计费系统扩展 - 三种服务类型 + 四种图文咨询计费模式
-- ==========================================================

-- 1. 扩展 service_order 表 (规范化服务类型 + 增加计费字段)
ALTER TABLE `service_order`
    MODIFY COLUMN `service_type` VARCHAR(30) NOT NULL
        COMMENT 'GRAPHIC_CONSULT=图文咨询 / VIDEO_CONSULT=视频问诊 / HOME_VISIT=上门服务',
    ADD COLUMN `billing_type` VARCHAR(20) NOT NULL DEFAULT 'PER_SESSION'
        COMMENT 'PER_SESSION=按次 / PER_MINUTE=按时 / SUBSCRIPTION=套餐 / FIRST_FREE=首单免费'
        AFTER `service_type`,
    ADD COLUMN `billing_unit_price` DECIMAL(8, 2) NULL
        COMMENT '计时单价 (按时计费时使用, 如2元/分钟)'
        AFTER `billing_type`,
    ADD COLUMN `billing_duration_min` INT NULL
        COMMENT '咨询时长上限(分钟), 按时计费使用'
        AFTER `billing_unit_price`,
    ADD COLUMN `billing_max_amount` DECIMAL(8, 2) NULL
        COMMENT '封顶金额, 按时计费使用'
        AFTER `billing_duration_min`,
    ADD COLUMN `is_first_free` TINYINT NOT NULL DEFAULT 0
        COMMENT '是否首单免费 (1=是)'
        AFTER `billing_max_amount`,
    ADD COLUMN `package_id` BIGINT NULL
        COMMENT '套餐订单关联ID'
        AFTER `is_first_free`,
    ADD COLUMN `expire_at` DATETIME NULL
        COMMENT '图文咨询有效期(24小时)'
        AFTER `package_id`;

-- 2. 用户套餐表
CREATE TABLE IF NOT EXISTS `user_package`
(
    `id`              BIGINT PRIMARY KEY AUTO_INCREMENT,
    `user_id`         BIGINT        NOT NULL,
    `package_type`    VARCHAR(20)   NOT NULL COMMENT 'MONTHLY=月卡 / QUARTERLY=季卡',
    `package_name`    VARCHAR(50)   NOT NULL COMMENT '套餐名称, 如月卡·30次',
    `price`           DECIMAL(8, 2) NOT NULL COMMENT '购买价格',
    `total_times`     INT           NULL COMMENT '总次数, NULL=不限次',
    `remaining_times` INT           NULL COMMENT '剩余次数',
    `started_at`      DATETIME      NULL,
    `expired_at`      DATETIME      NOT NULL,
    `status`          VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE=有效 / EXPIRED=过期 / CANCELLED=取消',
    `created_at`      DATETIME               DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_status_expire` (`user_id`, `status`, `expired_at`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- 3. 订单增值服务明细表
CREATE TABLE IF NOT EXISTS `order_addon`
(
    `id`          BIGINT PRIMARY KEY AUTO_INCREMENT,
    `order_id`    BIGINT        NOT NULL,
    `addon_type`  VARCHAR(30)   NOT NULL COMMENT 'PRIORITY_QUEUE=优先排队 / REPORT_ANALYSIS=病历解读 / FILE_UPLOAD=上传报告',
    `addon_name`  VARCHAR(50)   NOT NULL,
    `addon_price` DECIMAL(8, 2) NOT NULL,
    `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_order_id` (`order_id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- 4. 套餐配置表 (系统预设, 不由用户修改)
CREATE TABLE IF NOT EXISTS `package_config`
(
    `id`           BIGINT PRIMARY KEY AUTO_INCREMENT,
    `package_type` VARCHAR(20)   NOT NULL,
    `name`         VARCHAR(50)   NOT NULL,
    `price`        DECIMAL(8, 2) NOT NULL,
    `total_times`  INT           NULL COMMENT 'NULL=不限次',
    `valid_days`   INT           NOT NULL COMMENT '有效天数',
    `description`  VARCHAR(255),
    `is_active`    TINYINT       NOT NULL DEFAULT 1,
    `sort_order`   INT                    DEFAULT 0
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- 5. 预设套餐数据
INSERT INTO `package_config` (`package_type`, `name`, `price`, `total_times`, `valid_days`, `description`, `sort_order`)
VALUES ('MONTHLY', '月卡·30次图文咨询', 199.00, 30, 30, '每月30次图文咨询，随时发起，医生1小时内响应', 1),
       ('QUARTERLY', '季卡·100次图文咨询', 499.00, 100, 90, '三个月100次图文咨询，含优先排队特权', 2),
       ('QUARTERLY_UNLIMITED', '季卡·不限次', 799.00, NULL, 90, '三个月不限次图文咨询，最高性价比', 3);
