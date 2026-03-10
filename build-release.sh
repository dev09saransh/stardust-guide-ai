#!/bin/bash

# Build Release Script for Stardust Financial Vault
# Creates deployment package for AWS EC2

set -e  # Exit on any error

echo "🚀 Starting build process for Stardust Financial Vault..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf release
mkdir -p release

# Build Backend
print_status "Building Backend..."
cd backend
npm install
print_status "Creating backend executable..."
npx pkg src/app.js --targets node18-linux-x64 --output ../release/app
cd ..
mv release/app release/app.jar
print_status "Backend executable created: release/app.jar"

# Build Frontend
print_status "Building Frontend..."
cd frontend
npm install
print_status "Building frontend application..."
npm run build
cd ..
cp -r frontend/build release/dist
print_status "Frontend build copied to release/dist"

# Copy Backend Environment Configuration
if [ -f "backend/.env" ]; then
    cp backend/.env release/.env
    print_status "Backend .env included in release"
else
    print_warning "backend/.env not found - you will need to create it manually on EC2"
fi

# Prepare Python Card Benefits Service
print_status "Preparing Python Card Benefits Service..."
mkdir -p release/creditcard-benefits
cp backend/card-benefits-service/app.py release/creditcard-benefits/
cp backend/card-benefits-service/requirements.txt release/creditcard-benefits/
if [ -f "backend/card-benefits-service/.env" ]; then
    cp backend/card-benefits-service/.env release/creditcard-benefits/.env
    print_status "Python service .env included in release"
fi

# Create version info
print_status "Creating version information..."
echo "Build Date: $(date)" > release/VERSION.txt
echo "Git Commit: $(git rev-parse HEAD 2>/dev/null || echo 'N/A')" >> release/VERSION.txt

cat > release/DEPLOYMENT_INFO.txt << EOF
Stardust Financial Vault - Deployment Package
IP Address: 13.48.25.209
Backend: Port 5001
Frontend: Port 3000
Python Service: Port 5005

Directory Structure:
├── app.jar                # Backend binary
├── .env                   # Backend credentials (DB/JWT/RDS)
├── dist/                  # Frontend optimized build
└── creditcard-benefits/   # AI Service
    ├── app.py
    └── .env               # Gemini API Key

Built on: $(date)
EOF

# Create archive
print_status "Creating deployment archive..."
tar -czf stardust-release-$(date +%Y%m%d-%H%M%S).tar.gz release/

print_status "🎉 Build completed successfully!"
print_status "Release folder: ./release"
