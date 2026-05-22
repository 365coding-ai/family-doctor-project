package com.familydoctor.order.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "service_order")
public class ServiceOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 32)
    private String orderNo;

    @Column(nullable = false)
    private Long userId;

    @Column
    private Long doctorId;

    /**
     * 服务类型:
     * GRAPHIC_CONSULT = 图文咨询
     * VIDEO_CONSULT   = 视频问诊
     * HOME_VISIT      = 上门服务
     */
    @Column(nullable = false, length = 30)
    private String serviceType;

    /**
     * 图文咨询计费模式:
     * PER_SESSION  = 按次计费 (默认)
     * PER_MINUTE   = 按时计费
     * SUBSCRIPTION = 套餐抵扣
     * FIRST_FREE   = 首单免费
     */
    @Column(nullable = false, length = 20)
    private String billingType = "PER_SESSION";

    /** 按时计费: 单价 (元/分钟) */
    @Column(precision = 8, scale = 2)
    private BigDecimal billingUnitPrice;

    /** 按时计费: 最大咨询时长(分钟) */
    private Integer billingDurationMin;

    /** 按时计费: 封顶金额 */
    @Column(precision = 8, scale = 2)
    private BigDecimal billingMaxAmount;

    /** 是否首单免费 */
    @Column(nullable = false)
    private Integer isFirstFree = 0;

    /** 关联套餐ID */
    private Long packageId;

    /** 图文咨询有效期 (24小时后自动关闭) */
    private LocalDateTime expireAt;

    /**
     * 状态流转:
     * PENDING → PAID → ACCEPTED → IN_PROGRESS → COMPLETED → REVIEWED
     * PENDING → CANCELLED
     * PAID → REFUNDING → REFUNDED
     */
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    private Long addressId;

    private LocalDate scheduleDate;

    @Column(length = 20)
    private String scheduleTime;

    @Column(length = 500)
    private String remark;

    /** WECHAT / ALIPAY */
    @Column(length = 20)
    private String payMethod;

    private LocalDateTime payTime;

    private String cancelReason;

    /** 聊天房间号 (图文咨询支付后自动生成) */
    @Column(length = 64)
    private String roomId;

    // ===== 上门护理服务扩展字段 =====

    /** 上门服务项目ID */
    private Long serviceItemId;

    /** 服务规格ID */
    private Long specId;

    /** 护士ID */
    private Long nurseId;

    /** 交通费 */
    @Column(precision = 8, scale = 2)
    private BigDecimal trafficFee;

    /** 耗材费 */
    @Column(precision = 8, scale = 2)
    private BigDecimal materialFee;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
