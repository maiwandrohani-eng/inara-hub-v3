# INARA Platform - Deployment Guide

This guide covers deploying the INARA Global Staff Platform to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Deployment Methods](#deployment-methods)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **PostgreSQL**: 12+ (14+ recommended)
- **npm**: 9+
- **Git**: Latest version

### Server Requirements

- **Minimum**: 2GB RAM, 2 CPU cores, 20GB storage
- **Recommended**: 4GB RAM, 4 CPU cores, 50GB+ storage
- **OS**: Ubuntu 20.04+, Debian 11+, or similar Linux distribution

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/maiwandrohani-eng/inara-hub-v3.git
cd inara-hub-v3
```

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Configure Environment Variables

#### Backend (`server/.env`)

Copy the example file and configure:

```bash
cd server
cp env.example .env
nano .env  # or use your preferred editor
```

**Required Variables:**

```env
DATABASE_URL="postgresql://username:password@host:5432/inara_platform?schema=public"
PORT=5000
NODE_ENV=production
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="https://yourdomain.com,https://www.yourdomain.com"
```

**Optional Variables:**

```env
AI_API_KEY="your-ai-api-key"
AI_API_URL="https://router.huggingface.co/v1/chat/completions"
AI_MODEL="mistralai/Mistral-7B-Instruct-v0.2"
```

#### Frontend (`client/.env`)

```bash
cd client
cp env.example .env
nano .env
```

```env
# Only needed if frontend and backend are on different domains
VITE_API_URL="https://api.yourdomain.com"
```

---

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE inara_platform;
CREATE USER inara_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE inara_platform TO inara_user;
\q
```

### 2. Run Database Migrations

```bash
cd server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed initial data (admin user, etc.)
```

---

## Deployment Methods

### Method 1: Traditional VPS Deployment

#### Step 1: Build Application

```bash
# From project root
npm run build
```

This builds both frontend and backend.

#### Step 2: Setup Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd server
pm2 start dist/index.js --name inara-backend

# Save PM2 configuration
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

#### Step 3: Setup Nginx Reverse Proxy

Install Nginx:

```bash
sudo apt update
sudo apt install nginx
```

Create Nginx configuration (`/etc/nginx/sites-available/inara`):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    root /path/to/inara-hub-v3/client/dist;
    index index.html;

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /uploads {
        alias /path/to/inara-hub-v3/server/public/uploads;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/inara /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 4: Setup SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

### Method 2: Docker Deployment

#### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

#### Quick Start

```bash
# Copy environment files
cp server/env.example server/.env
cp client/env.example client/.env

# Edit server/.env with your configuration
nano server/.env

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

#### Custom Configuration

Edit `docker-compose.yml` and `nginx.conf` as needed.

---

### Method 3: Platform-as-a-Service (PaaS)

#### Railway

1. Connect GitHub repository
2. Add PostgreSQL service
3. Set environment variables
4. Deploy

#### Render

1. Create new Web Service
2. Connect GitHub repository
3. Build command: `npm run build:server`
4. Start command: `cd server && npm start`
5. Add PostgreSQL database
6. Set environment variables

#### Vercel (Frontend) + Railway (Backend)

**Frontend (Vercel):**
- Connect repository
- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`

**Backend (Railway):**
- Connect repository
- Root directory: `server`
- Start command: `npm start`

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Health check
curl http://yourdomain.com/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Create Admin User

If not seeded, create admin user:

```bash
cd server
npm run db:seed
```

Default credentials (change immediately):
- Email: `admin@inara.org`
- Password: `admin123`

### 3. Setup File Uploads Directory

```bash
mkdir -p server/public/uploads
chmod 755 server/public/uploads
```

### 4. Configure Backups

#### Database Backup Script

Create `/usr/local/bin/backup-inara-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/inara"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U inara_user inara_platform > $BACKUP_DIR/backup_$DATE.sql
# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

Add to crontab:

```bash
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-inara-db.sh
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql -h localhost -U inara_user -d inara_platform

# Check Prisma connection
cd server
npx prisma db pull
```

### Port Already in Use

```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>
```

### File Upload Issues

```bash
# Check permissions
ls -la server/public/uploads

# Fix permissions
chmod -R 755 server/public/uploads
chown -R www-data:www-data server/public/uploads
```

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules server/node_modules client/node_modules
rm -rf server/dist client/dist
npm run install:all
npm run build
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Configure `CORS_ORIGIN` with your domain(s)
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Configure database backups
- [ ] Set up monitoring and logging
- [ ] Review file upload permissions
- [ ] Enable rate limiting (Nginx)
- [ ] Set up error tracking (Sentry, etc.)

---

## Monitoring

### Health Check Endpoint

```bash
GET /api/health
```

### Logs

**PM2:**
```bash
pm2 logs inara-backend
```

**Docker:**
```bash
docker-compose logs -f backend
```

**Systemd:**
```bash
sudo journalctl -u inara-backend -f
```

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/maiwandrohani-eng/inara-hub-v3/issues
- Documentation: See `README.md`

---

## License

ISC

