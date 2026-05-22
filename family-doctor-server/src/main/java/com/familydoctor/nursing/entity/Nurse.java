package com.familydoctor.nursing.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "nurse")
public class Nurse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false, length = 32)
    private String name;

    private String avatarUrl;

    @Column(length = 16)
    private String phone;

    @Column(length = 32)
    private String title;

    @Column(length = 64)
    private String hospital;

    @Column(length = 32)
    private String department;

    @Column(columnDefinition = "TEXT")
    private String introduction;

    private Integer serviceYears;

    @Column(precision = 2, scale = 1)
    private BigDecimal rating;

    private Integer serviceCount;

    private Double latitude;

    private Double longitude;

    @Column(length = 16)
    private String status;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
