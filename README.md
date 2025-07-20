# HoloDraft - CAD to AR Platform

A modern web application that transforms CAD designs into immersive AR experiences for MetaQuest headsets. Upload your 3D files and deploy instantly to AR.

## Features

### Core Functionality
- **Multi-format CAD Support**: STL, STEP, OBJ, PLY, DAE file formats
- **Real-time Conversion**: Automatic FBX conversion for AR compatibility
- **AR Deployment**: Direct deployment to MetaQuest headsets
- **WebGL Preview**: Interactive 3D model viewer
- **Project Management**: Organize and manage multiple CAD projects

### User Interface
- **Modern Dark Theme**: Professional black/green interface
- **Responsive Design**: Optimized for desktop and mobile
- **Drag & Drop Upload**: Intuitive file upload experience
- **Real-time Progress**: Live upload and conversion feedback
- **File Management**: Comprehensive project workspace

### Technical Features
- **Authentication System**: Secure user accounts with Supabase
- **Database Integration**: PostgreSQL with real-time updates
- **File Processing**: Backend API for CAD file conversion
- **Error Handling**: Robust error management and user feedback

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Framer Motion** for animations
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **Supabase** for authentication and database
- **PostgreSQL** for data storage
- **File processing** API for CAD conversion

### AR/VR Integration
- **Unity WebGL** build system
- **Mixed Reality Toolkit** (MRTK)
- **MetaQuest** deployment ready

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Supabase account
- Unity 2022.3+ (for AR features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/azrabano23/AR-CAD-Editor.git
cd AR-CAD-Editor
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=http://localhost:3001
```

5. Start the development server:
```bash
npm start
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
npm install
```

2. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:3001`

## Project Structure

```
src/
├── components/           # React components
│   ├── Dashboard.tsx    # User dashboard
│   ├── ProjectWorkspace.tsx  # File upload workspace
│   ├── AuthPage.tsx     # Authentication
│   ├── ModernUploadZone.tsx  # Drag & drop upload
│   └── ModernButton.tsx # Reusable button component
├── lib/                 # Utilities and services
│   ├── supabaseClient.ts    # Database client
│   └── mockAuth.ts      # Development authentication
├── App.tsx              # Main application
├── App.css              # Global styles
└── index.tsx            # Application entry point

backend/
├── server.js            # Express server
├── routes/              # API routes
│   ├── upload.js        # File upload handling
│   └── convert.js       # CAD file conversion
└── middleware/          # Custom middleware

Assets/                  # Unity project files
├── Scripts/             # C# scripts
├── Scenes/              # Unity scenes
└── Prefabs/             # Reusable objects
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
