Shader "HoloDraft/WebGLOptimizedDataVisualization"
{
    Properties
    {
        _MainTex ("Base Texture", 2D) = "white" {}
        _Color ("Main Color", Color) = (1,1,1,1)
        _MetallicGlossMap ("Metallic Smoothness", 2D) = "white" {}
        _Metallic ("Metallic", Range(0.0, 1.0)) = 0.0
        _Glossiness ("Smoothness", Range(0.0, 1.0)) = 0.5
        _BumpMap ("Normal Map", 2D) = "bump" {}
        _BumpScale ("Normal Scale", Float) = 1.0
        _OcclusionMap ("Occlusion", 2D) = "white" {}
        _OcclusionStrength ("Occlusion Strength", Range(0.0, 1.0)) = 1.0
        _EmissionMap ("Emission", 2D) = "black" {}
        _EmissionColor ("Emission Color", Color) = (0,0,0)
        
        // WebGL Optimization Properties
        _LODFadeMode ("LOD Fade Mode", Float) = 0
        _LODFade ("LOD Fade", Range(0.0, 1.0)) = 1.0
        _CullingDistance ("Culling Distance", Float) = 1000.0
        _SimplificationLevel ("Simplification Level", Range(0, 3)) = 0
        
        // Performance Properties
        _MaxLights ("Max Lights", Int) = 4
        _LightmapUV ("Lightmap UV", Vector) = (1,1,0,0)
        _DitherFactor ("Dither Factor", Range(0.0, 1.0)) = 0.0
        
        // Data Visualization Properties
        _DataValue ("Data Value", Range(0.0, 1.0)) = 0.5
        _ColorRamp ("Color Ramp", 2D) = "white" {}
        _HeightScale ("Height Scale", Float) = 1.0
        _WireframeColor ("Wireframe Color", Color) = (1,1,1,1)
        _WireframeWidth ("Wireframe Width", Range(0.0, 0.1)) = 0.01
    }
    
    SubShader
    {
        Tags 
        { 
            "RenderType"="Opaque" 
            "Queue"="Geometry"
            "LightMode"="ForwardBase"
            "PerformanceHints"="VertexLit"
        }
        
        // LOD system for different quality levels
        LOD 300
        
        Pass
        {
            Name "FORWARD"
            Tags { "LightMode"="ForwardBase" }
            
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma target 3.0
            
            // WebGL optimizations
            #pragma prefer_hlslcc gles
            #pragma exclude_renderers d3d11_9x
            #pragma multi_compile_fwdbase
            #pragma multi_compile_fog
            #pragma multi_compile_instancing
            
            // Performance optimizations
            #pragma skip_variants SHADOWS_SOFT DIRLIGHTMAP_COMBINED DYNAMICLIGHTMAP_ON
            #pragma skip_variants LIGHTMAP_SHADOW_MIXING SHADOWS_SHADOWMASK
            #pragma skip_variants UNITY_SPECCUBE_BOX_PROJECTION UNITY_SPECCUBE_BLENDING
            
            // Feature toggles for different LOD levels
            #pragma multi_compile __ LOD_FADE_PERCENTAGE
            #pragma multi_compile __ ENABLE_NORMAL_MAPPING
            #pragma multi_compile __ ENABLE_OCCLUSION
            #pragma multi_compile __ ENABLE_EMISSION
            #pragma multi_compile __ ENABLE_METALLIC_WORKFLOW
            #pragma multi_compile __ WIREFRAME_MODE
            #pragma multi_compile __ DATA_VISUALIZATION_MODE
            
            #include "UnityCG.cginc"
            #include "Lighting.cginc"
            #include "AutoLight.cginc"
            
            // Properties
            sampler2D _MainTex;
            float4 _MainTex_ST;
            fixed4 _Color;
            
            #ifdef ENABLE_METALLIC_WORKFLOW
                sampler2D _MetallicGlossMap;
                half _Metallic;
                half _Glossiness;
            #endif
            
            #ifdef ENABLE_NORMAL_MAPPING
                sampler2D _BumpMap;
                half _BumpScale;
            #endif
            
            #ifdef ENABLE_OCCLUSION
                sampler2D _OcclusionMap;
                half _OcclusionStrength;
            #endif
            
            #ifdef ENABLE_EMISSION
                sampler2D _EmissionMap;
                fixed4 _EmissionColor;
            #endif
            
            // WebGL optimization properties
            half _LODFade;
            float _CullingDistance;
            int _SimplificationLevel;
            int _MaxLights;
            half _DitherFactor;
            
            // Data visualization properties
            #ifdef DATA_VISUALIZATION_MODE
                half _DataValue;
                sampler2D _ColorRamp;
                float _HeightScale;
            #endif
            
            #ifdef WIREFRAME_MODE
                fixed4 _WireframeColor;
                half _WireframeWidth;
            #endif
            
            struct appdata
            {
                float4 vertex : POSITION;
                float3 normal : NORMAL;
                float2 uv : TEXCOORD0;
                float2 uv1 : TEXCOORD1;
                
                #ifdef ENABLE_NORMAL_MAPPING
                    float4 tangent : TANGENT;
                #endif
                
                #ifdef DATA_VISUALIZATION_MODE
                    float4 color : COLOR;
                #endif
                
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };
            
            struct v2f
            {
                float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
                float3 worldPos : TEXCOORD1;
                float3 worldNormal : TEXCOORD2;
                
                #ifdef ENABLE_NORMAL_MAPPING
                    float3 worldTangent : TEXCOORD3;
                    float3 worldBinormal : TEXCOORD4;
                #endif
                
                #ifdef DATA_VISUALIZATION_MODE
                    float4 vertexColor : TEXCOORD5;
                #endif
                
                #ifdef WIREFRAME_MODE
                    float3 barycentricCoords : TEXCOORD6;
                #endif
                
                UNITY_FOG_COORDS(7)
                SHADOW_COORDS(8)
                UNITY_VERTEX_OUTPUT_STEREO
            };
            
            // Optimized vertex shader
            v2f vert(appdata v)
            {
                v2f o;
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                
                // LOD-based vertex position modification
                float3 worldPos = mul(unity_ObjectToWorld, v.vertex).xyz;
                float distanceToCamera = distance(worldPos, _WorldSpaceCameraPos);
                
                // Cull distant objects early
                if (distanceToCamera > _CullingDistance)
                {
                    o.pos = float4(2.0, 2.0, 2.0, 1.0); // Move outside frustum
                    return o;
                }
                
                // Data visualization height displacement
                #ifdef DATA_VISUALIZATION_MODE
                    v.vertex.y += _DataValue * _HeightScale;
                    o.vertexColor = v.color;
                #endif
                
                // Transform vertex
                o.pos = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                o.worldPos = worldPos;
                o.worldNormal = UnityObjectToWorldNormal(v.normal);
                
                #ifdef ENABLE_NORMAL_MAPPING
                    o.worldTangent = UnityObjectToWorldDir(v.tangent.xyz);
                    o.worldBinormal = cross(o.worldNormal, o.worldTangent) * v.tangent.w;
                #endif
                
                #ifdef WIREFRAME_MODE
                    // Calculate barycentric coordinates for wireframe
                    o.barycentricCoords = float3(1,0,0);
                #endif
                
                UNITY_TRANSFER_FOG(o, o.pos);
                TRANSFER_SHADOW(o);
                
                return o;
            }
            
            // Optimized dithering function for transparency
            float DitherNoiseLOD(float2 screenPos, float alpha)
            {
                float noise = frac(sin(dot(screenPos.xy, float2(12.9898, 78.233))) * 43758.5453);
                return alpha - noise * _DitherFactor;
            }
            
            // Simplified lighting calculation for WebGL
            fixed3 SimplifiedLighting(float3 worldPos, float3 worldNormal, float3 albedo)
            {
                // Ambient
                fixed3 ambient = ShadeSH9(float4(worldNormal, 1.0));
                
                // Main directional light
                float3 lightDir = normalize(_WorldSpaceLightPos0.xyz);
                float NdotL = saturate(dot(worldNormal, lightDir));
                fixed3 diffuse = _LightColor0.rgb * NdotL;
                
                // Simple shadow attenuation
                UNITY_LIGHT_ATTENUATION(atten, 0, worldPos);
                diffuse *= atten;
                
                return (ambient + diffuse) * albedo;
            }
            
            // Optimized fragment shader
            fixed4 frag(v2f i) : SV_Target
            {
                // Base color
                fixed4 col = tex2D(_MainTex, i.uv) * _Color;
                
                #ifdef DATA_VISUALIZATION_MODE
                    // Data-driven color mapping
                    fixed4 dataColor = tex2D(_ColorRamp, float2(_DataValue, 0.5));
                    col.rgb = lerp(col.rgb, dataColor.rgb, _DataValue);
                    col *= i.vertexColor;
                #endif
                
                // Wireframe rendering
                #ifdef WIREFRAME_MODE
                    float3 barys = i.barycentricCoords;
                    float minBary = min(barys.x, min(barys.y, barys.z));
                    float wireframe = 1.0 - smoothstep(0.0, _WireframeWidth, minBary);
                    col.rgb = lerp(col.rgb, _WireframeColor.rgb, wireframe);
                #endif
                
                // Normal mapping (if enabled)
                float3 worldNormal = i.worldNormal;
                #ifdef ENABLE_NORMAL_MAPPING
                    float3 normalMap = UnpackScaleNormal(tex2D(_BumpMap, i.uv), _BumpScale);
                    float3x3 TBN = float3x3(i.worldTangent, i.worldBinormal, i.worldNormal);
                    worldNormal = normalize(mul(normalMap, TBN));
                #endif
                
                // Lighting calculation
                fixed3 lighting = SimplifiedLighting(i.worldPos, worldNormal, col.rgb);
                col.rgb = lighting;
                
                // Metallic workflow (if enabled)
                #ifdef ENABLE_METALLIC_WORKFLOW
                    fixed4 metallicGloss = tex2D(_MetallicGlossMap, i.uv);
                    half metallic = metallicGloss.r * _Metallic;
                    half smoothness = metallicGloss.a * _Glossiness;
                    
                    // Simple PBR approximation
                    float3 viewDir = normalize(_WorldSpaceCameraPos - i.worldPos);
                    float3 reflectDir = reflect(-viewDir, worldNormal);
                    float3 specular = pow(saturate(dot(reflectDir, viewDir)), smoothness * 128.0) * metallic;
                    col.rgb += specular;
                #endif
                
                // Occlusion (if enabled)
                #ifdef ENABLE_OCCLUSION
                    half occlusion = tex2D(_OcclusionMap, i.uv).g;
                    col.rgb *= lerp(1.0, occlusion, _OcclusionStrength);
                #endif
                
                // Emission (if enabled)
                #ifdef ENABLE_EMISSION
                    fixed3 emission = tex2D(_EmissionMap, i.uv).rgb * _EmissionColor.rgb;
                    col.rgb += emission;
                #endif
                
                // LOD fade
                #ifdef LOD_FADE_PERCENTAGE
                    col.a *= _LODFade;
                    
                    // Dithered transparency for smooth LOD transitions
                    float dither = DitherNoiseLOD(i.pos.xy, col.a);
                    clip(dither);
                #endif
                
                // Apply fog
                UNITY_APPLY_FOG(i.fogCoord, col);
                
                return col;
            }
            ENDCG
        }
        
        // Simplified shadow pass for performance
        Pass
        {
            Name "ShadowCaster"
            Tags{"LightMode" = "ShadowCaster"}
            
            ZWrite On ZTest LEqual Cull Off
            
            CGPROGRAM
            #pragma vertex vert_shadow
            #pragma fragment frag_shadow
            #pragma target 3.0
            #pragma multi_compile_shadowcaster
            #pragma multi_compile_instancing
            
            #include "UnityCG.cginc"
            
            struct appdata_shadow
            {
                float4 vertex : POSITION;
                float3 normal : NORMAL;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };
            
            struct v2f_shadow
            {
                V2F_SHADOW_CASTER;
                UNITY_VERTEX_OUTPUT_STEREO
            };
            
            v2f_shadow vert_shadow(appdata_shadow v)
            {
                v2f_shadow o;
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                TRANSFER_SHADOW_CASTER_NORMALOFFSET(o)
                return o;
            }
            
            fixed4 frag_shadow(v2f_shadow i) : SV_Target
            {
                SHADOW_CASTER_FRAGMENT(i)
            }
            ENDCG
        }
    }
    
    // Lower LOD version for distant objects
    SubShader
    {
        Tags 
        { 
            "RenderType"="Opaque" 
            "Queue"="Geometry"
            "LightMode"="ForwardBase"
            "PerformanceHints"="VertexLit"
        }
        
        LOD 150
        
        Pass
        {
            Name "FORWARD_LOD"
            Tags { "LightMode"="ForwardBase" }
            
            CGPROGRAM
            #pragma vertex vert_lod
            #pragma fragment frag_lod
            #pragma target 2.0
            #pragma multi_compile_fwdbase nolightmap nodirlightmap nodynlightmap
            #pragma multi_compile_fog
            #pragma multi_compile_instancing
            
            #include "UnityCG.cginc"
            #include "Lighting.cginc"
            
            sampler2D _MainTex;
            float4 _MainTex_ST;
            fixed4 _Color;
            
            struct appdata_lod
            {
                float4 vertex : POSITION;
                float3 normal : NORMAL;
                float2 uv : TEXCOORD0;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };
            
            struct v2f_lod
            {
                float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
                float3 worldNormal : TEXCOORD1;
                UNITY_FOG_COORDS(2)
                UNITY_VERTEX_OUTPUT_STEREO
            };
            
            v2f_lod vert_lod(appdata_lod v)
            {
                v2f_lod o;
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                
                o.pos = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                o.worldNormal = UnityObjectToWorldNormal(v.normal);
                
                UNITY_TRANSFER_FOG(o, o.pos);
                return o;
            }
            
            fixed4 frag_lod(v2f_lod i) : SV_Target
            {
                fixed4 col = tex2D(_MainTex, i.uv) * _Color;
                
                // Very simple lighting
                float NdotL = saturate(dot(i.worldNormal, _WorldSpaceLightPos0.xyz));
                col.rgb *= _LightColor0.rgb * NdotL + ShadeSH9(float4(i.worldNormal, 1.0));
                
                UNITY_APPLY_FOG(i.fogCoord, col);
                return col;
            }
            ENDCG
        }
    }
    
    // Fallback for older hardware
    FallBack "Mobile/Diffuse"
    CustomEditor "WebGLOptimizedShaderGUI"
}
