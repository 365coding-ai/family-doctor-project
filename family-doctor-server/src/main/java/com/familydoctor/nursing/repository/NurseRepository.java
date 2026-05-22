package com.familydoctor.nursing.repository;

import com.familydoctor.nursing.entity.Nurse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface NurseRepository extends JpaRepository<Nurse, Long> {

    List<Nurse> findByStatus(String status);

    Optional<Nurse> findByUserId(Long userId);

    @Query("SELECT n FROM Nurse n WHERE n.id IN " +
           "(SELECT nsi.nurseId FROM NurseServiceItem nsi WHERE nsi.itemId = :itemId) " +
           "AND n.status = 'ACTIVE'")
    List<Nurse> findByServiceItemId(Long itemId);
}
