#!/bin/bash

# CLIMB2 Service Management Script
# Usage: ./manage-services.sh [install|start|stop|restart|status|logs|uninstall]

PROJECT_DIR="/home/wodecki/LLM/Aron/CLIMB2"
BACKEND_SERVICE="climb2-backend.service"
FRONTEND_SERVICE="climb2-frontend.service"

case "$1" in
    install)
        echo "Installing CLIMB2 services..."
        sudo cp "$PROJECT_DIR/$BACKEND_SERVICE" /etc/systemd/system/
        sudo cp "$PROJECT_DIR/$FRONTEND_SERVICE" /etc/systemd/system/
        sudo systemctl daemon-reload
        sudo systemctl enable $BACKEND_SERVICE
        sudo systemctl enable $FRONTEND_SERVICE
        echo "Services installed and enabled!"
        ;;
    start)
        echo "Starting CLIMB2 services..."
        sudo systemctl start $BACKEND_SERVICE
        sudo systemctl start $FRONTEND_SERVICE
        echo "Services started!"
        ;;
    stop)
        echo "Stopping CLIMB2 services..."
        sudo systemctl stop $FRONTEND_SERVICE
        sudo systemctl stop $BACKEND_SERVICE
        echo "Services stopped!"
        ;;
    restart)
        echo "Restarting CLIMB2 services..."
        sudo systemctl restart $BACKEND_SERVICE
        sudo systemctl restart $FRONTEND_SERVICE
        echo "Services restarted!"
        ;;
    status)
        echo "=== Backend Service Status ==="
        sudo systemctl status $BACKEND_SERVICE --no-pager
        echo ""
        echo "=== Frontend Service Status ==="
        sudo systemctl status $FRONTEND_SERVICE --no-pager
        ;;
    logs)
        echo "=== Backend Logs (last 50 lines) ==="
        sudo journalctl -u $BACKEND_SERVICE -n 50 --no-pager
        echo ""
        echo "=== Frontend Logs (last 50 lines) ==="
        sudo journalctl -u $FRONTEND_SERVICE -n 50 --no-pager
        ;;
    tail)
        echo "Following logs in real-time (Ctrl+C to exit)..."
        sudo journalctl -u $BACKEND_SERVICE -u $FRONTEND_SERVICE -f
        ;;
    uninstall)
        echo "Uninstalling CLIMB2 services..."
        sudo systemctl stop $FRONTEND_SERVICE
        sudo systemctl stop $BACKEND_SERVICE
        sudo systemctl disable $FRONTEND_SERVICE
        sudo systemctl disable $BACKEND_SERVICE
        sudo rm /etc/systemd/system/$BACKEND_SERVICE
        sudo rm /etc/systemd/system/$FRONTEND_SERVICE
        sudo systemctl daemon-reload
        echo "Services uninstalled!"
        ;;
    *)
        echo "CLIMB2 Service Manager"
        echo "Usage: $0 {install|start|stop|restart|status|logs|tail|uninstall}"
        echo ""
        echo "Commands:"
        echo "  install   - Install and enable services"
        echo "  start     - Start services"
        echo "  stop      - Stop services"
        echo "  restart   - Restart services"
        echo "  status    - Show service status"
        echo "  logs      - Show recent logs"
        echo "  tail      - Follow logs in real-time"
        echo "  uninstall - Remove services"
        exit 1
        ;;
esac