const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
const loadEnv = (envFile) => {
  const envPath = path.resolve(__dirname, envFile);
  return dotenv.config({ path: envPath }).parsed;
};

// 加载不同环境的配置
const developmentEnv = loadEnv('.env.development.local');
const productionEnv = loadEnv('.env.production.local');

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
};

module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: 'dist/apps/api-gateway/main.js',
      instances: 4, // 使用4个实例，因为网关需要处理大量并发
      ...commonConfig,
      max_memory_restart: '2G',
      error_file: 'logs/api-gateway-error.log',
      out_file: 'logs/api-gateway-out.log',
      node_args: '--trace-warnings',
    },
    {
      name: 'auth-service',
      script: 'dist/apps/auth-service/main.js',
      instances: 2,
      ...commonConfig,
      max_memory_restart: '1G',
      error_file: 'logs/auth-service-error.log',
      out_file: 'logs/auth-service-out.log',
    },
    {
      name: 'download-service',
      script: 'dist/apps/download-service/main.js',
      instances: 2,
      ...commonConfig,
      max_memory_restart: '1G',
      error_file: 'logs/download-service-error.log',
      out_file: 'logs/download-service-out.log',
    },
    {
      name: 'file-service',
      script: 'dist/apps/file-service/main.js',
      instances: 2,
      ...commonConfig,
      max_memory_restart: '1G',
      error_file: 'logs/file-service-error.log',
      out_file: 'logs/file-service-out.log',
    },
    {
      name: 'upload-service',
      script: 'dist/apps/upload-service/main.js',
      instances: 2,
      ...commonConfig,
      max_memory_restart: '1G',
      error_file: 'logs/upload-service-error.log',
      out_file: 'logs/upload-service-out.log',
    },
    {
      name: 'user-service',
      script: 'dist/apps/user-service/main.js',
      instances: 2,
      ...commonConfig,
      max_memory_restart: '1G',
      error_file: 'logs/user-service-error.log',
      out_file: 'logs/user-service-out.log',
    },
    {
      name: 'knowledge-service',
      script: 'dist/apps/knowledge-service/main.js',
      instances: 2,
      ...commonConfig,
      max_memory_restart: '1G',
      error_file: 'logs/knowledge-service-error.log',
      out_file: 'logs/knowledge-service-out.log',
    },
    {
      name: 'diagnosis-service',
      script: 'dist/apps/diagnosis-service/main.js',
      instances: 4, // 增加诊断服务的实例数
      ...commonConfig,
      max_memory_restart: '4G', // 增加诊断服务的内存限制
      error_file: 'logs/diagnosis-service-error.log',
      out_file: 'logs/diagnosis-service-out.log',
      node_args: '--trace-warnings --max-old-space-size=4096', // 增加 Node.js 堆内存限制
    },
  ],
};
