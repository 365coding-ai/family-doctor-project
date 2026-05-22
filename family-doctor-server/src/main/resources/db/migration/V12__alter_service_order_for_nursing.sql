-- 扩展 service_order 表支持上门护理订单
ALTER TABLE service_order ADD COLUMN service_item_id BIGINT COMMENT '上门服务项目ID';
ALTER TABLE service_order ADD COLUMN spec_id BIGINT COMMENT '服务规格ID';
ALTER TABLE service_order ADD COLUMN nurse_id BIGINT COMMENT '护士ID';
ALTER TABLE service_order ADD COLUMN traffic_fee DECIMAL(8,2) COMMENT '交通费';
ALTER TABLE service_order ADD COLUMN material_fee DECIMAL(8,2) COMMENT '耗材费';
