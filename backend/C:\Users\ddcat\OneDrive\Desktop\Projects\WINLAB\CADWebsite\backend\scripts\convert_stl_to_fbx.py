import bpy
import sys

argv = sys.argv
argv = argv[argv.index("--") + 1:]

stl_path = argv[0]
glb_path = argv[1]

# Enable STL import/export addon
bpy.ops.preferences.addon_enable(module='io_mesh_stl')

# Clear existing objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Import the STL
bpy.ops.import_mesh.stl(filepath=stl_path)

# Export to GLB
bpy.ops.export_scene.gltf(filepath=glb_path, export_format='GLB')

print(f"✅ Successfully converted {stl_path} to {glb_path}")
