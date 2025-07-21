using UnityEngine;
using UnityEditor;
using System.IO;
using UnityEngine.Rendering;

public class WebGLBuilder : MonoBehaviour
{
    [MenuItem("HoloDraft/Build WebGL")]
    public static void BuildWebGL()
    {
        string buildPath = "/Users/azrabano/cad-editor-react-website/public/unity-builds/webgl";
        
        // Ensure the directory exists
        if (!Directory.Exists(buildPath))
        {
            Directory.CreateDirectory(buildPath);
        }

        // Configure build settings
        BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions();
        buildPlayerOptions.scenes = new[] { "Assets/Scenes/SampleScene.unity" };
        buildPlayerOptions.locationPathName = buildPath;
        buildPlayerOptions.target = BuildTarget.WebGL;
        buildPlayerOptions.options = BuildOptions.None;

        // Set WebGL-specific settings for 60fps performance
        ConfigureWebGLPerformanceSettings();

        Debug.Log("Starting optimized WebGL build for HoloDraft (60fps target)...");
        BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
        
        if (report.summary.result == BuildResult.Succeeded)
        {
            Debug.Log($"✅ WebGL build succeeded! Built to: {buildPath}");
            Debug.Log($"Build size: {report.summary.totalSize} bytes");
            Debug.Log($"Build time: {report.summary.totalTime}");
            
            // Create optimized index.html with performance monitoring
            CreateOptimizedIndexHTML(buildPath);
        }
        else
        {
            Debug.LogError($"❌ WebGL build failed: {report.summary.result}");
        }
    }
    
    private static void ConfigureWebGLPerformanceSettings()
    {
        Debug.Log("[WebGL Builder] Configuring performance settings for 60fps...");
        
        // WebGL specific settings
        PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Brotli;
        PlayerSettings.WebGL.nameFilesAsHashes = true;
        PlayerSettings.WebGL.dataCaching = true;
        PlayerSettings.WebGL.decompressionFallback = false;
        PlayerSettings.WebGL.initialMemorySize = 64; // 64MB initial memory
        PlayerSettings.WebGL.maximumMemorySize = 2048; // 2GB max memory
        PlayerSettings.WebGL.memoryGrowthMode = WebGLMemoryGrowthMode.Geometric;
        PlayerSettings.WebGL.powerPreference = WebGLPowerPreference.HighPerformance;
        PlayerSettings.runInBackground = true;
        
        // Graphics settings for performance
        PlayerSettings.colorSpace = ColorSpace.Linear;
        PlayerSettings.graphicsJobs = true;
        PlayerSettings.MTRendering = true;
        
        // Quality settings optimized for WebGL
        QualitySettings.shadows = ShadowQuality.HardOnly;
        QualitySettings.shadowResolution = ShadowResolution.Medium;
        QualitySettings.shadowCascades = 2;
        QualitySettings.shadowDistance = 50f;
        QualitySettings.shadowmaskMode = ShadowmaskMode.Shadowmask;
        QualitySettings.shadowNearPlaneOffset = 2f;
        QualitySettings.shadowCascade2Split = 0.33333334f;
        
        // Rendering optimizations
        QualitySettings.pixelLightCount = 4;
        QualitySettings.anisotropicFiltering = AnisotropicFiltering.Enable;
        QualitySettings.antiAliasing = 0; // Disable MSAA for WebGL performance
        QualitySettings.softParticles = false;
        QualitySettings.realtimeReflectionProbes = false;
        QualitySettings.billboardsFaceCameraPosition = false;
        QualitySettings.asyncUploadTimeSlice = 2;
        QualitySettings.asyncUploadBufferSize = 16;
        QualitySettings.asyncUploadPersistentBuffer = true;
        
        // LOD settings
        QualitySettings.lodBias = 1.0f;
        QualitySettings.maximumLODLevel = 0;
        
        // Particle system settings
        QualitySettings.particleRaycastBudget = 256;
        QualitySettings.softVegetation = false;
        
        // Physics settings
        QualitySettings.vSyncCount = 0; // Disable VSync for WebGL
        
        // Graphics settings
        GraphicsSettings.useScriptableRenderPipelineBatching = true;
        
        // Shader stripping
        PlayerSettings.stripEngineCode = true;
        
        // Set target frame rate
        Application.targetFrameRate = 60;
        
        Debug.Log("[WebGL Builder] Performance settings configured");
    }
    
