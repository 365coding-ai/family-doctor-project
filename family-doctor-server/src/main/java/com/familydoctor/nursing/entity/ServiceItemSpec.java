package com.familydoctor.nursing.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "service_item_spec")
public class ServiceItemSpec {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long itemId;

    @Column(nullable = false, length = 64)
    private String specName;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal price;

    @Column(precision = 8, scale = 2)
    private BigDecimal originalPrice;

    private String description;

    private Integer sortOrder;

    private Integer status;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
