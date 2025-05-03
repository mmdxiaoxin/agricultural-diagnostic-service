#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
  echo -e "${GREEN}使用方法:${NC}"
  echo "  $0 [选项] <测试文件路径>"
  echo ""
  echo -e "${GREEN}选项:${NC}"
  echo "  -h, --help    显示帮助信息"
  echo "  -o, --output  指定输出目录 (默认: test/results)"
  echo ""
  echo -e "${GREEN}示例:${NC}"
  echo "  $0 test/login-test.js"
  echo "  $0 -o test/custom-results test/login-test.js"
  exit 0
}

# 默认参数
OUTPUT_DIR="test/results"
TEST_FILES=()

# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case $1 in
  -h | --help)
    show_help
    ;;
  -o | --output)
    OUTPUT_DIR="$2"
    shift 2
    ;;
  *)
    TEST_FILES+=("$1")
    shift
    ;;
  esac
done

# 检查是否提供了测试文件
if [ ${#TEST_FILES[@]} -eq 0 ]; then
  echo -e "${RED}错误: 请提供至少一个测试文件${NC}"
  show_help
  exit 1
fi

# 创建测试结果目录
mkdir -p "$OUTPUT_DIR"

# 打印测试开始信息
echo -e "${GREEN}开始性能测试...${NC}"
echo -e "${YELLOW}当前时间: $(date)${NC}"
echo -e "${YELLOW}输出目录: $OUTPUT_DIR${NC}"

# 运行测试
for test_file in "${TEST_FILES[@]}"; do
  if [ ! -f "$test_file" ]; then
    echo -e "${RED}错误: 测试文件不存在: $test_file${NC}"
    continue
  fi

  # 从文件名生成结果文件名
  result_file="${OUTPUT_DIR}/$(basename "$test_file" .js).json"

  echo -e "\n${GREEN}运行测试: $test_file${NC}"
  k6 run "$test_file" --out json="$result_file"

  # 检查测试结果
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}测试完成: $test_file${NC}"
  else
    echo -e "${RED}测试失败: $test_file${NC}"
    exit 1
  fi
done

# 生成HTML报告
echo -e "\n${GREEN}生成测试报告...${NC}"
k6 convert "${OUTPUT_DIR}"/*.json -o "${OUTPUT_DIR}/report.html"

# 检查报告生成结果
if [ $? -eq 0 ]; then
  echo -e "${GREEN}测试报告已生成: ${OUTPUT_DIR}/report.html${NC}"
else
  echo -e "${RED}报告生成失败${NC}"
  exit 1
fi

# 打印测试完成信息
echo -e "\n${GREEN}所有测试完成!${NC}"
echo -e "${YELLOW}测试报告位置: ${OUTPUT_DIR}/report.html${NC}"
echo -e "${YELLOW}完成时间: $(date)${NC}"
