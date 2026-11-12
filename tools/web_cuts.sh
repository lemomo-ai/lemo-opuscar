#!/bin/sh
# 720p web cuts for the gallery (served by GitHub Pages as video/mp4, which Safari needs).
# A cut is made when it doesn't exist yet or when its film is newer; a failing ffmpeg stops the run with exit 1.
cd "$(dirname "$0")/.."
mkdir -p .release/web
fail=0
webcut() {   # webcut <film> <slug>
  src=$1; out=.release/web/$2.mp4
  [ -f "$out" ] && [ ! "$src" -nt "$out" ] && return 0
  # the film's AAC track is copied as it is: mux.sh already holds it to -14 LUFS and true peak <= -1 dBTP,
  # and encoding it again (AAC 128k) pushed the peaks back over 0 dBTP. AAC-LC in MP4 plays in every browser, Safari and iOS included.
  # Audio that isn't AAC (a film not made with mux.sh) is encoded to AAC at the film's own 256k.
  case "$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$src" 2>/dev/null | head -1)" in
    aac|'') ca="-c:a copy" ;;
    *) ca="-c:a aac -b:a 256k"; echo "note: $2: the film's audio isn't AAC, so it is encoded (its true peak may rise; mux the film with core/render/mux.sh)" >&2 ;;
  esac
  # shellcheck disable=SC2086  ($ca splits into its arguments)
  if ffmpeg -v error -y -i "$src" -vf "scale=-2:720:flags=lanczos" -c:v libx264 -preset slow -crf 24 -maxrate 2M -bufsize 4M -pix_fmt yuv420p \
    $ca -movflags +faststart -f mp4 "$out.part"; then mv "$out.part" "$out"; echo "$2 $(du -h "$out" | cut -f1)"
  else rm -f "$out.part"; echo "✗ $2: ffmpeg could not make the web cut of $src" >&2; fail=1; fi
}
for f in styles/*/STYLE.md; do
  s=$(basename "$(dirname "$f")")
  [ -f "styles/$s/$s.mp4" ] && webcut "styles/$s/$s.mp4" "$s"
done
for f in .release/films/*.mp4; do      # feature films (not a style), e.g. opuscar98
  [ -f "$f" ] || continue
  s=$(basename "$f" .mp4)
  [ -f "styles/$s/STYLE.md" ] || webcut "$f" "$s"
done
du -sh .release/web
[ "$fail" = 0 ] || exit 1
