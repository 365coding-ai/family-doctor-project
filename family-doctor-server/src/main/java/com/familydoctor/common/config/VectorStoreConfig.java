package com.familydoctor.common.config;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

/**
 * PGVector 向量数据库独立配置类
 * <p>
 * 由于项目的主数据源属于 MySQL，Spring Boot 默认会将主数据源注入给自动配置的 PgVectorStore，
 * 导致执行 PostgreSQL 专有语法 (<=>) 时出现 bad SQL grammar 报错。
 * <p>
 * 本配置类内部手动读取 {@code pgvector.datasource} 配置构建专用的 PostgreSQL 数据源，
 * 且不暴露为 Spring Bean（避免干扰 Spring Boot 默认的 MySQL 数据源自动配置），
 * 并通过 Builder 手动初始化 {@link PgVectorStore}。
 */
@Configuration
public class VectorStoreConfig {

    @Bean
    public VectorStore vectorStore(
            EmbeddingModel embeddingModel,
            @Value("${pgvector.datasource.url}") String url,
            @Value("${pgvector.datasource.username}") String username,
            @Value("${pgvector.datasource.password}") String password) {

        // 内部手动构建 PostgreSQL 数据源，避免干扰全局的主数据源自动配置
        DataSource pgvectorDataSource = DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(url)
                .username(username)
                .password(password)
                .build();

        JdbcTemplate jdbcTemplate = new JdbcTemplate(pgvectorDataSource);

        return PgVectorStore.builder(jdbcTemplate, embeddingModel)
                .dimensions(1536)
                .distanceType(PgVectorStore.PgDistanceType.COSINE_DISTANCE)
                .indexType(PgVectorStore.PgIndexType.HNSW)
                .initializeSchema(true)
                .build();
    }
}
