# AR/VR Visualization of Data - HoloDraft

## Overview

HoloDraft is an enterprise-grade CAD-to-AR visualization platform that enables engineers, designers, and creators to transform traditional CAD files into immersive augmented reality experiences. The platform bridges the gap between traditional CAD software and cutting-edge AR technology, specifically targeting MetaQuest devices for deployment.

## Features

- Multi-Format CAD Support: Upload and process STL, STEP, OBJ, PLY, and DAE files
- Automated Conversion Pipeline: Seamless conversion to AR-ready FBX format using Blender
- WebGL Preview: Real-time browser-based 3D model visualization
- AR Deployment: Direct deployment to MetaQuest devices via USB, WiFi, or Bluetooth
- Cloud Integration: Supabase backend for file storage and management
- Real-time Processing: Live conversion status and progress tracking

## Technical Stack

### Frontend (React + TypeScript)
- Framework: React 18 with TypeScript for type safety
- UI Components: Modern, responsive design with Framer Motion animations
- 3D Rendering: Three.js for WebGL visualization
- Styling: Custom CSS with dark mode and green accent theme

### Backend (Node.js + Express)
- Runtime: Node.js with Express.js framework
- File Processing: Multer for file uploads, Blender Python API for conversions
- Database: Supabase for cloud storage and metadata
- AR Integration: ADB (Android Debug Bridge) for device communication

### AR/VR Integration
- Target Platform: MetaQuest 2/3 devices
- Unity Engine: WebGL builds for browser preview
- Deployment: Custom APK generation and sideloading

## Project Structure

```
ar-vr-visualization-of-data/
├── src/                          # React frontend source
│   ├── components/
│   │   ├── ModernUploadZone.tsx  # File upload interface
│   │   ├── ModernFileCard.tsx    # File management UI
│   │   ├── WebGLViewer.tsx       # 3D model viewer
│   │   ├── ARDeployment.tsx      # AR device deployment
│   │   └── UnityCADViewer.tsx    # Unity WebGL integration
│   ├── App.tsx                   # Main application component
│   └── App.css                   # Application styling
├── backend/
│   ├── server.js                 # Express.js server
│   ├── uploads/                  # Temporary file storage
│   ├── converted/                # Processed FBX files
│   └── scripts/                  # Blender conversion scripts
├── public/
│   └── unity-webgl/              # Unity WebGL build output
├── Assets/                       # Unity project files
│   ├── Scripts/
│   │   └── CAD/
│   │       └── CADModelManager.cs # Unity CAD handling
│   └── Editor/
│       └── WebGLBuilder.cs       # Automated WebGL builds
└── package.json                  # Dependencies and scripts
```

## Component Architecture

### Frontend Components

#### ModernUploadZone.tsx
- Purpose: Handles file uploads with drag-and-drop functionality
- Features: File validation, progress tracking, visual feedback
- Technologies: React hooks, Framer Motion animations

#### ModernFileCard.tsx
- Purpose: Displays uploaded files with action buttons
- Features: File conversion, WebGL preview, AR deployment
- Technologies: TypeScript interfaces, status management

#### WebGLViewer.tsx
- Purpose: Browser-based 3D model visualization
- Features: Three.js rendering, camera controls, model loading
- Technologies: Three.js, WebGL, React refs

#### ARDeployment.tsx
- Purpose: MetaQuest device connection and deployment
- Features: Device scanning, connection management, progress tracking
- Technologies: ADB integration, WebSocket communication

#### UnityCADViewer.tsx
- Purpose: Unity WebGL player integration
- Features: Model loading, Unity-React communication
- Technologies: Unity WebGL, postMessage API

### Backend Architecture

#### server.js (Express.js)
- File Upload API: POST /api/upload - Handles multipart file uploads
- Conversion API: POST /api/convert/:fileId - Blender-powered FBX conversion
- File Management: GET /api/files - Lists uploaded files
- AR Device API: GET /api/scan-wifi-devices - Scans for MetaQuest devices
- Deployment API: POST /api/deploy-to-ar - Deploys models to AR devices

