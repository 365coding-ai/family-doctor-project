package com.familydoctor.order.repository;

import com.familydoctor.order.entity.UserPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserPackageRepository extends JpaRepository<UserPackage, Long> {

    /**
     * 查询用户当前有效套餐 (状态为ACTIVE且未过期)
     */
    @Query("SELECT p FROM UserPackage p WHERE p.userId = :userId AND p.status = 'ACTIVE' AND p.expiredAt > :now ORDER BY p.expiredAt DESC")
    Optional<UserPackage> findActivePackage(Long userId, LocalDateTime now);

    /**
     * 检查用户是否有任何套餐历史 (用于首单判断)
     */
    boolean existsByUserId(Long userId);
}
