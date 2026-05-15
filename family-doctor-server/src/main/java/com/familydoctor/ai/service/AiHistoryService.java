package com.familydoctor.ai.service;

import com.familydoctor.ai.entity.AiConversation;
import com.familydoctor.ai.entity.AiMessage;
import com.familydoctor.ai.repository.AiConversationRepository;
import com.familydoctor.ai.repository.AiMessageRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * AI 历史会话与消息服务 — 深度结合 Redis + MySQL 双层存储架构
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiHistoryService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CONV_CACHE_KEY_PREFIX = "ai:conversations:user:";
    private static final String MSG_CACHE_KEY_PREFIX = "ai:messages:conversation:";
    private static final long CACHE_TTL_HOURS = 24;

    /**
     * 获取历史会话列表（优先查 Redis，未命中查 MySQL 并回写 Redis）
     */
    public List<AiConversation> getConversations(Long userId) {
        String key = CONV_CACHE_KEY_PREFIX + userId;
        try {
            Object cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                log.debug("命中 Redis 缓存会话列表: {}", key);
                return objectMapper.convertValue(cached, new TypeReference<List<AiConversation>>() {});
            }
        } catch (Exception e) {
            log.warn("读取 Redis 缓存异常: {}", e.getMessage());
        }

        log.debug("未命中 Redis 缓存，查询 MySQL 会话列表: {}", userId);
        List<AiConversation> list = conversationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        try {
            redisTemplate.opsForValue().set(key, list, CACHE_TTL_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("写入 Redis 缓存异常: {}", e.getMessage());
        }
        return list;
    }

    /**
     * 获取会话详情消息列表（优先查 Redis，未命中查 MySQL 并回写 Redis）
     */
    public List<AiMessage> getMessages(Long conversationId) {
        String key = MSG_CACHE_KEY_PREFIX + conversationId;
        try {
            Object cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                log.debug("命中 Redis 缓存消息列表: {}", key);
                return objectMapper.convertValue(cached, new TypeReference<List<AiMessage>>() {});
            }
        } catch (Exception e) {
            log.warn("读取 Redis 缓存异常: {}", e.getMessage());
        }

        log.debug("未命中 Redis 缓存，查询 MySQL 消息列表: {}", conversationId);
        List<AiMessage> list = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        try {
            redisTemplate.opsForValue().set(key, list, CACHE_TTL_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("写入 Redis 缓存异常: {}", e.getMessage());
        }
        return list;
    }

    /**
     * 创建新会话（写入 MySQL，并失效对应用户的会话列表 Redis 缓存）
     */
    @Transactional(rollbackFor = Exception.class)
    public AiConversation createConversation(Long userId, String title) {
        AiConversation conv = new AiConversation();
        conv.setUserId(userId);
        conv.setTitle(title);
        conv = conversationRepository.save(conv);

        try {
            redisTemplate.delete(CONV_CACHE_KEY_PREFIX + userId);
        } catch (Exception e) {
            log.warn("清理 Redis 缓存异常: {}", e.getMessage());
        }
        return conv;
    }

    /**
     * 保存单条消息（写入 MySQL，并失效对应会话的消息列表 Redis 缓存）
     */
    @Transactional(rollbackFor = Exception.class)
    public AiMessage saveMessage(Long conversationId, String role, String content) {
        AiMessage msg = new AiMessage();
        msg.setConversationId(conversationId);
        msg.setRole(role);
        msg.setContent(content);
        msg = messageRepository.save(msg);

        try {
            redisTemplate.delete(MSG_CACHE_KEY_PREFIX + conversationId);
        } catch (Exception e) {
            log.warn("清理 Redis 缓存异常: {}", e.getMessage());
        }
        return msg;
    }
}
