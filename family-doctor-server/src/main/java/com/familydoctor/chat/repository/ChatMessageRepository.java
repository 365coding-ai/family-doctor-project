package com.familydoctor.chat.repository;

import com.familydoctor.chat.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * 获取两人之间的聊天记录 (时间倒序)
     */
    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.senderId = :u1 AND m.receiverId = :u2) OR " +
           "(m.senderId = :u2 AND m.receiverId = :u1) " +
           "ORDER BY m.createdAt DESC")
    List<ChatMessage> findChatHistory(Long u1, Long u2, Pageable pageable);

    /**
     * 根据房间号获取聊天历史记录 (时间倒序)
     */
    @Query("SELECT m FROM ChatMessage m WHERE m.roomId = :roomId ORDER BY m.createdAt DESC")
    List<ChatMessage> findChatHistoryByRoom(String roomId, Pageable pageable);

    /**
     * 查找发送者发给接收者的所有未读消息 (用于批量已读标记)
     */
    @Query("SELECT m FROM ChatMessage m WHERE m.senderId = :senderId AND m.receiverId = :receiverId AND m.isRead = false")
    List<ChatMessage> findUnreadMessages(Long senderId, Long receiverId);

    /**
     * 查找发送者在指定房间内发给接收者的所有未读消息
     */
    @Query("SELECT m FROM ChatMessage m WHERE m.senderId = :senderId AND m.receiverId = :receiverId AND m.roomId = :roomId AND m.isRead = false")
    List<ChatMessage> findUnreadMessagesByRoom(Long senderId, Long receiverId, String roomId);

    /**
     * 幂等检查: 指定 msgId 是否已存在
     */
    boolean existsByMsgId(String msgId);

    /**
     * 获取未读消息总数
     */
    long countByReceiverIdAndIsReadFalse(Long receiverId);
}
