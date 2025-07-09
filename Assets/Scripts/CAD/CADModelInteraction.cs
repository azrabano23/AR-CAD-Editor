using UnityEngine;

namespace HoloDraft.CAD
{
    /// <summary>
    /// CAD Model Interaction for handling mouse and touch input (MRTK removed for WebGL)
    /// </summary>
    public class CADModelInteraction : MonoBehaviour
    {
        [Header("Interaction Settings")]
        [SerializeField] private bool enableSelection = true;
        [SerializeField] private bool enableManipulation = true;
        [SerializeField] private bool enableMeasurement = true;
        [SerializeField] private float selectionHighlightIntensity = 1.5f;
        
        private CADModel cadModel;
        private CADModelManager modelManager;
        private bool isPointerDown = false;
        private bool isFocused = false;
        private Material originalMaterial;
        private Renderer modelRenderer;
        
        // Measurement points
        private Vector3 firstMeasurementPoint;
        private Vector3 secondMeasurementPoint;
        private bool isMeasuring = false;
        private int measurementClickCount = 0;
        
        private void Awake()
        {
            cadModel = GetComponent<CADModel>();
            modelManager = CADModelManager.Instance;
            modelRenderer = GetComponent<Renderer>();
            
            if (modelRenderer != null)
            {
                originalMaterial = modelRenderer.material;
            }
        }
        
        private void Start()
        {
            // Ensure the object has a collider for interaction
            if (GetComponent<Collider>() == null)
            {
                gameObject.AddComponent<BoxCollider>();
            }
        }
        
        private void Update()
        {
            HandleMouseInput();
        }
        
        private void HandleMouseInput()
        {
            // Handle mouse clicks for WebGL
            if (Input.GetMouseButtonDown(0))
            {
                OnPointerDown();
            }
            
            if (Input.GetMouseButtonUp(0))
            {
                OnPointerUp();
            }
            
            // Handle mouse hover
            Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
            RaycastHit hit;
            
            if (Physics.Raycast(ray, out hit))
            {
                if (hit.collider.gameObject == gameObject)
                {
                    if (!isFocused)
                    {
                        OnFocusEnter();
                    }
                }
                else if (isFocused)
                {
                    OnFocusExit();
                }
            }
            else if (isFocused)
            {
                OnFocusExit();
            }
        }
        
        private void OnPointerDown()
        {
            if (!enableSelection) return;
            
            isPointerDown = true;
            
            // Handle model selection
            if (cadModel != null && modelManager != null)
            {
                modelManager.SelectModel(cadModel.ModelId);
            }
            
            // Handle measurement mode
            if (isMeasuring)
            {
                Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
                RaycastHit hit;
                if (Physics.Raycast(ray, out hit))
                {
                    HandleMeasurementClick(hit.point);
                }
            }
            
            Debug.Log($"CAD Model clicked: {cadModel?.ModelId}");
        }
        
        private void OnPointerUp()
        {
            isPointerDown = false;
        }
        
        private void OnFocusEnter()
        {
            isFocused = true;
            
            // Highlight the model when focused
            if (cadModel != null)
            {
                cadModel.SetHighlighted(true);
                ApplyHighlightMaterial();
            }
        }
        
        private void OnFocusExit()
        {
            isFocused = false;
            
            // Remove highlight when focus is lost
            if (cadModel != null)
            {
                cadModel.SetHighlighted(false);
                RemoveHighlightMaterial();
            }
        }
        
        #region Measurement System
        
        public void EnableMeasurementMode()
        {
            isMeasuring = true;
            measurementClickCount = 0;
            Debug.Log("Measurement mode enabled. Click two points to measure distance.");
        }
        
        public void DisableMeasurementMode()
        {
            isMeasuring = false;
            measurementClickCount = 0;
            Debug.Log("Measurement mode disabled.");
        }
        
        private void HandleMeasurementClick(Vector3 clickPoint)
        {
            if (measurementClickCount == 0)
            {
                firstMeasurementPoint = clickPoint;
                measurementClickCount = 1;
                Debug.Log($"First measurement point set: {firstMeasurementPoint}");
            }
            else if (measurementClickCount == 1)
            {
                secondMeasurementPoint = clickPoint;
                measurementClickCount = 0;
                
                // Create measurement
                if (modelManager != null)
                {
                    modelManager.AddMeasurement(firstMeasurementPoint, secondMeasurementPoint);
                }
                
                Debug.Log($"Measurement created between {firstMeasurementPoint} and {secondMeasurementPoint}");
            }
        }
        
        #endregion
        
        #region Visual Effects
        
        private void ApplyHighlightMaterial()
        {
            if (modelRenderer != null && modelManager != null)
            {
                // Apply highlight material if available
                if (modelManager.GetComponent<CADMaterialManager>() != null)
                {
                    var materialManager = modelManager.GetComponent<CADMaterialManager>();
                    modelRenderer.material = materialManager.GetHighlightMaterial();
                }
                else
                {
                    // Fallback: brighten the existing material
                    Material highlightMaterial = new Material(originalMaterial);
                    highlightMaterial.color = originalMaterial.color * selectionHighlightIntensity;
                    modelRenderer.material = highlightMaterial;
                }
            }
        }
        
        private void RemoveHighlightMaterial()
        {
            if (modelRenderer != null && originalMaterial != null)
            {
                // Only remove highlight if not selected
                if (cadModel != null && !cadModel.IsSelected)
                {
                    modelRenderer.material = originalMaterial;
                }
            }
        }
        
        #endregion
        
        #region Public Methods
        
        public void SetSelectionEnabled(bool enabled)
        {
            enableSelection = enabled;
        }
        
        public void SetManipulationEnabled(bool enabled)
        {
            enableManipulation = enabled;
        }
        
        public void SetMeasurementEnabled(bool enabled)
        {
            enableMeasurement = enabled;
        }
        
        public bool IsFocused()
        {
            return isFocused;
        }
        
        public bool IsPointerDown()
        {
            return isPointerDown;
        }
        
        #endregion
    }
}
