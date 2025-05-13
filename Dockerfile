# 构建阶段
FROM node:22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码和环境变量文件
COPY . .
COPY .env* ./

# 构建项目
RUN npm run build:all

# 生产阶段
FROM node:22-alpine

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

# 创建日志目录
RUN mkdir -p logs

# 设置环境变量
ENV NODE_ENV=production

# 暴露端口（根据实际服务端口调整）
EXPOSE 3000-3007

# 启动命令
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"] 