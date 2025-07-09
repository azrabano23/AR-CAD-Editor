using System.Collections.Generic;
using UnityEngine;

namespace HoloDraft.CAD
{
    /// <summary>
    /// CAD Measurement Tools for advanced measuring capabilities
    /// </summary>
    public class CADMeasurementTools : MonoBehaviour
    {
        [Header("Measurement Settings")]
        [SerializeField] private Material measurementLineMaterial;
        [SerializeField] private Color measurementLineColor = Color.yellow;
        [SerializeField] private float measurementLineWidth = 0.02f;
        [SerializeField] private Color measurementTextColor = Color.white;
        [SerializeField] private float measurementTextSize = 0.05f;
        
        [Header("Angle Measurement")]
        [SerializeField] private Material angleArcMaterial;
        [SerializeField] private Color angleArcColor = Color.green;
        [SerializeField] private float angleArcRadius = 0.2f;
        
        private List<CADDimension> activeMeasurements = new List<CADDimension>();
        private List<CADAngleMeasurement> activeAngleMeasurements = new List<CADAngleMeasurement>();
        private CADModelManager modelManager;
        
        // Measurement state
        private bool isDistanceMeasuring = false;
        private bool isAngleMeasuring = false;
        private Vector3 firstPoint;
        private Vector3 secondPoint;
        private Vector3 thirdPoint;
        private int measurementClickCount = 0;
        
        private void Awake()
        {
            modelManager = GetComponent<CADModelManager>();
        }
        
        #region Distance Measurement
        
        public void StartDistanceMeasurement()
        {
            isDistanceMeasuring = true;
            isAngleMeasuring = false;
            measurementClickCount = 0;
            Debug.Log("Distance measurement started. Click two points to measure.");
        }
        
        public void StopDistanceMeasurement()
        {
            isDistanceMeasuring = false;
            measurementClickCount = 0;
            Debug.Log("Distance measurement stopped.");
        }
        
        public CADDimension CreateDistanceMeasurement(Vector3 start, Vector3 end)
        {
            GameObject dimensionObj = new GameObject("Distance_Measurement");
            CADDimension dimension = dimensionObj.AddComponent<CADDimension>();
            
            dimension.SetPoints(start, end);
            dimension.SetLineColor(measurementLineColor);
            dimension.SetTextColor(measurementTextColor);
            dimension.SetLineWidth(measurementLineWidth);
            
            activeMeasurements.Add(dimension);
            return dimension;
        }
        
        #endregion
        
        #region Angle Measurement
        
        public void StartAngleMeasurement()
        {
            isAngleMeasuring = true;
            isDistanceMeasuring = false;
            measurementClickCount = 0;
            Debug.Log("Angle measurement started. Click three points to measure angle.");
        }
        
        public void StopAngleMeasurement()
        {
            isAngleMeasuring = false;
            measurementClickCount = 0;
            Debug.Log("Angle measurement stopped.");
        }
        
        public CADAngleMeasurement CreateAngleMeasurement(Vector3 point1, Vector3 vertex, Vector3 point2)
        {
            GameObject angleObj = new GameObject("Angle_Measurement");
            CADAngleMeasurement angleMeasurement = angleObj.AddComponent<CADAngleMeasurement>();
            
            angleMeasurement.SetPoints(point1, vertex, point2);
            angleMeasurement.SetArcColor(angleArcColor);
            angleMeasurement.SetTextColor(measurementTextColor);
            angleMeasurement.SetArcRadius(angleArcRadius);
            
            activeAngleMeasurements.Add(angleMeasurement);
            return angleMeasurement;
        }
        
        #endregion
        
        #region Volume and Surface Area Calculation
        
        public float CalculateModelVolume(CADModel model)
        {
            if (model == null) return 0f;
            
            // Simple bounding box volume calculation
            Bounds bounds = model.ModelBounds;
            float volume = bounds.size.x * bounds.size.y * bounds.size.z;
            
            Debug.Log($"Model {model.ModelId} volume: {volume:F3} cubic units");
            return volume;
        }
        
        public float CalculateModelSurfaceArea(CADModel model)
        {
            if (model == null) return 0f;
            
            // Simple bounding box surface area calculation
            Bounds bounds = model.ModelBounds;
            Vector3 size = bounds.size;
            float surfaceArea = 2 * (size.x * size.y + size.x * size.z + size.y * size.z);
            
            Debug.Log($"Model {model.ModelId} surface area: {surfaceArea:F3} square units");
            return surfaceArea;
        }
        
