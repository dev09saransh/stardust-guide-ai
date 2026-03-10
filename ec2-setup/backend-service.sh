#!/bin/bash

# Backend Service Setup for EC2
echo "Setting up Backend Service..."

# Create systemd service file
sudo tee /etc/systemd/system/stardust-backend.service > /dev/null <<EOF
[Unit]
Description=Stardust Backend Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
Environment=NODE_ENV=production
ExecStart=/home/ubuntu/app.jar
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=stardust-backend

[Install]
WantedBy=multi-user.target
EOF

# Make app.jar executable
chmod +x /home/ubuntu/app.jar

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable stardust-backend
sudo systemctl start stardust-backend

echo "✅ Backend service started!"
echo "Status: sudo systemctl status stardust-backend"
echo "Logs: sudo journalctl -u stardust-backend -f"
