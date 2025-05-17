#!/bin/bash

# 确保在 docker 目录下运行
cd "$(dirname "$0")"

# 检查 prometheus 配置目录是否存在
if [ ! -d "prometheus" ]; then
  mkdir -p prometheus
fi

# 启动监控服务
docker-compose -f docker-compose.monitor.yml up -d

echo "监控服务已启动："
echo "Grafana: http://localhost:4000 (用户名: admin, 密码: admin123)"
echo "Prometheus: http://localhost:4001"
