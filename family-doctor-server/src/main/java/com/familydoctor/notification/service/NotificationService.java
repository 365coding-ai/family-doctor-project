package com.familydoctor.notification.service;

import com.familydoctor.common.service.WsPushService;
import com.familydoctor.notification.entity.Notification;
import com.familydoctor.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final WsPushService wsPushService;

    /**
     * 发送系统通知
     */
    @Transactional
    public Notification sendNotification(Long userId, String title, String content) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setIsRead(false);
        Notification saved = notificationRepository.save(notification);

        // 实时推送通知数
        pushUnreadCount(userId);
        return saved;
    }

    /**
     * 标记已读并推送新计数
     */
    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
            pushUnreadCount(n.getUserId());
        });
    }

    private void pushUnreadCount(Long userId) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        wsPushService.pushToUser(userId, "NOTIFICATION_COUNT", count);
    }
}