        public void ShowVolumeAndSurfaceArea(CADModel model)
        {
            if (model == null) return;
            
            float volume = CalculateModelVolume(model);
            float surfaceArea = CalculateModelSurfaceArea(model);
            
            // Create info display
            Vector3 infoPosition = model.transform.position + Vector3.up * 0.5f;
            string infoText = $"Volume: {volume:F3}\nSurface Area: {surfaceArea:F3}";
            
            if (modelManager != null)
            {
                modelManager.AddAnnotation(infoPosition, infoText);
            }
        }
        
        #endregion
        
        #region Measurement Management
        
        public void ClearAllMeasurements()
        {
            // Clear distance measurements
            foreach (var measurement in activeMeasurements)
            {
                if (measurement != null)
                {
                    DestroyImmediate(measurement.gameObject);
                }
            }
            activeMeasurements.Clear();
            
            // Clear angle measurements
            foreach (var angleMeasurement in activeAngleMeasurements)
            {
                if (angleMeasurement != null)
                {
                    DestroyImmediate(angleMeasurement.gameObject);
                }
            }
            activeAngleMeasurements.Clear();
            
            Debug.Log("All measurements cleared.");
        }
        
        public void RemoveMeasurement(CADDimension measurement)
        {
            if (activeMeasurements.Contains(measurement))
            {
                activeMeasurements.Remove(measurement);
                DestroyImmediate(measurement.gameObject);
            }
        }
        
        public void RemoveAngleMeasurement(CADAngleMeasurement angleMeasurement)
        {
            if (activeAngleMeasurements.Contains(angleMeasurement))
            {
                activeAngleMeasurements.Remove(angleMeasurement);
                DestroyImmediate(angleMeasurement.gameObject);
            }
        }
        
        public List<CADDimension> GetActiveMeasurements()
        {
            return new List<CADDimension>(activeMeasurements);
        }
        
        public List<CADAngleMeasurement> GetActiveAngleMeasurements()
        {
            return new List<CADAngleMeasurement>(activeAngleMeasurements);
        }
        
        #endregion
        
        #region Input Handling
        
        public void HandleMeasurementClick(Vector3 clickPoint)
        {
            if (isDistanceMeasuring)
            {
                HandleDistanceMeasurementClick(clickPoint);
            }
            else if (isAngleMeasuring)
            {
                HandleAngleMeasurementClick(clickPoint);
            }
        }
        
        private void HandleDistanceMeasurementClick(Vector3 clickPoint)
        {
            if (measurementClickCount == 0)
            {
                firstPoint = clickPoint;
                measurementClickCount = 1;
                Debug.Log($"First point set: {firstPoint}");
            }
            else if (measurementClickCount == 1)
            {
                secondPoint = clickPoint;
                measurementClickCount = 0;
                
                CreateDistanceMeasurement(firstPoint, secondPoint);
                Debug.Log($"Distance measurement created: {Vector3.Distance(firstPoint, secondPoint):F3} units");
            }
        }
        
        private void HandleAngleMeasurementClick(Vector3 clickPoint)
        {
            if (measurementClickCount == 0)
            {
                firstPoint = clickPoint;
                measurementClickCount = 1;
                Debug.Log($"First point set: {firstPoint}");
            }
            else if (measurementClickCount == 1)
            {
                secondPoint = clickPoint; // This will be the vertex
                measurementClickCount = 2;
                Debug.Log($"Vertex point set: {secondPoint}");
            }
            else if (measurementClickCount == 2)
            {
                thirdPoint = clickPoint;
                measurementClickCount = 0;
                
                CreateAngleMeasurement(firstPoint, secondPoint, thirdPoint);
                
                // Calculate angle for debug
                Vector3 vec1 = (firstPoint - secondPoint).normalized;
                Vector3 vec2 = (thirdPoint - secondPoint).normalized;
                float angle = Vector3.Angle(vec1, vec2);
                Debug.Log($"Angle measurement created: {angle:F1} degrees");
            }
        }
        
        #endregion
        
        #region Utility Methods
        
        public void SetMeasurementLineColor(Color color)
        {
            measurementLineColor = color;
            
            // Update existing measurements
            foreach (var measurement in activeMeasurements)
            {
                if (measurement != null)
                {
                    measurement.SetLineColor(color);
                }
            }
        }
        
        public void SetMeasurementTextColor(Color color)
        {
            measurementTextColor = color;
            
            // Update existing measurements
            foreach (var measurement in activeMeasurements)
            {
                if (measurement != null)
                {
                    measurement.SetTextColor(color);
                }
            }
        }
        
        public bool IsInMeasurementMode()
        {
            return isDistanceMeasuring || isAngleMeasuring;
        }
        
        #endregion
    }
    
