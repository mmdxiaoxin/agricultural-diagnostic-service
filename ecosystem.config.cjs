const path = require('path');
const dotenv = require('dotenv');
const os = require('os');

// 获取服务器信息
const getServerInfo = () => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const cpus = os.cpus();
  const cpuCores = cpus.length;

  return {
    totalMemory: Math.floor(totalMemory / (1024 * 1024 * 1024)), // 转换为GB
    freeMemory: Math.floor(freeMemory / (1024 * 1024 * 1024)), // 转换为GB
    cpuCores,
  };
};

// 计算服务配置
const calculateServiceConfig = (serverInfo) => {
  const { totalMemory, cpuCores } = serverInfo;

  // 预留系统内存（20%）
  const availableMemory = Math.floor(totalMemory * 0.8);

  // 计算每个服务的配置
  return {
    diagnosis: {
      instances: Math.max(4, Math.floor(cpuCores * 0.5)), // 至少4个实例，最多使用50%的CPU核心
      memory: Math.min(4, Math.floor(availableMemory * 0.3)), // 使用30%的可用内存，最大4GB
    },
    apiGateway: {
      instances: Math.max(2, Math.floor(cpuCores * 0.25)), // 至少2个实例，最多使用25%的CPU核心
      memory: Math.min(2, Math.floor(availableMemory * 0.15)), // 使用15%的可用内存，最大2GB
    },
    otherServices: {
      instances: Math.max(1, Math.floor(cpuCores * 0.125)), // 至少1个实例，最多使用12.5%的CPU核心
      memory: Math.min(1, Math.floor(availableMemory * 0.1)), // 使用10%的可用内存，最大1GB
    },
  };
};

// 加载环境变量
const loadEnv = (envFile) => {
  const envPath = path.resolve(__dirname, envFile);
  return dotenv.config({ path: envPath }).parsed;
};

// 加载不同环境的配置
const developmentEnv = loadEnv('.env.development.local');
const productionEnv = loadEnv('.env.production.local');

// 获取服务器信息并计算配置
const serverInfo = getServerInfo();
const serviceConfig = calculateServiceConfig(serverInfo);

console.log('服务器信息:', serverInfo);
console.log('服务配置:', serviceConfig);

// 通用配置
const commonConfig = {
  exec_mode: 'cluster',
  watch: false,
  env: {
    ...productionEnv,
  },
  env_production: {
    ...productionEnv,
  },
  env_development: {
    ...developmentEnv,
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
