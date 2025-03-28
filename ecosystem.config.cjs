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

module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: 'dist/apps/api-gateway/main.js',
      instances: 'max',
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
      max_memory_restart: '1G',
      error_file: 'logs/api-gateway-error.log',
      out_file: 'logs/api-gateway-out.log',
      time: true,
      max_restarts: 10,
      exp_backoff_restart_delay: 100,
      kill_timeout: 3000,
      instance_var: 'INSTANCE_ID',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      log_rotate: true,
      max_logs: '10d',
      merge_logs: true,
      node_args: '--trace-warnings',
    },
    {
      name: 'auth-service',
      script: 'dist/apps/auth-service/main.js',
      instances: 1,
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
    },
    {
      name: 'download-service',
      script: 'dist/apps/download-service/main.js',
      instances: 1,
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
    },
    {
      name: 'file-service',
      script: 'dist/apps/file-service/main.js',
      instances: 1,
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
    },
    {
      name: 'upload-service',
      script: 'dist/apps/upload-service/main.js',
      instances: 1,
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
    },
    {
      name: 'user-service',
      script: 'dist/apps/user-service/main.js',
      instances: 1,
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
    },
    {
      name: 'knowledge-service',
      script: 'dist/apps/knowledge-service/main.js',
      instances: 1,
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
    },
    {
      name: 'diagnosis-service',
      script: 'dist/apps/diagnosis-service/main.js',
      instances: 1,
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
    },
  ],
};
