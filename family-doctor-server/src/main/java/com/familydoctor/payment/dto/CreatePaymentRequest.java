package com.familydoctor.payment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreatePaymentRequest {

    @NotBlank(message = "订单号不能为空")
    private String orderNo;

    /** WECHAT / ALIPAY */
    @NotBlank(message = "支付方式不能为空")
    private String payMethod;
}
