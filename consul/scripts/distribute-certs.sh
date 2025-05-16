#!/bin/bash

# 设置变量
CERT_DIR="/etc/consul/certs"
CONSUL_SERVERS=(
  "consul-server-1"
  "consul-server-2"
  "consul-server-3"
)

# 检查参数
if [ "$#" -ne 1 ]; then
  echo "用法: $0 <目标服务器用户名>"
  exit 1
fi

USER=$1

# 检查证书是否存在
if [ ! -f "${CERT_DIR}/ca.crt" ] || [ ! -f "${CERT_DIR}/server.crt" ] || [ ! -f "${CERT_DIR}/server.key" ]; then
  echo "错误：证书文件不存在，请先运行 generate-certs.sh"
  exit 1
fi

# 为每个服务器分发证书
for server in "${CONSUL_SERVERS[@]}"; do
  echo "正在分发证书到 ${server}..."

  # 创建远程目录
  ssh ${USER}@${server} "sudo mkdir -p ${CERT_DIR}"

  # 复制 CA 证书
  scp ${CERT_DIR}/ca.crt ${USER}@${server}:~/
  ssh ${USER}@${server} "sudo mv ~/ca.crt ${CERT_DIR}/"

  # 复制服务器证书和密钥
  scp ${CERT_DIR}/server.crt ${USER}@${server}:~/
  scp ${CERT_DIR}/server.key ${USER}@${server}:~/
  ssh ${USER}@${server} "sudo mv ~/server.crt ${CERT_DIR}/"
  ssh ${USER}@${server} "sudo mv ~/server.key ${CERT_DIR}/"

  # 设置权限
  ssh ${USER}@${server} "sudo chown -R consul:consul ${CERT_DIR}"
  ssh ${USER}@${server} "sudo chmod 600 ${CERT_DIR}/*.key"
  ssh ${USER}@${server} "sudo chmod 644 ${CERT_DIR}/*.crt"

  echo "证书已分发到 ${server}"
done

echo "所有证书分发完成！"
