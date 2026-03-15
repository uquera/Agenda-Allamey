module.exports = {
  apps: [
    {
      name: "agenda-allamey",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/var/www/agenda-allamey",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
}
