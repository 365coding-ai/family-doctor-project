package com.familydoctor.order.repository;

import com.familydoctor.order.entity.ServiceOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServiceOrderRepository extends JpaRepository<ServiceOrder, Long> {

    Optional<ServiceOrder> findByOrderNo(String orderNo);

    Page<ServiceOrder> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<ServiceOrder> findByDoctorIdOrderByCreatedAtDesc(Long doctorId, Pageable pageable);

    Page<ServiceOrder> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status, Pageable pageable);
}
