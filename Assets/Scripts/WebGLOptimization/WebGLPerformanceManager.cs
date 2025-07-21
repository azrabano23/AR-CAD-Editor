using System.Collections.Generic;
using System.Collections;
using UnityEngine;
using UnityEngine.Rendering;

namespace HoloDraft.WebGL
{
    /// <summary>
    /// WebGL Performance Manager for optimizing massive dataset rendering at 60fps
    /// Implements multiple optimization strategies for WebGL builds
    /// </summary>
    public class WebGLPerformanceManager : MonoBehaviour
    {
        [Header("Performance Settings")]
        [SerializeField] private int targetFrameRate = 60;
        [SerializeField] private bool enablePerformanceMonitoring = true;
        [SerializeField] private bool enableDynamicLOD = true;
        [SerializeField] private bool enableFrustumCulling = true;
        [SerializeField] private bool enableOcclusionCulling = true;
        [SerializeField] private bool enableInstancedRendering = true;
        
        [Header("Quality Settings")]
        [SerializeField] private int maxVerticesPerFrame = 100000;
        [SerializeField] private int maxDrawCallsPerFrame = 1000;
        [SerializeField] private float lodBias = 1.0f;
        [SerializeField] private int shadowCascades = 2;
        [SerializeField] private ShadowResolution shadowResolution = ShadowResolution.Medium;
        
        [Header("Memory Management")]
        [SerializeField] private int maxTextureMemoryMB = 512;
        [SerializeField] private int maxMeshMemoryMB = 256;
        [SerializeField] private bool enableTextureCompression = true;
        [SerializeField] private bool enableMeshCompression = true;
        
        // Performance tracking
        private PerformanceTracker performanceTracker;
        private LODManager lodManager;
        private CullingManager cullingManager;
        private InstancedRenderingManager instancedRenderingManager;
        private MemoryManager memoryManager;
        
        // Optimization components
        private Camera mainCamera;
        private Dictionary<GameObject, OptimizationData> optimizationData = new Dictionary<GameObject, OptimizationData>();
        
        public static WebGLPerformanceManager Instance { get; private set; }
        
        // Events
        public System.Action<float> OnFPSChanged;
        public System.Action<int> OnDrawCallsChanged;
        public System.Action<long> OnMemoryUsageChanged;
        
        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                Initialize();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        private void Initialize()
        {
            // Set target frame rate
            Application.targetFrameRate = targetFrameRate;
            
            // Initialize optimization components
            performanceTracker = new PerformanceTracker();
            lodManager = new LODManager();
            cullingManager = new CullingManager();
            instancedRenderingManager = new InstancedRenderingManager();
            memoryManager = new MemoryManager();
            
            // Get main camera
            mainCamera = Camera.main;
            if (mainCamera == null)
                mainCamera = FindObjectOfType<Camera>();
            
            // Setup WebGL specific optimizations
            SetupWebGLOptimizations();
            
            Debug.Log("[WebGL Performance] Optimization manager initialized");
        }
        
        private void SetupWebGLOptimizations()
        {
            // Configure quality settings for WebGL
            QualitySettings.shadows = ShadowQuality.HardOnly;
            QualitySettings.shadowResolution = shadowResolution;
            QualitySettings.shadowCascades = shadowCascades;
            QualitySettings.lodBias = lodBias;
            QualitySettings.maximumLODLevel = 0;
            QualitySettings.antiAliasing = 0; // Disable MSAA for better performance
            
            // Disable expensive features
            QualitySettings.softParticles = false;
            QualitySettings.realtimeReflectionProbes = false;
            
            // Configure rendering pipeline
            GraphicsSettings.useScriptableRenderPipelineBatching = true;
            
            // Enable GPU instancing
            if (enableInstancedRendering)
            {
                instancedRenderingManager.Initialize();
            }
        }
        
        private void Update()
        {
            if (enablePerformanceMonitoring)
            {
                performanceTracker.Update();
                
                // Dynamic quality adjustment
                if (performanceTracker.CurrentFPS < targetFrameRate - 5)
                {
                    ReduceQuality();
                }
                else if (performanceTracker.CurrentFPS > targetFrameRate + 5)
                {
                    IncreaseQuality();
                }
            }
            
            // Update LOD system
            if (enableDynamicLOD && mainCamera != null)
            {
                lodManager.UpdateLODs(mainCamera);
            }
            
            // Update culling
            if (enableFrustumCulling || enableOcclusionCulling)
            {
                cullingManager.UpdateCulling(mainCamera);
            }
            
            // Memory management
            memoryManager.Update();
        }
        
