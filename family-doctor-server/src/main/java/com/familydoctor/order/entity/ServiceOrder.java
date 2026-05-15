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

    @Column(nullable = false)
    private Long doctorId;

    /** HOME_VISIT / VIDEO / NURSING */
    @Column(nullable = false, length = 30)
    private String serviceType;

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

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
