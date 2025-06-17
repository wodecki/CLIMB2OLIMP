# CLIMB2OLIMP Service Setup with PM2

This document explains how to manage the CLIMB2OLIMP service using PM2 process manager.

## Service Status

The CLIMB2OLIMP frontend is now running as a persistent service that will:
- ✅ Continue running after you close your terminal
- ✅ Automatically restart if it crashes
- ✅ Start automatically when the system boots
- ✅ Log all output to files for debugging

## Service Information

- **Frontend URL**: http://localhost:3001
- **Service Name**: climb2olimp-frontend
- **Process Manager**: PM2
- **Auto-restart**: Enabled
- **Boot startup**: Enabled

## Management Commands

### Using the Management Script (Recommended)

```bash
# Show service status
./manage-services.sh status

# View service information
./manage-services.sh info

# View logs
./manage-services.sh logs

# Restart service
./manage-services.sh restart

# Stop service
./manage-services.sh stop

# Start service
./manage-services.sh start

# Open PM2 monitor
./manage-services.sh monitor
```

### Direct PM2 Commands

```bash
# View all processes
pm2 status

# View logs
pm2 logs climb2olimp-frontend

# Restart service
pm2 restart climb2olimp-frontend

# Stop service
pm2 stop climb2olimp-frontend

# Start service
pm2 start climb2olimp-frontend

# Monitor processes
pm2 monit

# Save current process list
pm2 save
```

## Log Files

Logs are stored in the `./logs/` directory:
- `frontend-error.log` - Error logs
- `frontend-out.log` - Standard output logs
- `frontend.log` - Combined logs

## Configuration

The PM2 configuration is defined in `ecosystem.config.js`:
- Port: 3001
- Environment: Development
- Auto-restart: Enabled
- Memory limit: 1GB
- Log rotation: Enabled

## Troubleshooting

### Service not starting
```bash
# Check PM2 status
pm2 status

# View logs for errors
pm2 logs climb2olimp-frontend

# Restart the service
./manage-services.sh restart
```

### Port conflicts
If port 3001 is already in use, you can:
1. Edit `ecosystem.config.js` to change the port
2. Restart the service: `./manage-services.sh restart`

### Remove service completely
```bash
# Delete from PM2
./manage-services.sh delete

# Remove startup script (if needed)
pm2 unstartup systemd
```

## System Boot Setup

The service is configured to start automatically on system boot via systemd:
- Service file: `/etc/systemd/system/pm2-wodecki.service`
- Status: `systemctl status pm2-wodecki`

## Access the Application

Once the service is running, you can access the CLIMB2OLIMP application at:
**http://localhost:3001**

The application will be available even after closing your terminal session.
