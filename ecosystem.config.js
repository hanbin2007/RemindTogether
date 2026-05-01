// PM2 process config — see https://pm2.keymetrics.io/docs/usage/application-declaration/
//
// Phase 1: single instance ("fork" mode). We keep cluster off until Phase 4
// adds the PostgreSQL LISTEN/NOTIFY adapter that lets Socket.io rooms span
// multiple workers (see docs/03-ARCHITECTURE.md).
//
// On a 1.9 GiB / 2 vCPU EC2 the single Next.js + Socket.io worker uses about
// 250–400 MB resident; we cap it at 600 MB and let PM2 restart on overrun.

module.exports = {
  apps: [
    {
      name: "remindtogether",
      script: "./server.js",
      cwd: __dirname,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "600M",
      kill_timeout: 8000,
      wait_ready: false,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOST: "127.0.0.1",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: "3000",
        HOST: "127.0.0.1",
      },
      // pm2 logrotate handles file rotation; we just append.
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
