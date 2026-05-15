# 医护到家 (Family Doctor) - 全栈医疗家政服务平台

本项目是一个基于 **Spring Boot 3** 和 **React** 的全栈医疗家政服务系统，旨在打通患者预约、医生在线咨询及上门服务的全流程闭环。

## 📁 仓库结构

*   `family-doctor-server/`: 后端核心，提供 RESTful API 与 WebSocket 服务。
*   `family-doctor-web/`: 前端应用，基于 Vite + Tailwind 打造的极简专业 UI。

## ✨ 核心功能
- **智能搜索**: 支持按科室、关键词搜索附近的热门医生。
- **在线咨询**: 医患双端实时 IM 沟通，支持专业提示语与身份标识。
- **预约系统**: 完整的排班预约流程，支持上门看诊/视频问诊。
- **医生工作台**: 医生专属面板，管理分配的订单与消息。
- **订单追踪**: 患者可实时查看服务单状态。

## 🛠️ 技术选型

| 领域 | 技术 |
| :--- | :--- |
| **后端** | Java 17, Spring Boot 3, JPA, JWT, WebSocket (STOMP) |
| **数据库** | MySQL 8.0, Flyway (版本控制) |
| **前端** | React 18, React Router, Lucide Icons, Context API |
| **设计** | Modern Material Design, Responsive UI |

## 🚀 快速启动

### 第一步：数据库初始化
1. 创建数据库 `family_doctor`。
2. 后端启动时 Flyway 会自动执行 `/resources/db/migration` 下的脚本，无需手动导入 SQL。

### 第二步：启动后端
```bash
cd family-doctor-server
mvn spring-boot:run
```

### 第三步：启动前端
```bash
cd family-doctor-web
npm install
npm run dev
```

## 👤 测试账号
- **医生**: `18800188000` (验证码 `123456`)
- **患者**: `13800138000` (验证码 `123456`)

---
© 2026 sangyy2/Family-Doctor. Powered by Antigravity AI.
