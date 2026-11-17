import numpy as np

FONT_5X7 = {
    "A": ["01110","10001","10001","11111","10001","10001","10001"],
    "B": ["11110","10001","10001","11110","10001","10001","11110"],
    "C": ["01110","10001","10000","10000","10000","10001","01110"],
    "D": ["11100","10010","10001","10001","10001","10010","11100"],
    "E": ["11111","10000","10000","11110","10000","10000","11111"],
    "F": ["11111","10000","10000","11110","10000","10000","10000"],
    "G": ["01110","10001","10000","10111","10001","10001","01111"],
    "H": ["10001","10001","10001","11111","10001","10001","10001"],
    "I": ["01110","00100","00100","00100","00100","00100","01110"],
    "J": ["00111","00010","00010","00010","10010","10010","01100"],
    "K": ["10001","10010","10100","11000","10100","10010","10001"],
    "L": ["10000","10000","10000","10000","10000","10000","11111"],
    "M": ["10001","11011","10101","10101","10001","10001","10001"],
    "N": ["10001","11001","10101","10011","10001","10001","10001"],
    "O": ["01110","10001","10001","10001","10001","10001","01110"],
    "P": ["11110","10001","10001","11110","10000","10000","10000"],
    "Q": ["01110","10001","10001","10001","10101","10010","01101"],
    "R": ["11110","10001","10001","11110","10100","10010","10001"],
    "S": ["01111","10000","10000","01110","00001","00001","11110"],
    "T": ["11111","00100","00100","00100","00100","00100","00100"],
    "U": ["10001","10001","10001","10001","10001","10001","01110"],
    "V": ["10001","10001","10001","10001","10001","01010","00100"],
    "W": ["10001","10001","10001","10101","10101","11011","10001"],
    "X": ["10001","10001","01010","00100","01010","10001","10001"],
    "Y": ["10001","10001","01010","00100","00100","00100","00100"],
    "Z": ["11111","00001","00010","00100","01000","10000","11111"],
    "0": ["01110","10011","10101","10101","11001","10001","01110"],
    "1": ["00100","01100","00100","00100","00100","00100","01110"],
    "2": ["01110","10001","00001","00110","01000","10000","11111"],
    "3": ["11110","00001","00001","01110","00001","00001","11110"],
    "4": ["00010","00110","01010","10010","11111","00010","00010"],
    "5": ["11111","10000","11110","00001","00001","10001","01110"],
    "6": ["01110","10000","11110","10001","10001","10001","01110"],
    "7": ["11111","00001","00010","00100","01000","01000","01000"],
    "8": ["01110","10001","10001","01110","10001","10001","01110"],
    "9": ["01110","10001","10001","01111","00001","00001","01110"],
    ".": ["00000","00000","00000","00000","00000","01100","01100"],
    ",": ["00000","00000","00000","00000","00100","00100","01000"],
    "!": ["00100","00100","00100","00100","00100","00000","00100"],
    "?": ["01110","10001","00001","00110","00100","00000","00100"],
    "-": ["00000","00000","00000","11111","00000","00000","00000"],
    ":": ["00000","01100","01100","00000","01100","01100","00000"],
    "/": ["00001","00010","00010","00100","01000","01000","10000"],
    "%": ["11001","11010","00010","00100","01000","01011","10011"],
    " ": ["00000","00000","00000","00000","00000","00000","00000"]
}

class HUDCaptionRenderer:
    def __init__(self, cues=None):
        # cues: list of dicts {"start": f0, "end": f1, "lines": ["LINE 1", "LINE 2"], "accent": "PYTHON", "y_ratio": 0.20}
        self.cues = cues or []
        self.glyphs = {}
        for ch, rows in FONT_5X7.items():
            arr = np.array([[int(c) for c in r] for r in rows], dtype=np.float32)
            self.glyphs[ch] = arr

    def set_cues(self, cues):
        self.cues = cues

    def _draw_line(self, img, text, center_x, top_y, scale, color, accent_word=None, accent_color=(0.15, 0.92, 1.0)):
        text = text.upper()
        h, w, _ = img.shape
        char_w = 5 * scale
        char_h = 7 * scale
        spacing = max(2, scale)
        total_w = len(text) * (char_w + spacing) - spacing
        if total_w <= 0:
            return

        # Dark backdrop pill for high readability
        pad_x = int(scale * 3.5)
        pad_y = int(scale * 2.5)
        x0 = max(0, int(center_x - total_w // 2 - pad_x))
        x1 = min(w, int(center_x + total_w // 2 + pad_x))
        y0 = max(0, int(top_y - pad_y))
        y1 = min(h, int(top_y + char_h + pad_y))
        img[y0:y1, x0:x1] *= 0.35

        # Find accent character indices if specified
        accent_mask = [False] * len(text)
        if accent_word:
            aw = accent_word.upper()
            idx = text.find(aw)
            if idx != -1:
                for k in range(idx, idx + len(aw)):
                    accent_mask[k] = True

        cur_x = int(center_x - total_w // 2)
        shadow_off = max(2, scale // 2)

        for i, ch in enumerate(text):
            g = self.glyphs.get(ch, self.glyphs[" "])
            scaled = np.repeat(np.repeat(g, scale, axis=0), scale, axis=1)
            gh, gw = scaled.shape

            # Drop shadow
            sy0, sy1 = top_y + shadow_off, top_y + shadow_off + gh
            sx0, sx1 = cur_x + shadow_off, cur_x + shadow_off + gw
            if 0 <= sy0 and sy1 <= h and 0 <= sx0 and sx1 <= w:
                m = scaled > 0.5
                img[sy0:sy1, sx0:sx1][m] = 0.0

            # Main glyph fill
            gy0, gy1 = top_y, top_y + gh
            gx0, gx1 = cur_x, cur_x + gw
            if 0 <= gy0 and gy1 <= h and 0 <= gx0 and gx1 <= w:
                m = scaled > 0.5
                c = accent_color if accent_mask[i] else color
                img[gy0:gy1, gx0:gx1][m] = c

            cur_x += char_w + spacing

    def apply(self, img, frame_idx):
        if not self.cues:
            return img
        h, w, _ = img.shape
        base_scale = max(4, int(round(w / 145.0)))
        for cue in self.cues:
            if cue["start"] <= frame_idx <= cue["end"]:
                lines = cue.get("lines", [])
                scale = cue.get("scale", base_scale)
                y_ratio = cue.get("y_ratio", 0.22)
                accent = cue.get("accent", None)
                accent_col = cue.get("accent_color", (0.15, 0.95, 1.0))
                line_gap = int(scale * 11.5)
                start_y = int(h * y_ratio) - ((len(lines) - 1) * line_gap) // 2
                for idx, line in enumerate(lines):
                    self._draw_line(
                        img, line, w // 2, start_y + idx * line_gap,
                        scale=scale, color=(1.0, 1.0, 1.0),
                        accent_word=accent, accent_color=accent_col
                    )
        return img
