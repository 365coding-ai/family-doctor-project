-- 上门护理服务分类表
CREATE TABLE service_category (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(32)  NOT NULL COMMENT '分类名称',
    icon_url    VARCHAR(255) COMMENT '分类图标URL',
    description VARCHAR(255) COMMENT '分类描述',
    sort_order  INT DEFAULT 0 COMMENT '排序',
    status      TINYINT DEFAULT 1 COMMENT '0:禁用 1:启用',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '上门服务分类';

INSERT INTO service_category (name, icon_url, description, sort_order) VALUES
('临床护理', NULL, '注射、换药、采血等临床护理服务', 1),
('母婴护理', NULL, '新生儿护理、产后指导等母婴服务', 2),
('专科护理', NULL, 'PICC维护、造口护理等专科服务', 3),
('居家服务', NULL, '日常居家照护服务', 4),
('康复护理', NULL, '康复训练指导服务', 5),
('中医护理', NULL, '中医特色护理服务', 6);
