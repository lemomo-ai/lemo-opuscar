import numpy as np

class CameraController:
    def __init__(self, fps=30):
        self.fps = fps
        self.position = np.array([0.0, 0.0, 0.0], dtype=np.float32)
        self.rotation = np.array([0.0, 0.0, 0.0], dtype=np.float32)
        self.shake_decay = 0.0

    def smootherstep(self, edge0, edge1, x):
        x = np.clip((x - edge0) / max(1e-5, (edge1 - edge0)), 0.0, 1.0)
        return x * x * x * (x * (x * 6 - 15) + 10)

    def update(self, frame_idx, total_frames=90):
        t = frame_idx / max(1, total_frames - 1)
        # Smooth dolly push-in using smootherstep
        ease = self.smootherstep(0.0, 1.0, t)
        self.position[2] = ease * 1.4
        # Damped impact camera shake
        if self.shake_decay > 0.001:
            self.position[0] = (np.random.rand() - 0.5) * self.shake_decay
            self.position[1] = (np.random.rand() - 0.5) * self.shake_decay
            self.shake_decay *= 0.72
        else:
            self.position[0] = 0.0
            self.position[1] = 0.0

    def trigger_impact_shake(self, intensity=0.25):
        self.shake_decay = float(intensity)
