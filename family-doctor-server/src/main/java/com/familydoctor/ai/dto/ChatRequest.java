package com.familydoctor.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.util.List;

/**
 * AI 对话请求体
 *
 * @author familydoctor
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatRequest {

    /** 会话 ID，用于保持上下文（首次对话可为空，后端自动创建） */
    private String sessionId;

    /** 消息体 */
    private MessageBody message;

    @Data
    public static class MessageBody {
        /** 文本消息 */
        private String text;
        /** 预留多模态附件（如图片 URL） */
        private List<String> attachments;
    }

    // ==================== 向后兼容旧版字段 ====================
    // 在旧版客户端升级之前，兼容直接传 message 字符串的情况

    /** @deprecated 使用 message.text 代替 */
    @Deprecated
    private transient String legacyMessage;

    /**
     * 获取用户实际文本（兼容新旧格式）
     */
    public String resolveText() {
        if (message != null && message.getText() != null) {
            return message.getText();
        }
        return legacyMessage;
    }
}
