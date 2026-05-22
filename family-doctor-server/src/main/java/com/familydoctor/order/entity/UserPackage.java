package com.familydoctor.order.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 用户套餐实体
 * 套餐类型: MONTHLY=月卡 / QUARTERLY=季卡 / QUARTERLY_UNLIMITED=季卡不限次
 */
@Data
@Entity
@Table(name = "user_package")
public class UserPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    /** MONTHLY / QUARTERLY / QUARTERLY_UNLIMITED */
    @Column(nullable = false, length = 30)
    private String packageType;

    @Column(nullable = false, length = 50)
    private String packageName;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal price;

    /** 总次数, null=不限次 */
    private Integer totalTimes;

    /** 剩余次数, null=不限次 */
    private Integer remainingTimes;

    private LocalDateTime startedAt;

    @Column(nullable = false)
    private LocalDateTime expiredAt;

    /** ACTIVE / EXPIRED / CANCELLED */
    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
