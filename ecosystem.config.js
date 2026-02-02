// PM2 Ecosystem Configuration
// Use this for production deployment with PM2
// Install PM2: npm install -g pm2
// Start: pm2 start ecosystem.config.js
// Or use: npm run pm2:start

module.exports = {
  apps: [{
    name: 'nagarparishad-api',
    script: './server.js',
    instances: 'max', // Use all CPU cores, or specify number like 2
    exec_mode: 'cluster', // Cluster mode for load balancing
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      // Load from .env.production file
    },
    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Auto restart
    autorestart: true,
    watch: false, // Set to true for development, false for production
    max_memory_restart: '1G', // Restart if memory exceeds 1GB
    
    // Advanced settings
    min_uptime: '10s', // Minimum uptime to consider app stable
    max_restarts: 10, // Maximum restarts in 1 minute
    restart_delay: 4000, // Delay between restarts
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Merge logs from all instances
    merge_logs: true,
    
    // Source map support
    source_map_support: true,
    
    // Instance variables
    instance_var: 'INSTANCE_ID'
  }]
};

