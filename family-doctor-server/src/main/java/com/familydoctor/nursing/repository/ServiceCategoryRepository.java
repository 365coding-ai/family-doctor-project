package com.familydoctor.nursing.repository;

import com.familydoctor.nursing.entity.ServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {
    List<ServiceCategory> findByStatusOrderBySortOrderAsc(Integer status);
}
