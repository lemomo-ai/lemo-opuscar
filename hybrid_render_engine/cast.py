import numpy as np

class StickmanActor:
    def __init__(self, name, world_pos=(0.0, 0.0, 4.2), scale=1.1, color=(0.05, 0.05, 0.08)):
        self.name = name
        self.world_pos = np.array(world_pos, dtype=np.float32)
        self.scale = float(scale)
        self.color = np.array(color, dtype=np.float32)
        self.phase = 0.0
        self.state = "walk"
        self.jump_height = 0.0

    def set_action(self, state, phase=0.0, jump_height=0.0):
        self.state = state
        self.phase = float(phase)
        self.jump_height = float(jump_height)

    def get_joints_2d(self, width, height, camera_pos, focal=450.0):
        pos = self.world_pos.copy()
        pos[1] += self.jump_height
        rel = pos - camera_pos
        z = max(0.5, float(rel[2]))
        cx = width * 0.5 + (rel[0] * focal / z)
        cy = height * 0.45 + (1.5 * height * 0.55 / z) - (rel[1] * focal / z)
        s = (focal / z) * self.scale * 0.45

        if self.state == "jump":
            crouch = 0.0
            swing = 0.55
            arm_raise = -0.85
        elif self.state == "land":
            crouch = 0.32 * s
            swing = 0.2
            arm_raise = 0.25
        else:
            crouch = abs(np.sin(self.phase)) * 0.08 * s
            swing = np.sin(self.phase) * 0.42
            arm_raise = 0.0

        hip = np.array([cx, cy - s * 1.1 + crouch])
        neck = np.array([cx + swing * 0.12 * s, cy - s * 2.1 + crouch])
        head = np.array([cx + swing * 0.16 * s, cy - s * 2.45 + crouch])

        l_knee = np.array([cx - s * (0.18 + swing * 0.5), cy - s * 0.55 + crouch * 0.5])
        r_knee = np.array([cx + s * (0.18 - swing * 0.5), cy - s * 0.55 + crouch * 0.5])
        l_foot = np.array([cx - s * (0.24 + swing), cy])
        r_foot = np.array([cx + s * (0.24 - swing), cy])

        l_elbow = np.array([cx - s * (0.34 - swing * 0.4), cy - s * (1.65 - arm_raise * 0.5) + crouch])
        r_elbow = np.array([cx + s * (0.34 + swing * 0.4), cy - s * (1.65 - arm_raise * 0.5) + crouch])
        l_hand = np.array([cx - s * (0.48 - swing * 0.8), cy - s * (1.30 - arm_raise) + crouch])
        r_hand = np.array([cx + s * (0.48 + swing * 0.8), cy - s * (1.30 - arm_raise) + crouch])

        bones = [
            (hip, neck),
            (hip, l_knee), (l_knee, l_foot),
            (hip, r_knee), (r_knee, r_foot),
            (neck, l_elbow), (l_elbow, l_hand),
            (neck, r_elbow), (r_elbow, r_hand)
        ]
        return {"head": head, "radius": max(4.0, s * 0.28), "bones": bones, "depth": z}