#### Blender Integration
- Language: Python with Blender API
- Process: STL/STEP/OBJ → FBX conversion
- Automation: Headless Blender execution
- Output: AR-optimized FBX files

### Unity Integration

#### CADModelManager.cs
- Purpose: Handles CAD model loading in Unity
- Features: FBX import, mesh processing, AR preparation
- Technologies: Unity C#, Asset Pipeline

#### WebGLBuilder.cs
- Purpose: Automated WebGL build generation
- Features: Build pipeline automation, optimization
- Technologies: Unity Editor scripting, BuildPipeline API

## Database Integration (Supabase)

### Why Supabase?
- Real-time Database: PostgreSQL with real-time subscriptions
- File Storage: Built-in file storage with CDN
- Authentication: User management and access control
- Scalability: Cloud-native architecture

### Integration Points
1. File Metadata: Stores upload information, conversion status
2. User Management: Handles authentication and permissions
3. Progress Tracking: Real-time conversion status updates
4. Asset Storage: Backup storage for converted files

## AR/VR Connection Architecture

### MetaQuest Integration

#### Connection Methods
1. USB Connection: Direct ADB connection for development
2. WiFi Connection: Wireless ADB over local network
3. Bluetooth: Proximity-based pairing for deployment

#### Deployment Process
1. Device Detection: ADB scans for connected devices
2. APK Generation: Unity builds custom AR application
3. Sideloading: APK installation via ADB
4. Model Transfer: FBX files transferred to device storage
5. Launch: AR application opens with loaded model

### AR Rendering Pipeline
1. Model Loading: FBX files loaded into Unity AR scene
2. Spatial Mapping: MetaQuest maps physical environment
3. Anchoring: Models anchored to real-world coordinates
4. Interaction: Hand tracking and gesture recognition
5. Rendering: Stereoscopic rendering for immersive experience

## Technology Choices

### Frontend: React + TypeScript
- Why React: Component-based architecture, large ecosystem
- Why TypeScript: Type safety, better IDE support, fewer runtime errors
- Benefits: Maintainable code, excellent developer experience

### Backend: Node.js + Express.js
- Why Node.js: JavaScript consistency, npm ecosystem, async I/O
- Why Express.js: Minimal framework, extensive middleware support
- Benefits: Fast development, scalable architecture

### 3D Rendering: Three.js
- Why Three.js: WebGL abstraction, comprehensive feature set
- Benefits: Cross-browser compatibility, active community

### AR Platform: Unity + MetaQuest
- Why Unity: Industry-standard AR/VR engine, C# ecosystem
- Why MetaQuest: Market leader, excellent developer tools
- Benefits: Proven platform, extensive documentation

### Database: Supabase
- Why Supabase: Open-source Firebase alternative, PostgreSQL
- Benefits: Real-time features, built-in authentication, scalable

## Installation and Setup

### Prerequisites
- Node.js 18+
- Unity 2022.3.0f1+
- Blender 3.0+
- MetaQuest Developer Account

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Frontend Setup
```bash
npm install
npm start
```

### Unity Setup
1. Open Unity Hub
2. Open project from root directory
3. Build WebGL player
4. Generate AR APK for MetaQuest

## Development Workflow

1. Upload CAD File: Use the web interface to upload STL/STEP/OBJ files
2. Automatic Conversion: Backend converts to FBX using Blender
3. WebGL Preview: View 3D model in browser using Three.js
4. AR Deployment: Deploy to MetaQuest via ADB connection
5. AR Experience: View and interact with model in augmented reality

## API Documentation

### File Upload
```
POST /api/upload
Content-Type: multipart/form-data
Body: file (CAD file)
```

### File Conversion
```
POST /api/convert/:fileId
Response: { success: true, convertedUrl: "/converted/file.fbx" }
```

### AR Deployment
```
POST /api/deploy-to-ar
Body: { deviceId: "192.168.1.100", modelUrl: "/converted/file.fbx" }
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License - see LICENSE file for details
