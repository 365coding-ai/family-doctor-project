package com.familydoctor.nursing.controller;

import com.familydoctor.common.exception.BusinessException;
import com.familydoctor.common.result.Result;
import com.familydoctor.nursing.entity.Nurse;
import com.familydoctor.nursing.entity.ServiceCategory;
import com.familydoctor.nursing.entity.ServiceItem;
import com.familydoctor.nursing.repository.NurseRepository;
import com.familydoctor.nursing.repository.ServiceCategoryRepository;
import com.familydoctor.nursing.repository.ServiceItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 上门护理服务接口
 */
@RestController
@RequestMapping("/api/v1/nursing")
@RequiredArgsConstructor
public class NursingController {

    private final ServiceCategoryRepository categoryRepository;
    private final ServiceItemRepository itemRepository;
    private final NurseRepository nurseRepository;

    // ========== 服务分类 ==========

    /** 获取所有启用的服务分类 */
    @GetMapping("/service-categories")
    public Result<List<ServiceCategory>> getCategories(@RequestParam(required = false) Integer limit) {
        List<ServiceCategory> list = categoryRepository.findByStatusOrderBySortOrderAsc(1);
        if (limit != null && limit > 0 && limit < list.size()) {
            return Result.success(list.subList(0, limit));
        }
        return Result.success(list);
    }

    // ========== 服务项目 ==========

    /** 按分类获取服务项目列表 */
    @GetMapping("/service-items")
    public Result<List<ServiceItem>> getItemsByCategory(@RequestParam Long categoryId) {
        List<ServiceItem> items = itemRepository.findByCategoryIdAndStatusOrderBySortOrderAsc(categoryId, 1);
        // 避免列表接口触发懒加载报错
        items.forEach(item -> {
            item.setSpecs(null);
            item.setMaterials(null);
        });
        return Result.success(items);
    }

    /** 获取服务项目详情（含规格和耗材） */
    @GetMapping("/service-items/{id}")
    @Transactional(readOnly = true)
    public Result<ServiceItem> getItemDetail(@PathVariable Long id) {
        ServiceItem item = itemRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "服务项目不存在"));
        // 触发懒加载
        item.getSpecs().size();
        item.getMaterials().size();
        return Result.success(item);
    }

    /** 获取可服务该项目的护士列表 */
    @GetMapping("/service-items/{id}/nurses")
    public Result<List<Nurse>> getItemNurses(@PathVariable Long id) {
        return Result.success(nurseRepository.findByServiceItemId(id));
    }

    // ========== 护士 ==========

    /** 获取所有在线护士 */
    @GetMapping("/nurses")
    public Result<List<Nurse>> getAllNurses() {
        return Result.success(nurseRepository.findByStatus("ACTIVE"));
    }

    /** 获取护士详情 */
    @GetMapping("/nurses/{id}")
    public Result<Nurse> getNurseDetail(@PathVariable Long id) {
        Nurse nurse = nurseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "护士不存在"));
        return Result.success(nurse);
    }
}
