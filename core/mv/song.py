"""Map a song for a music video: python core/mv/song.py song.wav --out song.json [--meter 4] [--sheet song.png] [--lyrics lyrics.json]
The song is the timeline: the picture locks to these numbers the way a film locks to its cue map (MV.md §3). Writes

  {dur, bpm, meter, beats: [t…], downbeats: [t…],
   bars: [{i, t, energy}],                         one per bar; energy 0–1 across the song
   sections: [{id, t0, t1, bars, label, energy}],  cut where the music changes, on a downbeat; label: A, B, C… the same
                                                   letter for sections that sound alike (a chorus comes back as the same letter)
   hits: {kick: [[t, s]…], snare: […], hat: […]},  drum onsets from the accompaniment, s = strength 0–1
   vocal: [[t0, t1]…],                             where the voice sings (needs stems/vocals.wav from lyrics.py next to it, else omitted)
   moments: [{t, jump, gap}],                      drum hits that land right after a gap or a dip: the loudness jumps
                                                   by `jump` (0–1); gap = how quiet the half second before was (0 = silence).
                                                   Candidates for the video's hardest hits (MV.md §5); your ear decides
   energy: {hz: 10, v: […]}}                       loudness envelope 0–1

Use the accompaniment stem (stems/no_vocals.wav from lyrics.py align) when it exists: drum hits are found there, so the voice
doesn't fake snares. Name the sections yourself (intro, verse, chorus…) from the letters, the energy and the lyrics; the tool
can't know a chorus from a hook. --sheet draws everything on one image (waveform, bars, sections, hits, lyric lines) to check by eye.
Beat tracking can lock onto half or double tempo: if the bpm feels wrong, pass --bpm with the tempo you hear.
Exit codes: 0 done; 1 failed; 2 usage or missing package.
"""
import sys, os, json, argparse
import numpy as np


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('song'); ap.add_argument('--out', required=True); ap.add_argument('--meter', type=int, default=4)
    ap.add_argument('--bpm', type=float, help='tempo hint when the tracker picks half or double time')
    ap.add_argument('--stems', help='folder with vocals.wav / no_vocals.wav (default: <song dir>/../lyrics/stems or <song dir>/stems)')
    ap.add_argument('--sheet'); ap.add_argument('--lyrics')
    a = ap.parse_args()
    try: import librosa
    except ImportError: print('✗ librosa is missing: sh plugin/skills/lemo-opuscar/scripts/setup.sh deps mv', file=sys.stderr); sys.exit(2)

    sr, hop = 22050, 512
    y, _ = librosa.load(a.song, sr=sr, mono=True); dur = len(y) / sr
    here = os.path.dirname(os.path.abspath(a.song))
    stems = a.stems or next((d for d in (os.path.join(here, '..', 'lyrics', 'stems'), os.path.join(here, 'stems'))
                             if os.path.exists(os.path.join(d, 'no_vocals.wav'))), None)
    acc = librosa.load(os.path.join(stems, 'no_vocals.wav'), sr=sr, mono=True)[0] if stems else y

    # -- beats: from the percussive part of the accompaniment --
    perc = librosa.effects.percussive(acc, margin=2.0)
    oenv = librosa.onset.onset_strength(y=perc, sr=sr, hop_length=hop)
    tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=hop, start_bpm=a.bpm or 120, tightness=400 if a.bpm else 100, units='time')
    tempo = float(np.atleast_1d(tempo)[0])
    if a.bpm and abs(tempo / a.bpm - 1) > .08:   # landed on double or half tempo: re-track at the hinted tempo
        tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=hop, bpm=a.bpm, tightness=800, units='time')
        tempo = float(np.atleast_1d(tempo)[0])
    beats = np.asarray(beats, float)

    # -- hits by band: kick < 150 Hz, snare a broadband hit at 150 Hz–2.5 kHz, hat > 6 kHz --
    S = np.abs(librosa.stft(perc, n_fft=2048, hop_length=hop)); f = librosa.fft_frequencies(sr=sr, n_fft=2048)
    def band(lo, hi):
        e = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S[(f >= lo) & (f < hi)]), sr=sr, hop_length=hop)
        pk = librosa.onset.onset_detect(onset_envelope=e, sr=sr, hop_length=hop, backtrack=False, delta=.25, wait=int(.09 * sr / hop))
        s = e[pk] / (e[pk].max() + 1e-9)
        return [[round(float(t), 3), round(float(v), 2)] for t, v in zip(librosa.frames_to_time(pk, sr=sr, hop_length=hop), s) if v > .15], e
    kick, ek = band(30, 150); snare, _ = band(150, 2500); hat, _ = band(6000, 11000)

    # -- bar lines: the phase with the heaviest kick is beat 1 --
    ekt = librosa.frames_to_time(np.arange(len(ek)), sr=sr, hop_length=hop)
    kb = np.interp(beats, ekt, ek)
    phase = int(np.argmax([kb[p::a.meter].mean() for p in range(a.meter)])) if len(beats) >= a.meter * 2 else 0
    downbeats = beats[phase::a.meter]   # beats before the first bar line are a pickup and belong to the first section

    # -- energy --
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]; rt = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
    db = 20 * np.log10(rms + 1e-6); lo_, hi_ = np.percentile(db, 5), np.percentile(db, 99)
    en = np.clip((db - lo_) / (hi_ - lo_ + 1e-9), 0, 1)
    grid = np.arange(0, dur, .1); env = np.interp(grid, rt, en)
    edges = list(downbeats) + [dur]
    bars = [{'i': i, 't': round(float(t), 3), 'energy': round(float(env[(grid >= t) & (grid < edges[i + 1])].mean() if ((grid >= t) & (grid < edges[i + 1])).any() else 0), 2)}
            for i, t in enumerate(downbeats)]

    # -- sections: bar-synchronous timbre + harmony features, checkerboard-kernel novelty on the self-similarity matrix, cut only on bar lines --
    sections = []
    if len(downbeats) >= 8:
        mf = librosa.feature.mfcc(y=y, sr=sr, hop_length=hop, n_mfcc=13); ch = librosa.feature.chroma_cqt(y=librosa.effects.harmonic(y), sr=sr, hop_length=hop)
        bf = librosa.time_to_frames(downbeats, sr=sr, hop_length=hop)
        F = np.vstack([librosa.util.normalize(librosa.util.sync(mf, bf, aggregate=np.mean), axis=0), librosa.util.sync(ch, bf, aggregate=np.median),
                       librosa.util.sync(en[None], bf, aggregate=np.mean) * 3])
        F = F[:, 1:len(downbeats) + 1]   # sync adds a column before the first bar line (the intro): drop it; one column = one bar
        X = (F - F.mean(1, keepdims=True)) / (F.std(1, keepdims=True) + 1e-9)
        R = np.corrcoef(X.T); n = len(R); k = 4
        ker = np.kron([[1, -1], [-1, 1]], np.ones((k, k))) * np.outer(np.hanning(2 * k + 2)[1:-1], np.hanning(2 * k + 2)[1:-1])
        Rp = np.pad(R, k, mode='edge'); nov = np.array([(Rp[i:i + 2 * k, i:i + 2 * k] * ker).sum() for i in range(n)])
        nov = np.maximum(nov, 0); thr = np.percentile(nov, 70)
        cut = [0]
        for i in range(2, n - 1):
            if nov[i] >= thr and nov[i] == nov[max(0, i - 3):i + 4].max() and i - cut[-1] >= 4: cut.append(i)
        cut.append(n)
        means = [X[:, s:e].mean(1) for s, e in zip(cut, cut[1:])]
        labels, protos = [], []
        for m in means:   # close enough to an earlier section: reuse its letter
            c = [float(np.corrcoef(m, p)[0, 1]) for p in protos]
            if c and max(c) > .6: labels.append(chr(65 + int(np.argmax(c))))
            else: labels.append(chr(65 + len(protos))); protos.append(m)
        for j, (s, e) in enumerate(zip(cut, cut[1:])):
            t0 = 0.0 if s == 0 else float(downbeats[s]); t1 = dur if e >= len(downbeats) else float(downbeats[e])
            sections.append({'id': f'S{j + 1:02d}', 't0': round(t0, 3), 't1': round(t1, 3), 'bars': e - s, 'label': labels[j],
                             'energy': round(float(env[(grid >= t0) & (grid < t1)].mean()), 2)})

    # -- drum entries: after a gap or a dip the drums slam in (quiet for 0.45 s before, loud for 0.9 s after) --
    seg = lambda a0, b0: en[(rt >= a0) & (rt < b0)]
    moments = []
    for t, s_, in sorted([tuple(h) for h in kick + snare]):
        if s_ < .3: continue
        pre, post = seg(t - .45, t - .04), seg(t + .03, t + .9)
        if len(pre) < 3 or len(post) < 3: continue
        jump = float(post.mean() - pre.mean())
        if jump > .3 and post.mean() > .5:
            m = {'t': round(t, 3), 'jump': round(jump, 2), 'gap': round(float(pre.min()), 2)}
            if moments and t - moments[-1]['t'] < 1.0:
                if jump > moments[-1]['jump']: moments[-1] = m
            else: moments.append(m)

    vocal = None
    if stems and os.path.exists(os.path.join(stems, 'vocals.wav')):
        v = librosa.load(os.path.join(stems, 'vocals.wav'), sr=sr, mono=True)[0]
        vr = librosa.feature.rms(y=v, hop_length=hop)[0]; vdb = 20 * np.log10(vr + 1e-6); on = vdb > max(-50, np.percentile(vdb, 95) - 28)
        vt = librosa.frames_to_time(np.arange(len(on)), sr=sr, hop_length=hop); vocal, s0 = [], None
        for t, o in zip(vt, on):
            if o and s0 is None: s0 = t
            if not o and s0 is not None:
                if vocal and s0 - vocal[-1][1] < .35: vocal[-1][1] = round(float(t), 3)
                else: vocal.append([round(float(s0), 3), round(float(t), 3)])
                s0 = None
        if s0 is not None: vocal.append([round(float(s0), 3), round(float(vt[-1]), 3)])   # sung up to the last frame
        vocal = [s for s in vocal if s[1] - s[0] > .2]

    res = {'song': os.path.abspath(a.song), 'dur': round(dur, 3), 'bpm': round(tempo, 2), 'meter': a.meter,
           'beats': [round(float(t), 3) for t in beats], 'downbeats': [round(float(t), 3) for t in downbeats], 'bars': bars,
           'sections': sections, 'hits': {'kick': kick, 'snare': snare, 'hat': hat}, 'moments': moments, 'energy': {'hz': 10, 'v': [round(float(x), 2) for x in env]}}
    if vocal is not None: res['vocal'] = vocal
    json.dump(res, open(a.out, 'w'), indent=None, separators=(',', ':'))
    print(f'{a.out}: {dur:.1f} s, {tempo:.1f} bpm, {len(beats)} beats, {len(downbeats)} bars, '
          f'{len(kick)} kick / {len(snare)} snare / {len(hat)} hat' + (f', {len(vocal)} vocal phrases' if vocal is not None else ''))
    for s in sections: print(f"  {s['id']} {s['label']}  {s['t0']:7.2f}–{s['t1']:7.2f}  {s['bars']:3d} bars  energy {s['energy']:.2f}")
    if moments: print('  moments (hits after a gap): ' + ', '.join(f"{m['t']:.2f}" for m in moments))
    if a.sheet: sheet(res, y, sr, a.sheet, a.lyrics)


