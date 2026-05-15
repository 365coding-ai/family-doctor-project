package com.familydoctor.chat.controller;

import com.familydoctor.chat.entity.ChatMessage;
import com.familydoctor.chat.repository.ChatMessageRepository;
import com.familydoctor.common.dto.WsMessage;
import com.familydoctor.common.result.Result;
import com.familydoctor.common.service.WsPushService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * 实时聊天控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final WsPushService wsPushService;

    /**
     * 获取历史记录
     */
    @GetMapping("/history")
    public Result<List<ChatMessage>> getHistory(
            @AuthenticationPrincipal Long currentUserId,
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(chatMessageRepository.findChatHistory(currentUserId, userId, PageRequest.of(page, size)));
    }

    /**
     * 处理发送消息
     * 客户端发送至: /app/chat.send
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage message, Principal principal) {
        if (principal == null) {
            log.error("WebSocket 消息处理失败: Principal 为空");
            return;
        }
        // 1. 设置发送者 (从 Security Context 获取)
        Long senderId = Long.parseLong(principal.getName());
        message.setSenderId(senderId);

        log.info("收到来自 {} 发往 {} 的消息: {}", senderId, message.getReceiverId(), message.getContent());

        // 2. 持久化到数据库
        chatMessageRepository.save(message);

        // 3. 实时推送给接收者
        wsPushService.pushToUser(message.getReceiverId(), "CHAT", message);
        
        // 4. (可选) 推送回执给发送者
        wsPushService.pushToUser(senderId, "CHAT_ACK", message.getId());
    }
}
