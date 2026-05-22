package com.familydoctor.nursing.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "nurse_service_item")
public class NurseServiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long nurseId;

    @Column(nullable = false)
    private Long itemId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
