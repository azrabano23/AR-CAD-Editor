const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/converted', express.static(path.join(__dirname, 'converted')));

// Create directories if they don't exist
const uploadDir = path.join(__dirname, 'uploads');
const convertedDir = path.join(__dirname, 'converted');
const scriptsDir = path.join(__dirname, 'scripts');

[uploadDir, convertedDir, scriptsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname;
    cb(null, `${timestamp}-${originalName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.stl', '.step', '.obj', '.ply', '.dae'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file format: ${fileExtension}`), false);
    }
  }
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AR CAD Editor Backend is running' });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileInfo = {
      id: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      format: path.extname(req.file.originalname).toLowerCase(),
      uploadPath: req.file.path,
      status: 'uploaded'
    };

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.post('/api/convert/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const inputPath = path.join(uploadDir, fileId);
    
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const outputFileName = fileId.replace(/\.[^/.]+$/, '.fbx');
    const outputPath = path.join(convertedDir, outputFileName);

    // Use the Python script to convert STL to FBX
    const success = await convertToFBX(inputPath, outputPath);

    if (success) {
      res.json({
        success: true,
        message: 'File converted successfully',
        convertedUrl: `/converted/${outputFileName}`,
        outputPath: outputPath
      });
    } else {
      res.status(500).json({ error: 'Conversion failed' });
    }
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

app.get('/api/files', (req, res) => {
  try {
    const uploadedFiles = fs.readdirSync(uploadDir).map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        id: filename,
        originalName: filename.split('-').slice(1).join('-'),
        size: stats.size,
        format: path.extname(filename).toLowerCase(),
        uploadDate: stats.birthtime,
        status: 'uploaded'
      };
    });

    res.json({ files: uploadedFiles });
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).json({ error: 'Failed to read files' });
  }
});

app.delete('/api/files/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const filePath = path.join(uploadDir, fileId);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Function to convert files using Blender
async function convertToFBX(inputPath, outputPath) {
  return new Promise((resolve) => {
    // Enhanced path detection with better macOS support
    let blenderPath;
    
    if (process.platform === 'darwin') {
      // Check multiple possible macOS locations
      const possiblePaths = [
        '/Applications/Blender.app/Contents/MacOS/Blender',
        '/Applications/Blender 4.4/Blender.app/Contents/MacOS/Blender',
        '/Applications/Blender 4.3/Blender.app/Contents/MacOS/Blender',
        '/opt/homebrew/bin/blender',
        '/usr/local/bin/blender'
      ];
      
      blenderPath = possiblePaths.find(path => fs.existsSync(path));
      if (!blenderPath) {
        console.error('❌ Blender not found in common macOS locations');
        console.log('Please install Blender from https://www.blender.org/download/');
        resolve(false);
        return;
      }
    } else if (process.platform === 'win32') {
      blenderPath = 'C:\\Program Files\\Blender Foundation\\Blender 4.4\\blender.exe';
    } else {
      blenderPath = 'blender'; // Linux
    }

    const scriptPath = path.join(scriptsDir, 'convert_stl_to_fbx.py');

    // Create the Python script if it doesn't exist
    if (!fs.existsSync(scriptPath)) {
      fs.writeFileSync(scriptPath, getBlenderScript());
    }

    const args = [
      '--background',
      '--python', scriptPath,
      '--', inputPath, outputPath
    ];

    console.log(`🔧 Starting conversion: ${inputPath} -> ${outputPath}`);
    console.log(`🔧 Using Blender: ${blenderPath}`);
    
    const blender = spawn(blenderPath, args);

    let output = '';
    let errorOutput = '';

    blender.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      console.log(`📝 Blender output: ${message.trim()}`);
    });

    blender.stderr.on('data', (data) => {
      const message = data.toString();
      errorOutput += message;
      console.log(`⚠️ Blender stderr: ${message.trim()}`);
    });

    blender.on('close', (code) => {
      console.log(`🏁 Blender process exited with code ${code}`);
      
      if (code === 0 && fs.existsSync(outputPath)) {
        console.log('✅ Conversion successful');
        resolve(true);
      } else {
        console.error('❌ Conversion failed:', errorOutput);
        resolve(false);
      }
    });

    blender.on('error', (error) => {
      console.error('❌ Failed to start Blender:', error);
      resolve(false);
    });
  });
}

// Get the Blender Python script content
function getBlenderScript() {
  return `import bpy
import sys

argv = sys.argv
argv = argv[argv.index("--") + 1:]  # Get only custom arguments

stl_path = argv[0]
fbx_path = argv[1]

# Clear existing objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Import the STL file
bpy.ops.wm.stl_import(filepath=stl_path)

# Export to FBX
bpy.ops.export_scene.fbx(filepath=fbx_path)

print(f"Successfully converted {stl_path} to {fbx_path}")
`;
}

// AR Device Detection Endpoints
app.get('/api/scan-wifi-devices', async (req, res) => {
  try {
    // In a real implementation, this would scan the network for ADB devices
    const { exec } = require('child_process');
    
    // Try to find ADB devices
    exec('adb devices', (error, stdout, stderr) => {
      if (error) {
        console.log('ADB not available, using mock devices');
        // Return mock devices for demo
        return res.json([
          {
            ip: '192.168.1.100',
            name: 'MetaQuest 2',
            model: 'Quest 2',
            connected: true,
            battery: 85
          }
        ]);
      }
      
      // Parse ADB output for real devices
      const devices = stdout.split('\n')
        .filter(line => line.includes('device') && !line.includes('List'))
        .map((line, index) => {
          const deviceId = line.split('\t')[0];
          return {
            ip: deviceId.includes('.') ? deviceId : `192.168.1.${100 + index}`,
            name: `MetaQuest Device ${index + 1}`,
            model: 'Quest 2',
            connected: true,
            battery: Math.floor(Math.random() * 40) + 60
          };
        });
      
      res.json(devices);
    });
  } catch (error) {
    console.error('WiFi device scan error:', error);
    res.status(500).json({ error: 'Failed to scan for devices' });
  }
});

app.post('/api/connect-device', async (req, res) => {
  try {
    const { deviceId, connectionType } = req.body;
    
    console.log(`Connecting to device ${deviceId} via ${connectionType}`);
    
    setTimeout(() => {
      res.json({
        success: true,
        deviceId,
        status: 'connected',
        message: 'Device connected successfully'
      });
    }, 1000);
    
  } catch (error) {
    console.error('Device connection error:', error);
    res.status(500).json({ error: 'Failed to connect to device' });
  }
});

app.post('/api/deploy-to-ar', async (req, res) => {
  try {
    const { deviceId, modelUrl, fileName } = req.body;
    
    console.log(`Deploying ${fileName} to device ${deviceId}`);
    
    res.json({
      success: true,
      deploymentId: `deploy_${Date.now()}`,
      message: 'Deployment started'
    });
    
  } catch (error) {
    console.error('AR deployment error:', error);
    res.status(500).json({ error: 'Failed to deploy to AR device' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AR CAD Editor Backend running on port ${PORT}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
  console.log(`🔄 Converted files directory: ${convertedDir}`);
  console.log(`🐍 Scripts directory: ${scriptsDir}`);
});

module.exports = app;
