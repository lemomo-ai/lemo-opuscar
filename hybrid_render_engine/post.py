import numpy as np

class PostProcessor:
    def __init__(self, grain_amount=0.015):
        self.grain_amount = grain_amount

    def apply(self, img):
        noise = (np.random.rand(*img.shape).astype(np.float32) - 0.5) * self.grain_amount
        return np.clip(img + noise, 0.0, 1.0)
