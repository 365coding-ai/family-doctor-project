-- ==========================================================
-- V3: 扩展用户角色与医生联系方式
-- ==========================================================

-- 1. 为用户表增加角色字段
ALTER TABLE `user` ADD COLUMN `role` VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER' AFTER `birth_date`;

-- 2. 为医生表增加关联字段
ALTER TABLE `doctor` ADD COLUMN `user_id` BIGINT AFTER `id`;
ALTER TABLE `doctor` ADD COLUMN `phone` VARCHAR(20) UNIQUE AFTER `user_id`;

-- 3. 更新测试医生数据
UPDATE `doctor` SET `phone` = '18800188000' WHERE `name` = '李秀英';
UPDATE `doctor` SET `phone` = '18800188001' WHERE `name` = '王建国';
UPDATE `doctor` SET `phone` = '18800188002' WHERE `name` = '张美玲';
