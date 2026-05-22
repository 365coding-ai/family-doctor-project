-- 护士信息表
CREATE TABLE nurse (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT       NOT NULL COMMENT '关联用户ID',
    name          VARCHAR(32)  NOT NULL COMMENT '姓名',
    avatar_url    VARCHAR(255) COMMENT '头像',
    phone         VARCHAR(16)  COMMENT '手机号',
    title         VARCHAR(32)  COMMENT '职称',
    hospital      VARCHAR(64)  COMMENT '所属医院',
    department    VARCHAR(32)  COMMENT '科室',
    introduction  TEXT         COMMENT '个人简介',
    service_years INT          COMMENT '从业年限',
    rating        DECIMAL(2,1) DEFAULT 5.0 COMMENT '评分',
    service_count INT DEFAULT 0 COMMENT '服务次数',
    latitude      DOUBLE       COMMENT '纬度',
    longitude     DOUBLE       COMMENT '经度',
    status        VARCHAR(16) DEFAULT 'ACTIVE' COMMENT '状态',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user (user_id)
) COMMENT '护士信息表';

-- 护士可服务项目关联表
CREATE TABLE nurse_service_item (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    nurse_id  BIGINT NOT NULL COMMENT '护士ID',
    item_id   BIGINT NOT NULL COMMENT '服务项目ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_nurse_item (nurse_id, item_id),
    INDEX idx_item (item_id)
) COMMENT '护士可服务项目关联';

-- 创建测试用护士用户
INSERT INTO user (phone, nickname, avatar_url, role, created_at) VALUES
('13900000003', '张护士', NULL, 'NURSE', NOW()),
('13900000004', '李护士', NULL, 'NURSE', NOW()),
('13900000005', '王护士', NULL, 'NURSE', NOW());

-- 创建护士记录 (假设上面插入的用户ID从某个值开始，使用子查询获取)
INSERT INTO nurse (user_id, name, phone, title, hospital, department, introduction, service_years, rating, service_count)
SELECT id, '张美玲', '13900000003', '主管护师', '上海市第一人民医院', '内科', '从事临床护理工作10年，擅长各类注射、伤口护理、PICC维护等专科护理技术。曾获优秀护士称号，具有丰富的上门护理经验。', 10, 4.9, 328
FROM user WHERE phone = '13900000003';

INSERT INTO nurse (user_id, name, phone, title, hospital, department, introduction, service_years, rating, service_count)
SELECT id, '李雪梅', '13900000004', '护师', '上海市中山医院', '妇产科', '专注母婴护理5年，持有母婴护理师资格证，擅长新生儿脐部护理、黄疸监测、产后康复指导等。服务态度温柔耐心。', 5, 4.8, 215
FROM user WHERE phone = '13900000004';

INSERT INTO nurse (user_id, name, phone, title, hospital, department, introduction, service_years, rating, service_count)
SELECT id, '王丽华', '13900000005', '副主任护师', '上海市华山医院', '外科', '从事外科护理15年，擅长造口护理、引流管护理、伤口评估与处理。曾多次参加国际造口治疗师培训，技术精湛。', 15, 5.0, 512
FROM user WHERE phone = '13900000005';

-- 护士-服务项目关联（张美玲：临床护理全部 + 专科护理全部）
INSERT INTO nurse_service_item (nurse_id, item_id)
SELECT n.id, si.id FROM nurse n, service_item si
WHERE n.phone = '13900000003' AND si.category_id IN (1, 3);

-- 李雪梅：临床护理 + 母婴护理全部
INSERT INTO nurse_service_item (nurse_id, item_id)
SELECT n.id, si.id FROM nurse n, service_item si
WHERE n.phone = '13900000004' AND si.category_id IN (1, 2);

-- 王丽华：全部服务
INSERT INTO nurse_service_item (nurse_id, item_id)
SELECT n.id, si.id FROM nurse n, service_item si
WHERE n.phone = '13900000005';
