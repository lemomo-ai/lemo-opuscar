import numpy as np

class GBuffer:
    """Stores multi-pass screen-space buffers for hybrid 2D/3D compositing."""
    def __init__(self, width=1080, height=1920):
        self.width = width
        self.height = height
        self.depth = np.full((height, width), np.inf, dtype=np.float32)
        self.normals = np.zeros((height, width, 3), dtype=np.float32)
        self.albedo = np.zeros((height, width, 3), dtype=np.float32)
        self.object_id = np.zeros((height, width), dtype=np.int32)

    def clear(self):
        self.depth.fill(np.inf)
        self.normals.fill(0.0)
        self.albedo.fill(0.0)
        self.object_id.fill(0)

class WorldScene:
    """Manages 3D environment objects, ground planes, and depth projection."""
    def __init__(self, width=1080, height=1920):
        self.gbuffer = GBuffer(width, height)
        self.entities = []

    def add_entity(self, name, position, scale, color, obj_id):
        self.entities.append({
            "name": name,
            "position": np.array(position, dtype=np.float32),
            "scale": np.array(scale, dtype=np.float32),
            "color": np.array(color, dtype=np.float32),
            "id": obj_id
        })

    def render_ground_plane(self, camera_pos, horizon_ratio=0.45):
        """Generates analytical depth and upward-facing normals for the 3D floor."""
        self.gbuffer.clear()
        horizon_y = int(self.gbuffer.height * horizon_ratio)
        y_indices = np.arange(horizon_y, self.gbuffer.height)[:, None]
        rel_y = np.maximum((y_indices - horizon_y) / max(1, (self.gbuffer.height - horizon_y)), 1e-4)
        
        row_depths = (1.5 / rel_y) + camera_pos[2]
        self.gbuffer.depth[horizon_y:, :] = row_depths
        self.gbuffer.normals[horizon_y:, :] = np.array([0.0, 1.0, 0.0], dtype=np.float32)
        self.gbuffer.albedo[horizon_y:, :] = np.array([0.18, 0.20, 0.24], dtype=np.float32)
        self.gbuffer.object_id[horizon_y:, :] = 1
        return self.gbuffer