        private void ReduceQuality()
        {
            // Reduce shadow resolution
            if (QualitySettings.shadowResolution > ShadowResolution.Low)
            {
                QualitySettings.shadowResolution = (ShadowResolution)((int)QualitySettings.shadowResolution - 1);
            }
            
            // Increase LOD bias (lower quality at same distance)
            QualitySettings.lodBias = Mathf.Max(0.5f, QualitySettings.lodBias - 0.1f);
            
            // Reduce texture quality
            QualitySettings.masterTextureLimit = Mathf.Min(3, QualitySettings.masterTextureLimit + 1);
            
            Debug.Log("[WebGL Performance] Quality reduced to maintain 60fps");
        }
        
        private void IncreaseQuality()
        {
            // Increase shadow resolution
            if (QualitySettings.shadowResolution < shadowResolution)
            {
                QualitySettings.shadowResolution = (ShadowResolution)((int)QualitySettings.shadowResolution + 1);
            }
            
            // Decrease LOD bias (higher quality at same distance)
            QualitySettings.lodBias = Mathf.Min(lodBias, QualitySettings.lodBias + 0.1f);
            
            // Increase texture quality
            QualitySettings.masterTextureLimit = Mathf.Max(0, QualitySettings.masterTextureLimit - 1);
        }
        
        public void RegisterObject(GameObject obj)
        {
            if (!optimizationData.ContainsKey(obj))
            {
                var data = new OptimizationData(obj);
                optimizationData[obj] = data;
                
                // Setup LOD if needed
                if (enableDynamicLOD)
                {
                    lodManager.SetupLOD(obj, data);
                }
                
                // Setup culling
                if (enableFrustumCulling || enableOcclusionCulling)
                {
                    cullingManager.RegisterObject(obj, data);
                }
                
                // Setup instancing if applicable
                if (enableInstancedRendering)
                {
                    instancedRenderingManager.RegisterObject(obj, data);
                }
            }
        }
        
        public void UnregisterObject(GameObject obj)
        {
            if (optimizationData.ContainsKey(obj))
            {
                lodManager.RemoveLOD(obj);
                cullingManager.UnregisterObject(obj);
                instancedRenderingManager.UnregisterObject(obj);
                optimizationData.Remove(obj);
            }
        }
        
        // Public API for getting performance metrics
        public float GetCurrentFPS() => performanceTracker?.CurrentFPS ?? 0f;
        public int GetCurrentDrawCalls() => performanceTracker?.DrawCalls ?? 0;
        public long GetMemoryUsage() => memoryManager?.GetCurrentMemoryUsage() ?? 0L;
        public int GetVisibleObjects() => cullingManager?.VisibleObjectCount ?? 0;
        
        private void OnDestroy()
        {
            performanceTracker?.Dispose();
            instancedRenderingManager?.Dispose();
        }
    }
    
    /// <summary>
    /// Stores optimization data for individual objects
    /// </summary>
    public class OptimizationData
    {
        public GameObject gameObject;
        public Renderer renderer;
        public MeshFilter meshFilter;
        public Bounds bounds;
        public float importance;
        public bool isVisible;
        public int currentLODLevel;
        public float distanceToCamera;
        
        public OptimizationData(GameObject obj)
        {
            gameObject = obj;
            renderer = obj.GetComponent<Renderer>();
            meshFilter = obj.GetComponent<MeshFilter>();
            bounds = renderer?.bounds ?? new Bounds();
            importance = 1.0f;
            isVisible = true;
            currentLODLevel = 0;
            distanceToCamera = 0f;
        }
    }
    
    /// <summary>
    /// Performance tracking and monitoring
    /// </summary>
    public class PerformanceTracker
    {
        private float[] frameTimes = new float[60];
        private int frameIndex = 0;
        private float lastFrameTime;
        
