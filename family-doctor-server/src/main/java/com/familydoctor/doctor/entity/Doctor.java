package com.familydoctor.doctor.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "doctor")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(unique = true, length = 20)
    private String phone;

    private Long userId;

    /** 主任医师/副主任医师/主治医师 */
    @Column(length = 50)
    private String title;

    @Column(length = 50)
    private String department;

    @Column(length = 100)
    private String hospital;

    @Column(length = 512)
    private String avatarUrl;

    @Column(precision = 2, scale = 1)
    private BigDecimal rating = new BigDecimal("5.0");

    private Integer serviceCount = 0;

    @Column(columnDefinition = "TEXT")
    private String introduction;

    @Column(columnDefinition = "tinyint")
    private Boolean canHomeVisit = false;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    /** 1=在线 0=离线 */
    private Integer status = 1;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
