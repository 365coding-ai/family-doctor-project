package com.familydoctor.nursing.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "service_item_material")
public class ServiceItemMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long itemId;

    @Column(nullable = false, length = 128)
    private String materialName;

    private Integer quantity;

    @Column(nullable = false, length = 16)
    private String unit;

    @Column(precision = 8, scale = 2)
    private BigDecimal price;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
