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
    private ServiceOrder resolveOrder(String idOrNo) {
        if (idOrNo.matches("\\d+")) {
            return orderRepository.findById(Long.parseLong(idOrNo))
                    .orElseGet(() -> orderRepository.findByOrderNo(idOrNo)
                            .orElseThrow(() -> new BusinessException(404, "订单不存在")));
        }
        return orderRepository.findByOrderNo(idOrNo)
                .orElseThrow(() -> new BusinessException(404, "订单不存在"));
    }

    /**
     * 订单详情
     */
    @GetMapping("/{idOrNo}")
    public Result<ServiceOrder> getOrderDetail(@AuthenticationPrincipal Long userId,
                                               @PathVariable String idOrNo) {
        ServiceOrder order = resolveOrder(idOrNo);
        
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
    @PutMapping("/{idOrNo}/cancel")
    public Result<ServiceOrder> cancelOrder(@AuthenticationPrincipal Long userId,
                                            @PathVariable String idOrNo,
                                            @RequestParam(required = false) String reason) {
        ServiceOrder order = resolveOrder(idOrNo);
        return Result.success(orderService.cancelOrder(userId, order.getId(), reason));
    }

    /**
     * 模拟支付
     */
    @PostMapping("/{idOrNo}/pay")
    public Result<ServiceOrder> payOrder(@AuthenticationPrincipal Long userId, @PathVariable String idOrNo) {
        ServiceOrder order = resolveOrder(idOrNo);
        return Result.success(orderService.payOrder(userId, order.getId()));
    }

    /**
     * 模拟状态变更 (仅供测试)
     */
    @PutMapping("/{idOrNo}/status")
    public Result<ServiceOrder> updateStatus(@PathVariable String idOrNo, @RequestParam String status) {
        ServiceOrder order = resolveOrder(idOrNo);
        return Result.success(orderService.updateStatus(order.getId(), status));
    }

    /**
     * 检查患者与医生之间是否有有效的已支付图文咨询订单
     * 前端进入聊天页时调用，决定是否弹出计费选择弹层
     * doctorId 这里接受的是医生的 userId (前端存的是 doctor.userId)
     */
    @GetMapping("/consult/check")
    public Result<java.util.Map<String, Object>> checkConsultStatus(
            @AuthenticationPrincipal Long userId,
            @RequestParam Long doctorId) {

        // 通过 doctorId (实为 doctor.userId) 找到 doctor 记录
        com.familydoctor.doctor.entity.Doctor doctor = doctorRepository.findByUserId(doctorId).orElse(null);
        if (doctor == null) {
            // 如果找不到医生，放行（可能是护士或其他角色）
            java.util.Map<String, Object> res = new java.util.HashMap<>();
            res.put("hasActive", true);
            res.put("order", null);
            return Result.success(res);
        }

        java.util.Optional<ServiceOrder> activeOrder = orderRepository.findActivePaidConsult(
                userId, doctor.getId(), java.time.LocalDateTime.now());

        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("hasActive", activeOrder.isPresent());
        res.put("order", activeOrder.orElse(null));
        return Result.success(res);
    }

    /**
     * 根据房间号获取订单 (用于聊天页加载上下文)
     */
    @GetMapping("/room/{roomId}")
    public Result<ServiceOrder> getOrderByRoom(@AuthenticationPrincipal Long userId,
                                                @PathVariable String roomId) {
        ServiceOrder order = orderRepository.findByRoomId(roomId)
                .orElseThrow(() -> new BusinessException(404, "房间不存在"));
        boolean isOwner = order.getUserId().equals(userId);
        boolean isAssignee = doctorRepository.findByUserId(userId)
                .map(d -> d.getId().equals(order.getDoctorId()))
                .orElse(false);
        if (!isOwner && !isAssignee) {
            throw new BusinessException(403, "无权查看");
        }
        return Result.success(order);
    }
}
