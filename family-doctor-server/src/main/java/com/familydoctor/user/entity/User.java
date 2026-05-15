package com.familydoctor.user.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String phone;

    @Column(length = 50)
    private String nickname;

    @Column(length = 512)
    private String avatarUrl;

    /** 0=未知 1=男 2=女 */
    private Integer gender = 0;

    private LocalDate birthDate;

    /** ROLE_USER, ROLE_DOCTOR, ROLE_NURSE */
    @Column(length = 20, nullable = false)
    private String role = "ROLE_USER";
    

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
