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

### 非Docker环境部署

#### 系统要求

- Node.js >= 22 (推荐使用nvm管理Node.js版本)
- npm >= 10
- MySQL >= 8
- Redis >= 7
- PM2 >= 5

#### 前置依赖安装

由于项目使用了bcrypt包，需要安装以下前置依赖：

**Linux环境**：
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y build-essential python3

# CentOS/RHEL
sudo yum groupinstall -y "Development Tools"
sudo yum install -y python3
```

**Windows环境**：
1. 安装 [Windows Build Tools](https://github.com/felixrieseberg/windows-build-tools)：
```bash
# 以管理员身份运行 PowerShell
npm install --global --production windows-build-tools
```

2. 安装 [Python](https://www.python.org/downloads/)（确保安装时勾选"Add Python to PATH"）

**macOS环境**：
```bash
# 使用 Homebrew
brew install python3
```

#### 安装步骤

1. **安装Node.js**

```bash
# 使用nvm安装Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

2. **克隆项目并安装依赖**

```bash
git clone <项目地址>
cd agricultural-diagnostic-service
npm install
```

3. **配置环境变量**

```bash
# 复制环境变量模板文件
cp .env.example .env
cp .env.example .env.development.local
cp .env.example .env.production.local

# 根据实际环境修改配置文件
vim .env
vim .env.development.local
vim .env.production.local
```

必需的环境变量配置说明：

```bash
# 数据库配置
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=agricultural_diagnostic
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_SYNC=true  # 开发环境建议开启，生产环境建议关闭

# JWT密钥
SECRET=your_jwt_secret_key

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_RECONNECT=true
REDIS_DB=0

# 邮件服务配置
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your_email@example.com
MAIL_PASS=your_email_password
MAIL_FROM=your_email@example.com

# 日志配置
LOG_LEVEL=info  # debug, info, warn, error
LOG_ON=true
TIMESTAMP=true
```

4. **构建项目**

```bash
# 构建所有服务
npm run build:all
```

5. **启动服务**

```bash
# 开发环境
npm run start:dev

# 生产环境
npm run start:prod
```

#### 服务管理

使用PM2管理服务：

```bash
# 查看服务状态
pm2 status

# 查看服务日志
pm2 logs

# 重启服务
pm2 restart all

# 停止服务
pm2 stop all

# 删除服务
pm2 delete all
```

#### 服务端口说明

- API网关服务：3000
- 认证服务：3001
- 诊断服务：3002
- 知识库服务：3003
- 文件服务：3004
- 用户服务：3005
- 下载服务：3006
- 上传服务：3007

#### 注意事项

1. 确保所有必需的端口（3000-3007）未被其他服务占用
2. 生产环境部署前请确保已正确配置所有环境变量
3. 建议使用PM2的集群模式运行服务，以充分利用多核CPU
4. 定期检查日志文件，确保服务正常运行
5. 建议配置防火墙规则，只开放必要的端口

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

### API文档访问

系统集成了Swagger UI，可以通过以下方式访问API文档：

1. **Swagger UI界面**
   - 开发环境：`http://localhost:3000/api`
   - 生产环境：`https://your-domain/api`

2. **Swagger JSON**
   - 开发环境：`http://localhost:3000/api-json`
   - 生产环境：`https://your-domain/api-json`

通过Swagger UI界面，您可以：
- 查看所有可用的API接口
- 测试API接口
- 查看请求/响应模型
- 下载API文档

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
