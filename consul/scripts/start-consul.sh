#!/bin/bash

# 设置环境变量
export CONSUL_HTTP_ADDR="http://localhost:8500"
export CONSUL_HTTP_TOKEN="{{ consul_http_token }}"

# 创建必要的目录
mkdir -p /var/lib/consul
mkdir -p /etc/consul/certs
mkdir -p /var/log/consul

# 生成加密密钥（如果不存在）
if [ ! -f /etc/consul/encrypt.key ]; then
  consul keygen >/etc/consul/encrypt.key
fi

# 设置权限
chown -R consul:consul /var/lib/consul
chown -R consul:consul /etc/consul
chown -R consul:consul /var/log/consul

# 启动 Consul
consul agent \
  -config-dir=/etc/consul/config \
  -data-dir=/var/lib/consul \
  -log-file=/var/log/consul/consul.log \
  -log-level=INFO \
  -syslog \
  -ui \
  -client=0.0.0.0 \
  -advertise={{ GetInterfaceIP "eth0" }} \
  -retry-join=consul-server-1 \
  -retry-join=consul-server-2 \
  -retry-join=consul-server-3 \
  -bootstrap-expect=3 \
  -encrypt=$(cat /etc/consul/encrypt.key) \
  -verify-incoming \
  -verify-outgoing \
  -verify-server-hostname \
  -ca-file=/etc/consul/certs/ca.crt \
  -cert-file=/etc/consul/certs/server.crt \
  -key-file=/etc/consul/certs/server.key
