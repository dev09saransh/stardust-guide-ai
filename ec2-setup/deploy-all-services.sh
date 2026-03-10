#!/bin/bash

# Complete Deployment Script for Stardust on EC2
echo "🚀 Deploying Stardust Financial Vault Services..."

# Update system packages
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js and Python if not exists
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if ! command -v python3 &> /dev/null; then
    echo "Installing Python3..."
    sudo apt install python3 python3-pip -y
fi

# Install PM2 for process management
sudo npm install -g pm2

# Run all service setup scripts
echo "Setting up Backend Service..."
chmod +x backend-service.sh
./backend-service.sh

echo "Setting up Frontend Service..."
chmod +x frontend-service.sh
./frontend-service.sh

echo "Setting up Python Service..."
chmod +x python-service.sh
./python-service.sh

# Wait for services to start
sleep 5

# Check all services status
echo "🔍 Checking Service Status..."
echo "=================================="
sudo systemctl status stardust-backend --no-pager
echo "=================================="
sudo systemctl status stardust-frontend --no-pager
echo "=================================="
sudo systemctl status stardust-python --no-pager
echo "=================================="

# Show ports and processes
echo "🌐 Active Services:"
netstat -tlnp | grep -E ':(3000|5001|5002)'

echo "✅ All services deployed and running!"
echo ""
echo "📋 Service Management Commands:"
echo "Backend: sudo systemctl status|restart|stop stardust-backend"
echo "Frontend: sudo systemctl status|restart|stop stardust-frontend"
echo "Python: sudo systemctl status|restart|stop stardust-python"
echo ""
echo "📊 View Logs:"
echo "Backend: sudo journalctl -u stardust-backend -f"
echo "Frontend: sudo journalctl -u stardust-frontend -f"
echo "Python: sudo journalctl -u stardust-python -f"
echo ""
echo "🌐 Access URLs:"
echo "Frontend: http://13.48.25.209:3000"
echo "Backend API: http://13.48.25.209:5001"
echo "Python Service: http://13.48.25.209:5005"
