package com.familydoctor.order.controller;

import com.familydoctor.common.exception.BusinessException;
import com.familydoctor.common.result.Result;
import com.familydoctor.order.dto.CreateOrderRequest;
import com.familydoctor.order.entity.ServiceOrder;
import com.familydoctor.order.service.OrderService;
import com.familydoctor.order.repository.ServiceOrderRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 订单接口
 */
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final ServiceOrderRepository orderRepository;
    private final com.familydoctor.doctor.repository.DoctorRepository doctorRepository;

    /**
     * 创建预约订单
     */
    @PostMapping
    public Result<ServiceOrder> createOrder(@AuthenticationPrincipal Long userId,
                                            @Valid @RequestBody CreateOrderRequest request) {
        return Result.success(orderService.createOrder(userId, request));
    }

    /**
     * 我的订单列表
     */
    @GetMapping
    public Result<Page<ServiceOrder>> getMyOrders(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageRequest pageable = PageRequest.of(page, size);
        if (status != null && !status.isBlank()) {
            return Result.success(orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, status, pageable));
        }
        return Result.success(orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable));
    }

    /**
     * 医生端订单列表
     */
    @GetMapping("/doctor")
    public Result<Page<ServiceOrder>> getDoctorOrders(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        // 查找当前用户的医生身份
        com.familydoctor.doctor.entity.Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(403, "非医生身份"));
        
        PageRequest pageable = PageRequest.of(page, size);
        return Result.success(orderRepository.findByDoctorIdOrderByCreatedAtDesc(doctor.getId(), pageable));
    }

    /**
     * 订单详情
     */
    @GetMapping("/{id}")
    public Result<ServiceOrder> getOrderDetail(@AuthenticationPrincipal Long userId,
                                               @PathVariable Long id) {
        ServiceOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "订单不存在"));
        
        // 允许订单所属用户或指派医生查看
        boolean isOwner = order.getUserId().equals(userId);
        boolean isAssignee = doctorRepository.findByUserId(userId)
                .map(d -> d.getId().equals(order.getDoctorId()))
                .orElse(false);
                
        if (!isOwner && !isAssignee) {
            throw new BusinessException(403, "无权查看");
        }
        return Result.success(order);
    }

    /**
     * 取消订单
     */
    @PutMapping("/{id}/cancel")
    public Result<ServiceOrder> cancelOrder(@AuthenticationPrincipal Long userId,
                                            @PathVariable Long id,
                                            @RequestParam(required = false) String reason) {
        return Result.success(orderService.cancelOrder(userId, id, reason));
    }

    /**
     * 模拟支付
     */
    @PostMapping("/{id}/pay")
    public Result<ServiceOrder> payOrder(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return Result.success(orderService.payOrder(userId, id));
    }

    /**
     * 模拟状态变更 (仅供测试)
     */
    @PutMapping("/{id}/status")
    public Result<ServiceOrder> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return Result.success(orderService.updateStatus(id, status));
    }
}
