#!/bin/bash

# Build Release Script for Stardust Financial Vault
# Creates deployment package for AWS EC2

set -e  # Exit on any error

echo "🚀 Starting build process for Stardust Financial Vault..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf release
mkdir -p release

# Build Backend
print_status "Building Backend..."
cd backend

# Check if pkg is installed for creating executable
if ! command -v pkg &> /dev/null; then
    print_warning "pkg not found. Installing pkg for creating executable..."
    npm install -g pkg
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
npm install

# Create executable from backend
print_status "Creating backend executable..."
if [ -f "package.json" ]; then
    # Create a standalone executable using pkg
    pkg src/app.js --targets node18-linux-x64 --output ../release/app
    cd ..
    
    # Rename to app.jar for consistency with your requirement
    mv release/app release/app.jar
    print_status "Backend executable created: release/app.jar"
else
    print_error "package.json not found in backend directory"
    exit 1
fi

# Build Frontend
print_status "Building Frontend..."
cd frontend

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm install

# Build frontend
print_status "Building frontend application..."
npm run build

# Copy frontend build to release
print_status "Copying frontend build to release directory..."
cd ..
cp -r frontend/build release/dist
print_status "Frontend build copied to release/dist"

# Prepare Python Card Benefits Service
print_status "Preparing Python Card Benefits Service..."
mkdir -p release/creditcard-benefits

# Copy Python service files
cp backend/card-benefits-service/app.py release/creditcard-benefits/
cp backend/card-benefits-service/requirements.txt release/creditcard-benefits/
cp backend/card-benefits-service/.env release/creditcard-benefits/ 2>/dev/null || print_warning "No .env file found in card-benefits-service"

print_status "Python service files copied to release/creditcard-benefits"

# Create version info
print_status "Creating version information..."
echo "Build Date: $(date)" > release/VERSION.txt
echo "Git Commit: $(git rev-parse HEAD 2>/dev/null || echo 'N/A')" >> release/VERSION.txt
echo "Git Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'N/A')" >> release/VERSION.txt

# Create deployment info file
cat > release/DEPLOYMENT_INFO.txt << EOF
Stardust Financial Vault - Deployment Package

Directory Structure:
├── app.jar                    # Backend executable (Node.js)
├── dist/                      # Frontend build (React)
│   ├── index.html
│   ├── assets/
│   └── static files
├── creditcard-benefits/       # Python Card Benefits Service
│   ├── app.py
│   ├── requirements.txt
│   └── .env (if exists)
├── VERSION.txt               # Build information
└── DEPLOYMENT_INFO.txt       # This file

Deployment Instructions:
1. Upload entire release folder to EC2
2. Make app.jar executable: chmod +x app.jar
3. Install Python dependencies: cd creditcard-benefits && pip install -r requirements.txt
4. Run backend: ./app.jar
5. Run Python service: cd creditcard-benefits && python app.py
6. Serve frontend files with nginx or similar web server

Built on: $(date)
EOF

# Verify release structure
print_status "Verifying release structure..."
echo "Release folder contents:"
ls -la release/

# Check if all required files exist
required_files=("app.jar" "dist" "creditcard-benefits/app.py" "creditcard-benefits/requirements.txt")
for file in "${required_files[@]}"; do
    if [ -e "release/$file" ]; then
        print_status "✓ $file exists"
    else
        print_error "✗ $file missing"
        exit 1
    fi
done

# Create archive for easy transfer
print_status "Creating deployment archive..."
tar -czf stardust-release-$(date +%Y%m%d-%H%M%S).tar.gz release/

print_status "🎉 Build completed successfully!"
print_status "Release folder: ./release"
print_status "Archive created: stardust-release-$(date +%Y%m%d-%H%M%S).tar.gz"
print_status ""
print_status "Ready for deployment to AWS EC2 via Termius!"
