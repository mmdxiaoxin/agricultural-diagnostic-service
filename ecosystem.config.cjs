const path = require('path');
const dotenv = require('dotenv');
const os = require('os');
const fs = require('fs');

// 加载环境变量
const loadEnv = (envFile) => {
  const envPath = path.resolve(__dirname, envFile);
  console.log(`尝试加载环境变量文件: ${envPath}`);

  if (!fs.existsSync(envPath)) {
    console.warn(`环境变量文件不存在: ${envPath}`);
    return {};
  }

  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error(`加载环境变量文件失败: ${envPath}`, result.error);
    return {};
  }

  console.log(`成功加载环境变量文件: ${envFile}`);
  return result.parsed || {};
};

// 加载不同环境的配置
const developmentEnv = loadEnv('.env.development.local');
const productionEnv = loadEnv('.env.production.local');
const defaultEnv = loadEnv('.env');

// 合并环境变量，优先级：development/production > default
const env = {
  ...defaultEnv,
  ...(process.env.NODE_ENV === 'production' ? productionEnv : developmentEnv),
};

// 将环境变量注入到 process.env
Object.entries(env).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});

// 获取容器资源信息
const getServerInfo = () => {
  // 从环境变量或默认值获取容器资源限制
  const totalMemory = process.env.CONTAINER_MEMORY_LIMIT
    ? parseInt(process.env.CONTAINER_MEMORY_LIMIT) * 1024 * 1024 * 1024
    : 8 * 1024 * 1024 * 1024; // 默认8GB

  // 获取CPU信息
  const cpuCores = process.env.CONTAINER_CPU_LIMIT
    ? parseInt(process.env.CONTAINER_CPU_LIMIT)
    : 4; // 默认4个计算单元

  // 获取当前内存使用情况
  const freeMemory = os.freemem();
  const usedMemory = Math.max(0, totalMemory - freeMemory);
  const memoryUsage = Math.min(
    100,
    Math.floor((usedMemory / totalMemory) * 100),
  );

  return {
    system: {
      platform: os.platform(),
      release: os.release(),
      hostname: os.hostname(),
      uptime: formatUptime(os.uptime()),
    },
    cpu: {
      cores: cpuCores,
      model: 'Container CPU',
      speed: 'N/A',
      usage: [0], // 容器中无法准确获取CPU使用率
      loadAverage: [0, 0, 0], // 容器中无法准确获取负载
    },
    memory: {
      total: Math.floor(totalMemory / (1024 * 1024 * 1024)), // 转换为GB
      free: Math.floor(freeMemory / (1024 * 1024 * 1024)), // 转换为GB
      used: Math.floor(usedMemory / (1024 * 1024 * 1024)), // 转换为GB
      usage: memoryUsage, // 使用率百分比
    },
  };
};

