using System.IO;
using UnityEngine;
using UnityEditor;
using UnityEditor.Build.Reporting;

public class BuildManager : MonoBehaviour
{
    public enum BuildTarget
    {
        WebGL,
        Android
    }

    [MenuItem("Build/Switch to WebGL (without MRTK)")]
    public static void SwitchToWebGL()
    {
        SwitchPackageManifest(BuildTarget.WebGL);
        EditorUtility.DisplayDialog("Package Manager", "Switched to WebGL build configuration. Please refresh the Package Manager.", "OK");
    }

    [MenuItem("Build/Switch to Android (with MRTK)")]
    public static void SwitchToAndroid()
    {
        SwitchPackageManifest(BuildTarget.Android);
        EditorUtility.DisplayDialog("Package Manager", "Switched to Android build configuration. Please refresh the Package Manager.", "OK");
    }

    [MenuItem("Build/Build WebGL")]
    public static void BuildWebGL()
    {
        // Disable compression for WebGL builds
        PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
        PlayerSettings.WebGL.decompressionFallback = true;
        PlayerSettings.WebGL.dataCaching = false;
        
        string buildPath = Path.Combine(Application.dataPath, "../public/unity-builds/webgl-new");
        
        BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions();
        buildPlayerOptions.scenes = new[] { "Assets/Scenes/SampleScene.unity" };
        buildPlayerOptions.locationPathName = buildPath;
        buildPlayerOptions.target = UnityEditor.BuildTarget.WebGL;
        buildPlayerOptions.options = BuildOptions.None;

        BuildPipeline.BuildPlayer(buildPlayerOptions);
        
        Debug.Log("WebGL build completed at: " + buildPath);
    }

    [MenuItem("Build/Build Android")]
    public static void BuildAndroid()
    {
        SwitchToAndroid();
        
        string buildPath = Path.Combine(Application.dataPath, "../build/android");
        
        BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions();
        buildPlayerOptions.scenes = new[] { "Assets/Scenes/CADViewer.unity" };
        buildPlayerOptions.locationPathName = buildPath;
        buildPlayerOptions.target = UnityEditor.BuildTarget.Android;
        buildPlayerOptions.options = BuildOptions.None;

        BuildPipeline.BuildPlayer(buildPlayerOptions);
        
        Debug.Log("Android build completed at: " + buildPath);
    }

    private static void SwitchPackageManifest(BuildTarget target)
    {
        string packagesPath = Path.Combine(Application.dataPath, "../Packages");
        string manifestPath = Path.Combine(packagesPath, "manifest.json");
        string webglManifestPath = Path.Combine(packagesPath, "manifest.json");
        string androidManifestPath = Path.Combine(packagesPath, "manifest.android.json");

        if (target == BuildTarget.WebGL)
        {
            // WebGL manifest is already the default manifest.json
            Debug.Log("Using WebGL manifest (default)");
        }
        else if (target == BuildTarget.Android)
        {
            // Copy Android manifest to main manifest
            if (File.Exists(androidManifestPath))
            {
                File.Copy(androidManifestPath, manifestPath, true);
                Debug.Log("Switched to Android manifest with MRTK");
            }
            else
            {
                Debug.LogError("Android manifest not found at: " + androidManifestPath);
            }
        }
    }
}
