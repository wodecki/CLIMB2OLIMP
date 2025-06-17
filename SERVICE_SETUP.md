# CLIMB2OLIMP Service Setup Guide

This guide will help you set up the CLIMB2OLIMP frontend service to run persistently on port 3001, even after closing the terminal.

## Quick Setup (Recommended)

Run the automated setup script:

```bash
./setup-service.sh
```

This script will:
- Install PM2 (if not already installed)
- Install frontend dependencies
- Start the service with PM2
- Configure it to start on system boot

## Manual Setup

If you prefer to set it up manually:

### 1. Install PM2 globally

```bash
npm install -g pm2
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Start the service

```bash
pm2 start ecosystem.config.js
```

### 4. Save PM2 configuration

```bash
pm2 save
```

### 5. Setup auto-start on boot

```bash
pm2 startup
```

Follow the instructions provided by the `pm2 startup` command.

## Service Management

### Check service status
```bash
pm2 status
```

### View logs
```bash
pm2 logs climb2olimp-frontend
```

### Restart service
```bash
pm2 restart climb2olimp-frontend
```

### Stop service
```bash
pm2 stop climb2olimp-frontend
```

### Remove service
```bash
pm2 delete climb2olimp-frontend
```

### View real-time logs
```bash
pm2 logs climb2olimp-frontend --lines 50
```

## Access Your Application

Once the service is running, you can access your application at:
**http://localhost:3001**

## Features

- ✅ Runs on port 3001
- ✅ Automatically restarts if it crashes
- ✅ Starts automatically on system boot
- ✅ Persistent even after closing terminal
- ✅ Logs are saved to `./logs/` directory
- ✅ Memory limit protection (1GB)

## Troubleshooting

### Service won't start
1. Check if port 3001 is already in use: `lsof -i :3001`
2. Check PM2 logs: `pm2 logs climb2olimp-frontend`
3. Restart the service: `pm2 restart climb2olimp-frontend`

### Permission issues
If you get permission errors when installing PM2:
```bash
sudo npm install -g pm2
```

### Check if service is running
```bash
pm2 list
```

### Reset everything
If you need to start fresh:
```bash
pm2 delete climb2olimp-frontend
pm2 start ecosystem.config.js
pm2 save
```

## Configuration

The service configuration is in `ecosystem.config.js`. You can modify:
- Port number
- Memory limits
- Log file locations
- Environment variables

After making changes, restart the service:
```bash
pm2 restart climb2olimp-frontend
