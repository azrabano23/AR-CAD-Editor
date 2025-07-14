using UnityEngine;
using UnityEditor;
using System.IO;

public class MinimalWebGLBuilder : MonoBehaviour
{
    [MenuItem("HoloDraft/Build Minimal WebGL")]
    public static void BuildMinimalWebGL()
    {
        string buildPath = "/Users/azrabano/cad-editor-react-website/public/unity-builds/webgl";
        
        // Ensure the directory exists
        if (!Directory.Exists(buildPath))
        {
            Directory.CreateDirectory(buildPath);
        }

        // Get all scenes in build settings
        string[] scenes = { "Assets/Scenes/SampleScene.unity" };

        // Configure build settings for minimal WebGL
        BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions();
        buildPlayerOptions.scenes = scenes;
        buildPlayerOptions.locationPathName = buildPath;
        buildPlayerOptions.target = BuildTarget.WebGL;
        buildPlayerOptions.options = BuildOptions.None;

        // Set WebGL-specific settings for minimal build
        PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled; // Disable compression for speed
        PlayerSettings.WebGL.nameFilesAsHashes = false;
        PlayerSettings.WebGL.dataCaching = false;
        PlayerSettings.runInBackground = true;
        PlayerSettings.WebGL.template = "PROJECT:Minimal"; // Use minimal template

        Debug.Log("Starting minimal WebGL build for HoloDraft...");
        BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
        
        if (report.summary.result == BuildResult.Succeeded)
        {
            Debug.Log($"✅ Minimal WebGL build succeeded! Built to: {buildPath}");
            Debug.Log($"Build size: {report.summary.totalSize} bytes");
            
            // Create a simple index.html for testing
            CreateTestHTML(buildPath);
        }
        else
        {
            Debug.LogError($"❌ WebGL build failed: {report.summary.result}");
        }
    }

    private static void CreateTestHTML(string buildPath)
    {
        string htmlContent = @"<!DOCTYPE html>
<html lang=""en-us"">
<head>
    <meta charset=""utf-8"">
    <meta http-equiv=""Content-Type"" content=""text/html; charset=utf-8"">
    <title>HoloDraft Unity Viewer</title>
    <style>
        body { margin: 0; padding: 0; background: #1a1a1a; }
        #unity-container { width: 100%; height: 100vh; }
        #unity-canvas { width: 100%; height: 100%; display: block; }
    </style>
</head>
<body>
    <div id=""unity-container"">
        <canvas id=""unity-canvas""></canvas>
    </div>
    <script src=""Build/UnityLoader.js""></script>
    <script>
        var unityInstance = UnityLoader.instantiate(""unity-canvas"", ""Build/Build.json"");
        
        // Global function for React to call
        window.unityMessageHandler = function(eventType, data) {
            console.log('Unity message:', eventType, data);
        };
        
        // Test function
        window.testUnity = function() {
            console.log('Unity instance:', unityInstance);
        };
    </script>
</body>
</html>";

        File.WriteAllText(Path.Combine(buildPath, "test.html"), htmlContent);
        Debug.Log("Created test.html for Unity viewer");
    }

    [MenuItem("HoloDraft/Build Minimal (Command Line)")]
    public static void BuildMinimalCommandLine()
    {
        BuildMinimalWebGL();
        EditorApplication.Exit(0);
    }
}
