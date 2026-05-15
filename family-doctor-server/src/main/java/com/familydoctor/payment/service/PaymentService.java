package com.familydoctor.payment.service;

import com.familydoctor.common.exception.BusinessException;
import com.familydoctor.order.entity.ServiceOrder;
import com.familydoctor.order.repository.ServiceOrderRepository;
import com.familydoctor.payment.dto.CreatePaymentRequest;
import com.familydoctor.payment.entity.PaymentRecord;
import com.familydoctor.payment.repository.PaymentRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 支付服务
 * TODO: Phase 3 对接微信/支付宝 SDK
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final ServiceOrderRepository orderRepository;
    private final PaymentRecordRepository paymentRecordRepository;

    /**
     * 创建支付（MVP: 模拟支付，直接返回成功）
     */
    @Transactional
    public Map<String, Object> createPayment(Long userId, CreatePaymentRequest request) {
        ServiceOrder order = orderRepository.findByOrderNo(request.getOrderNo())
                .orElseThrow(() -> new BusinessException(404, "订单不存在"));

        if (!order.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权操作");
        }
        if (!"PENDING".equals(order.getStatus())) {
            throw new BusinessException("订单状态异常");
        }

        // 创建支付记录
        PaymentRecord record = new PaymentRecord();
        record.setOrderNo(order.getOrderNo());
        record.setPayMethod(request.getPayMethod());
        record.setAmount(order.getAmount());
        record.setStatus("PENDING");
        paymentRecordRepository.save(record);

        // MVP: 模拟支付成功
        record.setStatus("SUCCESS");
        record.setTradeNo("MOCK_" + System.currentTimeMillis());
        paymentRecordRepository.save(record);

        // 更新订单状态
        order.setStatus("PAID");
        order.setPayMethod(request.getPayMethod());
        order.setPayTime(LocalDateTime.now());
        orderRepository.save(order);

        Map<String, Object> result = new HashMap<>();
        result.put("orderNo", order.getOrderNo());
        result.put("status", "SUCCESS");
        result.put("message", "支付成功（MVP 模拟）");

        log.info("支付成功: orderNo={}, method={}", order.getOrderNo(), request.getPayMethod());
        return result;
    }

    /**
     * 微信支付回调处理
     * TODO: Phase 3 实现验签 + 解密
     */
    public void handleWxCallback(String body) {
        log.info("收到微信支付回调: {}", body);
        // TODO: 验签、解密、更新订单状态
    }

    /**
     * 支付宝回调处理
     * TODO: Phase 3 实现验签
     */
    public void handleAliCallback(Map<String, String> params) {
        log.info("收到支付宝回调: {}", params);
        // TODO: 验签、更新订单状态
    }
}
