package com.familydoctor.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateOrderRequest {

    private Long doctorId;

    private Long nurseId;
    private Long serviceItemId;
    private Long specId;
    private BigDecimal trafficFee;
    private BigDecimal materialFee;

    /**
     * 服务类型: GRAPHIC_CONSULT / VIDEO_CONSULT / HOME_VISIT
     */
    @NotBlank(message = "服务类型不能为空")
    private String serviceType;

    /**
     * 计费模式 (图文咨询时有效):
     * PER_SESSION / PER_MINUTE / SUBSCRIPTION / FIRST_FREE
     */
    private String billingType = "PER_SESSION";

    /** 按时计费: 单价 (元/分钟) */
    private BigDecimal billingUnitPrice;

    /** 按时计费: 最大时长(分钟) */
    private Integer billingDurationMin;

    /** 按时计费: 封顶金额 */
    private BigDecimal billingMaxAmount;

    /** 套餐抵扣时: 套餐ID */
    private Long packageId;

    @NotNull(message = "金额不能为空")
    private BigDecimal amount;

    private Long addressId;

    private LocalDate scheduleDate;

    private String scheduleTime;

    private String remark;

    /** 增值服务列表 */
    private List<AddonItem> addons;

    @Data
    public static class AddonItem {
        /** PRIORITY_QUEUE / REPORT_ANALYSIS / FILE_UPLOAD */
        private String addonType;
        private String addonName;
        private BigDecimal addonPrice;
    }
}
