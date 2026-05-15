package com.familydoctor.order.service;

import com.familydoctor.common.exception.BusinessException;
import com.familydoctor.order.dto.CreateOrderRequest;
import com.familydoctor.order.entity.ServiceOrder;
import com.familydoctor.order.repository.ServiceOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 订单服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final ServiceOrderRepository orderRepository;
    private final com.familydoctor.common.service.WsPushService wsPushService;

    /**
     * 创建预约订单
     */
    @Transactional
    public ServiceOrder createOrder(Long userId, CreateOrderRequest request) {
        ServiceOrder order = new ServiceOrder();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setDoctorId(request.getDoctorId());
        order.setServiceType(request.getServiceType());
        order.setAmount(request.getAmount());
        order.setAddressId(request.getAddressId());
        order.setScheduleDate(request.getScheduleDate());
        order.setScheduleTime(request.getScheduleTime());
        order.setRemark(request.getRemark());
        order.setStatus("PENDING");

        ServiceOrder saved = orderRepository.save(order);
        log.info("订单已创建: orderNo={}, userId={}", saved.getOrderNo(), userId);
        return saved;
    }

    /**
     * 取消订单
     */
    @Transactional
    public ServiceOrder cancelOrder(Long userId, Long orderId, String reason) {
        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(404, "订单不存在"));

        if (!order.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权操作");
        }

        if (!"PENDING".equals(order.getStatus())) {
            throw new BusinessException("当前状态不允许取消");
        }

        order.setStatus("CANCELLED");
        order.setCancelReason(reason);
        ServiceOrder saved = orderRepository.save(order);
        
        // 推送通知
        wsPushService.pushToUser(userId, "ORDER_STATUS", saved);
        return saved;
    }

    /**
     * 模拟支付成功
     */
    @Transactional
    public ServiceOrder payOrder(Long userId, Long orderId) {
        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(404, "订单不存在"));
        
        if (!order.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权操作");
        }

        order.setStatus("PAID");
        ServiceOrder saved = orderRepository.save(order);

        // 实时推送支付结果
        wsPushService.pushToUser(userId, "ORDER_PAY_SUCCESS", saved);
        return saved;
    }

    /**
     * 更新订单状态 (模拟护士接单、出发、到达等)
     */
    @Transactional
    public ServiceOrder updateStatus(Long orderId, String newStatus) {
        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(404, "订单不存在"));
        
        order.setStatus(newStatus);
        ServiceOrder saved = orderRepository.save(order);

        // 实时推送状态变更给用户
        wsPushService.pushToUser(order.getUserId(), "ORDER_STATUS", saved);
        return saved;
    }

    /**
     * 生成订单号: FD + 年月日时分秒 + 4位随机数
     */
    private String generateOrderNo() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "FD" + dateStr + rand;
    }
}
