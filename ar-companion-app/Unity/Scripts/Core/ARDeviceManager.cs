using System;
using UnityEngine;
using UnityEngine.XR.ARFoundation;
using Unity.Netcode;
using System.Collections;
using System.Collections.Generic;

namespace ARCompanion.Core
{
    /// <summary>
    /// Main AR Device Manager that coordinates between web platform and AR functionality
    /// </summary>
    public class ARDeviceManager : MonoBehaviour
    {
        [Header("Device Configuration")]
        public string deviceId;
        public string deviceName;
        public DeviceType deviceType;
        
        [Header("Components")]
        public ARSession arSession;
        public ARSessionOrigin arSessionOrigin;
        public Camera arCamera;
        
        [Header("Communication")]
        public string webSocketUrl = "ws://localhost:3001";
        public bool autoConnect = true;
        
        // Events
        public static event Action<string> OnModelReceived;
        public static event Action<bool> OnConnectionStatusChanged;
        public static event Action<DeviceInfo> OnDeviceRegistered;
        
        // Private fields
        private WebSocketConnection wsConnection;
        private ARModelRenderer modelRenderer;
        private CADToolbarIntegration toolbarIntegration;
        private bool isConnected = false;
        private List<string> supportedCapabilities;
        
        public enum DeviceType
        {
            MetaQuest2,
            MetaQuest3, 
            HoloLens2,
            HoloLens3,
            Unknown
        }
        
        [System.Serializable]
        public struct DeviceInfo
        {
            public string deviceId;
            public string deviceName;
            public DeviceType deviceType;
            public List<string> capabilities;
            public bool isActive;
        }
        
        void Start()
        {
            InitializeDevice();
            SetupComponents();
            
            if (autoConnect)
            {
                StartCoroutine(ConnectToWebPlatform());
            }
        }
        
        void InitializeDevice()
        {
            // Generate unique device ID if not set
            if (string.IsNullOrEmpty(deviceId))
            {
                deviceId = SystemInfo.deviceUniqueIdentifier;
            }
            
            // Set device name if not specified
            if (string.IsNullOrEmpty(deviceName))
            {
                deviceName = $"{deviceType} - {SystemInfo.deviceName}";
            }
            
            // Detect device type automatically
            DetectDeviceType();
            
            // Initialize supported capabilities
            InitializeCapabilities();
            
            Debug.Log($"AR Device Initialized: {deviceName} ({deviceType})");
        }
        
        void DetectDeviceType()
        {
#if UNITY_ANDROID
            // Check for Meta Quest
            if (SystemInfo.deviceModel.Contains("Quest"))
            {
                deviceType = SystemInfo.deviceModel.Contains("Quest 3") ? 
                    DeviceType.MetaQuest3 : DeviceType.MetaQuest2;
            }
#elif UNITY_WSA
            // Check for HoloLens
            if (SystemInfo.deviceModel.Contains("HoloLens"))
            {
                deviceType = SystemInfo.deviceModel.Contains("HoloLens 3") ? 
                    DeviceType.HoloLens3 : DeviceType.HoloLens2;
            }
#endif
            if (deviceType == DeviceType.Unknown)
            {
                Debug.LogWarning("Unknown device type detected");
            }
        }
        
        void InitializeCapabilities()
        {
            supportedCapabilities = new List<string>();
            
            // Base AR capabilities
            supportedCapabilities.Add("mesh_rendering");
            supportedCapabilities.Add("model_placement");
            supportedCapabilities.Add("basic_interaction");
            
            // Device-specific capabilities
            switch (deviceType)
            {
                case DeviceType.MetaQuest2:
                case DeviceType.MetaQuest3:
                    supportedCapabilities.Add("hand_tracking");
                    supportedCapabilities.Add("controller_input");
                    supportedCapabilities.Add("oculus_integration");
                    if (deviceType == DeviceType.MetaQuest3)
                    {
                        supportedCapabilities.Add("mixed_reality");
                        supportedCapabilities.Add("enhanced_tracking");
                    }
                    break;
                    
                case DeviceType.HoloLens2:
                case DeviceType.HoloLens3:
                    supportedCapabilities.Add("spatial_mapping");
                    supportedCapabilities.Add("gesture_recognition");
                    supportedCapabilities.Add("voice_commands");
                    supportedCapabilities.Add("holographic_display");
                    if (deviceType == DeviceType.HoloLens3)
                    {
                        supportedCapabilities.Add("advanced_spatial_understanding");
                    }
                    break;
            }
        }
        
