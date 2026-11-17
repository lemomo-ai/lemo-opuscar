import numpy as np

class InkOutliner:
    def __init__(self, line_color=(0.04, 0.04, 0.06), depth_threshold=0.35):
        self.line_color = np.array(line_color, dtype=np.float32)
        self.depth_threshold = depth_threshold

    def apply_outlines(self, img, gbuffer):
        id_pad = np.pad(gbuffer.object_id, 1, mode="edge")
        id_edge = (
            (id_pad[1:-1, 1:-1] != id_pad[:-2, 1:-1]) |
            (id_pad[1:-1, 1:-1] != id_pad[2:, 1:-1]) |
            (id_pad[1:-1, 1:-1] != id_pad[1:-1, :-2]) |
            (id_pad[1:-1, 1:-1] != id_pad[1:-1, 2:])
        )
        safe_depth = np.where(gbuffer.depth < 1e8, gbuffer.depth, 50.0)
        d_pad = np.pad(safe_depth, 1, mode="edge")
        grad_x = np.abs(d_pad[1:-1, 2:] - d_pad[1:-1, :-2])
        grad_y = np.abs(d_pad[2:, 1:-1] - d_pad[:-2, 1:-1])
        depth_edge = (grad_x + grad_y) > self.depth_threshold
        edge_mask = (id_edge | depth_edge)[..., None]
        return np.where(edge_mask, self.line_color, img)
