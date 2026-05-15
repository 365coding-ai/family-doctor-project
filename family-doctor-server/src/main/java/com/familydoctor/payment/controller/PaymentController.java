package com.familydoctor.payment.controller;

import com.familydoctor.common.result.Result;
import com.familydoctor.payment.dto.CreatePaymentRequest;
import com.familydoctor.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 支付接口
 */
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * 创建支付
     */
    @PostMapping("/create")
    public Result<Map<String, Object>> createPayment(
            @AuthenticationPrincipal Long userId,
            @RequestBody CreatePaymentRequest request) {
        return Result.success(paymentService.createPayment(userId, request));
    }

    /**
     * 微信支付回调
     */
    @PostMapping("/wx/callback")
    public String wxPayCallback(@RequestBody String body) {
        paymentService.handleWxCallback(body);
        return "<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>";
    }

    /**
     * 支付宝回调
     */
    @PostMapping("/ali/callback")
    public String aliPayCallback(@RequestParam Map<String, String> params) {
        paymentService.handleAliCallback(params);
        return "success";
    }
}