        public float CurrentFPS { get; private set; }
        public float AverageFPS { get; private set; }
        public int DrawCalls { get; private set; }
        public int Vertices { get; private set; }
        public int Triangles { get; private set; }
        
        public void Update()
        {
            float currentFrameTime = Time.unscaledTime;
            float deltaTime = currentFrameTime - lastFrameTime;
            lastFrameTime = currentFrameTime;
            
            frameTimes[frameIndex] = deltaTime;
            frameIndex = (frameIndex + 1) % frameTimes.Length;
            
            // Calculate current FPS
            CurrentFPS = 1.0f / deltaTime;
            
            // Calculate average FPS
            float totalTime = 0f;
            for (int i = 0; i < frameTimes.Length; i++)
            {
                totalTime += frameTimes[i];
            }
            AverageFPS = frameTimes.Length / totalTime;
            
            // Update rendering stats
            #if UNITY_2019_1_OR_NEWER
            DrawCalls = UnityEngine.Rendering.FrameDebugger.GetDrawCallCount();
            #endif
        }
        
        public void Dispose()
        {
            // Cleanup if needed
        }
    }
    
    /// <summary>
    /// Dynamic Level of Detail management
    /// </summary>
    public class LODManager
    {
        private Dictionary<GameObject, LODGroup> lodGroups = new Dictionary<GameObject, LODGroup>();
        private Dictionary<GameObject, List<Mesh>> lodMeshes = new Dictionary<GameObject, List<Mesh>>();
        
        public void SetupLOD(GameObject obj, OptimizationData data)
        {
            if (data.meshFilter?.sharedMesh == null) return;
            
            // Create LOD group
            LODGroup lodGroup = obj.GetComponent<LODGroup>();
            if (lodGroup == null)
            {
                lodGroup = obj.AddComponent<LODGroup>();
            }
            
            lodGroups[obj] = lodGroup;
            
            // Generate LOD meshes
            GenerateLODMeshes(obj, data);
            
            // Setup LOD levels
            SetupLODLevels(obj, lodGroup);
        }
        
        private void GenerateLODMeshes(GameObject obj, OptimizationData data)
        {
            var originalMesh = data.meshFilter.sharedMesh;
            var lodMeshList = new List<Mesh>();
            
            // LOD 0: Original mesh (100%)
            lodMeshList.Add(originalMesh);
            
            // LOD 1: Simplified mesh (50%)
            lodMeshList.Add(SimplifyMesh(originalMesh, 0.5f));
            
            // LOD 2: Simplified mesh (25%)
            lodMeshList.Add(SimplifyMesh(originalMesh, 0.25f));
            
            // LOD 3: Simplified mesh (10%)
            lodMeshList.Add(SimplifyMesh(originalMesh, 0.1f));
            
            lodMeshes[obj] = lodMeshList;
        }
        
        private Mesh SimplifyMesh(Mesh original, float quality)
        {
            // Simple mesh simplification - in production, use a proper mesh simplification library
            var simplified = new Mesh();
            var vertices = original.vertices;
            var triangles = original.triangles;
            var normals = original.normals;
            var uvs = original.uv;
            
            int targetVertexCount = Mathf.RoundToInt(vertices.Length * quality);
            targetVertexCount = Mathf.Max(3, targetVertexCount); // Minimum 3 vertices
            
            if (targetVertexCount >= vertices.Length)
            {
                simplified.vertices = vertices;
                simplified.triangles = triangles;
                simplified.normals = normals;
                simplified.uv = uvs;
            }
            else
            {
                // Simple decimation - take every nth vertex
                int step = vertices.Length / targetVertexCount;
                var newVertices = new List<Vector3>();
                var newNormals = new List<Vector3>();
                var newUvs = new List<Vector2>();
                
                for (int i = 0; i < vertices.Length; i += step)
                {
                    newVertices.Add(vertices[i]);
                    if (normals.Length > i) newNormals.Add(normals[i]);
                    if (uvs.Length > i) newUvs.Add(uvs[i]);
                }
                
                simplified.vertices = newVertices.ToArray();
                simplified.normals = newNormals.ToArray();
                simplified.uv = newUvs.ToArray();
                
                // Generate new triangles
                var newTriangles = new List<int>();
                for (int i = 0; i < newVertices.Count - 2; i += 3)
                {
                    newTriangles.Add(i);
                    newTriangles.Add(i + 1);
                    newTriangles.Add(i + 2);
                }
                simplified.triangles = newTriangles.ToArray();
            }
            
            simplified.RecalculateBounds();
            simplified.RecalculateNormals();
            return simplified;
        }
        
