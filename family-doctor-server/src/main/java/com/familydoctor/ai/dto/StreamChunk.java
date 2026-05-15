package com.familydoctor.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * SSE 统一信封 DTO (Envelope Pattern)
 * <p>
 * 所有 SSE 输出统一走 data: 域，不使用 event: 类型头（跨端兼容：小程序、老浏览器）。
 * 路由分发由 {@code type} 字段驱动，前端只需一个 switch(chunk.type) 即可覆盖全场景。
 * <p>
 * 5 种核心 Type:
 * <ul>
 *   <li>{@code STATUS} — 状态汇报 / 思考过程 / 工具调用进度</li>
 *   <li>{@code TEXT_CHUNK} — 纯文本流式增量（打字机效果）</li>
 *   <li>{@code COMPONENT} — 生成式 UI 卡片（多态扩展，前端动态渲染组件）</li>
 *   <li>{@code ERROR} — 异常中断</li>
 *   <li>{@code FINISH} — 流结束标识与汇总</li>
 * </ul>
 *
 * @author familydoctor
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StreamChunk {

    /** 块的唯一 ID，用于防重和日志追踪 */
    private String chunkId;

    /** 【核心路由键】枚举: STATUS / TEXT_CHUNK / COMPONENT / ERROR / FINISH */
    private String type;

    /** 具体载荷，根据 type 多态变化 */
    private Object data;

    /** 附加元数据（可选） */
    private Map<String, Object> metadata;

    // ==================== 工厂方法 ====================

    private static String genId() {
        return "chk_" + UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * STATUS — 状态汇报（思考过程、工具调用、RAG 检索进度）
     */
    public static StreamChunk status(String statusCode, String message) {
        return StreamChunk.builder()
                .chunkId(genId())
                .type("STATUS")
                .data(Map.of("status", statusCode, "message", message))
                .build();
    }

    /**
     * TEXT_CHUNK — 纯文本流式增量
     */
    public static StreamChunk textChunk(String text) {
        return StreamChunk.builder()
                .chunkId(genId())
                .type("TEXT_CHUNK")
                .data(Map.of("text", text))
                .build();
    }

    /**
     * COMPONENT — 生成式 UI 卡片
     *
     * @param componentType 前端组件标识（如 DoctorRecommendCard, DepartmentCard, ActionButtons）
     * @param props         传入组件的属性
     * @param actions       预定义的可执行操作（可选）
     */
    public static StreamChunk component(String componentType, Object props, Map<String, Object> actions) {
        var dataMap = new java.util.LinkedHashMap<String, Object>();
        dataMap.put("componentType", componentType);
        dataMap.put("props", props);
        if (actions != null && !actions.isEmpty()) {
            dataMap.put("actions", actions);
        }
        return StreamChunk.builder()
                .chunkId(genId())
                .type("COMPONENT")
                .data(dataMap)
                .build();
    }

    /**
     * ERROR — 异常中断
     */
    public static StreamChunk error(int code, String message, String level) {
        return StreamChunk.builder()
                .chunkId(genId())
                .type("ERROR")
                .data(Map.of("code", code, "message", message, "level", level))
                .build();
    }

    /**
     * FINISH — 流结束标识与汇总
     */
    public static StreamChunk finish(String sessionId, String fullText, String stopReason,
                                      int promptTokens, int completionTokens) {
        return StreamChunk.builder()
                .chunkId(genId())
                .type("FINISH")
                .data(Map.of(
                        "sessionId", sessionId,
                        "fullText", fullText,
                        "stopReason", stopReason
                ))
                .metadata(Map.of(
                        "promptTokens", promptTokens,
                        "completionTokens", completionTokens,
                        "timestamp", System.currentTimeMillis()
                ))
                .build();
    }
}
