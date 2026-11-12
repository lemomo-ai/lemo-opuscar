# Prompts (Codex image generation)

Every prompt and its references are in `prompts.json`; `../tools/gen_all.sh` draws them in order through `core/image/gen_image.py`. `"@name"` in a `ref` list means the image already drawn in `../gen/` under that name.

| # | Name | Aspect | Reference | Used for |
|---|---|---|---|---|
| 0 | `char_lookback` | 1:1 | none | the closing look back (head and body on separate layers), the mirrored reflection |
| 0 | `eye` | 16:9 | none | her red eye in close-up |
| 1 | `boy_front` | 1:1 | char_lookback (drawing style only) | him: medium shots and silhouettes (corridor, window wall, stair foreground, the reflection in the iris) |
| 2 | `boy_phone` | 1:1 | boy_front | the split-screen call |
| 3 | `boy_eye` | 16:9 | boy_front | his eye inserts (also inverted) |
| 4 | `letter_hands` | 16:9 | boy_front | both hands holding the letter (its writing is set in code) |
| 5 | `her_back` | 9:16 | char_lookback | the cold open from behind, the small silhouette at the top of the stairs, the low angle, the small silhouette on the end card |
| 6 | `her_front` | 1:1 | char_lookback | her in the window, the 3×3 grid of panes |
| 7 | `her_umbrella` | 9:16 | char_lookback | far down the rainy street, closing in beat by beat during the call |
| 8 | `her_hand` | 16:9 | char_lookback + boy_front | the hand on his shoulder |
| 9 | `her_mouth` | 16:9 | char_lookback | the corner of her mouth in close-up |

The first two have no reference; every other image references her sheet (`char_lookback`), his (`boy_front`), or both. These images belong to this demo only: a film on another topic draws its own characters from its own model sheets (STYLE.md §9).
