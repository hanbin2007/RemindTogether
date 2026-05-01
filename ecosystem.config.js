// PM2 process config — see https://pm2.keymetrics.io/docs/usage/application-declaration/
//
// We run the custom server through `tsx` so server.ts can import the TS
// modules under src/ (Socket.io setup, PG LISTEN/NOTIFY adapter, etc.)
// without a separate build step. tsx uses esbuild internally — startup
// overhead is < 100 ms.
//
// Phase 4: still single-instance fork mode. Cluster mode becomes
// turn-on-able now that PG LISTEN/NOTIFY relays broadcasts across
// workers, but on a 1.9 GiB / 2 vCPU EC2 a single worker is plenty for
// the foreseeable load — bumping `instances` to "max" once we see CPU
// saturation is a one-line change. RAM cap at 600 MB; PM2 restarts on
// overrun.

module.exports = {
  apps: [
    {
      name: "remindtogether",
      script: "node_modules/.bin/tsx",
      args: "server.ts",
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
