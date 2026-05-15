package com.familydoctor.doctor.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Data
@Entity
@Table(name = "doctor_schedule",
       uniqueConstraints = @UniqueConstraint(columnNames = {"doctorId", "date", "timeSlot"}))
public class DoctorSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long doctorId;

    @Column(nullable = false)
    private LocalDate date;

    /** 时间段，如 09:00-10:00 */
    @Column(nullable = false, length = 20)
    private String timeSlot;

    @Column(columnDefinition = "tinyint")
    private Boolean isBooked = false;
}
