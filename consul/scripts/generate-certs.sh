#!/bin/bash

# 设置变量
CERT_DIR="/etc/consul/certs"
CONSUL_DC="production"
CONSUL_DOMAIN="consul"

# 创建证书目录
mkdir -p ${CERT_DIR}

# 生成 CA 配置文件
cat >${CERT_DIR}/ca-config.json <<EOF
{
  "signing": {
    "default": {
      "expiry": "87600h"
    },
    "profiles": {
      "consul": {
        "usages": ["signing", "key encipherment", "server auth", "client auth"],
        "expiry": "87600h"
      }
    }
  }
}
EOF

# 生成 CA 证书签名请求配置
cat >${CERT_DIR}/ca-csr.json <<EOF
{
  "CN": "Consul CA",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "L": "Shanghai",
      "O": "Consul",
      "OU": "System",
      "ST": "Shanghai"
    }
  ]
}
EOF

# 生成服务器证书签名请求配置
cat >${CERT_DIR}/server-csr.json <<EOF
{
  "CN": "server.${CONSUL_DC}.${CONSUL_DOMAIN}",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "L": "Shanghai",
      "O": "Consul",
      "OU": "System",
      "ST": "Shanghai"
    }
  ],
  "hosts": [
    "localhost",
    "127.0.0.1",
    "server.${CONSUL_DC}.${CONSUL_DOMAIN}",
    "consul-server-1",
    "consul-server-2",
    "consul-server-3"
  ]
}
EOF

# 生成客户端证书签名请求配置
cat >${CERT_DIR}/client-csr.json <<EOF
{
  "CN": "client.${CONSUL_DC}.${CONSUL_DOMAIN}",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "L": "Shanghai",
      "O": "Consul",
      "OU": "System",
      "ST": "Shanghai"
    }
  ]
}
EOF

# 检查 cfssl 是否安装
if ! command -v cfssl &>/dev/null; then
  echo "安装 cfssl..."
  curl -L https://pkg.cfssl.org/R1.2/cfssl_linux-amd64 -o /usr/local/bin/cfssl
  curl -L https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64 -o /usr/local/bin/cfssljson
  chmod +x /usr/local/bin/cfssl /usr/local/bin/cfssljson
fi

# 生成 CA 证书和密钥
echo "生成 CA 证书..."
cfssl gencert -initca ${CERT_DIR}/ca-csr.json | cfssljson -bare ${CERT_DIR}/ca

# 生成服务器证书和密钥
echo "生成服务器证书..."
cfssl gencert \
  -ca=${CERT_DIR}/ca.pem \
  -ca-key=${CERT_DIR}/ca-key.pem \
  -config=${CERT_DIR}/ca-config.json \
  -profile=consul \
  ${CERT_DIR}/server-csr.json | cfssljson -bare ${CERT_DIR}/server

# 生成客户端证书和密钥
echo "生成客户端证书..."
cfssl gencert \
  -ca=${CERT_DIR}/ca.pem \
  -ca-key=${CERT_DIR}/ca-key.pem \
  -config=${CERT_DIR}/ca-config.json \
  -profile=consul \
  ${CERT_DIR}/client-csr.json | cfssljson -bare ${CERT_DIR}/client

# 重命名证书文件
mv ${CERT_DIR}/ca.pem ${CERT_DIR}/ca.crt
mv ${CERT_DIR}/ca-key.pem ${CERT_DIR}/ca.key
mv ${CERT_DIR}/server.pem ${CERT_DIR}/server.crt
mv ${CERT_DIR}/server-key.pem ${CERT_DIR}/server.key
mv ${CERT_DIR}/client.pem ${CERT_DIR}/client.crt
mv ${CERT_DIR}/client-key.pem ${CERT_DIR}/client.key

# 设置权限
chown -R consul:consul ${CERT_DIR}
chmod 600 ${CERT_DIR}/*.key
chmod 644 ${CERT_DIR}/*.crt

# 验证证书
echo "验证证书..."
openssl verify -CAfile ${CERT_DIR}/ca.crt ${CERT_DIR}/server.crt
openssl verify -CAfile ${CERT_DIR}/ca.crt ${CERT_DIR}/client.crt

echo "证书生成完成！"
echo "证书位置: ${CERT_DIR}"
echo "请确保将 ca.crt 复制到所有 Consul 节点"
