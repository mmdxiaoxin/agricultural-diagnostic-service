#!/bin/bash

# ==========================================
# Proto 文件生成脚本
# 用于将 .proto 文件编译为 TypeScript 类型定义
#
# 用法：
#   ./generate-proto.sh [选项]
#
# 选项：
#   -p, --proto-dir     Proto 文件目录 (默认: ./apps/api-gateway/src/proto)
#   -o, --output-dir    输出目录 (默认: ./libs/common/src/types)
#   -h, --help          显示帮助信息
# ==========================================

# 默认配置参数
DEFAULT_PROTO_DIR="./apps/api-gateway/src/proto"
DEFAULT_OUTPUT_DIR="./libs/common/src/types"
readonly TS_PROTO_PLUGIN="./node_modules/.bin/protoc-gen-ts_proto"

# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case $1 in
  -p | --proto-dir)
    PROTO_DIR="$2"
    shift 2
    ;;
  -o | --output-dir)
    OUTPUT_DIR="$2"
    shift 2
    ;;
  -h | --help)
    echo "用法：$0 [选项]"
    echo "选项："
    echo "  -p, --proto-dir     Proto 文件目录 (默认: ${DEFAULT_PROTO_DIR})"
    echo "  -o, --output-dir    输出目录 (默认: ${DEFAULT_OUTPUT_DIR})"
    echo "  -h, --help          显示帮助信息"
    exit 0
    ;;
  *)
    echo "❌ 错误：未知选项 $1"
    echo "使用 -h 或 --help 查看帮助信息"
    exit 1
    ;;
  esac
done

# 设置默认值（如果未通过参数指定）
PROTO_DIR="${PROTO_DIR:-${DEFAULT_PROTO_DIR}}"
OUTPUT_DIR="${OUTPUT_DIR:-${DEFAULT_OUTPUT_DIR}}"

# 获取当前时间
start_time=$(date "+%Y-%m-%d %H:%M:%S")
echo "🚀 开始生成 Proto 文件 - ${start_time}"
echo "📂 配置信息："
echo "   - Proto 目录：${PROTO_DIR}"
echo "   - 输出目录：${OUTPUT_DIR}"

# 检查 proto 文件是否存在
if [ ! -d "${PROTO_DIR}" ]; then
  echo "❌ 错误：Proto 目录不存在: ${PROTO_DIR}"
  exit 1
fi

# 列出所有待处理的 proto 文件
echo "📋 待处理的 Proto 文件："
for proto_file in "${PROTO_DIR}"/*.proto; do
  if [ -f "${proto_file}" ]; then
    echo "   - $(basename "${proto_file}")"
  fi
done

# 确保输出目录存在
echo "📁 创建输出目录: ${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}"

# 编译 proto 文件
echo "⚙️  开始编译..."
protoc \
  --plugin="protoc-gen-ts_proto=${TS_PROTO_PLUGIN}" \
  --ts_proto_out="${OUTPUT_DIR}" \
  "${PROTO_DIR}"/*.proto \
  --ts_proto_opt="outputEncodeMethods=false,outputJsonMethods=false,outputClientImpl=false"

# 检查编译结果
if [ $? -eq 0 ]; then
  end_time=$(date "+%Y-%m-%d %H:%M:%S")
  echo "✅ Proto 文件编译成功！"
  echo "📊 编译信息："
  echo "   - 开始时间：${start_time}"
  echo "   - 完成时间：${end_time}"
  echo "   - 输出目录：${OUTPUT_DIR}"
else
  echo "❌ Proto 文件编译失败！"
  exit 1
fi
