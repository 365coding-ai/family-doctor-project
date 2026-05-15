package com.familydoctor.ai.service;

import com.familydoctor.ai.dto.StreamChunk;
import com.familydoctor.ai.entity.AiConversation;
import com.familydoctor.ai.entity.AiMessage;
import com.familydoctor.ai.service.AiHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * AI 健康问诊服务 — 基于统一信封(Envelope Pattern)的 SSE 事件流
 * <p>
 * 输出 5 种 Chunk 类型: STATUS / TEXT_CHUNK / COMPONENT / ERROR / FINISH
 * 前端用一个 switch(chunk.type) 即可覆盖全场景，无需 if-else 正则匹配。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HealthAiService {

    private final ChatClient.Builder chatClientBuilder;
    private final VectorStore vectorStore;
    private final AiHistoryService historyService;

    private static final String SYSTEM_PROMPT = """
            你是「医护到家」的智能健康助手。请基于以下医疗参考资料，提供专业、严谨的健康咨询服务。

            ## 核心规则
            1. 边界限制：仅回答医疗、健康、养生相关问题，非医疗问题请委婉拒绝。
            2. 安全底线：绝对不得提供具体的处方药物名称或用药剂量。
            3. 免责声明：必须在回答中包含类似"AI 建议仅供参考，如症状持续或加重请及时线下就医"的提醒。
            4. 语言风格：回答需专业、温暖、条理清晰，分段输出以提升阅读体验。

            ## 输出格式与标签规范（最高优先级，必须严格遵守）
            1. 结构要求：必须【先输出面向用户的正文内容】。
            2. 标签位置：如果你判断用户需要线下就医或采取特定行动，必须在【整个回答的绝对末尾】追加对应的特殊标签。
            3. 格式禁忌：严禁在正文中间插入标签！严禁使用 Markdown 代码块（如 ```xml）包裹标签！隐蔽输出即可。
            4. 分隔符：标签内部如有多个值，必须使用【英文半角逗号 (,)】分隔。

            可用标签如下（均为可选，请根据用户病情严重程度动态组合）：

            👉 标签 1：推荐就诊科室（开放数据）
            格式：<suggest_department>科室1,科室2</suggest_department>
            说明：根据症状推荐最相关的 1-3 个医院科室。
            示例：<suggest_department>呼吸内科,发热门诊</suggest_department>

            👉 标签 2：推荐快捷操作（封闭枚举，严禁捏造）
            格式：<suggest_action>action_id:展示文案,action_id:展示文案</suggest_action>
            说明：action_id 必须【严格单选或多选】以下列表中的标识符，绝不允许自行创造：
            - book_doctor (使用场景：建议用户预约挂号、找专家确诊时)
            - nearby_doctor (使用场景：建议用户去附近诊所、药房或急诊看看时)
            - call_emergency (使用场景：症状极度危险，如剧烈胸痛、昏迷、大量出血等，需紧急呼救时)
            示例：<suggest_action>book_doctor:预约专科医生,call_emergency:立即呼叫120</suggest_action>

            ## 参考资料
            {context}
            """;

    /**
     * 统一信封流式对话 — 返回 StreamChunk 事件流
     */
    public Flux<StreamChunk> streamChat(String message, Long userId, String sessionId) {
        Sinks.Many<StreamChunk> sink = Sinks.many().unicast().onBackpressureBuffer();

        // 异步执行完整的对话流程
        Flux.defer(() -> {
            try {
                return doStreamChat(message, userId, sessionId, sink);
            } catch (Exception e) {
                log.error("对话流程异常: {}", e.getMessage(), e);
                sink.tryEmitNext(StreamChunk.error(5000, "服务内部异常: " + e.getMessage(), "FATAL"));
                sink.tryEmitComplete();
                return Flux.empty();
            }
        }).subscribe();

        return sink.asFlux();
    }

    private Flux<Void> doStreamChat(String message, Long userId, String sessionId,
                                     Sinks.Many<StreamChunk> sink) {
        // ==================== 阶段 1: 会话管理 ====================
        Long convId;
        String resolvedSessionId = sessionId;

        if (sessionId == null || sessionId.isBlank()) {
            AiConversation conv = historyService.createConversation(
                    userId,
                    message.length() > 20 ? message.substring(0, 20) + "..." : message
            );
            convId = conv.getId();
            resolvedSessionId = "ses_" + convId;
        } else {
            // 从 sessionId 提取数字 ID
            convId = Long.parseLong(sessionId.replaceAll("\\D", ""));
        }

        // STATUS: 会话就绪
        sink.tryEmitNext(StreamChunk.status("session_ready", "会话已建立 #" + resolvedSessionId));

        // ==================== 阶段 2: RAG 检索 (STATUS 驱动) ====================
        sink.tryEmitNext(StreamChunk.status("loading", "正在分析您的症状描述..."));

        String context = "暂无参考资料";
        List<Map<String, String>> ragSources = new ArrayList<>();

        try {
            sink.tryEmitNext(StreamChunk.status("loading", "正在检索医疗知识库..."));

            var searchRequest = SearchRequest.builder()
                    .query(message)
                    .topK(5)
                    .similarityThreshold(0.7d)
                    .build();
            var docs = vectorStore.similaritySearch(searchRequest);
            if (docs != null && !docs.isEmpty()) {
                context = docs.stream()
                        .map(doc -> doc.getFormattedContent())
                        .collect(Collectors.joining("\n---\n"));

                for (var doc : docs) {
                    String title = doc.getMetadata() != null
                            ? String.valueOf(doc.getMetadata().getOrDefault("source", "医疗参考"))
                            : "医疗参考";
                    String snippet = doc.getText();
                    if (snippet != null && snippet.length() > 100) {
                        snippet = snippet.substring(0, 100) + "...";
                    }
                    ragSources.add(Map.of("title", title, "snippet", snippet != null ? snippet : ""));
                }
                sink.tryEmitNext(StreamChunk.status("rag_complete", "已找到 " + docs.size() + " 条相关参考资料"));
            } else {
                sink.tryEmitNext(StreamChunk.status("rag_empty", "知识库暂无匹配，将基于通用医学知识回答"));
            }
        } catch (Exception e) {
            log.warn("RAG 检索失败，降级使用无上下文模式: {}", e.getMessage());
            sink.tryEmitNext(StreamChunk.status("rag_fallback", "知识库连接异常，使用通用模式回答"));
        }

        sink.tryEmitNext(StreamChunk.status("generating", "AI 正在生成回复..."));

        // ==================== 阶段 3: 保存用户消息 ====================
        saveMessage(convId, "user", message);

        // ==================== 阶段 4: 流式大模型调用 (TEXT_CHUNK) ====================
        ChatClient chatClient = chatClientBuilder.build();
        StringBuilder fullResponse = new StringBuilder();
        final Long finalConvId = convId;
        final String finalSessionId = resolvedSessionId;
        AtomicInteger tokenCount = new AtomicInteger(0);

        String finalContext = context;
        final List<Map<String, String>> finalRagSources = ragSources;

        chatClient.prompt()
                .system(s -> s.text(SYSTEM_PROMPT).param("context", finalContext))
                .user(message)
                .stream()
                .content()
                .doOnNext(chunk -> {
                    fullResponse.append(chunk);
                    tokenCount.addAndGet(chunk.length());
                    // 逐块发送 TEXT_CHUNK
                    sink.tryEmitNext(StreamChunk.textChunk(chunk));
                })
                .doOnComplete(() -> {
                    String rawContent = fullResponse.toString();

                    log.info("AI 应答：{}", rawContent);
                    // ==================== 阶段 5: 解析并发送 COMPONENT ====================
                    parseAndEmitComponents(rawContent, finalRagSources, sink);

                    // ==================== 阶段 6: FINISH ====================
                    String cleanText = stripTags(rawContent);
                    sink.tryEmitNext(StreamChunk.finish(
                            finalSessionId,
                            cleanText,
                            "stop",
                            0,
                            tokenCount.get()
                    ));
                    sink.tryEmitComplete();

                    // 保存 AI 回复 (保存原始内容以便历史记录能解析出组件)
                    saveMessage(finalConvId, "assistant", rawContent);
                })
                .doOnError(err -> {
                    log.error("AI 流式调用失败: {}", err.getMessage());
                    sink.tryEmitNext(StreamChunk.error(5001, "AI 服务暂时不可用", "ERROR"));
                    sink.tryEmitComplete();

                    if (fullResponse.length() > 0) {
                        saveMessage(finalConvId, "assistant", fullResponse.toString());
                    }
                })
                .subscribe();

        return Flux.empty();
    }

    /**
     * 解析 AI 回复中的结构化标签 → 转为 COMPONENT 类型的 StreamChunk
     */
    private void parseAndEmitComponents(String rawContent, List<Map<String, String>> ragSources,
                                         Sinks.Many<StreamChunk> sink) {
        // COMPONENT: DepartmentCard
        Pattern deptPattern = Pattern.compile("<suggest_department>(.*?)</suggest_department>", Pattern.DOTALL);
        Matcher deptMatcher = deptPattern.matcher(rawContent);
        if (deptMatcher.find()) {
            String[] departments = deptMatcher.group(1).split("[,，]");
            List<Map<String, String>> deptList = new ArrayList<>();
            for (String dept : departments) {
                deptList.add(Map.of("name", dept.trim(), "reason", "推荐就诊科室"));
            }
            if (!deptList.isEmpty()) {
                sink.tryEmitNext(StreamChunk.component(
                        "DepartmentCard",
                        Map.of("departments", deptList),
                        Map.of("onSelect", Map.of(
                                "type", "NAVIGATE",
                                "target", "/search",
                                "params", Map.of("department", deptList.get(0).get("name"))
                        ))
                ));
            }
        }

        // COMPONENT: ActionButtons
        Pattern actionPattern = Pattern.compile("<suggest_action>(.*?)</suggest_action>", Pattern.DOTALL);
        Matcher actionMatcher = actionPattern.matcher(rawContent);
        if (actionMatcher.find()) {
            String[] actions = actionMatcher.group(1).split("[,，]");
            List<Map<String, String>> actionList = new ArrayList<>();
            for (String act : actions) {
                String[] parts = act.trim().split("[:：]");
                if (parts.length >= 2) {
                    String actionName = parts[0].trim();
                    String label = parts[1].trim();
                    String icon = switch (actionName) {
                        case "book_doctor" -> "calendar";
                        case "nearby_doctor" -> "map-pin";
                        case "call_emergency" -> "phone";
                        default -> "arrow-right";
                    };
                    actionList.add(Map.of("action", actionName, "label", label, "icon", icon));
                }
            }
            if (!actionList.isEmpty()) {
                sink.tryEmitNext(StreamChunk.component(
                        "ActionButtons",
                        Map.of("buttons", actionList),
                        null
                ));
            }
        }

        // COMPONENT: SourcesPanel (RAG 引用)
        if (!ragSources.isEmpty()) {
            sink.tryEmitNext(StreamChunk.component(
                    "SourcesPanel",
                    Map.of("sources", ragSources),
                    null
            ));
        }
    }

    /** 去除标签，保留纯文本 */
    private String stripTags(String rawContent) {
        return rawContent
                .replaceAll("<suggest_department>.*?</suggest_department>", "")
                .replaceAll("<suggest_action>.*?</suggest_action>", "")
                .trim();
    }

    private void saveMessage(Long conversationId, String role, String content) {
        historyService.saveMessage(conversationId, role, content);
    }
}