    private static void CreateOptimizedIndexHTML(string buildPath)
    {
        string htmlContent = @"<!DOCTYPE html>
<html lang=""en-us"">
<head>
    <meta charset=""utf-8"">
    <meta http-equiv=""Content-Type"" content=""text/html; charset=utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>HoloDraft - WebGL Optimized Viewer</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', Arial, sans-serif; 
            background: #0a0a0a; 
            color: #22c55e;
            overflow: hidden;
        }
        #gameContainer { 
            width: 100vw; 
            height: 100vh; 
            position: relative;
            background: #0a0a0a;
        }
        #unityContainer { 
            width: 100%; 
            height: 100%; 
            background: #0a0a0a;
        }
        .loading-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: #0a0a0a;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            transition: opacity 0.5s ease;
        }
        .loading-overlay.hidden { opacity: 0; pointer-events: none; }
        .loading-spinner {
            width: 60px; height: 60px;
            border: 4px solid #333;
            border-top: 4px solid #22c55e;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .loading-text {
            color: #22c55e;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .performance-monitor {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 8px;
            font-size: 12px;
            color: #22c55e;
            border: 1px solid #22c55e;
            z-index: 1001;
            display: none;
        }
        .performance-monitor.visible { display: block; }
        .perf-item {
            display: flex;
            justify-content: space-between;
            min-width: 120px;
            margin: 2px 0;
        }
        .toggle-perf {
            position: fixed;
            top: 10px;
            left: 10px;
            background: #22c55e;
            color: #0a0a0a;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            z-index: 1002;
        }
    </style>