    /// <summary>
    /// CAD Angle Measurement component
    /// </summary>
    public class CADAngleMeasurement : MonoBehaviour
    {
        [SerializeField] private Vector3 point1;
        [SerializeField] private Vector3 vertex;
        [SerializeField] private Vector3 point2;
        [SerializeField] private float angle;
        
        [Header("Visual Settings")]
        [SerializeField] private Color arcColor = Color.green;
        [SerializeField] private float arcRadius = 0.2f;
        [SerializeField] private Color textColor = Color.white;
        [SerializeField] private float textSize = 0.05f;
        
        private LineRenderer[] arcLines;
        private TextMesh angleText;
        private GameObject textObject;
        
        private void Awake()
        {
            SetupAngleVisualization();
        }
        
        private void SetupAngleVisualization()
        {
            // Create text object
            textObject = new GameObject("AngleText");
            textObject.transform.SetParent(transform);
            
            angleText = textObject.AddComponent<TextMesh>();
            angleText.text = "0°";
            angleText.color = textColor;
            angleText.anchor = TextAnchor.MiddleCenter;
            angleText.alignment = TextAlignment.Center;
            angleText.characterSize = textSize;
            angleText.fontSize = 100;
        }
        
        public void SetPoints(Vector3 p1, Vector3 v, Vector3 p2)
        {
            point1 = p1;
            vertex = v;
            point2 = p2;
            UpdateAngle();
        }
        
        public void SetArcColor(Color color)
        {
            arcColor = color;
            UpdateArcColor();
        }
        
        public void SetTextColor(Color color)
        {
            textColor = color;
            if (angleText != null)
            {
                angleText.color = color;
            }
        }
        
        public void SetArcRadius(float radius)
        {
            arcRadius = radius;
            UpdateAngle();
        }
        
        private void UpdateAngle()
        {
            // Calculate angle
            Vector3 vec1 = (point1 - vertex).normalized;
            Vector3 vec2 = (point2 - vertex).normalized;
            angle = Vector3.Angle(vec1, vec2);
            
            // Update text
            if (angleText != null)
            {
                angleText.text = $"{angle:F1}°";
                
                // Position text
                Vector3 bisector = (vec1 + vec2).normalized;
                textObject.transform.position = vertex + bisector * (arcRadius + 0.1f);
                
                // Make text face camera
                if (Camera.main != null)
                {
                    textObject.transform.LookAt(Camera.main.transform);
                    textObject.transform.Rotate(0, 180, 0);
                }
            }
            
            // Create arc visualization
            CreateArcVisualization();
        }
        
        private void CreateArcVisualization()
        {
            // Clear existing arc lines
            if (arcLines != null)
            {
                foreach (var line in arcLines)
                {
                    if (line != null)
                    {
                        DestroyImmediate(line.gameObject);
                    }
                }
            }
            
            // Create arc using line segments
            int segments = 20;
            GameObject arcObject = new GameObject("AngleArc");
            arcObject.transform.SetParent(transform);
            
            LineRenderer arcLine = arcObject.AddComponent<LineRenderer>();
            arcLine.material = new Material(Shader.Find("Sprites/Default"));
            arcLine.startColor = arcColor;
            arcLine.endColor = arcColor;
            arcLine.startWidth = 0.01f;
            arcLine.endWidth = 0.01f;
            arcLine.positionCount = segments + 1;
            arcLine.useWorldSpace = true;
            
            // Calculate arc points
            Vector3 vec1 = (point1 - vertex).normalized;
            Vector3 vec2 = (point2 - vertex).normalized;
            Vector3 normal = Vector3.Cross(vec1, vec2).normalized;
            
            for (int i = 0; i <= segments; i++)
            {
                float t = (float)i / segments;
                float currentAngle = angle * t * Mathf.Deg2Rad;
                
                Vector3 direction = Vector3.Slerp(vec1, vec2, t);
                Vector3 arcPoint = vertex + direction * arcRadius;
                
                arcLine.SetPosition(i, arcPoint);
            }
            
            arcLines = new LineRenderer[] { arcLine };
        }
        
        private void UpdateArcColor()
        {
            if (arcLines != null)
            {
                foreach (var line in arcLines)
                {
                    if (line != null)
                    {
                        line.startColor = arcColor;
                        line.endColor = arcColor;
                    }
                }
            }
        }
        
        public float GetAngle()
        {
            return angle;
        }
        
        private void Update()
        {
            // Continuously update text rotation to face camera
            if (textObject != null && Camera.main != null)
            {
                textObject.transform.LookAt(Camera.main.transform);
                textObject.transform.Rotate(0, 180, 0);
            }
        }
    }
}
