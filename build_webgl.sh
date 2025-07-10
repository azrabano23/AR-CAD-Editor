#!/bin/bash

# Build Unity WebGL without compression
echo "🚀 Building Unity WebGL without compression..."

# Set Unity project path
PROJECT_PATH="/Users/azrabano/cad-editor-react-website"
UNITY_PATH="/Applications/Unity/Hub/Editor/2022.3.0f1/Unity.app/Contents/MacOS/Unity"

# Build command
$UNITY_PATH \
  -projectPath "$PROJECT_PATH" \
  -buildTarget WebGL \
  -batchmode \
  -quit \
  -nographics \
  -logFile /tmp/unity_build.log \
  -executeMethod BuildManager.BuildWebGL

echo "✅ Unity WebGL build completed!"
echo "📁 Build output: $PROJECT_PATH/public/unity-builds/webgl-new/"

# Check if build was successful
if [ -d "$PROJECT_PATH/public/unity-builds/webgl-new/" ]; then
    echo "🎯 Build successful! Files are ready for deployment."
    ls -la "$PROJECT_PATH/public/unity-builds/webgl-new/"
else
    echo "❌ Build failed! Check Unity console for errors."
    cat /tmp/unity_build.log
fi
