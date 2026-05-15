package com.familydoctor.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 统一 WebSocket 消息封装
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WsMessage<T> {

    /**
     * 消息类型: CHAT, ORDER_STATUS, NOTIFICATION_COUNT, SYSTEM
     */
    private String type;

    /**
     * 消息载荷
     */
    private T payload;

    /**
     * 发送者 ID (可选)
     */
    private String sender;

    /**
     * 时间戳
     */
    private Long timestamp;

    public static <T> WsMessage<T> of(String type, T payload) {
        return WsMessage.<T>builder()
                .type(type)
                .payload(payload)
                .timestamp(System.currentTimeMillis())
                .build();
    }
}
