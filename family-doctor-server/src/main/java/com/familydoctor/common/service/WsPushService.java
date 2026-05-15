package com.familydoctor.common.service;

import com.familydoctor.common.dto.WsMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * WebSocket 实时推送服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WsPushService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 向指定用户推送实时消息 (通过 /user/{userId}/queue/messages)
     */
    public void pushToUser(Long userId, String type, Object payload) {
        WsMessage<Object> message = WsMessage.of(type, payload);
        log.info("WebSocket 推送给用户 {}: [{}]", userId, type);
        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/messages", message);
    }

    /**
     * 全局广播消息 (通过 /topic/public)
     */
    public void broadcast(String type, Object payload) {
        WsMessage<Object> message = WsMessage.of(type, payload);
        log.info("WebSocket 全局广播: [{}]", type);
        messagingTemplate.convertAndSend("/topic/public", message);
    }
}
