# 🎯 HoloDraft Workflow Guide

**The Complete CAD-to-AR Pipeline Experience**

## 🚀 Quick Start (5 Minutes)

### 1. Setup Your Environment
```bash
# Clone and setup (if not already done)
git clone [your-repo-url]
cd ar-vr-visualization-of-data

# Run the automated setup
./setup_holodraft.sh
```

### 2. Start Development Servers
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend  
npm start
```

### 3. Open Your Browser
Navigate to `http://localhost:3000` and you're ready!

---

## 👤 User Experience Flow

### **Step 1: Upload CAD File** 📤
- **User Action**: Drag & drop or click to upload
- **Supported Formats**: STL, STEP, OBJ, PLY, DAE
- **File Size Limit**: 50MB
- **What Happens**: File uploads to backend, gets validated and stored

### **Step 2: Automatic Conversion** 🔄  
- **User Action**: Click "Convert to FBX"
- **Backend Process**: 
  - Blender loads your CAD file
  - Converts to FBX format optimized for AR
  - Generates WebGL-compatible version
- **Duration**: 30 seconds - 2 minutes depending on file complexity

### **Step 3: Preview in WebGL** 👀
- **User Action**: Click "WebGL View"
- **Experience**:
  - 3D model loads in browser
  - Mouse controls for rotation/zoom
  - Basic material and lighting preview
  - No editing capabilities (view-only)

### **Step 4: Deploy to AR Headset** 🥽
- **User Action**: Click "Deploy to AR"
- **Connection Process**:
  1. System scans for nearby MetaQuest devices
  2. Choose connection method (USB/WiFi/Bluetooth)
  3. Select your MetaQuest device
  4. Click "Deploy to AR"
- **Deployment**: 
  - Model + HoloDraft AR app transfers to headset
  - Includes full CAD editing toolbar
  - Hand tracking and gesture controls enabled

### **Step 5: AR CAD Editing** ✏️
- **User puts on headset**
- **AR Experience**:
  - 3D model appears in real space
  - Hand gestures to grab, scale, rotate
  - CAD toolbar with measurement tools
  - Annotation and dimension tools
  - Real-time collaborative editing

---

## 🛠️ Technical Pipeline

```
📄 CAD File (STL/STEP/OBJ) 
    ↓
🔄 Blender Conversion (Python API)
    ↓  
📦 FBX + WebGL Assets
    ↓
🌐 React WebGL Viewer (Unity)
    ↓
📱 AR Deployment Pipeline
    ↓
🥽 MetaQuest AR Experience
```

---

## 🎮 For Developers

### Backend Architecture
```javascript
// File Upload
POST /api/upload
→ Multer file storage
→ Validation & metadata

// Conversion  
POST /api/convert/:fileId
→ Spawn Blender process
→ Python script execution
→ FBX output generation

// File Management
GET /api/files
DELETE /api/files/:fileId
```

### Frontend Components
```typescript
// Main App Flow
App.tsx
├── ModernUploadZone.tsx    // Drag & drop
├── ModernFileCard.tsx      // File status & actions  
├── UnityCADViewer.tsx      // WebGL integration
└── ARDeployment.tsx        // MetaQuest connection

// Unity Integration
unity-integration/
├── React/UnityWebGLWrapper.tsx
├── Scripts/WebGL/CADModelManager.cs
└── Scripts/AR/ARCADEditor.cs
```

---

## 🔧 Unity WebGL Build

### Build Process
```bash
# Automated build
./build_unity_webgl.sh

# Manual build (if needed)
Unity → File → Build Settings → WebGL → Build
```

### Integration Points
- **Model Loading**: `CADModelManager.LoadCADModel()`
- **Material System**: Real-time PBR materials
- **Interaction**: MRTK hand tracking
- **Communication**: Unity ↔ React messaging

---

## 📱 AR Deployment Pipeline

### MetaQuest Connection
1. **Device Discovery**: Bluetooth/WiFi scanning
2. **Connection Handshake**: Secure pairing
3. **App Installation**: HoloDraft AR app sideloading
4. **Model Transfer**: FBX + texture assets
5. **Launch**: Automatic AR session start

### AR Features
- **Hand Tracking**: Natural gesture controls
- **CAD Tools**: Measure, annotate, dimension
- **Collaboration**: Multi-user shared sessions
- **Export**: Save modifications back to CAD

---

## 🎯 User Personas & Use Cases

### **Design Engineer**
- **Goal**: Review CAD designs in 3D space
- **Workflow**: Upload → Convert → Quick WebGL check → AR review
- **Value**: Spatial understanding, design validation

### **Review Team**  
- **Goal**: Collaborative design feedback
- **Workflow**: Access shared model → AR collaboration session
- **Value**: Real-time communication, stakeholder engagement

### **Client Presentation**
- **Goal**: Impressive design showcase
- **Workflow**: WebGL demo → AR experience walkthrough
- **Value**: Visual impact, easy adoption

---

## 🚨 Troubleshooting

### Common Issues

**Upload Fails**
- Check file format (must be STL, STEP, OBJ, PLY, DAE)
- Verify file size under 50MB
- Ensure backend server is running

**Conversion Errors**
- Confirm Blender is installed
- Check backend logs: `tail -f backend/logs/conversion.log`
- Verify file isn't corrupted

**WebGL Not Loading**
- Build Unity WebGL: `./build_unity_webgl.sh`
- Check browser console for errors
- Ensure files in `public/unity-builds/webgl/`

**AR Deployment Issues**
- Confirm MetaQuest in developer mode
- Check USB/WiFi connection
- Verify Unity AR build configured

---

## 📊 Performance Expectations

| File Size | Upload Time | Conversion Time | WebGL Load | AR Transfer |
|-----------|-------------|-----------------|------------|-------------|
| < 1MB     | < 5s        | 30s            | 2s         | 10s         |
| 1-10MB    | 5-30s       | 1-2min         | 5s         | 30s         |
| 10-50MB   | 30s-2min    | 2-5min         | 10s        | 1-2min      |

---

## 🎉 Success Metrics

**User completed the full pipeline when they:**
1. ✅ Successfully upload a CAD file
2. ✅ Convert it to FBX without errors  
3. ✅ Preview model in WebGL viewer
4. ✅ Deploy to MetaQuest device
5. ✅ Experience model in AR with hand tracking

**This achieves the goal**: Traditional CAD → Modern AR workflow in under 10 minutes!

---

## 🔗 Next Steps

After successful deployment:
- **Advanced Editing**: Use AR toolbar for modifications
- **Collaboration**: Invite team members to shared AR session  
- **Export**: Save changes back to original CAD format
- **Integration**: Connect with existing CAD software workflows

**The future of CAD design is in your hands! 🙌**
