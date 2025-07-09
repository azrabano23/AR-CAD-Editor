using UnityEngine;
using UnityEditor;
using UnityEditor.Build.Reporting;
using System.IO;

public class BuildScript
{
    [MenuItem("Build/Build WebGL")]
    public static void BuildWebGL()
    {
        string buildPath = System.Environment.GetFolderPath(System.Environment.SpecialFolder.Desktop) + "/WebGLBuild";
        
        // Ensure build directory exists
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
        
        // Build the project
        BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
        
        if (report.summary.result == BuildResult.Succeeded)
        {
            Debug.Log("WebGL build succeeded!");
            Debug.Log($"Build location: {buildPath}");
        }
        else
        {
            Debug.LogError("WebGL build failed!");
        }
    }
    
    public static void BuildWebGLCommandLine()
    {
        string buildPath = System.Environment.GetFolderPath(System.Environment.SpecialFolder.Desktop) + "/WebGLBuild";
        
        // Ensure build directory exists
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
        
        // Build the project
        BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
        
        if (report.summary.result == BuildResult.Succeeded)
        {
            Debug.Log("WebGL build succeeded!");
            System.Console.WriteLine("WebGL build succeeded!");
        }
        else
        {
            Debug.LogError("WebGL build failed!");
            System.Console.WriteLine("WebGL build failed!");
        }
    }
}
