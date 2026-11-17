import numpy as np

class EiffelSetPiece:
    def __init__(self, world_z=18.0, base_width=4.5, tower_height=9.0):
        self.world_z = float(world_z)
        self.base_width = float(base_width)
        self.tower_height = float(tower_height)
        self.steel_color = np.array([0.42, 0.38, 0.34], dtype=np.float32)

    def render_into_gbuffer(self, gbuffer, camera_pos, focal=900.0):
        rel_z = self.world_z - camera_pos[2]
        if rel_z <= 0.5:
            return
        h, w = gbuffer.depth.shape
        horizon_y = int(h * 0.45)
        ground_y = int(horizon_y + (1.5 * h * 0.55 / rel_z))
        top_y = max(0, int(ground_y - (self.tower_height * focal / rel_z)))
        if top_y >= ground_y:
            return
        yy, xx = np.mgrid[top_y:ground_y, 0:w]
        progress = (yy - top_y) / max(1.0, float(ground_y - top_y))
        # Tapered lattice silhouette curve
        half_w = ((0.06 + 0.94 * (progress ** 1.7)) * (self.base_width * 0.5 * focal / rel_z))
        cx = w * 0.5 - (camera_pos[0] * focal / rel_z)
        in_silhouette = np.abs(xx - cx) <= half_w
        # Hollow arch cutout at the base + truss lattice pattern
        arch_cutout = (progress > 0.72) & (np.abs(xx - cx) < half_w * 0.42)
        truss = ((yy + xx) % 14 < 3) | ((yy - xx) % 14 < 3) | (progress < 0.25)
        tower_mask = in_silhouette & (~arch_cutout) & truss

        sub_depth = gbuffer.depth[top_y:ground_y, :]
        write_mask = tower_mask & (rel_z < sub_depth)
        sub_depth[write_mask] = rel_z
        gbuffer.normals[top_y:ground_y, :][write_mask] = np.array([0.0, 0.25, -0.96], dtype=np.float32)
        gbuffer.albedo[top_y:ground_y, :][write_mask] = self.steel_color
        gbuffer.object_id[top_y:ground_y, :][write_mask] = 2
