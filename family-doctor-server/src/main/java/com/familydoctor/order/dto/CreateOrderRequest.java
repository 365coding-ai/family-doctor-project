package com.familydoctor.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateOrderRequest {

    @NotNull(message = "医生ID不能为空")
    private Long doctorId;

    @NotBlank(message = "服务类型不能为空")
    private String serviceType;

    @NotNull(message = "金额不能为空")
    private BigDecimal amount;

    private Long addressId;

    private LocalDate scheduleDate;

    private String scheduleTime;

    private String remark;
}
