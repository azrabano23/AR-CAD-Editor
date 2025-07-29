# HoloDraft System Architecture Diagram

## For Poster Presentation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              HOLODRAFT PLATFORM                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   USER INPUT    │    │   PROCESSING    │    │   AR/VR OUTPUT  │
└─────────────────┘    └─────────────────┘    └─────────────────┘

     Upload              Conversion            Deployment
        │                    │                    │
        ▼                    ▼                    ▼

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  CAD FILES      │───▶│   BACKEND       │───▶│  AR DEVICES     │
│                 │    │                 │    │                 │
│ • STL           │    │ Node.js Server  │    │ • MetaQuest     │
│ • STEP          │    │ Express API     │    │ • HoloLens      │
│ • OBJ           │    │ Blender Auto    │    │ • Mobile AR     │
│ • PLY           │    │ File Processing │    │                 │
│ • DAE           │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                    │                    │
        │                    ▼                    │
        │              ┌─────────────────┐        │
        │              │   SUPABASE      │        │
        │              │                 │        │
        │              │ • Authentication│        │
        │              │ • File Storage  │        │
        │              │ • User Database │        │
        │              │ • Real-time Sync│        │
        │              └─────────────────┘        │
        │                    │                    │
        └──────────────────▼────────────────────┘
                      
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + TypeScript)                           │
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Upload    │  │   Preview   │  │   Deploy    │  │ Collaborate │           │
│  │   Interface │  │   WebGL     │  │   to AR     │  │   & Share   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────────────────────┘

DATA FLOW:
1. User uploads CAD file → React Frontend
2. File sent to Node.js Backend via API
3. Backend stores file in Supabase Storage
4. Blender processes & converts to FBX format
5. Converted file stored back in Supabase
6. User deploys to AR device with one click
7. Real-time collaboration via Supabase sync

KEY BENEFITS:
✓ 3-Step Process (Upload → Preview → Deploy)
✓ Cross-Platform Compatibility
✓ Real-time Collaboration
✓ Secure Cloud Storage
✓ No Technical Expertise Required
```

## Simplified Visual Flow for Poster:

```
CAD FILE → HOLODRAFT → AR DEVICE
   ↓           ↓           ↓
[STL/OBJ]  [Convert]   [MetaQuest]
   ↓           ▼           ↓
[Upload]   [Optimize]  [HoloLens]
   ↓           ▼           ↓
[Store]    [Deploy]    [Mobile AR]

Powered by: React + Node.js + Supabase + Blender
```

## Technology Stack Visual:

```
┌─────────────┐
│  FRONTEND   │  React + TypeScript
├─────────────┤
│   BACKEND   │  Node.js + Express
├─────────────┤
│  DATABASE   │  Supabase (Auth + Storage)
├─────────────┤
│ CONVERSION  │  Blender Automation
├─────────────┤
│ AR/VR DEPLOY│  WebGL + Device APIs
└─────────────┘
```
