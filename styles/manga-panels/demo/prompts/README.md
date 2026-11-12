# Prompts

The text of every image the demo draws, one file per image in `../gen/`; `../tools/style_suffix.txt` is appended to each. They show how this style's prompts are written; a film in this style writes its own for its own characters and props (STYLE.md §9).

- **First pass** (`../tools/gen_all.sh`): the references `char_shoot` (the photographer, no reference) and `prod_hero` (the camera, `--ref char_shoot`), then every other image with `--ref` to the character and, where the camera shows, to `prod_hero`. The order and the references of each image are in `gen_all.sh`.
- **Changing the prop** (`../tools/gen_camswap.sh`, STYLE.md §9, Pipeline 6): `prod_hero_redesign.txt` redraws the camera alone as an edit of the first `prod_hero`; then each image that shows the camera is an edit of its first drawing, with the new `prod_hero` as the second reference. Its prompt is `_camswap.txt` + its line in `_camswap_list.txt` (how the camera is held and seen there) + `_camswap_tail.txt`. A close-up names its framing and scale outright (`finger`), or the edit pulls back to show the whole prop.
