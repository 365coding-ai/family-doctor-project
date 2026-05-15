package com.familydoctor.ai.repository;

import com.familydoctor.ai.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {

    List<AiConversation> findByUserIdOrderByCreatedAtDesc(Long userId);
}