        void SetupComponents()
        {
            // Initialize WebSocket connection
            wsConnection = gameObject.AddComponent<WebSocketConnection>();
            wsConnection.Initialize(webSocketUrl);
            
            // Initialize model renderer
            modelRenderer = gameObject.AddComponent<ARModelRenderer>();
            modelRenderer.Initialize(arCamera);
            
            // Initialize toolbar integration
            toolbarIntegration = gameObject.AddComponent<CADToolbarIntegration>();
            toolbarIntegration.Initialize();
            
            // Subscribe to events
            WebSocketConnection.OnMessageReceived += HandleWebSocketMessage;
            WebSocketConnection.OnConnectionChanged += HandleConnectionChange;
        }
        
        IEnumerator ConnectToWebPlatform()
        {
            Debug.Log("Attempting to connect to web platform...");
            
            yield return new WaitForSeconds(1f); // Wait for initialization
            
            if (wsConnection != null)
            {
                wsConnection.Connect();
            }
        }
        
        void HandleConnectionChange(bool connected)
        {
            isConnected = connected;
            OnConnectionStatusChanged?.Invoke(connected);
            
            if (connected)
            {
                Debug.Log("Connected to web platform");
                RegisterDevice();
            }
            else
            {
                Debug.Log("Disconnected from web platform");
            }
        }
        
        void RegisterDevice()
        {
            var deviceInfo = new DeviceInfo
            {
                deviceId = this.deviceId,
                deviceName = this.deviceName,
                deviceType = this.deviceType,
                capabilities = this.supportedCapabilities,
                isActive = true
            };
            
            var message = new
            {
                type = "device_registration",
                deviceId = deviceInfo.deviceId,
                deviceName = deviceInfo.deviceName,
                deviceType = deviceInfo.deviceType.ToString().ToLower(),
                capabilities = deviceInfo.capabilities,
                timestamp = DateTime.UtcNow.ToString("O")
            };
            
            wsConnection.SendMessage(JsonUtility.ToJson(message));
            OnDeviceRegistered?.Invoke(deviceInfo);
            
            Debug.Log($"Device registered: {deviceName}");
        }
        
        void HandleWebSocketMessage(string message)
        {
            try
            {
                var data = JsonUtility.FromJson<WebSocketMessage>(message);
                
                switch (data.type)
                {
                    case "model_deployment":
                        HandleModelDeployment(data);
                        break;
                        
                    case "device_command":
                        HandleDeviceCommand(data);
                        break;
                        
                    case "ping":
                        SendPong();
                        break;
                        
                    default:
                        Debug.LogWarning($"Unknown message type: {data.type}");
                        break;
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Error handling WebSocket message: {e.Message}");
            }
        }
        
        void HandleModelDeployment(WebSocketMessage data)
        {
            Debug.Log($"Received model deployment: {data.modelName}");
            
            if (modelRenderer != null)
            {
                modelRenderer.LoadAndDisplayModel(data.modelUrl, data.modelName);
            }
            
            OnModelReceived?.Invoke(data.modelName);
        }
        
        void HandleDeviceCommand(WebSocketMessage data)
        {
            Debug.Log($"Received device command: {data.command}");
            
            switch (data.command)
            {
                case "clear_models":
                    modelRenderer?.ClearAllModels();
                    break;
                    
                case "reset_position":
                    modelRenderer?.ResetModelPositions();
                    break;
                    
                case "enable_toolbar":
                    toolbarIntegration?.ShowToolbar(true);
                    break;
                    
                case "disable_toolbar":
                    toolbarIntegration?.ShowToolbar(false);
                    break;
            }
        }
        
        void SendPong()
        {
            var pong = new { type = "pong", timestamp = DateTime.UtcNow.ToString("O") };
            wsConnection.SendMessage(JsonUtility.ToJson(pong));
        }
        
        public void SendModelStatus(string modelName, string status)
        {
            var message = new
            {
                type = "model_status",
                deviceId = this.deviceId,
                modelName = modelName,
                status = status,
                timestamp = DateTime.UtcNow.ToString("O")
            };
            
            wsConnection?.SendMessage(JsonUtility.ToJson(message));
        }
        
        public bool IsDeviceReady()
        {
            return isConnected && arSession != null && arSession.enabled;
        }
        
        void OnDestroy()
        {
            // Cleanup subscriptions
            WebSocketConnection.OnMessageReceived -= HandleWebSocketMessage;
            WebSocketConnection.OnConnectionChanged -= HandleConnectionChange;
        }
        
        [System.Serializable]
        public class WebSocketMessage
        {
            public string type;
            public string deviceId;
            public string modelName;
            public string modelUrl;
            public string command;
            public string status;
        }
    }
}