</head>
<body>
    <div id=""gameContainer"">
        <div id=""unityContainer""></div>
        <div class=""loading-overlay"" id=""loadingOverlay"">
            <div class=""loading-spinner""></div>
            <div class=""loading-text"">Loading HoloDraft...</div>
            <div class=""loading-text"" style=""font-size: 12px; opacity: 0.7;"" id=""loadingProgress"">Initializing...</div>
        </div>
        <button class=""toggle-perf"" onclick=""togglePerformanceMonitor()"">PERF</button>
        <div class=""performance-monitor"" id=""performanceMonitor"">
            <div class=""perf-item""><span>FPS:</span> <span id=""fps"">--</span></div>
            <div class=""perf-item""><span>Frame Time:</span> <span id=""frameTime"">--</span></div>
            <div class=""perf-item""><span>Memory:</span> <span id=""memory"">--</span></div>
            <div class=""perf-item""><span>Draw Calls:</span> <span id=""drawCalls"">--</span></div>
        </div>
    </div>
    
    <script src=""Build/UnityLoader.js""></script>
    <script>
        let unityInstance = null;
        let performanceMonitorVisible = false;
        let lastFrameTime = performance.now();
        let frameCount = 0;
        let fps = 0;
        
        // Unity configuration for optimal performance
        const unityConfig = {
            dataUrl: ""Build/webgl.data.unityweb"",
            frameworkUrl: ""Build/webgl.framework.js.unityweb"",
            codeUrl: ""Build/webgl.wasm.unityweb"",
            streamingAssetsUrl: ""StreamingAssets"",
            companyName: ""HoloDraft"",
            productName: ""HoloDraft WebGL Viewer"",
            productVersion: ""1.0"",
            showBanner: false,
            matchWebGLToCanvasSize: true,
            devicePixelRatio: Math.min(window.devicePixelRatio, 2), // Limit pixel ratio for performance
        };
        
        // Performance monitoring
        function updatePerformanceMetrics() {
            if (!performanceMonitorVisible || !unityInstance) return;
            
            const now = performance.now();
            const deltaTime = now - lastFrameTime;
            frameCount++;
            
            if (frameCount % 60 === 0) { // Update every 60 frames
                fps = Math.round(1000 / deltaTime);
                document.getElementById('fps').textContent = fps;
                document.getElementById('frameTime').textContent = deltaTime.toFixed(1) + 'ms';
                
                // Memory usage (approximate)
                if (performance.memory) {
                    const memory = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                    document.getElementById('memory').textContent = memory + 'MB';
                }
            }
            
            lastFrameTime = now;
            requestAnimationFrame(updatePerformanceMetrics);
        }
        
        function togglePerformanceMonitor() {
            performanceMonitorVisible = !performanceMonitorVisible;
            const monitor = document.getElementById('performanceMonitor');
            if (performanceMonitorVisible) {
                monitor.classList.add('visible');
                updatePerformanceMetrics();
            } else {
                monitor.classList.remove('visible');
            }
        }
        
        // Unity loading with progress tracking
        function loadUnity() {
            const canvas = document.createElement('canvas');
            canvas.id = 'unity-canvas';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.display = 'block';
            
            document.getElementById('unityContainer').appendChild(canvas);
            
            unityInstance = UnityLoader.instantiate('unity-canvas', unityConfig, {
                onProgress: function(progress) {
                    const percent = Math.round(progress * 100);
                    document.getElementById('loadingProgress').textContent = 
                        `Loading... ${percent}%`;
                },
                
                Module: {
                    onRuntimeInitialized: function() {
                        console.log('[HoloDraft] Unity WebGL runtime initialized');
                        document.getElementById('loadingProgress').textContent = 'Starting application...';
                    },
                    
                    preRun: [function() {
                        console.log('[HoloDraft] Unity WebGL pre-run');
                        // Set WebGL context attributes for better performance
                        Module.canvas.getContext('webgl2', {
                            alpha: false,
                            antialias: false,
                            depth: true,
                            stencil: false,
                            powerPreference: 'high-performance',
                            premultipliedAlpha: false,
                            preserveDrawingBuffer: false
                        });
                    }]
                }
            }).then(function(instance) {
                unityInstance = instance;
                console.log('[HoloDraft] Unity WebGL loaded successfully');
                
                // Hide loading overlay
                setTimeout(() => {
                    document.getElementById('loadingOverlay').classList.add('hidden');
                }, 500);
                
                // Setup global functions for React integration
                setupReactIntegration();
                
                // Start performance monitoring
                updatePerformanceMetrics();
                
            }).catch(function(error) {
                console.error('[HoloDraft] Unity WebGL load failed:', error);
                document.getElementById('loadingProgress').textContent = 'Load failed: ' + error;
            });
        }
        
        function setupReactIntegration() {
            // Global functions for React to interact with Unity
            window.HoloDraft = {
                // Send message to Unity
                sendMessage: function(objectName, methodName, value) {
                    if (unityInstance) {
                        unityInstance.SendMessage(objectName, methodName, value || '');
                    }
                },
                
                // Load CAD model
                loadModel: function(modelData) {
                    this.sendMessage('CADManager', 'LoadModel', JSON.stringify(modelData));
                },
                
                // Set visualization mode
                setVisualizationMode: function(mode) {
                    this.sendMessage('CADManager', 'SetVisualizationMode', mode);
                },
                
                // Toggle wireframe
                toggleWireframe: function() {
                    this.sendMessage('CADManager', 'ToggleWireframe', '');
                },
                
                // Get performance metrics
                getPerformanceMetrics: function() {
                    return {
                        fps: fps,
                        frameTime: performance.now() - lastFrameTime,
                        memory: performance.memory ? performance.memory.usedJSHeapSize : 0
                    };
                },
                
                // Unity instance reference
                unity: function() {
                    return unityInstance;
                }
            };
            
            console.log('[HoloDraft] React integration setup complete');
        }
        
        // Handle window resize for responsive design
        window.addEventListener('resize', function() {
            if (unityInstance) {
                unityInstance.SetCanvasSize(window.innerWidth, window.innerHeight);
            }
        });
        
        // Initialize on load
        window.addEventListener('load', function() {
            loadUnity();
        });
        
        // Prevent right-click context menu
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'F11') {
                e.preventDefault();
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    document.getElementById('gameContainer').requestFullscreen();
                }
            }
            
            if (e.key === 'F12' || (e.ctrlKey && e.key === '`')) {
                e.preventDefault();
                togglePerformanceMonitor();
            }
        });
        
    </script>
</body>
</html>";

        File.WriteAllText(Path.Combine(buildPath, "index.html"), htmlContent);
        Debug.Log("[WebGL Builder] Created optimized index.html with performance monitoring");
    }

    [MenuItem("HoloDraft/Build WebGL (Command Line)")]
    public static void BuildWebGLCommandLine()
    {
        BuildWebGL();
        EditorApplication.Exit(0);
    }
    
    [MenuItem("HoloDraft/Optimize for WebGL")]
    public static void OptimizeForWebGL()
    {
        Debug.Log("[WebGL Builder] Applying WebGL optimizations...");
        ConfigureWebGLPerformanceSettings();
        Debug.Log("[WebGL Builder] WebGL optimizations applied");
    }
}
