import numpy as np

class SurfacePainter:
    def apply_perspective_grid(self, gbuffer, camera_pos, grid_spacing=2.0, line_color=(0.28, 0.34, 0.44)):
        valid = gbuffer.object_id == 1
        if not np.any(valid):
            return
        h, w = gbuffer.depth.shape
        yy, xx = np.mgrid[0:h, 0:w]
        z = np.where(valid, gbuffer.depth, 1.0)
        world_x = ((xx - w * 0.5) / 900.0) * z + camera_pos[0]
        grid_x = np.abs((world_x / grid_spacing) - np.round(world_x / grid_spacing)) < 0.035
        grid_z = np.abs((z / grid_spacing) - np.round(z / grid_spacing)) < 0.045
        mask = valid & (grid_x | grid_z)
        gbuffer.albedo[mask] = np.array(line_color, dtype=np.float32)
