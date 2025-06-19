# 农业病害智能诊断系统服务

<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-EA2845?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![GitHub stars](https://img.shields.io/github/stars/mmdxiaoxin/agricultural-diagnostic-service?style=social)](https://github.com/mmdxiaoxin/agricultural-diagnostic-service/stargazers)

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

</div>

## 📖 项目简介

农业病害智能诊断系统是一个基于NestJS框架开发的微服务架构系统，旨在为农业生产提供智能化的病害诊断服务。系统采用现代化的技术栈，提供高可用性、可扩展性和可维护性的解决方案。

### ✨ 主要特性

- 🔐 完整的用户认证和授权系统
- 🏥 智能病害诊断服务
- 📚 丰富的农业知识库
- 📁 高效的文件管理系统
- 📊 实时监控和性能分析
- 🔄 高可用性和可扩展性
- 🔍 详细的日志记录和追踪

## 🏗️ 系统架构

系统采用微服务架构，包含以下核心服务：

| 服务名称    | HTTP端口 | TCP端口 | gRPC端口 | 功能描述                         |
| ----------- | -------- | ------- | -------- | -------------------------------- |
| API网关服务 | 3000     | -       | -        | 统一入口，负责请求路由和负载均衡 |
| 认证服务    | 3001     | 30001   | 30011    | 处理用户认证和授权               |
| 诊断服务    | 3002     | 30002   | 30012    | 核心业务服务，提供病害诊断功能   |
| 知识库服务  | 3003     | 30003   | 30013    | 管理农业知识库                   |
| 文件服务    | 3004     | 30004   | 30014    | 处理文件上传和管理               |
| 用户服务    | 3005     | 30005   | 30015    | 管理用户信息和权限               |
| 下载服务    | 3006     | 30006   | 30016    | 处理文件下载                     |
| 上传服务    | 3007     | 30007   | 30017    | 处理文件上传                     |

> 注意：
>
> - HTTP端口(3001-3007)：用于健康检查和监控指标收集
> - TCP端口(30000-30007)：用于微服务间通信
> - gRPC端口(30010-30017)：用于高性能RPC调用

## 🛠️ 技术栈

### 核心框架

- **框架**：NestJS
- **语言**：TypeScript
- **数据库**：MySQL
- **缓存**：Redis
- **消息队列**：BullMQ

### 基础设施

- **对象存储**：阿里云OSS
- **服务发现**：Consul
- **监控**：Prometheus
- **日志管理**：PM2
- **容器化**：Docker

## 🚀 快速开始

### 环境要求

- Node.js >= 22
- npm >= 10
- Docker >= 24
- MySQL >= 8
- Redis >= 7

### 安装依赖

```bash
# 使用npm安装依赖
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

## 📁 项目结构

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

## 📦 部署指南

### 一、环境准备

#### 1. 系统要求

- 操作系统：Ubuntu 22.04 LTS / CentOS 8 或更高版本
- CPU：2核或以上
- 内存：4GB或以上
- 硬盘：50GB或以上可用空间
- 网络：稳定的互联网连接

#### 2. 基础软件安装

**更新系统包**：

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

**安装基础工具**：

```bash
# Ubuntu/Debian
sudo apt install -y curl wget git vim build-essential

# CentOS/RHEL
sudo yum install -y curl wget git vim gcc gcc-c++ make
```

#### 3. Node.js环境安装

**使用NVM安装Node.js**：

```bash
# 安装NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载配置
source ~/.bashrc

# 安装Node.js
nvm install 22
nvm use 22
nvm alias default 22

# 验证安装
node --version  # 应显示 v22.x.x
npm --version   # 应显示 10.x.x
```

#### 4. 全局工具安装

```bash
# 安装PM2
npm install -g pm2

# 安装pnpm
npm install -g pnpm

# 安装Nest CLI
npm install -g @nestjs/cli

# 验证安装
pm2 --version
pnpm --version
nest --version
```

#### 5. 数据库和缓存服务安装

**MySQL安装**：

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# CentOS/RHEL
sudo yum install mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld

# 初始化MySQL（首次安装后）
sudo mysql_secure_installation

# 创建数据库和用户
mysql -u root -p
```

```sql
CREATE DATABASE agricultural_diagnostic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'agri_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON agricultural_diagnostic.* TO 'agri_user'@'localhost';
FLUSH PRIVILEGES;
```

**系统初始化说明**：

系统在首次启动时会自动初始化以下基础数据：

1. **基础角色**：

   - 管理员（admin）：系统管理员，拥有所有权限
   - 专家（expert）：农业专家，拥有诊断和知识库管理权限
   - 农户（user）：普通用户，拥有基本的诊断和查询权限

2. **系统菜单**：
   - 系统会自动初始化预设的菜单结构
   - 菜单配置位于 `libs/database/src/data/menus.ts`
   - 您可以通过修改该文件来自定义菜单结构
   - 菜单初始化仅在数据库为空时执行，不会覆盖已存在的菜单

**自定义菜单配置**：

如需自定义菜单，请修改 `libs/database/src/data/menus.ts` 文件。菜单配置格式如下：

```typescript
export const menusData = [
  {
    icon: 'MenuOutlined', // 菜单图标
    title: '菜单管理', // 菜单标题
    path: '/user/menu/manage', // 菜单路径
    sort: 0, // 排序号
    parentId: 2, // 父菜单ID（可选）
    isLink: null, // 外部链接（可选）
    roles: ['admin'], // 可访问的角色
  },
  // ... 更多菜单配置
];
```

**Redis安装**：

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# CentOS/RHEL
sudo yum install redis
sudo systemctl start redis
sudo systemctl enable redis

# 配置Redis密码（可选但推荐）
sudo vim /etc/redis/redis.conf
```

在redis.conf中添加或修改：

```
requirepass your_redis_password
```

**验证服务安装**：

```bash
# 验证MySQL
mysql --version
mysql -u root -p

# 验证Redis
redis-cli ping  # 应返回 PONG
redis-cli -a your_redis_password ping  # 使用密码验证
```

### 二、项目部署

#### 1. 获取项目代码

```bash
# 克隆项目
git clone <项目地址>
cd agricultural-diagnostic-service

# 切换到稳定版本（可选）
git checkout <版本标签>
```

#### 2. 安装项目依赖

```bash
# 使用npm安装依赖
npm install

# 如果遇到权限问题
sudo chown -R $USER:$USER .
```

#### 3. 环境配置

```bash
# 复制环境配置文件
cp .env.example .env
cp .env.example .env.development.local
cp .env.example .env.production.local

# 编辑配置文件
vim .env
```

配置示例：

```bash
# 数据库配置
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=agricultural_diagnostic
DB_USERNAME=agri_user
DB_PASSWORD=your_password
DB_SYNC=true  # 开发环境建议开启，生产环境建议关闭

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password  # 如果Redis设置了密码，此项必须配置
REDIS_RECONNECT=true
REDIS_DB=0

# JWT配置
SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# 邮件服务配置
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your_email@example.com
MAIL_PASS=your_email_password
MAIL_FROM=your_email@example.com

# 阿里云OSS配置（可选，不配置则无法使用OSS服务）
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET_NAME=your_bucket_name
OSS_REGION=oss-cn-hangzhou  # 例如：oss-cn-hangzhou, oss-cn-beijing 等

# 日志配置
LOG_LEVEL=info
LOG_ON=true
TIMESTAMP=true
```

#### 4. 构建项目

```bash
# 构建所有服务
npm run build:all

# 验证构建结果
ls -l dist/
```

#### 5. 启动服务

**开发环境**：

```bash
# 使用PM2启动开发环境
pm2 start ecosystem.config.js --env development

# 查看服务状态
pm2 status

# 查看日志
pm2 logs
```

**生产环境**：

```bash
# 使用PM2启动生产环境
pm2 start ecosystem.config.js --env production

# 设置开机自启
pm2 startup
pm2 save
```

#### 6. 验证部署

```bash
# 检查服务状态
pm2 status

# 检查端口占用
netstat -tulpn | grep -E '3000|3001|3002|3003|3004|3005|3006|3007'

# 测试API网关
curl http://localhost:3000/health
```

### 三、维护指南

#### 1. 日常维护

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs

# 重启服务
pm2 restart all

# 更新代码
git pull
npm install
npm run build:all
pm2 restart all
```

#### 2. 数据持久化说明

系统使用 Docker 卷来持久化存储重要数据，主要包括：

1. **文件存储**

   - 用户上传文件存储在 `uploads_data` 卷中
   - 用户头像存储在 `avatar_data` 卷中
   - 日志文件存储在 `./logs` 目录中

2. **数据备份建议**

   ```bash
   # 备份上传文件
   docker run --rm -v uploads_data:/source -v $(pwd)/backup:/backup alpine tar czf /backup/uploads_backup_$(date +%Y%m%d).tar.gz -C /source .

   # 备份头像文件
   docker run --rm -v avatar_data:/source -v $(pwd)/backup:/backup alpine tar czf /backup/avatar_backup_$(date +%Y%m%d).tar.gz -C /source .
   ```

3. **数据恢复方法**

   ```bash
   # 恢复上传文件
   docker run --rm -v uploads_data:/target -v $(pwd)/backup:/backup alpine sh -c "rm -rf /target/* && tar xzf /backup/uploads_backup.tar.gz -C /target"

   # 恢复头像文件
   docker run --rm -v avatar_data:/target -v $(pwd)/backup:/backup alpine sh -c "rm -rf /target/* && tar xzf /backup/avatar_backup.tar.gz -C /target"
   ```

4. **注意事项**
   - 定期备份重要数据
   - 在更新系统前确保数据已备份
   - 监控存储空间使用情况
   - 建议配置自动备份任务

#### 3. 备份策略

```bash
# 备份数据库
mysqldump -u root -p agricultural_diagnostic > backup_$(date +%Y%m%d).sql

# 备份配置文件
cp .env .env.backup_$(date +%Y%m%d)
```

#### 4. 故障排查

```bash
# 检查服务状态
pm2 status
pm2 logs

# 检查系统资源
htop
df -h
free -m

# 检查网络连接
netstat -tulpn
```

#### 5. 安全建议

1. 定期更新系统和依赖包
2. 使用强密码并定期更换
3. 配置防火墙只开放必要端口
4. 启用SSL/TLS加密
5. 定期备份数据
6. 监控异常访问

### 四、可选：监控系统配置

> 注意：监控系统配置是可选的，仅在生产环境或需要详细监控时建议配置。

#### 1. 安装监控工具

```bash
# 安装Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*

# 安装Grafana
wget https://dl.grafana.com/enterprise/release/grafana-enterprise-10.0.0.linux-amd64.tar.gz
tar xvfz grafana-*.tar.gz
cd grafana-*
```

#### 2. 配置监控

```bash
# 配置Prometheus
vim prometheus.yml
```

添加以下配置：

```yaml
scrape_configs:
  - job_name: 'agricultural-diagnostic'
    static_configs:
      - targets: ['localhost:3000', 'localhost:3001', 'localhost:3002']
```

#### 3. 启动监控服务

```bash
# 启动Prometheus
./prometheus --config.file=prometheus.yml

# 启动Grafana
./bin/grafana-server
```

#### 4. 访问监控面板

- Grafana: http://localhost:4000
  - 默认用户名：admin
  - 默认密码：admin123
- Prometheus: http://localhost:4001

#### 5. 监控内容

系统提供了两个主要的监控面板：

- **微服务监控面板**：监控所有微服务的运行状态、性能指标
- **PM2监控面板**：监控Node.js进程的运行状态、资源使用情况

#### 6. 监控指标

监控系统收集以下指标：

- 服务响应时间
- 请求成功率
- CPU使用率
- 内存使用情况
- 进程状态
- 错误率统计

#### 7. 注意事项

- 确保端口4000和4001未被占用
- 首次登录Grafana后请及时修改默认密码
- 监控数据默认保存在本地，建议配置数据持久化
- 生产环境建议配置监控系统的备份策略

## 📝 开发指南

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

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 许可证

本项目采用 GNU Affero General Public License v3.0 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

GNU Affero General Public License 是一个自由软件许可证，专门设计用于确保在网络服务器软件的情况下与社区合作。该许可证要求：

1. 您可以自由地运行、修改和分发本软件
2. 如果您修改了软件并在网络服务器上运行，必须向用户提供源代码
3. 您必须保留所有版权声明和许可证信息
4. 您必须明确说明您对软件所做的任何修改

更多信息请访问 [GNU AGPL v3.0](https://www.gnu.org/licenses/agpl-3.0.html)。

## 📞 联系方式

如有问题或建议，请通过以下方式联系我们：

- 项目维护者：[mmdxiaoxin]
- 邮箱：[782446723@qq.com]

---

<div align="center">
  <sub>Built with ❤️ by mmdxiaoxin.</sub>
</div>
