-- ==========================================================
-- V5: 图文消息增强 - 支持 IMAGE 类型、已读回执、msgId 幂等
-- ==========================================================

ALTER TABLE `chat_message`
    ADD COLUMN `msg_id`    VARCHAR(64)  NULL COMMENT '客户端消息唯一ID，用于幂等去重' AFTER `id`,
    ADD COLUMN `media_url` VARCHAR(512) NULL COMMENT '图片/文件 URL (MinIO)' AFTER `content`,
    ADD COLUMN `media_width`  INT       NULL COMMENT '图片宽度(px)' AFTER `media_url`,
    ADD COLUMN `media_height` INT       NULL COMMENT '图片高度(px)' AFTER `media_width`,
    ADD COLUMN `read_at`   DATETIME     NULL COMMENT '已读时间' AFTER `is_read`,
    MODIFY COLUMN `type` VARCHAR(20) NOT NULL DEFAULT 'TEXT'
        COMMENT 'TEXT=文本 / IMAGE=图片 / ORDER_CARD=订单卡片',
    ADD UNIQUE INDEX `uk_msg_id` (`msg_id`);
