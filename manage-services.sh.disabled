#!/bin/bash

# CLIMB2OLIMP Service Management Script
# This script helps manage the CLIMB2OLIMP services using PM2

case "$1" in
    start)
        echo "Starting CLIMB2OLIMP services..."
        pm2 start ecosystem.config.js
        pm2 save
        echo "Services started successfully!"
        ;;
    stop)
        echo "Stopping CLIMB2OLIMP services..."
        pm2 stop climb2olimp-frontend
        echo "Services stopped successfully!"
        ;;
    restart)
        echo "Restarting CLIMB2OLIMP services..."
        pm2 restart climb2olimp-frontend
        echo "Services restarted successfully!"
        ;;
    status)
        echo "CLIMB2OLIMP Service Status:"
        pm2 status
        ;;
    logs)
        echo "Showing logs for CLIMB2OLIMP frontend..."
        pm2 logs climb2olimp-frontend
        ;;
    monitor)
        echo "Opening PM2 monitor..."
        pm2 monit
        ;;
    delete)
        echo "Deleting CLIMB2OLIMP services..."
        pm2 delete climb2olimp-frontend
        pm2 save
        echo "Services deleted successfully!"
        ;;
    info)
        echo "CLIMB2OLIMP Service Information:"
        echo "================================"
        echo "Frontend URL: http://localhost:3001"
        echo "Service Name: climb2olimp-frontend"
        echo "Log Files:"
        echo "  - Error: ./logs/frontend-error.log"
        echo "  - Output: ./logs/frontend-out.log"
        echo "  - Combined: ./logs/frontend.log"
        echo ""
        echo "PM2 Commands:"
        echo "  - View status: pm2 status"
        echo "  - View logs: pm2 logs climb2olimp-frontend"
        echo "  - Monitor: pm2 monit"
        echo "  - Restart: pm2 restart climb2olimp-frontend"
        echo "  - Stop: pm2 stop climb2olimp-frontend"
        echo "  - Delete: pm2 delete climb2olimp-frontend"
        ;;
    *)
        echo "CLIMB2OLIMP Service Management"
        echo "Usage: $0 {start|stop|restart|status|logs|monitor|delete|info}"
        echo ""
        echo "Commands:"
        echo "  start    - Start the CLIMB2OLIMP services"
        echo "  stop     - Stop the CLIMB2OLIMP services"
        echo "  restart  - Restart the CLIMB2OLIMP services"
        echo "  status   - Show service status"
        echo "  logs     - Show service logs"
        echo "  monitor  - Open PM2 monitor"
        echo "  delete   - Delete services from PM2"
        echo "  info     - Show service information"
        echo ""
        echo "The service will automatically start on system boot."
        echo "Frontend will be available at: http://localhost:3001"
        exit 1
        ;;
esac

exit 0