        private void SetupLODLevels(GameObject obj, LODGroup lodGroup)
        {
            var lods = new LOD[4];
            
            // LOD 0: 0-25% distance (high detail)
            lods[0] = new LOD(0.25f, new Renderer[] { obj.GetComponent<Renderer>() });
            
            // LOD 1: 25-50% distance (medium detail)
            lods[1] = new LOD(0.125f, new Renderer[] { obj.GetComponent<Renderer>() });
            
            // LOD 2: 50-75% distance (low detail)
            lods[2] = new LOD(0.0625f, new Renderer[] { obj.GetComponent<Renderer>() });
            
            // LOD 3: 75-100% distance (very low detail)
            lods[3] = new LOD(0.03125f, new Renderer[] { obj.GetComponent<Renderer>() });
            
            lodGroup.SetLODs(lods);
            lodGroup.RecalculateBounds();
        }
        
        public void UpdateLODs(Camera camera)
        {
            foreach (var kvp in lodGroups)
            {
                if (kvp.Key == null || kvp.Value == null) continue;
                
                float distance = Vector3.Distance(camera.transform.position, kvp.Key.transform.position);
                UpdateObjectLOD(kvp.Key, kvp.Value, distance);
            }
        }
        
        private void UpdateObjectLOD(GameObject obj, LODGroup lodGroup, float distance)
        {
            // LOD selection based on distance
            int lodLevel = 0;
            if (distance > 50f) lodLevel = 3;
            else if (distance > 25f) lodLevel = 2;
            else if (distance > 10f) lodLevel = 1;
            
            // Update mesh if LOD level changed
            if (lodMeshes.ContainsKey(obj))
            {
                var meshFilter = obj.GetComponent<MeshFilter>();
                if (meshFilter != null && lodLevel < lodMeshes[obj].Count)
                {
                    meshFilter.sharedMesh = lodMeshes[obj][lodLevel];
                }
            }
        }
        
        public void RemoveLOD(GameObject obj)
        {
            if (lodGroups.ContainsKey(obj))
            {
                lodGroups.Remove(obj);
            }
            if (lodMeshes.ContainsKey(obj))
            {
                lodMeshes.Remove(obj);
            }
        }
    }
    
    /// <summary>
    /// Frustum and occlusion culling management
    /// </summary>
    public class CullingManager
    {
        private Dictionary<GameObject, OptimizationData> objects = new Dictionary<GameObject, OptimizationData>();
        private Plane[] frustumPlanes = new Plane[6];
        
        public int VisibleObjectCount { get; private set; }
        
        public void RegisterObject(GameObject obj, OptimizationData data)
        {
            objects[obj] = data;
        }
        
        public void UnregisterObject(GameObject obj)
        {
            objects.Remove(obj);
        }
        
        public void UpdateCulling(Camera camera)
        {
            if (camera == null) return;
            
            // Calculate frustum planes
            GeometryUtility.CalculateFrustumPlanes(camera, frustumPlanes);
            
            int visibleCount = 0;
            
            foreach (var kvp in objects)
            {
                if (kvp.Key == null) continue;
                
                var obj = kvp.Key;
                var data = kvp.Value;
                
                // Update distance to camera
                data.distanceToCamera = Vector3.Distance(camera.transform.position, obj.transform.position);
                
                // Frustum culling
                bool inFrustum = GeometryUtility.TestPlanesAABB(frustumPlanes, data.bounds);
                
                // Occlusion culling (simplified)
                bool occluded = IsOccluded(obj, camera);
                
                bool shouldBeVisible = inFrustum && !occluded;
                
                if (data.isVisible != shouldBeVisible)
                {
                    data.isVisible = shouldBeVisible;
                    data.renderer.enabled = shouldBeVisible;
                }
                
                if (shouldBeVisible)
                {
                    visibleCount++;
                }
            }
            
            VisibleObjectCount = visibleCount;
        }
        
