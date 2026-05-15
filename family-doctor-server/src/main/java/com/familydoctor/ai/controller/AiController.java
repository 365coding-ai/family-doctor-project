package com.familydoctor.ai.controller;

import com.familydoctor.ai.dto.ChatRequest;
import com.familydoctor.ai.dto.StreamChunk;
import com.familydoctor.ai.entity.AiConversation;
import com.familydoctor.ai.entity.AiMessage;
import com.familydoctor.ai.repository.AiConversationRepository;
import com.familydoctor.ai.repository.AiMessageRepository;
import com.familydoctor.ai.service.AiHistoryService;
import com.familydoctor.ai.service.HealthAiService;
import com.familydoctor.common.result.Result;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;

/**
 * AI 问诊接口 — 基于统一信封 (Envelope Pattern) 的 SSE 流式响应
 * <p>
 * 所有事件统一走 SSE 的 data: 域，不使用 event: 类型头（跨端兼容）。
 * 路由分发由 JSON 内的 {@code type} 字段驱动。
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final HealthAiService aiService;
    private final AiHistoryService historyService;
    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final ObjectMapper objectMapper;

    /**
     * AI 对话 — 统一信封 SSE 流
     * <p>
     * 每个 chunk 序列化为 JSON 字符串放入 SSE 的 data: 域。
     * 前端只需 JSON.parse(data) 后 switch(chunk.type) 即可路由处理。
     */
    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chat(@AuthenticationPrincipal Long userId,
                             @RequestBody ChatRequest request) {
        // 兼容新旧请求格式
        String messageText = request.resolveText();
        if (messageText == null || messageText.isBlank()) {
            // 直接返回一个 ERROR chunk
            try {
                StreamChunk errorChunk = StreamChunk.error(4000, "消息内容不能为空", "WARN");
                return Flux.just(objectMapper.writeValueAsString(errorChunk));
            } catch (JsonProcessingException e) {
                return Flux.just("{\"type\":\"ERROR\",\"data\":{\"code\":4000,\"message\":\"消息不能为空\"}}");
            }
        }

        return aiService.streamChat(messageText, userId, request.getSessionId())
                .map(chunk -> {
                    try {
                        return objectMapper.writeValueAsString(chunk);
                    } catch (JsonProcessingException e) {
                        log.error("Chunk 序列化失败: {}", e.getMessage());
                        return "{\"chunkId\":\"err\",\"type\":\"ERROR\",\"data\":{\"code\":5002,\"message\":\"序列化异常\"}}";
                    }
                });
    }

    /**
     * 获取对话历史列表（优先走 Redis 缓存）
     */
    @GetMapping("/conversations")
    public Result<List<AiConversation>> getConversations(@AuthenticationPrincipal Long userId) {
        return Result.success(historyService.getConversations(userId));
    }

    /**
     * 获取对话消息列表（优先走 Redis 缓存）
     */
    @GetMapping("/conversations/{id}/messages")
    public Result<List<AiMessage>> getMessages(@PathVariable Long id) {
        return Result.success(historyService.getMessages(id));
    }
}
