#!/bin/bash

# Python Card Benefits Service Setup for EC2
echo "Setting up Python Card Benefits Service..."

# Install Python dependencies
cd /home/ubuntu/creditcard-benefits
pip3 install -r requirements.txt

# Create systemd service for Python app
sudo tee /etc/systemd/system/stardust-python.service > /dev/null <<EOF
[Unit]
Description=Stardust Python Card Benefits Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/creditcard-benefits
Environment=PATH=/usr/bin:/usr/local/bin
ExecStart=/usr/bin/python3 app.py
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=stardust-python

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable stardust-python
sudo systemctl start stardust-python

echo "✅ Python service started!"
echo "Status: sudo systemctl status stardust-python"
echo "Logs: sudo journalctl -u stardust-python -f"