        private bool IsOccluded(GameObject obj, Camera camera)
        {
            // Simple occlusion test using raycasting
            Vector3 directionToObject = (obj.transform.position - camera.transform.position).normalized;
            float distanceToObject = Vector3.Distance(camera.transform.position, obj.transform.position);
            
            RaycastHit hit;
            if (Physics.Raycast(camera.transform.position, directionToObject, out hit, distanceToObject))
            {
                return hit.collider.gameObject != obj;
            }
            
            return false;
        }
    }
    
    /// <summary>
    /// GPU Instanced rendering for similar objects
    /// </summary>
    public class InstancedRenderingManager
    {
        private Dictionary<Mesh, List<Matrix4x4>> instancedObjects = new Dictionary<Mesh, List<Matrix4x4>>();
        private Dictionary<Material, Mesh> materialToMesh = new Dictionary<Material, Mesh>();
        
        public void Initialize()
        {
            // Enable GPU instancing in shaders
            Shader.EnableKeyword("_INSTANCING_ON");
        }
        
        public void RegisterObject(GameObject obj, OptimizationData data)
        {
            if (data.meshFilter?.sharedMesh == null || data.renderer?.sharedMaterial == null) return;
            
            var mesh = data.meshFilter.sharedMesh;
            var material = data.renderer.sharedMaterial;
            
            if (!instancedObjects.ContainsKey(mesh))
            {
                instancedObjects[mesh] = new List<Matrix4x4>();
            }
            
            instancedObjects[mesh].Add(obj.transform.localToWorldMatrix);
            materialToMesh[material] = mesh;
        }
        
        public void UnregisterObject(GameObject obj)
        {
            // Remove from instanced rendering
            var data = obj.GetComponent<MeshFilter>();
            if (data?.sharedMesh != null && instancedObjects.ContainsKey(data.sharedMesh))
            {
                var matrices = instancedObjects[data.sharedMesh];
                matrices.Remove(obj.transform.localToWorldMatrix);
                
                if (matrices.Count == 0)
                {
                    instancedObjects.Remove(data.sharedMesh);
                }
            }
        }
        
        public void RenderInstances()
        {
            foreach (var kvp in instancedObjects)
            {
                var mesh = kvp.Key;
                var matrices = kvp.Value;
                
                if (matrices.Count == 0) continue;
                
                // Find material for this mesh
                Material material = null;
                foreach (var matKvp in materialToMesh)
                {
                    if (matKvp.Value == mesh)
                    {
                        material = matKvp.Key;
                        break;
                    }
                }
                
                if (material == null) continue;
                
                // Render instances
                Graphics.DrawMeshInstanced(mesh, 0, material, matrices.ToArray());
            }
        }
        
        public void Dispose()
        {
            instancedObjects.Clear();
            materialToMesh.Clear();
        }
    }
    
    /// <summary>
    /// Memory management and optimization
    /// </summary>
    public class MemoryManager
    {
        private float lastGCTime;
        private const float GC_INTERVAL = 10f; // Run GC every 10 seconds
        
        public void Update()
        {
            // Periodic garbage collection for WebGL
            if (Time.time - lastGCTime > GC_INTERVAL)
            {
                System.GC.Collect();
                lastGCTime = Time.time;
            }
            
            // Monitor memory usage
            CheckMemoryUsage();
        }
        
        private void CheckMemoryUsage()
        {
            #if UNITY_WEBGL && !UNITY_EDITOR
            // WebGL specific memory monitoring
            long memoryUsage = System.GC.GetTotalMemory(false);
            
            if (memoryUsage > 1024 * 1024 * 512) // 512MB threshold
            {
                Debug.LogWarning("[WebGL Performance] High memory usage detected: " + (memoryUsage / 1024 / 1024) + "MB");
                OptimizeMemory();
            }
            #endif
        }
        
        private void OptimizeMemory()
        {
            // Force garbage collection
            System.GC.Collect();
            
            // Unload unused assets
            Resources.UnloadUnusedAssets();
            
            Debug.Log("[WebGL Performance] Memory optimization performed");
        }
        
        public long GetCurrentMemoryUsage()
        {
            return System.GC.GetTotalMemory(false);
        }
    }
}
