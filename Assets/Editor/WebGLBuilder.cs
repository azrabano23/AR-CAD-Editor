using UnityEngine;
using UnityEditor;
using UnityEditor.Build.Reporting;
using System.IO;

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

        // Set WebGL-specific settings
        PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Gzip;
        PlayerSettings.WebGL.nameFilesAsHashes = true;
        PlayerSettings.WebGL.dataCaching = true;
        PlayerSettings.runInBackground = true;

        Debug.Log("Starting WebGL build for HoloDraft...");
        BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
        
        if (report.summary.result == BuildResult.Succeeded)
        {
            Debug.Log($"✅ WebGL build succeeded! Built to: {buildPath}");
            Debug.Log($"Build size: {report.summary.totalSize} bytes");
        }
        else
        {
            Debug.LogError($"❌ WebGL build failed: {report.summary.result}");
        }
    }

    [MenuItem("HoloDraft/Build WebGL (Command Line)")]
    public static void BuildWebGLCommandLine()
    {
        BuildWebGL();
        EditorApplication.Exit(0);
    }
}
