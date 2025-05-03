import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// 测试配置
export const options = {
  // 定义测试阶段
  stages: [
    { duration: '30s', target: 10 }, // 30秒内逐渐增加到10个并发用户
    { duration: '1m', target: 10 }, // 保持10个并发用户1分钟
    { duration: '30s', target: 0 }, // 30秒内逐渐减少到0个并发用户
  ],
  // 定义性能指标阈值
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95%的请求应该在500ms内完成
    http_req_failed: ['rate<0.01'], // 错误率应该低于1%
  },
  // 输出配置
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)'],
};

// 测试数据
const testData = new SharedArray('test data', function () {
  return [
    {
      username: 'test1@example.com',
      password: 'password123',
    },
    {
      username: 'test2@example.com',
      password: 'password123',
    },
    {
      username: 'test3@example.com',
      password: 'password123',
    },
  ];
});

// 测试函数
export default function () {
  // 随机选择一个测试账号
  const account = testData[Math.floor(Math.random() * testData.length)];

  // 测试登录接口
  const url = 'http://localhost:3000/auth/login';
  const payload = JSON.stringify({
    username: account.username,
    password: account.password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '30s',
  };

  const res = http.post(url, payload, params);

  // 检查响应
  check(res, {
    状态码是200: (r) => r.status === 200,
    响应时间小于500ms: (r) => r.timings.duration < 500,
    响应包含token: (r) => {
      const body = JSON.parse(r.body);
      return body.data && body.data.token;
    },
  });

  // 如果请求失败，打印详细信息
  if (res.status !== 200) {
    console.log(`请求失败: ${res.status} ${res.error}`);
    console.log(`响应内容: ${res.body}`);
  }

  // 每次请求之间等待1秒
  sleep(1);
}
