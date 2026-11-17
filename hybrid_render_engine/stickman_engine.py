import numpy as np

class StickmanRenderer:
    def _draw_segment(self, img, depth_buf, p0, p1, radius, color, char_depth):
        h, w = img.shape[:2]
        min_x = max(0, int(min(p0[0], p1[0]) - radius - 2))
        max_x = min(w - 1, int(max(p0[0], p1[0]) + radius + 2))
        min_y = max(0, int(min(p0[1], p1[1]) - radius - 2))
        max_y = min(h - 1, int(max(p0[1], p1[1]) + radius + 2))
        if min_x >= max_x or min_y >= max_y:
            return
        yy, xx = np.mgrid[min_y:max_y+1, min_x:max_x+1]
        pts = np.stack([xx, yy], axis=-1).astype(np.float32)
        ab = p1 - p0
        ab_len2 = max(float(np.dot(ab, ab)), 1e-5)
        t = np.clip(np.sum((pts - p0) * ab, axis=-1) / ab_len2, 0.0, 1.0)
        closest = p0 + t[..., None] * ab
        dist = np.linalg.norm(pts - closest, axis=-1)
        mask = (dist <= radius) & (char_depth <= depth_buf[min_y:max_y+1, min_x:max_x+1])
        img[min_y:max_y+1, min_x:max_x+1][mask] = color
        depth_buf[min_y:max_y+1, min_x:max_x+1][mask] = char_depth

    def render_shockwave(self, img, world_pos, camera_pos, progress, focal=450.0, color=(0.35, 0.85, 1.0)):
        if progress <= 0.0 or progress >= 1.0:
            return img
        h, w = img.shape[:2]
        rel = np.array(world_pos, dtype=np.float32) - camera_pos
        z = max(0.5, float(rel[2]))
        cx = w * 0.5 + (rel[0] * focal / z)
        cy = h * 0.45 + (1.5 * h * 0.55 / z) - (rel[1] * focal / z)
        rx = (0.3 + progress * 2.4) * (focal / z)
        ry = rx * 0.28
        thickness = max(2.0, (1.0 - progress) * 8.0)

        min_x = max(0, int(cx - rx - thickness - 4))
        max_x = min(w - 1, int(cx + rx + thickness + 4))
        min_y = max(0, int(cy - ry - thickness - 4))
        max_y = min(h - 1, int(cy + ry + thickness + 4))
        if min_x >= max_x or min_y >= max_y:
            return img
        yy, xx = np.mgrid[min_y:max_y+1, min_x:max_x+1]
        norm_d = np.sqrt(((xx - cx) / max(1.0, rx)) ** 2 + ((yy - cy) / max(1.0, ry)) ** 2)
        ring_dist = np.abs(norm_d - 1.0) * rx
        alpha = np.clip(1.0 - (ring_dist / thickness), 0.0, 1.0) * (1.0 - progress)
        sub = img[min_y:max_y+1, min_x:max_x+1]
        img[min_y:max_y+1, min_x:max_x+1] = np.clip(sub + alpha[..., None] * np.array(color, dtype=np.float32), 0.0, 1.0)
        return img

    def render_actor(self, img, gbuffer, actor, camera_pos, focal=450.0):
        h, w = img.shape[:2]
        rig = actor.get_joints_2d(w, h, camera_pos, focal=focal)
        thickness = max(2.0, rig["radius"] * 0.25)
        for p0, p1 in rig["bones"]:
            self._draw_segment(img, gbuffer.depth, p0, p1, thickness, actor.color, rig["depth"])
        self._draw_segment(img, gbuffer.depth, rig["head"], rig["head"], rig["radius"], actor.color, rig["depth"])
        return img
