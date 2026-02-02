# Production Deployment Guide

This guide explains how to deploy the Nagar Parishad backend to production.

## Prerequisites

- Node.js >= 14.0.0 installed
- PostgreSQL database set up
- PM2 installed (for process management)
- Domain/SSL certificate (for HTTPS)

## Step 1: Install Dependencies

```bash
# Install production dependencies only
npm install --production

# Or install all (including dev dependencies)
npm install
```

## Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.production.example .env.production

# Edit with your production values
nano .env.production
```

**Important Production Settings:**
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET` (generate random string)
- Update database credentials
- Configure CORS allowed origins
- Set up SSL/TLS certificates

## Step 3: Database Setup

```bash
# Create production database
psql -U postgres -c "CREATE DATABASE nagarparishad_db WITH ENCODING 'UTF8';"

# Run schema
psql -U postgres -d nagarparishad_db -f database/complete_schema.sql
```

## Step 4: Start Application

### Option A: Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2 ecosystem config
pm2 start ecosystem.config.js --env production

# Or use npm script
npm run pm2:start

# Check status
npm run pm2:status

# View logs
npm run pm2:logs
```

### Option B: Using npm scripts

```bash
# Start production server
npm run start:prod

# Or
npm run prod
```

### Option C: Direct node

```bash
NODE_ENV=production node server.js
```

## Step 5: PM2 Management Commands

```bash
# Start application
npm run pm2:start

# Stop application
npm run pm2:stop

# Restart application
npm run pm2:restart

# Delete from PM2
npm run pm2:delete

# View logs
npm run pm2:logs

# Check status
npm run pm2:status

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
pm2 save
```

## Step 6: Setup Reverse Proxy (Nginx)

### Nginx Configuration

Create `/etc/nginx/sites-available/nagarparishad-api`:

```nginx
server {
    listen 80;
    server_name api.kaamlo.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.kaamlo.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy Settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/nagarparishad-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 7: Setup Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (if needed)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

## Step 8: Setup SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.kaamlo.com

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

## Step 9: Monitoring

### PM2 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Health Checks

```bash
# Check application health
curl https://api.kaamlo.com/health

# Should return:
# {"success":true,"message":"Nagar Parishad Backend Service is running","timestamp":"..."}
```

## Step 10: Backup Strategy

### Database Backup

```bash
# Create backup script
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/nagarparishad"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U postgres nagarparishad_db > $BACKUP_DIR/backup_$DATE.sql
# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-db.sh
```

## Environment Variables Checklist

Ensure these are set in production:

- [ ] `NODE_ENV=production`
- [ ] `PORT=3000` (or your port)
- [ ] `DB_HOST` (production database host)
- [ ] `DB_NAME` (production database name)
- [ ] `DB_USER` (production database user)
- [ ] `DB_PASSWORD` (strong production password)
- [ ] `JWT_SECRET` (strong random secret)
- [ ] `ALLOWED_ORIGINS` (your production domains)
- [ ] SSL certificates configured (if using HTTPS)

## Security Checklist

- [ ] Strong JWT secret (use random generator)
- [ ] Database password is strong
- [ ] CORS configured for production domains only
- [ ] SSL/TLS enabled
- [ ] Firewall configured
- [ ] Regular security updates
- [ ] Database backups automated
- [ ] Logs are monitored
- [ ] Error tracking (Sentry, etc.) configured
- [ ] Rate limiting enabled

## Troubleshooting

### Application won't start

```bash
# Check logs
npm run pm2:logs

# Check environment
echo $NODE_ENV

# Test database connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;"
```

### High memory usage

```bash
# Check PM2 memory
pm2 monit

# Restart if needed
npm run pm2:restart
```

### Database connection errors

```bash
# Test connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Check PostgreSQL is running
sudo systemctl status postgresql
```

## Production Scripts Reference

```bash
# Development
npm run dev              # Start with nodemon (development)

# Production
npm run prod             # Start production server
npm run start:prod       # Same as above

# PM2 Management
npm run pm2:start        # Start with PM2
npm run pm2:stop         # Stop PM2 process
npm run pm2:restart      # Restart PM2 process
npm run pm2:logs         # View PM2 logs
npm run pm2:status       # Check PM2 status
```

## Deployment Checklist

- [ ] Code deployed to server
- [ ] Dependencies installed (`npm install --production`)
- [ ] Environment variables configured (`.env.production`)
- [ ] Database created and schema applied
- [ ] Application starts successfully
- [ ] PM2 configured and running
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] Firewall rules set
- [ ] Health check endpoint working
- [ ] Database backups scheduled
- [ ] Monitoring configured
- [ ] Logs accessible

## Quick Start Production

```bash
# 1. Install dependencies
npm install --production

# 2. Configure environment
cp .env.production.example .env.production
# Edit .env.production with your values

# 3. Setup database
psql -U postgres -d nagarparishad_db -f database/complete_schema.sql

# 4. Start with PM2
npm run pm2:start

# 5. Verify
curl http://localhost:3000/health
```

## Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm install --production

# Restart application
npm run pm2:restart
```

### View Logs

```bash
# PM2 logs
npm run pm2:logs

# Or directly
pm2 logs nagarparishad-api

# System logs (if using systemd)
journalctl -u nagarparishad-api -f
```

---

**Remember**: Never commit `.env.production` to version control!

