using System;
using UnityEngine;
using System.Collections;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace ARCompanion.Communication
{
    /// <summary>
    /// WebSocket connection manager for communicating with web platform
    /// </summary>
    public class WebSocketConnection : MonoBehaviour
    {
        [Header("Connection Settings")]
        public string serverUrl = "ws://localhost:3001";
        public float reconnectInterval = 5.0f;
        public int maxReconnectAttempts = 10;
        
        // Events
        public static event Action<string> OnMessageReceived;
        public static event Action<bool> OnConnectionChanged;
        
        // Private fields
        private ClientWebSocket webSocket;
        private CancellationTokenSource cancellationTokenSource;
        private bool isConnecting = false;
        private bool shouldReconnect = true;
        private int reconnectAttempts = 0;
        
        public bool IsConnected => webSocket?.State == WebSocketState.Open;
        
        public void Initialize(string url)
        {
            serverUrl = url;
            Debug.Log($"WebSocket initialized with URL: {serverUrl}");
        }
        
        public async void Connect()
        {
            if (isConnecting || IsConnected)
            {
                return;
            }
            
            isConnecting = true;
            
            try
            {
                // Create new WebSocket and cancellation token
                webSocket = new ClientWebSocket();
                cancellationTokenSource = new CancellationTokenSource();
                
                Debug.Log($"Attempting to connect to {serverUrl}...");
                
                // Connect to server
                await webSocket.ConnectAsync(new Uri(serverUrl), cancellationTokenSource.Token);
                
                Debug.Log("WebSocket connected successfully!");
                isConnecting = false;
                reconnectAttempts = 0;
                
                OnConnectionChanged?.Invoke(true);
                
                // Start listening for messages
                _ = StartListening();
            }
            catch (Exception e)
            {
                Debug.LogError($"WebSocket connection failed: {e.Message}");
                isConnecting = false;
                OnConnectionChanged?.Invoke(false);
                
                // Attempt to reconnect
                if (shouldReconnect && reconnectAttempts < maxReconnectAttempts)
                {
                    reconnectAttempts++;
                    StartCoroutine(ReconnectAfterDelay());
                }
            }
        }
        
        private async Task StartListening()
        {
            var buffer = new byte[4096];
            
            try
            {
                while (webSocket.State == WebSocketState.Open)
                {
                    var result = await webSocket.ReceiveAsync(
                        new ArraySegment<byte>(buffer), 
                        cancellationTokenSource.Token
                    );
                    
                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        
                        // Dispatch to main thread
                        UnityMainThreadDispatcher.Enqueue(() =>
                        {
                            OnMessageReceived?.Invoke(message);
                        });
                    }
                    else if (result.MessageType == WebSocketMessageType.Close)
                    {
                        Debug.Log("WebSocket connection closed by server");
                        break;
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"WebSocket listening error: {e.Message}");
            }
            finally
            {
                UnityMainThreadDispatcher.Enqueue(() =>
                {
                    OnConnectionChanged?.Invoke(false);
                    
                    if (shouldReconnect && reconnectAttempts < maxReconnectAttempts)
                    {
                        reconnectAttempts++;
                        StartCoroutine(ReconnectAfterDelay());
                    }
                });
            }
        }
        
        public async void SendMessage(string message)
        {
            if (!IsConnected)
            {
                Debug.LogWarning("Cannot send message - WebSocket not connected");
                return;
            }
            
            try
            {
                var bytes = Encoding.UTF8.GetBytes(message);
                await webSocket.SendAsync(
                    new ArraySegment<byte>(bytes), 
                    WebSocketMessageType.Text, 
                    true, 
                    cancellationTokenSource.Token
                );
                
                Debug.Log($"Sent message: {message}");
            }
            catch (Exception e)
            {
                Debug.LogError($"Error sending WebSocket message: {e.Message}");
            }
        }
        
        private IEnumerator ReconnectAfterDelay()
        {
            Debug.Log($"Reconnecting in {reconnectInterval} seconds... (Attempt {reconnectAttempts}/{maxReconnectAttempts})");
            
            yield return new WaitForSeconds(reconnectInterval);
            
            if (shouldReconnect)
            {
                Connect();
            }
        }
        
        public void Disconnect()
        {
            shouldReconnect = false;
            
            if (webSocket != null && webSocket.State == WebSocketState.Open)
            {
                _ = webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Client disconnecting", CancellationToken.None);
            }
            
            cancellationTokenSource?.Cancel();
            OnConnectionChanged?.Invoke(false);
        }
        
        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                // App paused - close connection
                shouldReconnect = false;
                Disconnect();
            }
            else
            {
                // App resumed - reconnect
                shouldReconnect = true;
                reconnectAttempts = 0;
                Connect();
            }
        }
        
        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                // App lost focus
                shouldReconnect = false;
                Disconnect();
            }
            else
            {
                // App gained focus
                shouldReconnect = true;
                reconnectAttempts = 0;
                Connect();
            }
        }
        
        void OnDestroy()
        {
            Disconnect();
        }
    }
    
    /// <summary>
    /// Helper class to dispatch actions to Unity main thread
    /// </summary>
    public class UnityMainThreadDispatcher : MonoBehaviour
    {
        private static readonly Queue<Action> _executionQueue = new Queue<Action>();
        private static UnityMainThreadDispatcher _instance = null;
        
        public static UnityMainThreadDispatcher Instance()
        {
            if (!_instance)
            {
                var go = new GameObject("MainThreadDispatcher");
                _instance = go.AddComponent<UnityMainThreadDispatcher>();
                DontDestroyOnLoad(go);
            }
            return _instance;
        }
        
        public static void Enqueue(Action action)
        {
            if (action == null) return;
            
            lock (_executionQueue)
            {
                _executionQueue.Enqueue(action);
            }
        }
        
        void Update()
        {
            lock (_executionQueue)
            {
                while (_executionQueue.Count > 0)
                {
                    _executionQueue.Dequeue().Invoke();
                }
            }
        }
    }
}
