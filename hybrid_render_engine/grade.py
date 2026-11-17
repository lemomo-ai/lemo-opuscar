import numpy as np

class ColorGrader:
    def __init__(self, contrast=1.12, saturation=1.08, vignette_strength=0.35):
        self.contrast = contrast
        self.saturation = saturation
        self.vignette_strength = vignette_strength

    def apply(self, img):
        # Filmic S-curve contrast
        graded = np.clip((img - 0.5) * self.contrast + 0.5, 0.0, 1.0)
        # Saturation boost
        lum = np.mean(graded, axis=-1, keepdims=True)
        graded = np.clip(lum + (graded - lum) * self.saturation, 0.0, 1.0)
        # Radial vignette
        h, w = graded.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        nx = (xx - w * 0.5) / (w * 0.5)
        ny = (yy - h * 0.5) / (h * 0.5)
        vig = 1.0 - np.clip((nx * nx + ny * ny) * self.vignette_strength, 0.0, 0.85)
        return np.clip(graded * vig[..., None], 0.0, 1.0)
