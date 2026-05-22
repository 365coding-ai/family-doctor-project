package com.familydoctor.order.service;

import com.familydoctor.common.exception.BusinessException;
import com.familydoctor.order.dto.CreateOrderRequest;
import com.familydoctor.order.entity.OrderAddon;
import com.familydoctor.order.entity.ServiceOrder;
import com.familydoctor.order.entity.UserPackage;
import com.familydoctor.order.repository.ServiceOrderRepository;
import com.familydoctor.order.repository.UserPackageRepository;
import com.familydoctor.doctor.entity.Doctor;
import com.familydoctor.doctor.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 订单服务 - 支持三种服务类型和四种图文咨询计费模式
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final ServiceOrderRepository orderRepository;
    private final UserPackageRepository packageRepository;
    private final EntityManager entityManager;
    private final com.familydoctor.common.service.WsPushService wsPushService;
    private final DoctorRepository doctorRepository;

    /**
     * 创建订单 (含计费模式处理)
     */
    @Transactional
    public ServiceOrder createOrder(Long userId, CreateOrderRequest req) {
        ServiceOrder order = new ServiceOrder();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        
        if ("HOME_NURSING".equals(req.getServiceType())) {
            order.setDoctorId(null);
            order.setNurseId(req.getNurseId());
            order.setServiceItemId(req.getServiceItemId());
            order.setSpecId(req.getSpecId());
            order.setTrafficFee(req.getTrafficFee());
            order.setMaterialFee(req.getMaterialFee());
        } else {
            Long inputDoctorId = req.getDoctorId();
            if (inputDoctorId == null) throw new BusinessException(400, "医生ID不能为空");
            Doctor doctor = doctorRepository.findByUserId(inputDoctorId).orElse(null);
            if (doctor == null) {
                doctor = doctorRepository.findById(inputDoctorId)
                        .orElseThrow(() -> new BusinessException(404, "医生不存在"));
            }
            order.setDoctorId(doctor.getId());
        }
        
        order.setServiceType(req.getServiceType());
        order.setAddressId(req.getAddressId());
        order.setScheduleDate(req.getScheduleDate());
        order.setScheduleTime(req.getScheduleTime());
        order.setRemark(req.getRemark());
        order.setStatus("PENDING");

        // === 图文咨询: 计费模式处理 ===
        if ("GRAPHIC_CONSULT".equals(req.getServiceType())) {
            processGraphicConsultBilling(userId, req, order);
        } else {
            // 视频问诊 / 上门服务: 按传入金额
            order.setBillingType("PER_SESSION");
            order.setAmount(req.getAmount());
        }

        ServiceOrder saved = orderRepository.save(order);

        // 保存增值服务明细
        if (req.getAddons() != null && !req.getAddons().isEmpty()) {
            for (CreateOrderRequest.AddonItem item : req.getAddons()) {
                OrderAddon addon = new OrderAddon();
                addon.setOrderId(saved.getId());
                addon.setAddonType(item.getAddonType());
                addon.setAddonName(item.getAddonName());
                addon.setAddonPrice(item.getAddonPrice());
                entityManager.persist(addon);
            }
        }

        log.info("订单已创建: orderNo={}, serviceType={}, billingType={}, amount={}",
                saved.getOrderNo(), saved.getServiceType(), saved.getBillingType(), saved.getAmount());
        return saved;
    }

    /**
     * 图文咨询计费逻辑:
     * 1. 首单免费判断
     * 2. 套餐抵扣判断
     * 3. 按次/按时计费
     * 4. 设置24小时有效期
     */
    private void processGraphicConsultBilling(Long userId, CreateOrderRequest req, ServiceOrder order) {
        // 判断是否首单免费
        boolean isFirstOrder = !orderRepository.existsByUserIdAndServiceType(userId, "GRAPHIC_CONSULT");
        if (isFirstOrder) {
            order.setBillingType("FIRST_FREE");
            order.setIsFirstFree(1);
            order.setAmount(BigDecimal.ZERO);
            order.setStatus("PAID"); // 首单直接标记为已支付
            order.setExpireAt(LocalDateTime.now().plusHours(24));
            order.setRoomId(generateRoomId(order));
            log.info("首单免费: userId={}", userId);
            return;
        }

        // 判断是否使用套餐
        if ("SUBSCRIPTION".equals(req.getBillingType())) {
            UserPackage pkg = packageRepository.findActivePackage(userId, LocalDateTime.now())
                    .orElseThrow(() -> new BusinessException("您没有可用的套餐，请先购买"));
            // 检查剩余次数
            if (pkg.getRemainingTimes() != null && pkg.getRemainingTimes() <= 0) {
                throw new BusinessException("套餐次数已用完，请续费或选择其他计费方式");
            }
            // 扣减套餐次数
            if (pkg.getRemainingTimes() != null) {
                pkg.setRemainingTimes(pkg.getRemainingTimes() - 1);
                packageRepository.save(pkg);
            }
            order.setBillingType("SUBSCRIPTION");
            order.setPackageId(pkg.getId());
            order.setAmount(BigDecimal.ZERO);
            order.setStatus("PAID");
            order.setExpireAt(LocalDateTime.now().plusHours(24));
            order.setRoomId(generateRoomId(order));
            return;
        }

        // 按时计费
        if ("PER_MINUTE".equals(req.getBillingType())) {
            order.setBillingType("PER_MINUTE");
            order.setBillingUnitPrice(req.getBillingUnitPrice() != null ? req.getBillingUnitPrice() : new BigDecimal("2.00"));
            order.setBillingDurationMin(req.getBillingDurationMin() != null ? req.getBillingDurationMin() : 30);
            order.setBillingMaxAmount(req.getBillingMaxAmount() != null ? req.getBillingMaxAmount() : new BigDecimal("60.00"));
            order.setAmount(req.getAmount());
        } else {
            // 默认: 按次计费 PER_SESSION
            order.setBillingType("PER_SESSION");
            order.setAmount(req.getAmount() != null ? req.getAmount() : new BigDecimal("30.00"));
        }
        order.setExpireAt(LocalDateTime.now().plusHours(24));
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
        order.setPayTime(LocalDateTime.now());
        // 图文咨询支付后设置24小时有效期 & 生成房间号
        if ("GRAPHIC_CONSULT".equals(order.getServiceType())) {
            if (order.getExpireAt() == null) {
                order.setExpireAt(LocalDateTime.now().plusHours(24));
            }
            if (order.getRoomId() == null) {
                order.setRoomId(generateRoomId(order));
            }
        }
        ServiceOrder saved = orderRepository.save(order);
        wsPushService.pushToUser(userId, "ORDER_PAY_SUCCESS", saved);
        return saved;
    }

    /**
     * 更新订单状态 (医生接单、出发、到达等)
     */
    @Transactional
    public ServiceOrder updateStatus(Long orderId, String newStatus) {
        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(404, "订单不存在"));
        order.setStatus(newStatus);
        ServiceOrder saved = orderRepository.save(order);
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

    /**
     * 生成聊天房间号: room_用户ID_医生ID_时间戳
     */
    private String generateRoomId(ServiceOrder order) {
        long ts = System.currentTimeMillis() / 1000;
        return "room_" + order.getUserId() + "_" + order.getDoctorId() + "_" + ts;
    }
}
