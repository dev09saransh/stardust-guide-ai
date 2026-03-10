#!/bin/bash

# Frontend Service Setup for EC2
echo "Setting up Frontend Service..."

# Install serve globally if not exists
npm list -g serve || npm install -g serve

# Create systemd service for frontend
sudo tee /etc/systemd/system/stardust-frontend.service > /dev/null <<EOF
[Unit]
Description=Stardust Frontend Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/dist
ExecStart=/usr/bin/serve -s /home/ubuntu/dist -l 3000
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=stardust-frontend

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable stardust-frontend
sudo systemctl start stardust-frontend

echo "✅ Frontend service started!"
echo "Status: sudo systemctl status stardust-frontend"
echo "Logs: sudo journalctl -u stardust-frontend -f"