def sheet(r, y, sr, path, lyrics=None):
    """One overview image: 30 s per row; waveform, bar lines, section colours, kick/snare, lyric lines"""
    from PIL import Image, ImageDraw, ImageFont
    W, row, per = 1800, 160, 30.0; rows = int(np.ceil(r['dur'] / per)); img = Image.new('RGB', (W + 60, rows * row + 20), (250, 249, 245))
    d = ImageDraw.Draw(img)
    font = ImageFont.load_default()
    for f in ('/System/Library/Fonts/Hiragino Sans GB.ttc', '/System/Library/Fonts/STHeiti Medium.ttc', '/Library/Fonts/Arial Unicode.ttf',
              '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', '/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc'):
        if os.path.exists(f): font = ImageFont.truetype(f, 13); break   # only to read the lyrics: any system font with CJK will do
    pal = [(255, 214, 165), (174, 214, 241), (200, 230, 180), (240, 190, 220), (220, 220, 160), (190, 200, 240)]
    X = lambda t: 50 + (t % per) / per * W; Y = lambda t: 10 + int(t // per) * row
    for s in r['sections']:
        t = s['t0']
        while t < s['t1']:
            e = min(s['t1'], (t // per + 1) * per); c = pal[(ord(s['label']) - 65) % len(pal)]
            d.rectangle([X(t), Y(t) + 4, X(e - 1e-6) if e % per else 50 + W, Y(t) + 22], fill=c); t = e
        d.text((X(s['t0']) + 3, Y(s['t0']) + 6), f"{s['id']} {s['label']}", fill=(60, 60, 60), font=font)
    hop = int(sr * .02); env = np.array([np.abs(y[i:i + hop]).max() for i in range(0, len(y), hop)]); env /= env.max() + 1e-9
    for i, v in enumerate(env):
        t = i * .02; x = X(t); yc = Y(t) + 70; d.line([x, yc - v * 38, x, yc + v * 38], fill=(150, 150, 150))
    for t in r['beats']: d.line([X(t), Y(t) + 30, X(t), Y(t) + 34], fill=(120, 120, 120))
    for b in r['bars']: d.line([X(b['t']), Y(b['t']) + 24, X(b['t']), Y(b['t']) + 112], fill=(90, 90, 200)); d.text((X(b['t']) + 2, Y(b['t']) + 24), str(b['i']), fill=(90, 90, 200), font=font)
    for t, s in r['hits']['kick']: d.ellipse([X(t) - 2, Y(t) + 108 - 5 * s, X(t) + 2, Y(t) + 112], fill=(200, 60, 40))
    for t, s in r['hits']['snare']: d.rectangle([X(t) - 1, Y(t) + 30, X(t) + 1, Y(t) + 30 + 8 * s], fill=(40, 140, 60))
    for m in r.get('moments', []): x, y0 = X(m['t']), Y(m['t']); d.polygon([(x - 7, y0 + 24), (x + 7, y0 + 24), (x, y0 + 38)], fill=(150, 40, 200))   # drum entry
    for v0, v1 in r.get('vocal', []): d.line([X(v0), Y(v0) + 116, X(min(v1, (v0 // per + 1) * per - 1e-3)), Y(v0) + 116], fill=(230, 120, 0), width=3)
    if lyrics and os.path.exists(lyrics):
        for k, L in enumerate(json.load(open(lyrics, encoding='utf-8'))['lines']):
            c = {'weak': (200, 120, 0), 'guess': (210, 30, 30)}.get(L.get('flag', ''), (30, 30, 30))   # pinned lines are drawn black like unflagged ones
            y0 = Y(L['t0']) + 118 + 14 * (k % 2)   # alternate rows up and down so neighbouring lines do not overlap
            d.line([X(L['t0']), y0, X(L['t0']), y0 + 4], fill=c); d.text((X(L['t0']) + 2, y0), L['text'][:12], fill=c, font=font)
    for k in range(rows): d.text((4, 10 + k * row + 60), f'{int(k * per)}s', fill=(80, 80, 80), font=font)
    img.save(path); print(path)


if __name__ == '__main__': main()
