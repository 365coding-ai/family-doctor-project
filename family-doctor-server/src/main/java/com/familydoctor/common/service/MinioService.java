package com.familydoctor.common.service;

import com.familydoctor.common.config.MinioConfig;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.SetBucketPolicyArgs;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * MinIO 文件上传服务
 * 支持图片、PDF 等文件上传，返回公网可访问的 URL
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MinioService {

    private final MinioClient minioClient;
    private final MinioConfig minioConfig;

    @PostConstruct
    public void init() {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(minioConfig.getBucket()).build());
            if (!exists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder().bucket(minioConfig.getBucket()).build());
                log.info("创建 MinIO Bucket: {}", minioConfig.getBucket());
            }
            // 确保设置公共读的 Bucket Policy，使用标准 AWS/MinIO Policy JSON
            String policy = "{\n" +
                    "  \"Version\": \"2012-10-17\",\n" +
                    "  \"Statement\": [\n" +
                    "    {\n" +
                    "      \"Effect\": \"Allow\",\n" +
                    "      \"Principal\": {\n" +
                    "        \"AWS\": [\"*\"]\n" +
                    "      },\n" +
                    "      \"Action\": [\"s3:GetObject\"],\n" +
                    "      \"Resource\": [\"arn:aws:s3:::" + minioConfig.getBucket() + "/*\"]\n" +
                    "    }\n" +
                    "  ]\n" +
                    "}";
            minioClient.setBucketPolicy(
                    SetBucketPolicyArgs.builder()
                            .bucket(minioConfig.getBucket())
                            .config(policy)
                            .build());
            log.info("成功设置 MinIO Bucket 公共读权限策略: {}", minioConfig.getBucket());
        } catch (Exception e) {
            log.error("初始化 MinIO 桶及公共读策略失败", e);
        }
    }

    /**
     * 上传文件并返回公网 URL
     *
     * @param file   MultipartFile
     * @param folder 子目录 (如 "chat", "avatar", "report")
     * @return 公网访问 URL
     */
    public String upload(MultipartFile file, String folder) {
        try {
            // 确保 bucket 存在
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(minioConfig.getBucket()).build());
            if (!exists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder().bucket(minioConfig.getBucket()).build());
            }

            // 生成唯一文件名: folder/uuid.ext
            String ext = getExtension(file.getOriginalFilename());
            String objectName = folder + "/" + UUID.randomUUID() + ext;

            // 上传
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(minioConfig.getBucket())
                    .object(objectName)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());

            String url = minioConfig.getPublicUrl() + "/" + minioConfig.getBucket() + "/" + objectName;
            log.info("文件上传成功: {}", url);
            return url;

        } catch (Exception e) {
            log.error("文件上传 MinIO 失败", e);
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return "." + filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
