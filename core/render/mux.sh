#!/bin/sh
# Mux the finished film: mux.sh video.mp4 mix.wav out.mp4 [fps] [grain]
# Video is output at the target frame rate (held segments get duplicated frames automatically); grain = grain strength (default 2, 0 = none; use 0 for pixel/vector styles)
# Audio: two-pass loudnorm → −14 LUFS / TP −1.2 (a single pass is off by about 0.5 LU); finally prints the measured I / LRA / true peak and warns if off target (loudness outside ±1 LU or peak above −1 dB)
# (when the mix itself clips or has extremely high peaks, loudnorm's dynamic mode misses both targets; measured −20 LUFS / +5 dBTP)
# Any failed ffmpeg step exits non-zero and leaves no half-written file; the output path is printed only if the finished file exists and is non-empty.
#   (the film is written to a temporary file beside the output and renamed when complete, so Ctrl-C or a failed re-mux never touches an earlier good film)
# Silent / extremely quiet audio (below −70 LUFS, which loudnorm can't measure): only when it "decoded successfully and measured as truly silent" is loudness normalisation skipped with a warning; the film is still made.
# Not audio, no audio stream, or a damaged file: exit 1, no film. "Damaged" is judged from what actually decodes, not from seeing error wording:
#   · the decoder reported an error (with damaged FLAC/MP3/M4A, ffmpeg often reports an error yet returns 0);
#   · the decoded duration is clearly shorter than the container claims (truncated FLAC/MP3);
#   · the WAV header declares more audio than the file actually holds (interrupted halfway through writing).
#   A WAV streamed out by `ffmpeg … -f wav -` has a placeholder length in its header and decodes completely, but ends with three demuxer notices: that's a good file and the film is made as usual (with a one-line note).
#   One case it can't detect: a streamed WAV truncated exactly on a sample boundary (no header length to compare, and decoding shows no error).
# Audio shorter than the picture: padded with silence to the picture's length (the video is never cut short); audio longer: cut to the picture's length as before (-shortest).
# Colour: by default exactly as before (keeps the yuvj420p full range / bt470bg tags that video.mjs outputs); LEMO_COLOR=bt709 switches to standard yuv420p limited range / bt709 (picture values differ by ±3 at most, but there's a slight colour difference from older films).
die() { echo "mux.sh: $*" >&2; exit 1; }
V="$1"; A="$2"; O="$3"; FPS="${4:-24}"; GR="${5:-2}"
[ -n "$V" ] && [ -n "$A" ] && [ -n "$O" ] || die "usage: sh core/render/mux.sh video.mp4 mix.wav out.mp4 [fps=24] [grain=2]"
[ -f "$V" ] || die "video not found: $V"
[ -f "$A" ] || die "audio not found: $A"
case "$FPS" in ''|*[!0-9.]*) die "fps must be a number, got '$FPS'";; esac
case "$GR" in ''|*[!0-9.]*) die "grain must be a number (0 = none), got '$GR'";; esac
case "${LEMO_COLOR:-}" in ''|bt709) ;; *) die "LEMO_COLOR must be bt709 or unset, got '$LEMO_COLOR'";; esac

# Check whether the audio length declared in the WAV header exceeds the file (for a WAV truncated on a sample boundary, ffmpeg itself reports no error). Reads the length byte by byte, independent of the machine's byte order
wav_truncated() {   # returns 0 = the header declares more than the file holds; a placeholder length (0 or 0xFFFFFFFF) is treated as "length unknown", not truncated
  [ "$(dd if="$1" bs=1 count=4 2>/dev/null)" = RIFF ] && [ "$(dd if="$1" bs=1 skip=8 count=4 2>/dev/null)" = WAVE ] || return 1
  _size=$(wc -c < "$1" | tr -d ' '); _off=12
  while [ $((_off + 8)) -le "$_size" ]; do
    _id=$(dd if="$1" bs=1 skip=$_off count=4 2>/dev/null)
    set -- "$1" $(od -An -tu1 -j $((_off + 4)) -N4 "$1"); _len=$(($2 + $3 * 256 + $4 * 65536 + $5 * 16777216))
    if [ "$_id" = data ]; then
      [ "$_len" -eq 0 ] || [ "$_len" -eq 4294967295 ] && return 1
      [ $((_off + 8 + _len)) -gt "$_size" ] && return 0 || return 1
    fi
    _off=$((_off + 8 + _len + (_len & 1)))
  done
  return 1
}

