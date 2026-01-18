---
description: CI/CD Pipeline Setup Guide for Oracle Cloud
---

# CI/CD Pipeline Setup Guide

This guide explains how to set up automatic deployments from GitHub to your Oracle Cloud server.

## Overview

When you push code to the `main` or `master` branch:
1. GitHub Actions builds and tests your code
2. Builds the React frontend
3. SSHs into your Oracle server
4. Pulls the latest code
5. Runs migrations and rebuilds
6. Restarts services

## Step 1: Generate SSH Key Pair (If Needed)

If you don't already have an SSH key for your Oracle server:

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -f ~/.ssh/oracle_deploy_key -C "github-actions-deploy"
```

This creates:
- `~/.ssh/oracle_deploy_key` (private key - keep secret!)
- `~/.ssh/oracle_deploy_key.pub` (public key - goes on server)

## Step 2: Add Public Key to Oracle Server

```bash
# Copy public key to server
ssh ubuntu@YOUR_ORACLE_IP "echo '$(cat ~/.ssh/oracle_deploy_key.pub)' >> ~/.ssh/authorized_keys"

# Test connection
ssh -i ~/.ssh/oracle_deploy_key ubuntu@YOUR_ORACLE_IP "echo 'Connection successful!'"
```

## Step 3: Configure GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `ORACLE_HOST` | Your server's public IP | `140.245.217.236` |
| `ORACLE_USER` | SSH username | `ubuntu` |
| `ORACLE_SSH_KEY` | Contents of your private key file | (see below) |
| `ORACLE_PORT` | SSH port | `22` |

### Getting the SSH Key Content

```bash
# On your local machine, display the private key content
cat ~/.ssh/oracle_deploy_key
```

Copy the **entire output** including:
```
-----BEGIN RSA PRIVATE KEY-----
... (many lines of characters) ...
-----END RSA PRIVATE KEY-----
```

Paste this as the value for `ORACLE_SSH_KEY`.

## Step 4: Configure Server for Passwordless Sudo

The deploy script needs to restart services without a password prompt.

SSH into your server and run:

```bash
# Create sudoers file for deploy operations
sudo visudo -f /etc/sudoers.d/github-deploy
```

Add this content:
```
# Allow ubuntu user to restart services without password
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart gunicorn
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
ubuntu ALL=(ALL) NOPASSWD: /bin/chown -R deploy\:www-data /home/deploy/apps/nucleIQ/repo/frontend/dist
```

Save and exit (Ctrl+X, then Y, then Enter).

**Test it works:**
```bash
sudo systemctl restart gunicorn
# Should not ask for password
```

## Step 5: Ensure Git Repository is Configured

On your Oracle server:

```bash
cd /home/deploy/apps/nucleIQ/repo

# Set git to allow pulling
git config --global --add safe.directory /home/deploy/apps/nucleIQ/repo

# Ensure you can pull without credentials (SSH or stored credentials)
git fetch origin
```

### Option A: Use SSH for Git (Recommended)

```bash
# On server, generate deploy key
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -C "oracle-server-deploy"

# Show public key
cat ~/.ssh/github_deploy.pub
```

1. Go to GitHub → Repository → Settings → Deploy keys
2. Add a new key with the public key content
3. Check "Allow write access" if needed

Update remote URL:
```bash
cd /home/deploy/apps/nucleIQ/repo
git remote set-url origin git@github.com:YOUR_USERNAME/nucleIQ.git
```

### Option B: Use HTTPS with Token

```bash
# Create a Personal Access Token on GitHub
# Settings → Developer settings → Personal access tokens → Generate new token

# Update remote with token
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/nucleIQ.git
```

## Step 6: Test the Pipeline

1. Make a small change to any file
2. Commit and push to main/master:
   ```bash
   git add -A
   git commit -m "test: CI/CD pipeline test"
   git push origin main
   ```
3. Go to GitHub → Actions tab
4. Watch the workflow run

## Troubleshooting

### "Permission denied (publickey)"
- Ensure the public key is in `~/.ssh/authorized_keys` on the server
- Verify the private key in GitHub secrets is correct and complete

### "sudo: a password is required"
- Run Step 4 again to configure passwordless sudo
- Make sure you edited the correct sudoers file

### "npm: command not found"
SSH into server and ensure Node.js is in PATH:
```bash
# Add to ~/.bashrc
export PATH=$PATH:/usr/bin/node
source ~/.bashrc
```

### Pipeline times out
- Check server disk space: `df -h`
- Check if services are running: `sudo systemctl status gunicorn nginx`
- Check npm build logs on server

### Frontend still shows old code
- Clear browser cache (Ctrl+Shift+R)
- Check if dist folder was updated: `ls -la /home/deploy/apps/nucleIQ/repo/frontend/dist`

## Manual Deployment (Fallback)

If CI/CD fails, you can always deploy manually:

```bash
# SSH to server
ssh ubuntu@YOUR_ORACLE_IP

# Run deployment
cd /home/deploy/apps/nucleIQ/repo
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# Frontend
cd ../frontend
echo "VITE_API_URL=/api" > .env
npm install
export NODE_OPTIONS=--max-old-space-size=4096
npm run build

# Restart services
sudo chown -R deploy:www-data /home/deploy/apps/nucleIQ/repo/frontend/dist
sudo systemctl restart gunicorn
sudo systemctl reload nginx
```

## Workflow File Location

The CI/CD configuration is at:
```
.github/workflows/deploy.yml
```

You can modify this file to:
- Add more tests
- Deploy to different branches
- Add notifications (Slack, Discord, Email)
- Add staging environments
