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
  const logicalCores = process.env.CONTAINER_CPU_LIMIT
    ? parseInt(process.env.CONTAINER_CPU_LIMIT)
    : 4; // 默认4个逻辑核心

  // 线程比例为2:1，计算物理核心数
  const physicalCores = Math.ceil(logicalCores / 2);

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
      physicalCores: physicalCores,
      logicalCores: logicalCores,
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
  const { memory, cpu } = serverInfo;
  const totalLogicalCores = cpu.logicalCores;
  const totalPhysicalCores = cpu.physicalCores;

  // 预留系统内存（20%）
  const availableMemory = Math.floor(memory.total * 0.8);

  // 计算每个服务的配置
  const diagnosis = {
    instances: Math.max(1, Math.floor(totalPhysicalCores * 0.3)), // 使用30%的物理CPU核心
    memory: Math.min(4, Math.floor(availableMemory * 0.3)), // 使用30%的可用内存，最大4GB
  };

  const gateway = {
    instances: Math.max(1, Math.floor(totalPhysicalCores * 0.2)), // 使用20%的物理CPU核心
    memory: Math.min(2, Math.floor(availableMemory * 0.15)), // 使用15%的可用内存，最大2GB
  };

  const other = {
    instances: Math.max(1, Math.floor(totalPhysicalCores * 0.1)), // 使用10%的物理CPU核心
    memory: Math.min(1, Math.floor(availableMemory * 0.1)), // 使用10%的可用内存，最大1GB
  };

  // 确保总实例数不超过物理CPU核心数
  const totalInstances =
    diagnosis.instances + gateway.instances + other.instances * 6; // 6个其他服务
  if (totalInstances > totalPhysicalCores) {
    const scaleFactor = totalPhysicalCores / totalInstances;
    diagnosis.instances = Math.max(
      1,
      Math.floor(diagnosis.instances * scaleFactor),
    );
    gateway.instances = Math.max(
      1,
      Math.floor(gateway.instances * scaleFactor),
    );
    other.instances = Math.max(1, Math.floor(other.instances * scaleFactor));
  }

  return {
    diagnosis,
    apiGateway: gateway,
    otherServices: other,
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
console.log(`物理核心数: ${serverInfo.cpu.physicalCores}`);
console.log(`逻辑核心数: ${serverInfo.cpu.logicalCores}`);
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
      max_memory_restart: `${serviceConfig.apiGateway.memory}G`,
      error_file: 'logs/api-gateway/error.log',
      out_file: 'logs/api-gateway/out.log',
      node_args: '--trace-warnings',
    },
    {
      name: 'auth-service',
      script: 'dist/apps/auth-service/main.js',
      instances: serviceConfig.otherServices.instances,
      ...commonConfig,
      max_memory_restart: `${serviceConfig.otherServices.memory}G`,
      error_file: 'logs/auth-service/error.log',
      out_file: 'logs/auth-service/out.log',
    },
    {
      name: 'download-service',
      script: 'dist/apps/download-service/main.js',
      instances: serviceConfig.otherServices.instances,
      ...commonConfig,
      max_memory_restart: `${serviceConfig.otherServices.memory}G`,
      error_file: 'logs/download-service/error.log',
      out_file: 'logs/download-service/out.log',
    },
    {
      name: 'file-service',
      script: 'dist/apps/file-service/main.js',
      instances: serviceConfig.otherServices.instances,
      ...commonConfig,
      max_memory_restart: `${serviceConfig.otherServices.memory}G`,
      error_file: 'logs/file-service/error.log',
      out_file: 'logs/file-service/out.log',
    },
    {
      name: 'upload-service',
      script: 'dist/apps/upload-service/main.js',
      instances: serviceConfig.otherServices.instances,
      ...commonConfig,
      max_memory_restart: `${serviceConfig.otherServices.memory}G`,
      error_file: 'logs/upload-service/error.log',
      out_file: 'logs/upload-service/out.log',
    },
    {
      name: 'user-service',
      script: 'dist/apps/user-service/main.js',
      instances: serviceConfig.otherServices.instances,
      ...commonConfig,
      max_memory_restart: `${serviceConfig.otherServices.memory}G`,
      error_file: 'logs/user-service/error.log',
      out_file: 'logs/user-service/out.log',
    },
    {
      name: 'knowledge-service',
      script: 'dist/apps/knowledge-service/main.js',
      instances: serviceConfig.otherServices.instances,
      ...commonConfig,
      max_memory_restart: `${serviceConfig.otherServices.memory}G`,
      error_file: 'logs/knowledge-service/error.log',
      out_file: 'logs/knowledge-service/out.log',
    },
    {
      name: 'diagnosis-service',
      script: 'dist/apps/diagnosis-service/main.js',
      instances: serviceConfig.diagnosis.instances,
      ...commonConfig,
      max_memory_restart: `${serviceConfig.diagnosis.memory}G`,
      error_file: 'logs/diagnosis-service/error.log',
      out_file: 'logs/diagnosis-service/out.log',
      node_args: `--trace-warnings --max-old-space-size=${serviceConfig.diagnosis.memory * 1024}`,
    },
  ],
};
