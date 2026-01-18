---
description: Deploy nucleIQ to Oracle Cloud (Non-Docker)
---

# Oracle Cloud Deployment Guide

This workflow covers deploying the nucleIQ application on Oracle Cloud Infrastructure (OCI) without Docker.

## Prerequisites
- Oracle Cloud instance running Ubuntu 24.04
- SSH access to the server
- Git repository cloned to the server

## Server Setup

### 1. Install System Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nginx redis-server postgresql postgresql-contrib nodejs npm
```

### 2. Clone Repository
```bash
mkdir -p /home/deploy/apps/nucleIQ
cd /home/deploy/apps/nucleIQ
git clone YOUR_REPO_URL repo
```

## Backend Deployment

### 3. Setup Python Virtual Environment
```bash
cd /home/deploy/apps/nucleIQ/repo/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy and update the `.env` file:
```bash
cp .env.example .env
# Edit .env and set:
# - ALLOWED_HOSTS=YOUR_PUBLIC_IP,localhost,127.0.0.1
# - REDIS_URL=redis://localhost:6379/1
# - CELERY_BROKER_URL=redis://localhost:6379/0
# - DATABASE settings for PostgreSQL
```

### 5. Run Migrations and Collect Static Files
```bash
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### 6. Setup Gunicorn Service
Create `/etc/systemd/system/gunicorn.service`:
```ini
[Unit]
Description=Gunicorn daemon for nucleIQ
After=network.target

[Service]
User=deploy
Group=www-data
WorkingDirectory=/home/deploy/apps/nucleIQ/repo/backend
ExecStart=/home/deploy/apps/nucleIQ/repo/backend/venv/bin/gunicorn --workers 3 --bind unix:/run/gunicorn.sock config.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable gunicorn
sudo systemctl start gunicorn
```

## Frontend Deployment

### 7. Build Frontend
```bash
cd /home/deploy/apps/nucleIQ/repo/frontend

# Create .env file (IMPORTANT: Use relative path for production)
echo "VITE_API_URL=/api" > .env

# Install dependencies
npm install

# Build with increased memory
export NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

### 8. Fix Permissions
```bash
sudo chown -R deploy:www-data /home/deploy/apps/nucleIQ/repo/frontend/dist
```

## Nginx Configuration

### 9. Create Nginx Config
Create `/etc/nginx/sites-available/nucleiq`:
```nginx
server {
    listen 80;
    server_name YOUR_PUBLIC_IP;

    # Frontend
    location / {
        root /home/deploy/apps/nucleIQ/repo/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://unix:/run/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://unix:/run/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files
    location /static/ {
        alias /home/deploy/apps/nucleIQ/repo/backend/staticfiles/;
    }

    # Media files
    location /media/ {
        alias /home/deploy/apps/nucleIQ/repo/backend/media/;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/nucleiq /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Firewall Configuration

### 10. Open Ports
```bash
# Ubuntu firewall
sudo iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
sudo apt install netfilter-persistent
sudo netfilter-persistent save
```

### 11. OCI Security List
In Oracle Cloud Console:
1. Navigate to Networking > Virtual Cloud Networks
2. Click on your VCN > Security Lists
3. Add Ingress Rules:
   - Source: 0.0.0.0/0, Protocol: TCP, Destination Port: 80
   - Source: 0.0.0.0/0, Protocol: TCP, Destination Port: 443

## Troubleshooting

### Common Issues

**DisallowedHost Error:**
- Update `ALLOWED_HOSTS` in `.env` to include the public IP

**Connection Error in Frontend:**
- Ensure `.env` has `VITE_API_URL=/api` (relative path)
- Rebuild frontend after changing `.env`
- Clear browser cache with Ctrl+F5

**Redis Connection Error:**
- Ensure redis-server is installed and running
- Update `REDIS_URL` and `CELERY_BROKER_URL` to use `localhost` instead of `redis`

**Permission Denied during build:**
```bash
sudo chown -R ubuntu:ubuntu /home/deploy/apps/nucleIQ/repo/frontend
npm run build
sudo chown -R deploy:www-data /home/deploy/apps/nucleIQ/repo/frontend/dist
```

**Node.js Memory Error:**
```bash
export NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

## Verification

1. Check Gunicorn: `sudo systemctl status gunicorn`
2. Check Nginx: `sudo systemctl status nginx`
3. Check Redis: `sudo systemctl status redis`
4. Access frontend: `http://YOUR_PUBLIC_IP/`
5. Access admin: `http://YOUR_PUBLIC_IP/admin/`
