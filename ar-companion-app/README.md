# AR Companion App

This AR companion app enables seamless deployment of CAD models from the web platform to AR headsets (MetaQuest 2/3 and HoloLens).

## Architecture

The AR companion app consists of:

1. **Unity Core** - Cross-platform AR foundation
2. **MetaQuest Plugin** - Quest-specific implementations  
3. **HoloLens Plugin** - HoloLens-specific implementations
4. **Communication Layer** - WebSocket connection to web platform
5. **CAD Model Renderer** - Optimized 3D model rendering
6. **AR Toolkit Integration** - Existing toolbar and interaction systems

## Features

- **Device Registration** - Connect and register with web platform
- **Real-time Model Reception** - Receive CAD models from web platform
- **AR Visualization** - Display models in AR space with full interactions
- **Toolbar Integration** - Use existing CAD toolbar functionality
- **Multi-platform Support** - Works on both Quest and HoloLens

## Setup Instructions

### MetaQuest 2/3
1. Install the `.apk` file on your Quest device
2. Launch the app and follow pairing instructions
3. Use the web platform to deploy models

### HoloLens
1. Deploy the UWP app to your HoloLens device  
2. Launch the app and follow pairing instructions
3. Use the web platform to deploy models

## Communication Protocol

The app communicates with the web platform via WebSocket using a JSON protocol:

```json
{
  "type": "device_registration",
  "deviceId": "quest-12345",
  "deviceName": "John's Quest 2",
  "deviceType": "metaquest", 
  "capabilities": ["mesh_rendering", "hand_tracking"]
}
```

See `Communication/` folder for full protocol specification.
