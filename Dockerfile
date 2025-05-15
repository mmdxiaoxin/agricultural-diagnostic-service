# 构建阶段
FROM node:22-alpine AS builder

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装 bcrypt 所需的系统依赖
RUN apk add --no-cache python3 make g++

# 设置工作目录
WORKDIR /app

# 首先只复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 安装 Nest CLI
RUN npm install -g @nestjs/cli

# 复制源代码文件，排除 node_modules 和 dist
COPY apps/ ./apps/
COPY libs/ ./libs/
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY .env* ./
COPY config/ ./config/

# 分别构建各个服务
RUN nest build api-gateway && \
  nest build auth-service && \
  nest build download-service && \
  nest build file-service && \
  nest build upload-service && \
  nest build user-service && \
  nest build knowledge-service && \
  nest build diagnosis-service

# 生产阶段
FROM node:22-alpine

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装 PM2
RUN npm install -g pm2

# 设置工作目录
WORKDIR /app

# 从构建阶段复制构建产物和环境变量文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/ecosystem.config.cjs ./
COPY --from=builder /app/.env* ./

# 创建数据存储目录
RUN mkdir -p /app/dist/chunks \
  && mkdir -p /app/dist/uploads \
  && mkdir -p /app/dist/avatar \
  && mkdir -p logs

# 设置环境变量
ENV NODE_ENV=production
ENV DOCKER_HOST=host.docker.internal

# 暴露端口（根据实际服务端口调整）
EXPOSE 3000-3007

# 启动命令
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"] 