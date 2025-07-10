# Unity Build Configuration Guide

This project supports two build configurations:

## WebGL Build (Minimal XR)
- **Purpose**: Web preview with basic XR functionality
- **Packages**: Unity XR Management, XR Interaction Toolkit, Oculus XR Plugin, OpenXR
- **Features**: Basic 3D model rendering, simple interaction
- **Limitations**: No advanced hand tracking, no complex UI, no spatial anchors

## Android Build (Full MRTK)
- **Purpose**: MetaQuest deployment with full AR capabilities
- **Packages**: All WebGL packages + Microsoft Mixed Reality Toolkit (MRTK)
- **Features**: Advanced hand tracking, voice commands, spatial anchors, complex UI

## Switching Between Builds

### Using Unity Editor Menu
1. Open Unity Editor
2. Go to **Build** menu
3. Select **Switch to WebGL (without MRTK)** or **Switch to Android (with MRTK)**
4. Refresh Package Manager after switching

### Using Build Scripts
- **Build WebGL**: `Build > Build WebGL`
- **Build Android**: `Build > Build Android`

### Manual Process
1. **For WebGL**: Use the default `Packages/manifest.json`
2. **For Android**: Copy `Packages/manifest.android.json` to `Packages/manifest.json`

## File Structure
```
Packages/
├── manifest.json          # WebGL configuration (default)
├── manifest.android.json  # Android configuration with MRTK
└── ...

Assets/Scripts/
├── BuildManager.cs        # Build switching automation
└── ...
```

## Important Notes
- Always refresh Package Manager after switching configurations
- WebGL builds are optimized for web deployment
- Android builds require MRTK setup and configuration
- Both builds maintain 3D model rendering capabilities
- WebGL builds have smaller file sizes for web deployment
