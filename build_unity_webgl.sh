#!/bin/bash

# HoloDraft Unity WebGL Build Script
# This script automates the Unity WebGL build process for the CAD viewer

echo "🚀 Starting HoloDraft Unity WebGL Build Process..."

# Configuration
UNITY_PATH="/Applications/Unity/Hub/Editor/2022.3.0f1/Unity.app/Contents/MacOS/Unity"
PROJECT_PATH="$(pwd)"
BUILD_PATH="$PROJECT_PATH/public/unity-builds/webgl"
LOG_FILE="$PROJECT_PATH/unity-webgl-build.log"

# Unity method to call for building
UNITY_METHOD="WebGLBuilder.BuildWebGL"

# Check if Unity exists
if [ ! -f "$UNITY_PATH" ]; then
    echo "❌ Unity not found at $UNITY_PATH"
    echo "   Please install Unity 2022.3 LTS or update the UNITY_PATH variable"
    exit 1
fi

# Create build directory
echo "📁 Creating build directory..."
mkdir -p "$BUILD_PATH"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf "$BUILD_PATH"/*

echo "🔧 Starting Unity build..."
echo "   Project: $PROJECT_PATH"
echo "   Output: $BUILD_PATH"
echo "   Log: $LOG_FILE"

# Run Unity build
"$UNITY_PATH" \
    -batchmode \
    -quit \
    -projectPath "$PROJECT_PATH" \
    -buildTarget WebGL \
    -executeMethod "$UNITY_METHOD" \
    -logFile "$LOG_FILE"

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Unity WebGL build completed successfully!"
    echo "📦 Build output: $BUILD_PATH"
    
    # List build contents
    echo "📋 Build contents:"
    ls -la "$BUILD_PATH"
    
    # Check if index.html exists
    if [ -f "$BUILD_PATH/index.html" ]; then
        echo "🌐 WebGL build is ready for deployment"
        echo "   You can now serve this from your React app's public folder"
    else
        echo "⚠️  Warning: index.html not found in build output"
    fi
    
else
    echo "❌ Unity build failed!"
    echo "📋 Check the log file for details: $LOG_FILE"
    echo ""
    echo "Last 20 lines of log:"
    tail -n 20 "$LOG_FILE" 2>/dev/null || echo "Could not read log file"
    exit 1
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. The WebGL build is now in public/unity-builds/webgl/"
echo "   2. Start your React development server: npm start"
echo "   3. The Unity viewer will be accessible through your web app"
echo "   4. Upload CAD files and test the WebGL viewer"
echo ""
echo "🔗 Integration:"
echo "   - WebGL build integrates with src/components/UnityCADViewer.tsx"
echo "   - File communication handled by unity-integration/React/"
echo "   - AR deployment pipeline connects to MetaQuest devices"

# Optional: Open browser to local development server
read -p "🌐 Would you like to open the development server? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Opening http://localhost:3000 in your default browser..."
    open "http://localhost:3000" 2>/dev/null || echo "Could not open browser automatically"
fi

echo "✨ HoloDraft WebGL build process complete!"