// 格式化运行时间
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}天 ${hours}小时 ${minutes}分钟`;
};

// 计算服务配置
const calculateServiceConfig = (serverInfo) => {
  // 检查是否使用自动分配模式
  const useAutoAllocation = process.env.USE_AUTO_ALLOCATION === 'true';

  if (!useAutoAllocation) {
    // 手动分配模式 - 不限制CPU核心数
    return {
      diagnosis: {
        instances: process.env.DIAGNOSIS_INSTANCES
          ? parseInt(process.env.DIAGNOSIS_INSTANCES)
          : 1,
        memory: process.env.DIAGNOSIS_MEMORY
          ? parseInt(process.env.DIAGNOSIS_MEMORY)
          : 2,
      },
      apiGateway: {
        instances: process.env.GATEWAY_INSTANCES
          ? parseInt(process.env.GATEWAY_INSTANCES)
          : 1,
        memory: process.env.GATEWAY_MEMORY
          ? parseInt(process.env.GATEWAY_MEMORY)
          : 1.5,
      },
      otherServices: {
        instances: process.env.OTHER_INSTANCES
          ? parseInt(process.env.OTHER_INSTANCES)
          : 1,
        memory: process.env.OTHER_MEMORY
          ? parseInt(process.env.OTHER_MEMORY)
          : 1,
      },
      threadPoolSize: process.env.THREAD_POOL_SIZE
        ? parseInt(process.env.THREAD_POOL_SIZE)
        : 4,
    };
  }

  // 自动分配模式
  const { memory, cpu } = serverInfo;
  const totalCores = cpu.cores;

  // 预留系统内存（20%）
  const availableMemory = Math.floor(memory.total * 0.8);

  // API Gateway 直接使用 CPU 核心数
  const gateway = {
    instances: totalCores, // 直接使用所有 CPU 核心
    memory: Math.min(1.5, Math.floor(availableMemory * 0.15)),
  };

  // 诊断服务使用 25% 的额外计算资源
  const diagnosis = {
    instances: Math.max(1, Math.floor(totalCores * 0.25)),
    memory: Math.min(2, Math.floor(availableMemory * 0.2)),
  };

  // 其他服务共享剩余资源
  const other = {
    instances: Math.max(1, Math.floor(totalCores * 0.1)),
    memory: Math.min(1, Math.floor(availableMemory * 0.1)),
  };

  // 计算 UV_THREADPOOL_SIZE
  // 对于 bcrypt 操作，建议线程池大小为 CPU 核心数的 2 倍
  const threadPoolSize = Math.max(4, totalCores * 2);

  return {
    diagnosis,
    apiGateway: gateway,
    otherServices: other,
    threadPoolSize,
  };
};

// 获取服务器信息并计算配置
const serverInfo = getServerInfo();
const serviceConfig = calculateServiceConfig(serverInfo);

console.log('\n=== 服务器系统信息 ===');
console.log(
  `系统平台: ${serverInfo.system.platform} ${serverInfo.system.release}`,
);
console.log(`主机名: ${serverInfo.system.hostname}`);
console.log(`运行时间: ${serverInfo.system.uptime}`);

console.log('\n=== CPU信息 ===');
console.log(`CPU型号: ${serverInfo.cpu.model}`);
console.log(`CPU核心数: ${serverInfo.cpu.cores}`);
console.log(`CPU频率: ${serverInfo.cpu.speed}`);
console.log(`CPU使用率: ${serverInfo.cpu.usage.join('% ')}%`);
console.log(`系统负载: ${serverInfo.cpu.loadAverage.join(', ')}`);

console.log('\n=== 内存信息 ===');
console.log(`总内存: ${serverInfo.memory.total}GB`);
console.log(`已用内存: ${serverInfo.memory.used}GB`);
console.log(`空闲内存: ${serverInfo.memory.free}GB`);
console.log(`内存使用率: ${serverInfo.memory.usage}%`);

console.log('\n=== 服务配置 ===');
console.log(JSON.stringify(serviceConfig, null, 2));

// 通用配置
const commonConfig = {
  exec_mode: 'cluster',
  watch: false,
  watch_delay: 1000,
  ignore_watch: [
    'node_modules',
    'logs',
    'dist',
    '.git',
    '*.log',
    '*.md',
    '*.json',
    '*.lock',
    '*.yml',
    '*.yaml',
    '*.config.js',
    '*.config.cjs',
    '*.config.ts',
    '*.config.json',
    '*.config.yaml',
    '*.config.yml',
  ],
  env: {
    ...productionEnv,
  },
  env_production: {
    ...productionEnv,
  },
  env_development: {
    ...developmentEnv,
    watch: true,
  },
  time: true,
  max_restarts: 10,
  exp_backoff_restart_delay: 100,
  kill_timeout: 3000,
  instance_var: 'INSTANCE_ID',
  log_date_format: 'YYYY-MM-DD HH:mm:ss',
  log_rotate: true,
  max_logs: '10d',
  merge_logs: true,
  log_rotate_interval: '1', // 每1分钟
  log_rotate_interval_unit: 'm', // 单位：分钟
  log_rotate_max_size: '10M',
  log_rotate_keep: 10,
};

module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: 'dist/apps/api-gateway/main.js',
      instances: serviceConfig.apiGateway.instances,
      ...commonConfig,
      max_memory_restart: `${serviceConfig.apiGateway.memory * 1024}M`,
      error_file: 'logs/api-gateway/error.log',
      out_file: 'logs/api-gateway/out.log',
      node_args: '--trace-warnings',
      env: {
        ...commonConfig.env,
        NODE_OPTIONS: `--max-old-space-size=${serviceConfig.apiGateway.memory * 1024}`,
      },
      env_production: {
        ...commonConfig.env_production,
        NODE_OPTIONS: `--max-old-space-size=${serviceConfig.apiGateway.memory * 1024}`,
      },
      env_development: {
        ...commonConfig.env_development,
        NODE_OPTIONS: `--max-old-space-size=${serviceConfig.apiGateway.memory * 1024}`,
      },
    },
    {
      name: 'auth-service',
      script: 'dist/apps/auth-service/main.js',
      instances: serviceConfig.otherServices.instances,
      ...commonConfig,
      max_memory_restart: `${serviceConfig.otherServices.memory * 1024}M`,
      error_file: 'logs/auth-service/error.log',
      out_file: 'logs/auth-service/out.log',
      env: {
        ...commonConfig.env,
        UV_THREADPOOL_SIZE: Math.max(4, serverInfo.cpu.cores * 2).toString(),
        NODE_OPTIONS: '--max-old-space-size=1024',
      },
      env_production: {
        ...commonConfig.env_production,
        UV_THREADPOOL_SIZE: Math.max(4, serverInfo.cpu.cores * 2).toString(),
        NODE_OPTIONS: '--max-old-space-size=1024',
      },
      env_development: {
        ...commonConfig.env_development,
        UV_THREADPOOL_SIZE: Math.max(4, serverInfo.cpu.cores * 2).toString(),
        NODE_OPTIONS: '--max-old-space-size=1024',
      },
    },
    {
      name: 'download-service',
      script: 'dist/apps/download-service/main.js',
      instances: serviceConfig.otherServices.instances,
      ...commonConfig,
      max_memory_restart: `${serviceConfig.otherServices.memory * 1024}M`,
      error_file: 'logs/download-service/error.log',
      out_file: 'logs/download-service/out.log',
    },
    {
      name: 'file-service',
      script: 'dist/apps/file-service/main.js',
      instances: serviceConfig.otherServices.instances,
      ...commonConfig,
      max_memory_restart: `${serviceConfig.otherServices.memory * 1024}M`,
      error_file: 'logs/file-service/error.log',
      out_file: 'logs/file-service/out.log',
    },
    {
      name: 'upload-service',
      script: 'dist/apps/upload-service/main.js',
      instances: serviceConfig.otherServices.instances,
      ...commonConfig,
      max_memory_restart: `${serviceConfig.otherServices.memory * 1024}M`,
      error_file: 'logs/upload-service/error.log',
      out_file: 'logs/upload-service/out.log',
    },
    {
      name: 'user-service',
      script: 'dist/apps/user-service/main.js',
      instances: serviceConfig.otherServices.instances,
      ...commonConfig,
      max_memory_restart: `${serviceConfig.otherServices.memory * 1024}M`,
      error_file: 'logs/user-service/error.log',
      out_file: 'logs/user-service/out.log',
    },
    {
      name: 'knowledge-service',
      script: 'dist/apps/knowledge-service/main.js',
      instances: serviceConfig.otherServices.instances,
      ...commonConfig,
      max_memory_restart: `${serviceConfig.otherServices.memory * 1024}M`,
      error_file: 'logs/knowledge-service/error.log',
      out_file: 'logs/knowledge-service/out.log',
    },
    {
      name: 'diagnosis-service',
      script: 'dist/apps/diagnosis-service/main.js',
      instances: serviceConfig.diagnosis.instances,
      ...commonConfig,
      max_memory_restart: `${serviceConfig.diagnosis.memory * 1024}M`,
      error_file: 'logs/diagnosis-service/error.log',
      out_file: 'logs/diagnosis-service/out.log',
      node_args: `--trace-warnings --max-old-space-size=${serviceConfig.diagnosis.memory * 1024}`,
    },
  ],
};
