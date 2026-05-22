package com.familydoctor.chat.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "chat_message")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 客户端生成的唯一消息ID，用于幂等去重 */
    @Column(length = 64, unique = true)
    private String msgId;

    @Column(nullable = false)
    private Long senderId;

    @Column(nullable = false)
    private Long receiverId;

    /**
     * 消息内容
     * TEXT: 文本内容
     * IMAGE: 为空或为描述文字
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * 图片/文件 URL (MinIO)
     */
    @Column(length = 512)
    private String mediaUrl;

    /** 图片宽度 (px) */
    private Integer mediaWidth;

    /** 图片高度 (px) */
    private Integer mediaHeight;

    /**
     * 消息类型:
     * TEXT       = 文字消息
     * IMAGE      = 图片/检查报告
     * ORDER_CARD = 订单卡片 (系统消息)
     */
    @Column(nullable = false, length = 20)
    private String type = "TEXT";

    @Column(nullable = false)
    private Boolean isRead = false;

    /** 已读时间 */
    private LocalDateTime readAt;

    /** 房间号 (即订单的 roomId)，用于隔离不同订单的聊天记录 */
    @Column(length = 64)
    private String roomId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
