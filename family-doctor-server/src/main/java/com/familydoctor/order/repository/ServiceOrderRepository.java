package com.familydoctor.order.repository;

import com.familydoctor.order.entity.ServiceOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface ServiceOrderRepository extends JpaRepository<ServiceOrder, Long> {

    Optional<ServiceOrder> findByOrderNo(String orderNo);

    Page<ServiceOrder> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<ServiceOrder> findByDoctorIdOrderByCreatedAtDesc(Long doctorId, Pageable pageable);

    Page<ServiceOrder> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status, Pageable pageable);

    /**
     * 检查用户是否为首次图文咨询 (用于首单免费逻辑)
     */
    boolean existsByUserIdAndServiceType(Long userId, String serviceType);

    /**
     * 查找用户与某医生之间有效的已支付图文咨询订单
     * 用于进入聊天前验证是否已支付
     */
    @Query("SELECT o FROM ServiceOrder o WHERE o.userId = :userId AND o.doctorId = :doctorId " +
           "AND o.serviceType = 'GRAPHIC_CONSULT' AND o.status = 'PAID' " +
           "AND (o.expireAt IS NULL OR o.expireAt > :now)")
    Optional<ServiceOrder> findActivePaidConsult(Long userId, Long doctorId, LocalDateTime now);

    Optional<ServiceOrder> findByRoomId(String roomId);
}
