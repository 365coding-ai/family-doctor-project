-- ==========================================================
-- V2: 插入测试数据
-- ==========================================================

-- 测试用户
INSERT INTO `user` (`phone`, `nickname`, `avatar_url`, `gender`) VALUES
('13800138000', '张三', NULL, 1),
('13900139000', '李小红', NULL, 2);

-- 测试地址
INSERT INTO `user_address` (`user_id`, `name`, `phone`, `province`, `city`, `district`, `detail`, `latitude`, `longitude`, `is_default`) VALUES
(1, '张三', '13800138000', '北京市', '北京市', '朝阳区', '建国路88号 国贸中心', 39.9087243, 116.4604034, 1);

-- 测试医生
INSERT INTO `doctor` (`name`, `title`, `department`, `hospital`, `avatar_url`, `rating`, `service_count`, `introduction`, `can_home_visit`, `latitude`, `longitude`, `status`) VALUES
('李秀英', '主任医师', '心血管内科', '北京协和医院', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200', 4.9, 1280, '从事心血管内科临床工作20余年，擅长高血压、冠心病、心力衰竭等疾病的诊治。', 1, 39.9100000, 116.4620000, 1),
('王建国', '副主任医师', '儿科', '北京儿童医院', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', 4.8, 960, '儿科专家，专注小儿呼吸系统疾病、过敏性疾病的诊治，临床经验丰富。', 0, 39.9300000, 116.3800000, 1),
('张美玲', '主治医师', '全科', '朝阳区社区卫生服务中心', NULL, 4.7, 520, '全科医学专家，擅长常见病、多发病的诊治及慢性病管理。', 1, 39.9150000, 116.4700000, 1);

-- 测试排班
INSERT INTO `doctor_schedule` (`doctor_id`, `date`, `time_slot`, `is_booked`) VALUES
(1, CURDATE(), '09:00-10:00', 0),
(1, CURDATE(), '10:00-11:00', 0),
(1, CURDATE(), '14:00-15:00', 1),
(1, CURDATE(), '15:00-16:00', 0),
(2, CURDATE(), '09:00-10:00', 0),
(2, CURDATE(), '14:00-15:00', 0),
(3, CURDATE(), '09:00-10:00', 0),
(3, CURDATE(), '10:00-11:00', 0),
(3, CURDATE(), '14:00-15:00', 0),
(3, CURDATE(), '15:00-16:00', 0),
(3, CURDATE(), '16:00-17:00', 0);
