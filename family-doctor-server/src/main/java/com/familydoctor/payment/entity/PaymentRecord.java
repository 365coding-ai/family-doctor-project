package com.familydoctor.payment.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "payment_record")
public class PaymentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String orderNo;

    /** 第三方交易号 */
    @Column(length = 64)
    private String tradeNo;

    /** WECHAT / ALIPAY */
    @Column(nullable = false, length = 20)
    private String payMethod;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /** PENDING / SUCCESS / FAILED / REFUNDED */
    @Column(nullable = false, length = 20)
    private String status;

    @Column(columnDefinition = "JSON")
    private String callbackData;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
