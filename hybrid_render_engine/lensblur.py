import numpy as np

class DepthOfField:
    def __init__(self, focal_distance=4.0, aperture=0.18):
        self.focal_distance = float(focal_distance)
        self.aperture = float(aperture)

    def apply(self, img, gbuffer):
        # Fast separable box blur blended by circle-of-confusion from G-buffer depth
        pad = np.pad(img, ((2, 2), (2, 2), (0, 0)), mode="edge")
        blurred = (
            pad[:-4, 2:-2] + pad[1:-3, 2:-2] + pad[2:-2, 2:-2] + pad[3:-1, 2:-2] + pad[4:, 2:-2]
        ) / 5.0
        pad_h = np.pad(blurred, ((0, 0), (2, 2), (0, 0)), mode="edge")
        blurred = (
            pad_h[:, :-4] + pad_h[:, 1:-3] + pad_h[:, 2:-2] + pad_h[:, 3:-1] + pad_h[:, 4:]
        ) / 5.0

        safe_depth = np.where(gbuffer.depth < 1e8, gbuffer.depth, 25.0)
        coc = np.clip(np.abs(safe_depth - self.focal_distance) * self.aperture, 0.0, 1.0)[..., None]
        return img * (1.0 - coc) + blurred * coc
