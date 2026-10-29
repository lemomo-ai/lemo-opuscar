"""Get the song a music video is made for: python core/mv/get_song.py <url | audio or video file> <project>/song/ [--video]
Writes song/song.wav (44.1 kHz stereo, the master every later step reads) and song/source.json (where it came from: url, title,
uploader, duration, platform), plus the platform's cover image when there is one (cover.jpg, reference only).

A URL goes through yt-dlp (Bilibili, YouTube, NetEase and most video sites): the best audio-only stream is downloaded. The video
only with --video: song/video.mp4 (≤720p, no sound), for reading lyrics burned into it (lyrics.py ocr). Reference only, like the cover.
Bilibili's default CDN node often answers HTTP 567 or hangs for scripts, so a Bilibili file is tried on the other mirrors first
(ali, hw, bd…) with the page as referer, and on the node it was given last. A local file is converted with ffmpeg, so a video file works too.

The song stays the user's: it is not copied anywhere else and never goes into the library. Who may use it is the user's
responsibility (MV.md §1).
Exit codes: 0 done; 1 download or conversion failed; 2 usage.
"""
import sys, os, json, shutil, subprocess, urllib.request

MIRRORS = ['upos-sz-mirrorali.bilivideo.com', 'upos-sz-mirrorhw.bilivideo.com', 'upos-sz-mirrorbd.bilivideo.com',
           'upos-sz-mirror08c.bilivideo.com', 'upos-sz-mirrorcos.bilivideo.com']


def to_wav(src, dst):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '2', '-ar', '44100', '-c:a', 'pcm_s16le', dst])
    if r.returncode or not os.path.getsize(dst): sys.exit(f'✗ ffmpeg could not read {src}')


def fetch(url, headers, dst):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=20) as r, open(dst, 'wb') as f: shutil.copyfileobj(r, f)
    return os.path.getsize(dst)


def candidates(u):
    """The same file on other CDN nodes. Bilibili's upos nodes are interchangeable; the default one (cosov and the like) often
    answers 567 or not at all, so the mirrors go first and the original URL last"""
    host = u.split('/')[2]
    if 'bilivideo.com' in host or 'bilivideo.cn' in host:
        for m in MIRRORS:
            if m != host: yield u.replace(host, m, 1)
    yield u


def stream(url, fmt, dst_stem, what):
    """Fetch one stream by yt-dlp format, trying each mirror; returns the saved file and the info"""
    import yt_dlp
    with yt_dlp.YoutubeDL({'quiet': True, 'no_warnings': True, 'format': fmt}) as ydl:
        info = ydl.extract_info(url, download=False)
    if info.get('entries'): info = info['entries'][0]   # multi-part video or playlist: take the first
    fmts = [f for f in info.get('requested_formats') or [info] if f.get('url')]
    if not fmts: sys.exit(f'✗ no {what} stream found')
    f = fmts[0]; headers = {**(info.get('http_headers') or {}), **(f.get('http_headers') or {})}
    headers.setdefault('Referer', info.get('webpage_url', url))
    raw = f"{dst_stem}.{f.get('ext') or 'mp4'}"
    err = None
    for u in candidates(f['url']):
        try:
            if fetch(u, headers, raw) > 10000: return raw, info, headers
        except Exception as e: err = e; print(f'  {u.split("/")[2]}: {e}')
    sys.exit(f'✗ {what} download failed on every mirror ({err})')


def from_url(url, out, video=False):
    try: import yt_dlp  # noqa: F401
    except ImportError: sys.exit('✗ yt-dlp is missing: sh plugin/skills/lemo-opuscar/scripts/setup.sh deps mv')
    raw, info, headers = stream(url, 'bestaudio/best', os.path.join(out, 'download'), 'audio')
    to_wav(raw, os.path.join(out, 'song.wav')); os.remove(raw)
    if video:
        raw, _, _ = stream(url, 'bestvideo[height<=720]/best[height<=720]/best', os.path.join(out, 'video-download'), 'video')
        r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-an', '-c:v', 'copy', os.path.join(out, 'video.mp4')])
        if r.returncode:   # webm and the like do not fit in mp4: transcode
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-an', '-c:v', 'libx264', '-crf', '20', os.path.join(out, 'video.mp4')], check=True)
        os.remove(raw)
    thumb = info.get('thumbnail')
    if thumb:
        try: fetch(thumb, {'User-Agent': headers.get('User-Agent', 'Mozilla/5.0')}, os.path.join(out, 'cover.jpg'))
        except Exception: pass
    return {'url': info.get('webpage_url', url), 'title': info.get('title'), 'uploader': info.get('uploader'),
            'duration': info.get('duration'), 'platform': info.get('extractor_key'), 'description': info.get('description')}


def main():
    args = [a for a in sys.argv[1:] if a != '--video']; video = '--video' in sys.argv
    if len(args) < 2: print(__doc__.split('\n')[0], file=sys.stderr); sys.exit(2)
    src, out = args[0], args[1]
    os.makedirs(out, exist_ok=True)
    if os.path.exists(src):
        to_wav(src, os.path.join(out, 'song.wav')); meta = {'file': os.path.abspath(src)}
    elif src.startswith(('http://', 'https://')): meta = from_url(src, out, video)
    else: print(f'✗ not a file or URL: {src}', file=sys.stderr); sys.exit(2)
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
                                os.path.join(out, 'song.wav')], capture_output=True, text=True).stdout or 0)
    meta['wav_duration'] = round(dur, 3)
    json.dump(meta, open(os.path.join(out, 'source.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f"{os.path.join(out, 'song.wav')}  {dur:.2f} s  {meta.get('title') or ''}")


if __name__ == '__main__': main()
