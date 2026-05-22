package com.familydoctor.nursing.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "service_item")
public class ServiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long categoryId;

    @Column(nullable = false, length = 64)
    private String itemName;

    @Column(length = 16)
    private String itemNo;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String coverUrl;

    private Integer serviceDuration;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal basePrice;

    @Column(precision = 8, scale = 2)
    private BigDecimal trafficFee;

    @Column(columnDefinition = "TEXT")
    private String suitablePeople;

    @Column(columnDefinition = "TEXT")
    private String contraindications;

    @Column(columnDefinition = "TEXT")
    private String riskNotice;

    @Column(length = 1024)
    private String notes;

    private Integer sortOrder;

    private Integer status;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "itemId", insertable = false, updatable = false)
    private List<ServiceItemSpec> specs;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "itemId", insertable = false, updatable = false)
    private List<ServiceItemMaterial> materials;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
