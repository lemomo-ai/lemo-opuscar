import numpy as np

class ToonShader:
    def __init__(self, bands=3, shadow_tint=(0.75, 0.80, 0.92)):
        self.bands = max(2, int(bands))
        self.shadow_tint = np.array(shadow_tint, dtype=np.float32)

    def apply_cel_shading(self, shaded_img, gbuffer):
        valid_mask = (gbuffer.depth < 1e8)[..., None]
        lum = np.mean(shaded_img, axis=-1, keepdims=True)
        quantized_lum = np.floor(lum * self.bands) / self.bands
        ratio = np.where(lum > 1e-5, quantized_lum / np.maximum(lum, 1e-5), 1.0)
        cel = shaded_img * (0.4 + 0.6 * ratio)
        cel = np.where(lum < (1.0 / self.bands), cel * self.shadow_tint, cel)
        return np.where(valid_mask, np.clip(cel, 0.0, 1.0), shaded_img)
