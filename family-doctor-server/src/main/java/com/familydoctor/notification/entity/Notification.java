package com.familydoctor.notification.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 500)
    private String content;

    /** ORDER / SYSTEM / PROMOTION */
    @Column(length = 20)
    private String type;

    @Column(columnDefinition = "tinyint")
    private Boolean isRead = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
