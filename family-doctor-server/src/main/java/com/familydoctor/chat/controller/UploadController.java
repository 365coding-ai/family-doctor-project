package com.familydoctor.chat.controller;

import com.familydoctor.common.result.Result;
import com.familydoctor.common.service.MinioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * 文件上传接口
 * POST /api/v1/upload/chat-image → 返回 { url, width?, height? }
 */
@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
public class UploadController {

    private final MinioService minioService;

    private static final long MAX_SIZE_BYTES = 10 * 1024 * 1024L; // 10MB

    /**
     * 上传聊天图片/文件
     * 前端拿到 url 后，通过 WebSocket 发送 IMAGE 消息
     */
    @PostMapping("/chat-image")
    public Result<Map<String, Object>> uploadChatImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Result.error(400, "文件不能为空");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            return Result.error(400, "文件大小不能超过 10MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            return Result.error(400, "只支持图片和 PDF 文件");
        }

        String url = minioService.upload(file, "chat");
        return Result.success(Map.of("url", url, "contentType", contentType, "size", file.getSize()));
    }
}
