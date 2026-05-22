package com.familydoctor.chat.controller;

import com.familydoctor.chat.entity.ChatMessage;
import com.familydoctor.chat.repository.ChatMessageRepository;
import com.familydoctor.common.dto.WsMessage;
import com.familydoctor.common.result.Result;
import com.familydoctor.common.service.WsPushService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 实时聊天控制器
 * WebSocket 消息类型:
 *   /app/chat.send    → 发送 TEXT/IMAGE 消息
 *   /app/chat.read    → 发送已读回执
 *   /app/chat.typing  → 发送正在输入状态
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final WsPushService wsPushService;

    // ─── HTTP 接口 ────────────────────────────────────────────

    /**
     * 获取聊天历史记录
     */
    @GetMapping("/history")
    public Result<List<ChatMessage>> getHistory(
            @AuthenticationPrincipal Long currentUserId,
            @RequestParam Long userId,
            @RequestParam(required = false) String roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (roomId != null && !roomId.trim().isEmpty()) {
            return Result.success(chatMessageRepository.findChatHistoryByRoom(
                    roomId, PageRequest.of(page, size)));
        }
        return Result.success(chatMessageRepository.findChatHistory(
                currentUserId, userId, PageRequest.of(page, size)));
    }

    /**
     * HTTP 标记消息已读 (批量)
     * 进入聊天页时调用，将对方发给自己的所有未读消息标记为已读
     */
    @PutMapping("/read/{fromUserId}")
    public Result<Void> markRead(@AuthenticationPrincipal Long currentUserId,
                                 @PathVariable Long fromUserId,
                                 @RequestParam(required = false) String roomId) {
        List<ChatMessage> unread;
        if (roomId != null && !roomId.trim().isEmpty()) {
            unread = chatMessageRepository.findUnreadMessagesByRoom(fromUserId, currentUserId, roomId);
        } else {
            unread = chatMessageRepository.findUnreadMessages(fromUserId, currentUserId);
        }
        if (!unread.isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            unread.forEach(m -> { m.setIsRead(true); m.setReadAt(now); });
            chatMessageRepository.saveAll(unread);
            // 通知对方"你的消息已被阅读"
            wsPushService.pushToUser(fromUserId, "READ_RECEIPT",
                    Map.of("readBy", currentUserId, "count", unread.size(), "readAt", now.toString(), "roomId", roomId != null ? roomId : ""));
        }
        return Result.success(null);
    }

    // ─── WebSocket 消息处理 ───────────────────────────────────

    /**
     * 处理发送消息 (TEXT / IMAGE)
     * 客户端发往: /app/chat.send
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage message, Principal principal) {
        if (principal == null) {
            log.error("WebSocket 消息处理失败: Principal 为空");
            return;
        }

        Long senderId = Long.parseLong(principal.getName());
        message.setSenderId(senderId);

        // 幂等检查: 相同 msgId 不重复存储
        if (message.getMsgId() != null) {
            boolean exists = chatMessageRepository.existsByMsgId(message.getMsgId());
            if (exists) {
                log.warn("重复消息忽略: msgId={}", message.getMsgId());
                return;
            }
        }

        // 默认类型为 TEXT
        if (message.getType() == null) message.setType("TEXT");

        log.info("收到来自 {} 发往 {} 的[{}]消息", senderId, message.getReceiverId(), message.getType());

        ChatMessage saved = chatMessageRepository.save(message);

        // 推送给接收者
        wsPushService.pushToUser(message.getReceiverId(), "CHAT", saved);
        // 回执给发送者 (确认已入库)
        wsPushService.pushToUser(senderId, "CHAT_ACK", Map.of("msgId", message.getMsgId(), "id", saved.getId()));
    }

    /**
     * 处理已读回执 (WebSocket 方式)
     * 客户端发往: /app/chat.read
     * payload: { "fromUserId": 7, "messageIds": [101, 102, 103] }
     */
    @MessageMapping("/chat.read")
    public void handleRead(@Payload ReadRequest req, Principal principal) {
        if (principal == null) return;
        Long readerId = Long.parseLong(principal.getName());

        // 标记已读
        List<ChatMessage> msgs = chatMessageRepository.findAllById(req.getMessageIds());
        if (msgs.isEmpty()) return;

        LocalDateTime now = LocalDateTime.now();
        msgs.stream()
            .filter(m -> m.getReceiverId().equals(readerId))
            .forEach(m -> { m.setIsRead(true); m.setReadAt(now); });
        chatMessageRepository.saveAll(msgs);

        // 确定消息的真正发送者 (即接收已读回执的人)
        Long targetNotifyUserId = req.getFromUserId();
        if (targetNotifyUserId == null || targetNotifyUserId.equals(readerId)) {
            targetNotifyUserId = msgs.get(0).getSenderId();
        }

        // 通知发送方: 消息已被读
        wsPushService.pushToUser(targetNotifyUserId, "READ_RECEIPT",
                Map.of("readBy", readerId, "messageIds", req.getMessageIds(), "readAt", now.toString(), "roomId", req.getRoomId() != null ? req.getRoomId() : ""));
    }

    /**
     * 处理"正在输入"信号
     * 客户端发往: /app/chat.typing
     * payload: { "toUserId": 7, "isTyping": true }
     */
    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload TypingSignal signal, Principal principal) {
        if (principal == null) return;
        Long fromUserId = Long.parseLong(principal.getName());
        log.debug("收到[正在输入]信号: 来自={}, 发往={}, 状态={}", fromUserId, signal.getToUserId(), signal.isTyping());
        // 直接转发给对方，不持久化
        wsPushService.pushToUser(signal.getToUserId(), "TYPING",
                Map.of("fromUserId", fromUserId, "isTyping", signal.isTyping()));
    }

    // ─── 内部 DTO ─────────────────────────────────────────────

    @Data
    public static class ReadRequest {
        private Long fromUserId;
        private List<Long> messageIds;
        private String roomId;
    }

    @Data
    public static class TypingSignal {
        private Long toUserId;
        
        @com.fasterxml.jackson.annotation.JsonProperty("isTyping")
        private boolean isTyping;
    }
}
