# EC2 Setup Scripts Location

## Local Location
```
/Volumes/ssd/coc/ec2-setup/
├── backend-service.sh
├── frontend-service.sh  
├── python-service.sh
├── deploy-all-services.sh
└── README.md
```

## Upload to EC2
Upload these files to your EC2 server at:
```
/home/ubuntu/
```

## Quick Upload Commands (if using SCP)
```bash
# From your local machine:
scp /Volumes/ssd/coc/ec2-setup/*.sh ubuntu@16.170.248.196:/home/ubuntu/
```

## After Upload
On your EC2 server, run:
```bash
cd /home/ubuntu
chmod +x deploy-all-services.sh
./deploy-all-services.sh
```
