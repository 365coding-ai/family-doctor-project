-- 聊天消息表增加 room_id 字段，用于区分并隔离不同订单的聊天记录
ALTER TABLE `chat_message` ADD COLUMN `room_id` VARCHAR(64) NULL COMMENT '聊天房间号' AFTER `read_at`;
