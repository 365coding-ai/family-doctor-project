package com.familydoctor.doctor.repository;

import com.familydoctor.doctor.entity.Doctor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByPhone(String phone);

    Optional<Doctor> findByUserId(Long userId);


    Page<Doctor> findByDepartment(String department, Pageable pageable);

    @Query("SELECT d FROM Doctor d WHERE :department LIKE CONCAT('%', d.department, '%') OR d.department LIKE CONCAT('%', :department, '%')")
    Page<Doctor> findByDepartmentLike(@Param("department") String department, Pageable pageable);

    @Query("SELECT d FROM Doctor d WHERE d.name LIKE %:keyword% OR d.department LIKE %:keyword% OR :keyword LIKE CONCAT('%', d.department, '%') OR d.hospital LIKE %:keyword%")
    Page<Doctor> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    List<Doctor> findByCanHomeVisitTrueAndStatus(Integer status);

    @Query("SELECT d.id as id, u.nickname as name, d.title as title, " +
           "d.department as department, d.hospital as hospital, " +
           "u.avatarUrl as avatarUrl, d.rating as rating, " +
           "d.serviceCount as serviceCount, d.introduction as introduction, " +
           "d.canHomeVisit as canHomeVisit, d.status as status, u.id as userId " +
           "FROM Doctor d JOIN User u ON d.userId = u.id " +
           "WHERE d.canHomeVisit = true AND d.status = :status")
    List<com.familydoctor.doctor.dto.NearbyDoctorVO> findNearbyDoctorsWithUser(@Param("status") Integer status);
}
