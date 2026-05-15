package com.familydoctor.chat.repository;

import com.familydoctor.chat.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * 获取两人之间的聊天记录
     */
    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.senderId = :u1 AND m.receiverId = :u2) OR " +
           "(m.senderId = :u2 AND m.receiverId = :u1) " +
           "ORDER BY m.createdAt DESC")
    List<ChatMessage> findChatHistory(Long u1, Long u2, Pageable pageable);

    /**
     * 获取未读消息数
     */
    long countByReceiverIdAndIsReadFalse(Long receiverId);
}
