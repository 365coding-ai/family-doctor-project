package com.familydoctor.order.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单增值服务明细
 * addon_type: PRIORITY_QUEUE=优先排队 / REPORT_ANALYSIS=病历解读 / FILE_UPLOAD=上传报告
 */
@Data
@Entity
@Table(name = "order_addon")
public class OrderAddon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long orderId;

    /** PRIORITY_QUEUE / REPORT_ANALYSIS / FILE_UPLOAD */
    @Column(nullable = false, length = 30)
    private String addonType;

    @Column(nullable = false, length = 50)
    private String addonName;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal addonPrice;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
