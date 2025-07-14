#!/bin/bash

# HoloDraft Complete Setup Script
# Sets up the entire CAD-to-AR development environment

echo "🎯 HoloDraft Setup - CAD to AR Pipeline"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_warning "This script is optimized for macOS. Some steps may need adjustment for other platforms."
fi

# 1. Check Prerequisites
echo "📋 Checking Prerequisites..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm installed: $NPM_VERSION"
else
    print_error "npm not found"
    exit 1
fi

# Check Unity (optional for now)
UNITY_PATH="/Applications/Unity/Hub/Editor/2022.3.40f1/Unity.app/Contents/MacOS/Unity"
if [ -f "$UNITY_PATH" ]; then
    print_status "Unity 2022.3 LTS found"
    UNITY_AVAILABLE=true
else
    print_warning "Unity 2022.3 LTS not found at expected location"
    print_info "You can install Unity later if you want to build WebGL/AR components"
    UNITY_AVAILABLE=false
fi

# Check Blender
if command -v blender &> /dev/null; then
    BLENDER_VERSION=$(blender --version | head -n 1)
    print_status "Blender found: $BLENDER_VERSION"
else
    print_warning "Blender not found. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install --cask blender
        print_status "Blender installed"
    else
        print_warning "Homebrew not found. Please install Blender manually from https://www.blender.org/"
    fi
fi

echo ""

# 2. Install Dependencies
echo "📦 Installing Dependencies..."
echo ""

print_info "Installing frontend dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_status "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

print_info "Installing backend dependencies..."
cd backend
npm install
if [ $? -eq 0 ]; then
    print_status "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ..

echo ""

# 3. Environment Configuration
echo "⚙️  Setting up Environment..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status "Created .env from .env.example"
        print_warning "Please configure your Supabase credentials in .env"
    else
        print_warning ".env.example not found. You may need to configure environment variables manually"
    fi
else
    print_status ".env file already exists"
fi

# Check backend .env
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        print_status "Created backend/.env from backend/.env.example"
    else
        print_info "Backend .env not needed for local development"
    fi
fi

echo ""

# 4. Directory Structure
echo "📁 Setting up Directory Structure..."
echo ""

# Create necessary directories
mkdir -p public/unity-builds/webgl
mkdir -p backend/uploads
mkdir -p backend/converted
mkdir -p backend/scripts
mkdir -p Assets/Scripts/CAD
mkdir -p Assets/Editor

print_status "Directory structure created"

echo ""

# 5. Unity Setup (if available)
if [ "$UNITY_AVAILABLE" = true ]; then
    echo "🎮 Unity Setup..."
    echo ""
    
    print_info "Unity WebGL build script is ready: ./build_unity_webgl.sh"
    print_info "CAD scripts are in Assets/Scripts/CAD/"
    print_info "Build scripts are in Assets/Editor/"
    
    # Make build script executable
    chmod +x build_unity_webgl.sh
    print_status "Build script permissions set"
    
    echo ""
fi

# 6. Test Backend Connection
echo "🔌 Testing Backend Setup..."
echo ""

print_info "Starting backend server for test..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for server to start
sleep 3

# Test health endpoint
if curl -s http://localhost:5000/api/health > /dev/null; then
    print_status "Backend server is responding"
else
    print_warning "Backend server test failed (this is OK if it's not running yet)"
fi

# Stop test server
kill $BACKEND_PID 2>/dev/null
wait $BACKEND_PID 2>/dev/null

echo ""

# 7. Summary and Next Steps
echo "🎉 Setup Complete!"
echo "=================="
echo ""

print_status "HoloDraft development environment is ready!"
echo ""

echo "🚀 To start developing:"
echo ""
echo "1. Start the backend server:"
echo "   cd backend && npm start"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   npm start"
echo ""
echo "3. Open your browser to http://localhost:3000"
echo ""

if [ "$UNITY_AVAILABLE" = true ]; then
    echo "🎮 To build Unity WebGL component:"
    echo "   ./build_unity_webgl.sh"
    echo ""
fi

echo "📋 Workflow:"
echo "   1. Upload CAD files (STL, STEP, OBJ, PLY, DAE)"
echo "   2. Convert to FBX format"
echo "   3. View in WebGL browser"
echo "   4. Deploy to AR headset"
echo ""

echo "🛠️  Available Scripts:"
echo "   - ./setup_holodraft.sh  (this script)"
echo "   - ./build_unity_webgl.sh  (Unity WebGL build)"
echo "   - npm start  (React development server)"
echo "   - cd backend && npm start  (Backend server)"
echo ""

print_info "Documentation: README.md"
print_info "Unity Setup: UNITY_SETUP.md"
print_info "Build Guide: UNITY_BUILD_GUIDE.md"

echo ""

# 8. Optional: Start development servers
read -p "🚀 Would you like to start the development servers now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Starting backend server..."
    cd backend
    npm start &
    BACKEND_PID=$!
    cd ..
    
    sleep 2
    
    print_info "Starting frontend server..."
    npm start &
    FRONTEND_PID=$!
    
    print_status "Development servers starting..."
    print_info "Backend: http://localhost:5000"
    print_info "Frontend: http://localhost:3000"
    print_info "Press Ctrl+C to stop servers when done"
    
    # Wait for user to stop
    wait
else
    print_info "You can start the servers manually when ready"
fi

echo ""
print_status "HoloDraft setup complete! 🎯"
