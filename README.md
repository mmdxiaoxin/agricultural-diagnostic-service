# 农业病害智能诊断系统服务

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

## 项目简介

农业病害智能诊断系统是一个基于NestJS框架开发的微服务架构系统，旨在为农业生产提供智能化的病害诊断服务。系统采用现代化的技术栈，提供高可用性、可扩展性和可维护性的解决方案。

## 系统架构

系统采用微服务架构，包含以下核心服务：

- **API网关服务**：统一入口，负责请求路由和负载均衡
- **认证服务**：处理用户认证和授权
- **诊断服务**：核心业务服务，提供病害诊断功能
- **知识库服务**：管理农业知识库
- **文件服务**：处理文件上传和管理
- **用户服务**：管理用户信息和权限
- **下载服务**：处理文件下载
- **上传服务**：处理文件上传

## 技术栈

- **框架**：NestJS
- **数据库**：MySQL
- **缓存**：Redis
- **消息队列**：BullMQ
- **对象存储**：阿里云OSS
- **服务发现**：Consul
- **监控**：Prometheus
- **日志管理**：PM2
- **容器化**：Docker

## 快速开始

### 环境要求

- Node.js >= 22
- npm >= 10
- Docker >= 24
- MySQL >= 8
- Redis >= 7

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
# 开发模式
npm run start:dev

# 调试模式
npm run start:debug
```

### 生产环境运行

```bash
# 构建项目
npm run build

# 生产模式运行
npm run start:prod
```

## 项目结构

```
├── apps/                    # 微服务应用
│   ├── api-gateway/        # API网关服务
│   ├── auth-service/       # 认证服务
│   ├── diagnosis-service/  # 诊断服务
│   ├── download-service/   # 下载服务
│   ├── file-service/       # 文件服务
│   ├── knowledge-service/  # 知识库服务
│   ├── upload-service/     # 上传服务
│   └── user-service/       # 用户服务
├── libs/                   # 共享库
│   ├── ali-oss/           # 阿里云OSS集成
│   ├── consul/            # 服务发现
│   ├── database/          # 数据库配置
│   ├── file-operation/    # 文件操作
│   ├── mail/              # 邮件服务
│   ├── metrics/           # 监控指标
│   └── redis/             # Redis缓存
└── scripts/               # 工具脚本
```

## 部署

### Docker部署

```bash
# 构建镜像
docker build -t agricultural-diagnostic-service .

# 运行容器
docker run -d -p 3000-3007:3000-3007 agricultural-diagnostic-service
```

### 环境变量配置

系统支持多环境配置，通过以下文件进行管理：

- `.env`：默认配置
- `.env.development.local`：开发环境配置
- `.env.production.local`：生产环境配置

## 监控和日志

- 使用PM2进行进程管理和日志收集
- 通过Prometheus进行系统监控
- 日志文件位于`logs`目录下

## 开发指南

### 代码规范

```bash
# 代码格式化
npm run format

# 代码检查
npm run lint
```

### 测试

```bash
# 单元测试
npm run test

# E2E测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

### 文档生成

```bash
# 生成API文档
npm run doc
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

本项目采用 GNU Affero General Public License v3.0 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

GNU Affero General Public License 是一个自由软件许可证，专门设计用于确保在网络服务器软件的情况下与社区合作。该许可证要求：

1. 您可以自由地运行、修改和分发本软件
2. 如果您修改了软件并在网络服务器上运行，必须向用户提供源代码
3. 您必须保留所有版权声明和许可证信息
4. 您必须明确说明您对软件所做的任何修改

更多信息请访问 [GNU AGPL v3.0](https://www.gnu.org/licenses/agpl-3.0.html)。

## 联系方式

如有问题或建议，请通过以下方式联系我们：

- 项目维护者：[mmdxiaoxin]
- 邮箱：[782446723@qq.com]
