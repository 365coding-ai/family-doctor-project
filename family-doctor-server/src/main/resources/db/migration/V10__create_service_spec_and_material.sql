-- 服务项目规格表
CREATE TABLE service_item_spec (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id        BIGINT       NOT NULL COMMENT '服务项目ID',
    spec_name      VARCHAR(64)  NOT NULL COMMENT '规格名称',
    price          DECIMAL(8,2) NOT NULL COMMENT '规格价格',
    original_price DECIMAL(8,2) COMMENT '原价（划线价）',
    description    VARCHAR(255) COMMENT '规格说明',
    sort_order     INT DEFAULT 0 COMMENT '排序',
    status         TINYINT DEFAULT 1 COMMENT '0:禁用 1:启用',
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_item (item_id)
) COMMENT '服务项目规格';

INSERT INTO service_item_spec (item_id, spec_name, price, original_price, sort_order) VALUES
(1, '默认规格', 169.00, 189.00, 1),
(2, '默认规格', 169.00, 189.00, 1),
(3, '伤口数量1个', 259.00, 279.00, 1),
(3, '伤口数量2个', 299.00, 319.00, 2),
(3, '伤口数量3个', 339.00, 359.00, 3),
(3, '伤口数量4个', 379.00, 399.00, 4),
(3, '伤口数量5个及以上', 419.00, 439.00, 5),
(4, '默认规格', 296.00, 326.00, 1),
(5, '默认规格', 105.00, 125.00, 1),
(6, '鼻饲管置管', 193.00, 213.00, 1),
(6, '鼻饲管喂食', 116.00, 136.00, 2),
(7, '默认规格', 157.00, 177.00, 1),
(8, '默认规格', 105.00, 125.00, 1),
(9, '默认规格', 157.00, 177.00, 1),
(10, '默认规格', 317.50, 347.50, 1),
(11, '默认规格', 329.00, 359.00, 1),
(12, '默认规格', 200.00, 230.00, 1);

-- 服务项目耗材表
CREATE TABLE service_item_material (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id       BIGINT       NOT NULL COMMENT '服务项目ID',
    material_name VARCHAR(128) NOT NULL COMMENT '耗材名称',
    quantity      INT DEFAULT 1 COMMENT '数量',
    unit          VARCHAR(16)  NOT NULL COMMENT '单位',
    price         DECIMAL(8,2) COMMENT '单价',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_item (item_id)
) COMMENT '服务项目耗材';

INSERT INTO service_item_material (item_id, material_name, quantity, unit, price) VALUES
(1, '一次性注射器', 1, '只', 2.00),
(1, '棉签', 2, '根', 0.50),
(1, '碘伏棉球', 1, '个', 1.00),
(2, '一次性注射器', 1, '只', 2.00),
(2, '棉签', 2, '根', 0.50),
(3, '换药包', 1, '包', 15.00),
(3, '医用胶带', 1, '卷', 5.00),
(3, '无菌敷料', 2, '块', 3.00),
(4, '导尿管', 1, '根', 25.00),
(4, '引流袋', 1, '个', 8.00),
(5, '血糖试纸', 1, '片', 5.00),
(5, '采血针', 1, '只', 2.00),
(6, '鼻饲管', 1, '根', 15.00),
(6, '注射器', 1, '只', 2.00),
(7, '脐部护理包', 1, '包', 10.00),
(7, '碘伏棉球', 2, '个', 1.00),
(10, 'PICC护理套件', 1, '包', 35.00),
(10, '预冲式导管冲洗器', 1, '只', 18.00),
(10, '透明敷料', 1, '张', 12.00),
(11, '造口袋', 1, '只', 25.00),
(11, '造口底盘', 1, '个', 30.00),
(11, '造口粉', 1, '瓶', 15.00);