# first pass: measure loudness
[ -n "$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of csv=p=0 "$A" 2>/dev/null)" ] || die "no audio stream in '$A' (is it really the mixed audio file?)"
M=$(ffmpeg -hide_banner -nostats -progress pipe:2 -i "$A" -af loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json -f null - 2>&1) || die "ffmpeg cannot read the audio '$A': $(echo "$M" | tail -2)"
wav_truncated "$A" && die "the WAV file '$A' is cut off: its header promises more audio than the file contains (was the write interrupted?)"
# decoder/demuxer log lines all start with [name @ 0x…]; any with error wording, except the three fixed streamed-WAV notices below, mean the file is damaged (loudness would be -inf, but that isn't "silence")
ERRS=$(echo "$M" | grep -E '^\[' | grep -iE 'error|invalid|corrupt|header missing|overread|truncat|incomplete')
BENIGN='Ignoring maximum wav data size|Packet corrupt \(stream = [0-9]+, dts = NOPTS\)|corrupt input packet in stream [0-9]+'
BAD=$(echo "$ERRS" | grep -vE "$BENIGN" | head -2)
[ -z "$BAD" ] || die "the audio '$A' is damaged; ffmpeg reported while decoding it:
$BAD"
# seconds actually decoded (the last out_time from -progress) versus what the container claims; when the container duration is one ffmpeg "estimated from the bitrate" it's unreliable, so don't compare
DEC=$(echo "$M" | grep '^out_time=' | tail -1 | cut -d= -f2 | awk '{ if ($0 ~ /^-/ || $0 !~ /:/) print 0; else { split($0, p, ":"); print p[1] * 3600 + p[2] * 60 + p[3] } }')
CONT=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$A" 2>/dev/null | head -1)
if ! echo "$M" | grep -q 'Estimating duration from bitrate' && awk -v d="${DEC:-0}" -v c="${CONT:-0}" 'BEGIN { tol = c * 0.05 > 0.15 ? c * 0.05 : 0.15; exit !(c + 0 > 0 && c - d > tol) }'; then
  die "only ${DEC:-0} s of the ${CONT} s that '$A' claims could be decoded: the file is damaged or cut off"
fi
[ -z "$ERRS" ] || echo "mux.sh: note: ffmpeg complained about the header/ending of '$A' (typical of a WAV streamed with 'ffmpeg … -f wav -', whose length is a placeholder), but all ${DEC:-0} s decoded; continuing" >&2
J=$(echo "$M" | sed -n '/{/,/}/p')
g() { echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
NORM=1
for k in input_i input_tp input_lra input_thresh target_offset; do
  case "$(g $k)" in ''|*inf*|*nan*) NORM=0;; esac
done
if [ "$NORM" = 1 ]; then
  LN="loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true"
else
  LN="anull"
  echo "mux.sh: warning: the audio is silent or quieter than -70 LUFS, so loudness normalisation was skipped" >&2
fi

# pad with silence if the audio is shorter than the picture
dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1" 2>/dev/null | head -1; }
VD=$(dur "$V"); AD=$(dur "$A"); PAD=""
if awk -v a="$AD" -v v="$VD" 'BEGIN { exit !(a + 0 > 0 && v + 0 > 0 && a + 0 < v - 0.02) }'; then
  PAD=",apad=whole_dur=$VD"
  echo "mux.sh: note: the audio ($AD s) is shorter than the video ($VD s); padding it with silence" >&2
fi

if [ "$GR" = "0" ]; then VF="fps=$FPS"; else VF="fps=$FPS,noise=c0s=$GR:allf=t"; fi
if [ "${LEMO_COLOR:-}" = "bt709" ]; then
  VF="$VF,scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p,setparams=range=tv:colorspace=bt709:color_primaries=bt709:color_trc=bt709"
  CARGS="-color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709"
else
  VF="$VF,format=yuv420p"; CARGS=""
fi
# the temporary file keeps the output's extension, since ffmpeg picks the container from it
B=${O##*/}; case "$B" in *.*) EXT=${B##*.} ;; *) EXT=mp4 ;; esac
TMP="$O.$$.part.$EXT"
trap 'rm -f "$TMP"' EXIT
trap 'exit 130' INT; trap 'exit 143' TERM
# shellcheck disable=SC2086  (CARGS must split on spaces into several arguments; empty by default)
ffmpeg -y -loglevel error -i "$V" -i "$A" \
  -filter_complex "[0:v]$VF[v];[1:a]$LN,aresample=48000$PAD[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 19 -r "$FPS" $CARGS -c:a aac -b:a 256k -movflags +faststart -shortest "$TMP" \
  || die "ffmpeg failed while writing '$O' (its message is above)"
[ -s "$TMP" ] || die "no output was written to '$O'"
mv -f "$TMP" "$O" || die "could not move the finished film to '$O'"
echo "$O"
R=$(ffmpeg -hide_banner -nostats -i "$O" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | head -3)
echo "$R"
if [ "$NORM" = 1 ]; then
  OI=$(echo "$R" | awk '$1 == "I:" { print $2 }'); OP=$(echo "$R" | awk '$1 == "Peak:" { print $2 }')
  awk -v i="$OI" -v p="$OP" 'BEGIN { exit !(i + 0 < -15 || i + 0 > -13 || p + 0 > -1) }' \
    && echo "mux.sh: warning: the film missed the target (-14 LUFS, true peak <= -1.2 dB): measured $OI LUFS, peak $OP dB. The mix is probably clipping or has very hot peaks: lower it and tame the peaks, then mux again" >&2
fi
exit 0
