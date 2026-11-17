import numpy as np

class ShortQAValidator:
    def audit_frame(self, rgb_uint8, frame_idx=0):
        mean_luma = float(np.mean(rgb_uint8))
        clipped_white = float(np.mean(rgb_uint8 >= 254))
        clipped_black = float(np.mean(rgb_uint8 <= 1))
        passed = (18.0 <= mean_luma <= 235.0) and (clipped_white < 0.25)
        return {
            "frame": frame_idx,
            "mean_luma": round(mean_luma, 2),
            "clipped_white_pct": round(clipped_white * 100, 2),
            "clipped_black_pct": round(clipped_black * 100, 2),
            "status": "PASS" if passed else "WARN"
        }
