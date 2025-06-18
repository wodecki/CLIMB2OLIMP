#!/bin/bash

# CLIMB2OLIMP Service Setup Script
# This script sets up the frontend service to run persistently on port 3001

echo "🚀 Setting up CLIMB2OLIMP service..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 not found. Installing PM2 globally..."
    npm install -g pm2
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install PM2. Please run: sudo npm install -g pm2"
        exit 1
    fi
fi

# Navigate to frontend directory and install dependencies
echo "📋 Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
cd ..

# Start the service with PM2
echo "🔄 Starting CLIMB2OLIMP service with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 to start on system boot
echo "🔧 Setting up PM2 to start on system boot..."
pm2 startup

echo ""
echo "✅ CLIMB2OLIMP service setup complete!"
echo ""
echo "📊 Service Status:"
pm2 status

echo ""
echo "🌐 Your application is now running on: http://localhost:3001"
echo ""
echo "📋 Useful PM2 commands:"
echo "  pm2 status                    - Check service status"
echo "  pm2 logs climb2olimp-frontend - View logs"
echo "  pm2 restart climb2olimp-frontend - Restart service"
echo "  pm2 stop climb2olimp-frontend    - Stop service"
echo "  pm2 delete climb2olimp-frontend  - Remove service"
echo ""
echo "🔄 The service will automatically restart if it crashes and will start on system boot."
