import numpy as np

class LightingEngine:
    """Computes multi-pass directional shading, rim highlights, and depth fog."""
    def __init__(self, sun_dir=(0.4, 0.8, -0.4), sun_color=(1.0, 0.96, 0.90), ambient=0.22):
        dir_vec = np.array(sun_dir, dtype=np.float32)
        self.sun_dir = dir_vec / np.linalg.norm(dir_vec)
        self.sun_color = np.array(sun_color, dtype=np.float32)
        self.ambient = ambient
        self.fog_color = np.array([0.06, 0.08, 0.12], dtype=np.float32)
        self.fog_density = 0.035

    def shade_gbuffer(self, gbuffer):
        """Applies Lambertian diffuse lighting and exponential depth fog."""
        # Dot product of surface normals with directional light
        ndotl = np.clip(np.sum(gbuffer.normals * self.sun_dir, axis=-1, keepdims=True), 0.0, 1.0)
        lit = gbuffer.albedo * (self.ambient + ndotl * self.sun_color)

        # Exponential depth fog based on G-buffer depth
        valid_mask = gbuffer.depth < 1e8
        safe_depth = np.where(valid_mask, gbuffer.depth, 0.0)
        fog_factor = np.exp(-self.fog_density * safe_depth)[..., None]

        shaded = np.where(
            valid_mask[..., None],
            lit * fog_factor + self.fog_color * (1.0 - fog_factor),
            self.fog_color
        )
        return np.clip(shaded, 0.0, 1.0)
