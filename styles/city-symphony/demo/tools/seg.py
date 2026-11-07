"""For a large file download only the needed segment: cut by time from the Commons original-file URL, convert to H.264 at 1080p or below, and record the source in SOURCES.jsonl (same format as footage.py).
Usage: python3 seg.py "File:X.webm" name start_s duration_s "licence" "author" ["note"]"""
import sys, json, subprocess, hashlib, urllib.parse, time, os
from pathlib import Path
UA = "lemo-opuscar/1.0 (https://github.com/lemomo-ai/lemo-opuscar)"
t, name, ss, du, lic, credit = sys.argv[1:7]; note = sys.argv[7] if len(sys.argv) > 7 else ""
fn = t.removeprefix("File:").replace(" ", "_"); h = hashlib.md5(fn.encode()).hexdigest()
url = f"https://upload.wikimedia.org/wikipedia/commons/{h[0]}/{h[:2]}/{urllib.parse.quote(fn)}"
dest = Path("raw") / f"{name}.mp4"; dest.parent.mkdir(exist_ok=True)
if not dest.exists():
    for a in range(5):
        r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-user_agent", UA, "-ss", ss, "-i", url, "-t", du,
            "-vf", "scale='min(1920,iw)':-2:flags=lanczos", "-c:v", "libx264", "-crf", "14", "-preset", "fast", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", str(dest) + ".part.mp4"], capture_output=True, text=True)
        if r.returncode == 0: os.rename(str(dest) + ".part.mp4", dest); break
        print("retry", r.stderr[-300:], file=sys.stderr); time.sleep(30 * (a + 1))
    else: sys.exit("download failed")
pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration", "-of", "json", str(dest)], capture_output=True, text=True).stdout)
v = next(s for s in pr["streams"] if s["codec_type"] == "video")
rec = {"name": name, "file": str(dest), "url": url, "input": f"commons:{t}", "page": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(t.replace(" ", "_")),
       "title": t, "credit": credit, "license": lic, "w": v["width"], "h": v["height"], "fps": v["r_frame_rate"], "dur": float(pr["format"]["duration"]),
       "audio": any(s["codec_type"] == "audio" for s in pr["streams"]), "note": f"{ss}–{float(ss)+float(du):g} s excerpt of the original (transcoded to H.264)" + (f"; {note}" if note else ""),
       "used": [], "fetched": time.strftime("%Y-%m-%d %H:%M")}
log = Path("SOURCES.jsonl"); recs = [json.loads(l) for l in log.read_text().splitlines() if l.strip()] if log.exists() else []
recs = [r for r in recs if r["name"] != name] + [rec]; log.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in recs))
print(name, v["width"], v["height"], rec["dur"])
