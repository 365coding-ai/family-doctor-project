-- 订单表增加 room_id 字段，图文咨询支付后自动生成房间号
ALTER TABLE `service_order` ADD COLUMN `room_id` VARCHAR(64) NULL COMMENT '聊天房间号' AFTER `cancel_reason`;

-- 为已有的已支付图文咨询订单补充 room_id
UPDATE `service_order`
SET `room_id` = CONCAT('room_', id, '_', UNIX_TIMESTAMP(created_at))
WHERE `service_type` = 'GRAPHIC_CONSULT'
  AND `status` IN ('PAID', 'ACCEPTED', 'COMPLETED')
  AND `room_id` IS NULL;
