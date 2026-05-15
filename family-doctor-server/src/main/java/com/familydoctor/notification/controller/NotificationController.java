package com.familydoctor.notification.controller;

import com.familydoctor.common.result.Result;
import com.familydoctor.notification.entity.Notification;
import com.familydoctor.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 通知接口
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final com.familydoctor.notification.service.NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    /**
     * 获取通知列表
     */
    @GetMapping
    public Result<Page<Notification>> getNotifications(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(
                notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
        );
    }

    /**
     * 未读数量
     */
    @GetMapping("/unread-count")
    public Result<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal Long userId) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        return Result.success(Map.of("count", count));
    }

    /**
     * 标记已读
     */
    @PutMapping("/{id}/read")
    public Result<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return Result.success();
    }
}
