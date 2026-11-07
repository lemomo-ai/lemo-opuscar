"""Rebuild the footage from a clean clone: download the files missing from raw/ per SOURCES.jsonl (whole files downloaded directly; excerpted segments re-cut using the start/end seconds in the record),
then download the two OFL fonts into fonts/. Existing files are skipped. Usage: python3 tools/fetch_sources.py"""
import json, os, re, subprocess, sys, time, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(os.path.join(HERE, '..'))
UA = 'LemoOpuscar/1.0 (https://github.com/lemomo-ai/lemo-opuscar)'
FONTS = {
    'fonts/Michroma-Regular.ttf': 'https://github.com/google/fonts/raw/main/ofl/michroma/Michroma-Regular.ttf',
    'fonts/OFL-Michroma.txt': 'https://github.com/google/fonts/raw/main/ofl/michroma/OFL.txt',
    'fonts/NotoSansSC-VF.ttf': 'https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf',
    'fonts/OFL-NotoSansSC.txt': 'https://github.com/google/fonts/raw/main/ofl/notosanssc/OFL.txt',
}


def get(url, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    for k in range(5):
        try:
            data = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=300).read()
            open(dest, 'wb').write(data); print('ok', dest, f'{len(data) / 1e6:.1f} MB'); return
        except Exception as e:
            print('retry', dest, e, file=sys.stderr); time.sleep(20 * (k + 1))
    sys.exit(f'download failed: {url}')


for dest, url in FONTS.items():
    if not os.path.exists(dest): get(url, dest)
for line in open('SOURCES.jsonl'):
    r = json.loads(line)
    if os.path.exists(r['file']): continue
    m = re.search(r'([\d.]+)–([\d.]+) s excerpt of the original|原片 ([\d.]+)–([\d.]+) s 截取', r.get('note', ''))
    if m:      # for large files cut only the needed segment (same parameters as seg.py)
        a, b = (float(x) for x in (m.groups()[:2] if m.group(1) else m.groups()[2:]))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-user_agent', UA, '-ss', str(a), '-i', r['url'], '-t', str(b - a),
                        '-vf', "scale='min(1920,iw)':-2:flags=lanczos", '-c:v', 'libx264', '-crf', '14', '-preset', 'fast',
                        '-pix_fmt', 'yuv420p', '-an', r['file']], check=True)
        print('ok', r['file'])
    else:
        get(r['url'], r['file'])
