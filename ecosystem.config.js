module.exports = {
  apps: [
    {
      name: 'gpb-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000/api/v1',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 5000,
      kill_timeout: 5000,
    },
  ],
};

