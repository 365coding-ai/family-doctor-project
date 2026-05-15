package com.familydoctor.doctor.repository;

import com.familydoctor.doctor.entity.DoctorSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {

    List<DoctorSchedule> findByDoctorIdAndDateOrderByTimeSlot(Long doctorId, LocalDate date);

    List<DoctorSchedule> findByDoctorIdAndDateAndIsBookedFalseOrderByTimeSlot(Long doctorId, LocalDate date);
}
