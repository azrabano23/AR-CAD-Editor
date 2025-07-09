using UnityEngine;

namespace HoloDraft.CAD
{
    /// <summary>
    /// CAD Dimension for measuring distances between points
    /// </summary>
    public class CADDimension : MonoBehaviour
    {
        [Header("Dimension Points")]
        [SerializeField] private Vector3 startPoint;
        [SerializeField] private Vector3 endPoint;
        [SerializeField] private float distance;
        
        [Header("Visual Settings")]
        [SerializeField] private Color lineColor = Color.yellow;
        [SerializeField] private float lineWidth = 0.02f;
        [SerializeField] private Color textColor = Color.white;
        [SerializeField] private float textSize = 0.05f;
        
        private LineRenderer lineRenderer;
        private TextMesh distanceText;
        private GameObject textObject;
        
        private void Awake()
        {
            SetupLineRenderer();
            SetupDistanceText();
        }
        
        private void SetupLineRenderer()
        {
            lineRenderer = gameObject.AddComponent<LineRenderer>();
            lineRenderer.material = new Material(Shader.Find("Sprites/Default"));
            lineRenderer.startColor = lineColor;
            lineRenderer.endColor = lineColor;
            lineRenderer.startWidth = lineWidth;
            lineRenderer.endWidth = lineWidth;
            lineRenderer.positionCount = 2;
            lineRenderer.useWorldSpace = true;
        }
        
        private void SetupDistanceText()
        {
            textObject = new GameObject("DimensionText");
            textObject.transform.SetParent(transform);
            
            distanceText = textObject.AddComponent<TextMesh>();
            distanceText.text = "0.00";
            distanceText.color = textColor;
            distanceText.anchor = TextAnchor.MiddleCenter;
            distanceText.alignment = TextAlignment.Center;
            distanceText.characterSize = textSize;
            distanceText.fontSize = 100;
        }
        
        public void SetPoints(Vector3 start, Vector3 end)
        {
            startPoint = start;
            endPoint = end;
            UpdateDimension();
        }
        
        public void SetStartPoint(Vector3 point)
        {
            startPoint = point;
            UpdateDimension();
        }
        
        public void SetEndPoint(Vector3 point)
        {
            endPoint = point;
            UpdateDimension();
        }
        
        private void UpdateDimension()
        {
            // Calculate distance
            distance = Vector3.Distance(startPoint, endPoint);
            
            // Update line renderer
            if (lineRenderer != null)
            {
                lineRenderer.SetPosition(0, startPoint);
                lineRenderer.SetPosition(1, endPoint);
            }
            
            // Update text
            if (distanceText != null)
            {
                distanceText.text = $"{distance:F2}m";
                
                // Position text at midpoint
                Vector3 midpoint = (startPoint + endPoint) / 2f;
                textObject.transform.position = midpoint + Vector3.up * 0.1f;
                
                // Make text face the camera
                if (Camera.main != null)
                {
                    textObject.transform.LookAt(Camera.main.transform);
                    textObject.transform.Rotate(0, 180, 0);
                }
            }
        }
        
        public void SetLineColor(Color color)
        {
            lineColor = color;
            if (lineRenderer != null)
            {
                lineRenderer.startColor = color;
                lineRenderer.endColor = color;
            }
        }
        
        public void SetTextColor(Color color)
        {
            textColor = color;
            if (distanceText != null)
            {
                distanceText.color = color;
            }
        }
        
        public void SetLineWidth(float width)
        {
            lineWidth = width;
            if (lineRenderer != null)
            {
                lineRenderer.startWidth = width;
                lineRenderer.endWidth = width;
            }
        }
        
        public float GetDistance()
        {
            return distance;
        }
        
        public Vector3 GetStartPoint()
        {
            return startPoint;
        }
        
        public Vector3 GetEndPoint()
        {
            return endPoint;
        }
        
        public Vector3 GetMidpoint()
        {
            return (startPoint + endPoint) / 2f;
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
