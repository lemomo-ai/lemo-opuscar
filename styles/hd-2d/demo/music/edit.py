#!/usr/bin/env python3
"""
The Lampbearer 守灯人 — score edit (2.5D Pixel Art demo)

Source : "Precipice" by Scott Buckley (CC BY 4.0) — src/sb_precipice.mp3
Output : score.wav (48 kHz, stereo, 24-bit, 76.5 s, peak <= -1 dBFS), CUES.md

Re-run :  ../../../../.venv/bin/python edit.py
          (from this folder; any python with numpy/scipy/soundfile/librosa + ffmpeg on PATH)

Everything that decides timing lives in the CONFIG block below.
Film times are seconds on the finished film timeline; P-times are seconds in the
source recording (as decoded by ffmpeg at 48 kHz, i.e. same as any DAW import).

Edit map (film <- source):
  S1  0.30-11.60  <- P 4.70-16.00   quiet D pedal intro, first swell at the harbour reveal
      11.60-12.40  caesura: music breathes out (synthetic room tail), lamp dies
  S2 12.40-42.00  <- P 18.47-48.07  resumes on the G-chord bass entry; forest -> storm crescendo
      42.00        hard stop into room tail ("the wind takes the flame")
  S3 42.00-44.90  <- P 6.20-9.10    intro pad, very soft, as the only held tone
  S4 44.30-66.96  <- P 70.54-93.20  the composer's own build; P79.74 (Gb downbeat, bass entry) = film 53.50
  S5 66.96-76.50  <- P104.86-114.40 jump into the final Eb arrival; natural decay, faded by 76.5
"""
import json, os, subprocess, sys
import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve, resample_poly, lfilter

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
DUR = 76.5
# outputs (score.wav, measure.json, CUES.md) go here; set OUT_DIR=... to test without touching the shipped files
OUT = os.environ.get("OUT_DIR", HERE); os.makedirs(OUT, exist_ok=True)

# ----------------------------------------------------------------------------- CONFIG
SRC = os.path.join(HERE, "src", "sb_precipice.mp3")

# guesses for musical landmarks in the source (refined automatically to the real onset)
P_RESUME_GUESS = 18.47   # G-chord bass entry after the first phrase breath
P_HIT_GUESS    = 79.74   # D -> Gb arrival, low brass/bass enters: the climax downbeat
P_ARRIVE_GUESS = 104.86  # Bbm -> Eb final arrival (bass onset)
P_CUT_A        = 93.195  # leave the climax here (onset inside the Fm bar, pitch content ~ pre-arrival)

# film cue points
T_FADEIN   = 0.30
T_CAESURA  = (11.60, 12.40)   # lamp goes out
T_STORM    = 35.50
T_SILENCE  = (42.00, 44.30)   # flame nearly dies
T_HIT      = 53.50            # lighthouse ignites
T_END_FADE = (75.20, 76.50)

P_CAESURA_OUT = 16.00         # source point that falls on film 11.60
P_PAD         = 6.20          # soft intro pad reused under the 42.0-44.3 hush

NARRATION = [(6.8, 11.0), (12.6, 13.7), (17.8, 23.2), (27.0, 30.1),
             (36.3, 39.5), (44.3, 47.7), (59.5, 63.0), (69.3, 72.5)]

# static gain breakpoints (film time, dB) — linear interpolation in dB
GAIN_POINTS = [
    (0.0, 3.0), (5.3, 3.0), (5.8, 0.0),          # intro pad a touch up, harbour at 0
    (11.6, 0.0), (12.4, -3.0),                   # harbour/dock bed sits lower
    (25.0, -4.0), (31.0, -6.0), (35.2, -6.0),    # forest: keep the source's own swell in check
    (35.8, -3.0), (41.9, -1.0),                  # storm pushes
    (42.0, 0.0), (76.5, 0.0),
]
NARR_DIP_DB = {(6.8, 11.0): -3.5, (12.6, 13.7): -2.0, (17.8, 23.2): -3.5,
               (27.0, 30.1): -2.0, (59.5, 63.0): -1.5}
PAD_GAIN_DB = -4.0

# build (44.3 -> 53.5): level-following automation towards a rising target curve
BUILD_TARGET = (-42.0, -22.0)   # source-scale dB RMS (0.5 s, stereo power) at 44.3 and at 53.2
BUILD_CLAMP = (-18.0, 10.0)
# pre-hit inhale: short duck right before the downbeat so the hit reads as an entry
DUCK = dict(start=53.12, full=53.42, release=53.495, depth_db=-10.0)

PEAK_TARGET_DBFS = -1.1          # true-peak-ish (4x oversampled)
# ----------------------------------------------------------------------------- helpers


def decode(path):
    """decode with ffmpeg at the file's native rate, resample to 48 kHz with a
    polyphase filter (scipy) — no dependency on ffmpeg's optional soxr."""
    sr_in = int(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
                                "stream=sample_rate", "-of", "csv=p=0", path],
                               capture_output=True, text=True, check=True).stdout.strip())
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype="<f4").reshape(-1, 2).astype(np.float64)
    if sr_in != SR:
        from math import gcd
        g = gcd(SR, sr_in)
        x = resample_poly(x, SR // g, sr_in // g, axis=0)
    return x


def s(t):
    return int(round(t * SR))


def band_env(x, lo=None, hi=None, hop=120, win=1024):
    """energy envelope (dB) of a band, via STFT frames; returns (times, dB)"""
    m = x.mean(1) if x.ndim == 2 else x
    n = 1 + (len(m) - win) // hop
    idx = np.arange(win)[None, :] + hop * np.arange(n)[:, None]
    fr = m[idx] * np.hanning(win)[None, :]
    S = np.abs(np.fft.rfft(fr, axis=1)) ** 2
    f = np.fft.rfftfreq(win, 1 / SR)
    msk = np.ones_like(f, bool)
    if lo is not None:
        msk &= f >= lo
    if hi is not None:
        msk &= f < hi
    e = 10 * np.log10(S[:, msk].sum(1) + 1e-12)
    t = (np.arange(n) * hop + win / 2) / SR
    return t, e


def refine_onset(x, guess, win=0.10, hi=250.0):
    """perceptual attack time of the strongest low-band entry near `guess`.
    Envelope: 2048-pt frames (43 ms) every 2.5 ms, 20 ms moving average; the attack
    time is the centre of the steepest 40 ms rise. Returns (time_s, rise_dB)."""
    a = s(guess - win - 0.15)
    seg = x[a:s(guess + win + 0.15)]
    t, e = band_env(seg, hi=hi, hop=120, win=2048)
    t = t + a / SR
    e = np.convolve(e, np.ones(8) / 8, mode="same")
    k = 16  # 40 ms
    rise = np.full_like(e, -99.0)
    rise[k:] = e[k:] - e[:-k]
    tc = t - k * 120 / SR / 2          # centre of each rise window
    ok = (tc >= guess - win) & (tc <= guess + win)
    i = int(np.argmax(np.where(ok, rise, -99)))
    return float(tc[i]), float(rise[i])


def rms_db(y):
    return 20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-12)


def short_rms_db(y, win=0.4, hop=0.01):
    m2 = (y ** 2).mean(1) if y.ndim == 2 else y ** 2
    w, h = s(win), s(hop)
    c = np.concatenate([[0.0], np.cumsum(m2)])
    n = (len(m2) - w) // h + 1
    st = np.arange(n) * h
    val = (c[st + w] - c[st]) / w
    t = (st + w / 2) / SR
    return t, 10 * np.log10(val + 1e-12)


def room_ir(rt60=1.8, seconds=3.5, seed=7):
    """simple decorrelated stereo tail: exp-decaying noise, gently darkened."""
    rng = np.random.default_rng(seed)
    n = s(seconds)
    t = np.arange(n) / SR
    env = np.exp(-6.9078 * t / rt60)
    ir = rng.standard_normal((n, 2)) * env[:, None]
    # darken over time: one-pole LP, then a second pass for the far tail
    ir = lfilter([0.22], [1, -0.78], ir, axis=0)
    ir[: s(0.012)] = 0  # pre-delay
    ir /= np.sqrt((ir ** 2).sum(0, keepdims=True))
    return ir


def make_tail(pre, rt60, rel_db):
    """tail that continues `pre` (the last ~0.35 s before a cut). Returned array
    starts at the cut instant. Level: first 60 ms of tail ~= rel_db vs RMS of `pre`'s end."""
    ir = room_ir(rt60)
    w = np.linspace(0, 1, len(pre)) ** 2  # emphasise what was sounding at the cut
    wet = np.stack([fftconvolve(pre[:, c] * w, ir[:, c]) for c in range(2)], 1)
    tail = wet[len(pre):]
    ref = rms_db(pre[-s(0.1):])
    cur = rms_db(tail[: s(0.06)])
    tail *= 10 ** ((ref + rel_db - cur) / 20)
    return tail


def cosramp(n, up=True):
    r = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n))
    return r if up else r[::-1]


def eqp(n, up=True):
    r = np.sin(np.linspace(0, np.pi / 2, n))
    return r if up else r[::-1]


# ----------------------------------------------------------------------------- build
def main():
    x = decode(SRC)
    P_res, r1 = refine_onset(x, P_RESUME_GUESS, win=0.06)
    P_hit, r2 = refine_onset(x, P_HIT_GUESS, win=0.08)
    P_arr, r3 = refine_onset(x, P_ARRIVE_GUESS, win=0.06)
    P_A = P_CUT_A
    print(f"refined onsets: resume {P_res:.4f} (+{r1:.1f}dB)  hit {P_hit:.4f} (+{r2:.1f}dB)"
          f"  arrival {P_arr:.4f} (+{r3:.1f}dB)")

    N = s(DUR)
    out = np.zeros((N, 2))
    t_film = np.arange(N) / SR

    def place(p0, f0, f1, fin=0.0, fout=0.0, fin_shape="eqp", fout_shape="eqp", gain_db=0.0):
        """copy source [p0, p0+(f1-f0)) to film [f0, f1) with fades; returns the segment."""
        a, b = s(f0), s(f1)
        seg = x[s(p0): s(p0) + (b - a)].copy()
        if fin > 0:
            n = s(fin)
            seg[:n] *= (eqp(n) if fin_shape == "eqp" else cosramp(n))[:, None]
        if fout > 0:
            n = s(fout)
            seg[-n:] *= (eqp(n, False) if fout_shape == "eqp" else cosramp(n, False))[:, None]
        seg *= 10 ** (gain_db / 20)
        out[a:b] += seg
        return seg

    segs = []
    # S1 intro + harbour, ends into the caesura
    oA = P_CAESURA_OUT - T_CAESURA[0]
    place(T_FADEIN + oA, T_FADEIN, T_CAESURA[0], fout=0.12, fout_shape="cos")
    pre = x[s(P_CAESURA_OUT - 0.35): s(P_CAESURA_OUT)]
    tail1 = make_tail(pre, rt60=1.5, rel_db=-7.0)
    k = s(T_CAESURA[0] - 0.06)
    out[k:k + len(tail1)][: N - k] += tail1[: N - k]
    segs.append(("S1", T_FADEIN, T_CAESURA[0], T_FADEIN + oA, P_CAESURA_OUT))

    # S2 resume on the downbeat at 12.40 -> storm, hard stop at 42.0
    oB = P_res - T_CAESURA[1]
    pre_roll = 0.02
    P_stop = T_SILENCE[0] + oB
    place(T_CAESURA[1] - pre_roll + oB, T_CAESURA[1] - pre_roll, T_SILENCE[0],
          fin=pre_roll, fin_shape="cos", fout=0.05, fout_shape="cos")
    pre = x[s(P_stop - 0.35): s(P_stop)]
    tail2 = make_tail(pre, rt60=1.6, rel_db=-9.0)
    k = s(T_SILENCE[0] - 0.03)
    out[k:k + len(tail2)] += tail2[: N - k] if k + len(tail2) > N else tail2
    segs.append(("S2", T_CAESURA[1], T_SILENCE[0], P_res, P_stop))

    # S3 hush pad (kept separate so the build gain automation does not touch it)
    pad_f0, pad_f1 = T_SILENCE[0] + 0.05, T_SILENCE[1] + 0.6
    pad = np.zeros_like(out)
    a, b = s(pad_f0), s(pad_f1)
    ps = x[s(P_PAD): s(P_PAD) + (b - a)].copy()
    ps[: s(0.6)] *= cosramp(s(0.6))[:, None]
    ps[-s(0.6):] *= eqp(s(0.6), False)[:, None]
    pad[a:b] = ps * 10 ** (PAD_GAIN_DB / 20)
    segs.append(("S3", pad_f0, pad_f1, P_PAD, P_PAD + (pad_f1 - pad_f0)))

    # S4 build + climax, hit lands on T_HIT
    oC = P_hit - T_HIT
    F_A = T_HIT + (P_A - P_hit)          # film time of the jump
    XF = 0.06
    build = np.zeros_like(out)
    a, b = s(T_SILENCE[1]), s(F_A)
    sg = x[s(T_SILENCE[1] + oC): s(T_SILENCE[1] + oC) + (b - a)].copy()
    build_raw = np.zeros_like(out)
    build_raw[a:b] = sg           # unfaded copy, only used to measure level for the automation
    sg[: s(0.6)] *= eqp(s(0.6))[:, None]
    sg[-s(XF):] *= eqp(s(XF), False)[:, None]
    build[a:b] = sg
    segs.append(("S4", T_SILENCE[1], F_A, T_SILENCE[1] + oC, P_A))

    # S5 final arrival: B-side onset lands exactly at F_A (crossfade ends on it)
    oD = P_arr - F_A
    a, b = s(F_A - XF), N
    sg = x[s(F_A - XF + oD): s(F_A - XF + oD) + (b - a)].copy()
    sg[: s(XF)] *= eqp(s(XF))[:, None]
    build[a:b] += sg
    segs.append(("S5", F_A, DUR, P_arr, DUR + oD))

    # ------------------------------------------------------------------ gain automation
    gp = np.array(GAIN_POINTS)
    g_db = np.interp(t_film, gp[:, 0], gp[:, 1])
    for (n0, n1), d in NARR_DIP_DB.items():
        r = 0.35
        w = np.clip(np.minimum((t_film - (n0 - r)) / r, ((n1 + r) - t_film) / r), 0, 1)
        g_db += d * (0.5 - 0.5 * np.cos(np.pi * w))
    # fade-in at the very start
    fi = np.clip((t_film - T_FADEIN) / 2.0, 0, 1)
    fade = 0.5 - 0.5 * np.cos(np.pi * fi)

    # build: level-following automation towards a rising target
    tt, lv = short_rms_db(build_raw, win=0.5, hop=0.01)
    lv_f = np.interp(t_film, tt, lv)
    bs, be = T_SILENCE[1], T_HIT
    u = np.clip((t_film - bs) / (53.2 - bs), 0, 1)
    target = BUILD_TARGET[0] + (BUILD_TARGET[1] - BUILD_TARGET[0]) * u ** 1.3
    ag = np.clip(target - lv_f, *BUILD_CLAMP)
    ag[t_film < bs] = ag[np.searchsorted(t_film, bs)]
    # smooth 300 ms
    k = s(0.3)
    ag = np.convolve(np.pad(ag, (k, k), mode="edge"), np.ones(k) / k, mode="same")[k:-k]
    # automation is active from the start of the build until the downbeat, then snaps
    # to 0 dB together with the duck release (the attack masks the step)
    wb = ((t_film >= bs - 0.5) & (t_film < T_HIT)).astype(float)
    rel = (t_film >= DUCK["release"]) & (t_film < T_HIT)
    wb[rel] = 1 - (t_film[rel] - DUCK["release"]) / (T_HIT - DUCK["release"])
    build_db = ag * wb
    # pre-hit inhale
    d = DUCK
    duck = np.zeros(N)
    m1 = (t_film >= d["start"]) & (t_film < d["full"])
    duck[m1] = d["depth_db"] * (0.5 - 0.5 * np.cos(np.pi * (t_film[m1] - d["start"]) / (d["full"] - d["start"])))
    m2 = (t_film >= d["full"]) & (t_film < d["release"])
    duck[m2] = d["depth_db"]
    m3 = (t_film >= d["release"]) & (t_film < T_HIT)
    duck[m3] = d["depth_db"] * (1 - (t_film[m3] - d["release"]) / (T_HIT - d["release"]))
    build_db += duck

    # end fade
    ef = np.clip((t_film - T_END_FADE[0]) / (T_END_FADE[1] - T_END_FADE[0]), 0, 1)
    endfade = 0.5 + 0.5 * np.cos(np.pi * ef)

    main_mix = out * (10 ** (g_db / 20) * fade)[:, None]
    build_mix = build * (10 ** ((g_db + build_db) / 20) * endfade)[:, None]
    mix = main_mix + pad + build_mix
    mix[: s(T_FADEIN)] = 0.0
    mix[-1] = 0.0

    # ------------------------------------------------------------------ normalise
    tp = np.abs(resample_poly(mix, 4, 1, axis=0)).max()
    norm = 10 ** (PEAK_TARGET_DBFS / 20) / tp
    mix *= norm
    sf.write(os.path.join(OUT, "score.wav"), mix.astype(np.float32), SR, subtype="PCM_24")
    print(f"wrote score.wav  {len(mix)/SR:.3f}s  norm {20*np.log10(norm):+.2f} dB  "
          f"true-peak {20*np.log10(np.abs(resample_poly(mix,4,1,axis=0)).max()):.2f} dBFS")

    # ------------------------------------------------------------------ measure
    y, _ = sf.read(os.path.join(OUT, "score.wav"))
    hit_meas, hit_rise = refine_onset(y, T_HIT, win=0.15)
    arr_meas, _ = refine_onset(y, F_A, win=0.08)
    res_meas, _ = refine_onset(y, T_CAESURA[1], win=0.08)
    sections = [
        ("Chapter card", 0.0, 5.5), ("Harbour town at night (narration N1)", 5.5, 11.6), ("Lamp-out pause", 11.6, 12.4),
        ("Harbour town / pier", 12.4, 25.5), ("Night forest", 25.5, 35.5), ("Storm, stone steps", 35.5, 42.0),
        ("Flame almost out (drop-out)", 42.0, 44.3), ("Relit → climbing the tower", 44.3, 53.5), ("Climax: beam sweeps the sea", 53.5, 67.0),
        ("Title wrap-up", 67.0, 74.5), ("Reverb tail", 74.5, 76.5),
    ]
    sec_rows = []
    for name, a, b in sections:
        seg = y[s(a):s(b)]
        tt, lv = short_rms_db(seg, win=0.4, hop=0.05)
        sec_rows.append(dict(name=name, a=a, b=b, rms=round(rms_db(seg), 1),
                             peak_st=round(float(lv.max()), 1) if len(lv) else None,
                             min_st=round(float(lv.min()), 1) if len(lv) else None))
    tt, lv = short_rms_db(y, win=1.0, hop=1.0)
    curve = [(round(float(a), 1), round(float(b), 1)) for a, b in zip(tt, lv)]
    # hit contrast: 300 ms before vs 300 ms after
    pre_hit = rms_db(y[s(T_HIT - 0.3):s(T_HIT)])
    post_hit = rms_db(y[s(T_HIT):s(T_HIT + 0.3)])
    # discontinuity check at edit points
    def click(tc):
        seg = y[s(tc - 0.01):s(tc + 0.01)].mean(1)
        return float(np.abs(np.diff(seg)).max())
    meas = dict(
        P_resume=P_res, P_hit=P_hit, P_hit_rise=r2, P_arrival=P_arr, P_cutA=P_A, F_cutA=F_A,
        offsets=dict(S1=oA, S2=oB, S4=oC, S5=oD),
        hit_measured=hit_meas, hit_error_ms=(hit_meas - T_HIT) * 1000, hit_rise_db=hit_rise,
        hit_pre_rms=pre_hit, hit_post_rms=post_hit,
        arrival_measured=arr_meas, resume_measured=res_meas,
        sections=sec_rows, curve_1s=curve, segs=segs, norm_db=20 * np.log10(norm),
        clicks={str(tc): click(tc) for tc in [T_CAESURA[1], T_SILENCE[0], T_SILENCE[1], T_HIT, F_A]},
        overall_rms=rms_db(y), sample_peak=20 * np.log10(np.abs(y).max()),
    )
    with open(os.path.join(OUT, "measure.json"), "w") as f:
        json.dump(meas, f, indent=1, ensure_ascii=False, default=float)
    print(f"hit: measured {hit_meas:.4f}s  error {meas['hit_error_ms']:+.1f} ms  "
          f"pre {pre_hit:.1f} dB -> post {post_hit:.1f} dB")
    print(f"final Eb arrival at film {arr_meas:.3f}s; resume after caesura at {res_meas:.3f}s")
    for r in sec_rows:
        print(f"  {r['a']:5.1f}-{r['b']:5.1f}  {r['rms']:6.1f} dBFS  (0.4s max {r['peak_st']}, min {r['min_st']})  {r['name']}")
    write_cues(meas)


def write_cues(m):
    o = m["offsets"]
    S = {k: v for k, v, *_ in [(x[0], x) for x in m["segs"]]}
    rows = "\n".join(
        f"| {r['a']:.1f}–{r['b']:.1f} | {r['name']} | {r['rms']:.1f} | {r['peak_st']:.1f} | {r['min_st']:.1f} |"
        for r in m["sections"])
    curve = " ".join(f"{t - 0.5:.0f}s:{v:.0f}" for t, v in m["curve_1s"])
    txt = f"""# Score edit sheet · The Lampbearer 守灯人

> Generated automatically by `edit.py` (re-running overwrites it). Times in seconds. "Film" = the 74.5 s film timeline; "P" = time in the source track (decoded by ffmpeg at 48 kHz, same as a DAW import).

## Source

| Title | Composer | Page / direct link | Licence |
|---|---|---|---|
| Precipice | Scott Buckley | https://www.scottbuckley.com.au/library/precipice/ · https://www.scottbuckley.com.au/library/wp-content/uploads/2021/01/sb_precipice.mp3 | CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/) |

Composer's description: "A short, sweeping fantasy orchestral track evoking the anticipation of approaching the unknown, the confusion and terror as you cross the threshold, and the pride and relief as you learn and grow from your discoveries." (third place in the Orchestral Tools "Discovery" competition).
Only this one track is used: the source itself runs "anticipation → terror at crossing the threshold → pride and relief", the same arc as the film's "setting out with the lamp → storm → the lighthouse lit", so key, orchestration and mix space are naturally consistent, and every edit point is inside the same piece. The original mp3 is in `src/`.

Structure of the source (librosa analysis): P0–12 D pedal pad (about -43 dB) → P12–36 first section in D/G/B♭ major, flowing and gradually opening out → P36–49 crescendo to the first high point (G) → P50–76 turns to D minor / A dominant pedal, the tense section → **P79.7 sudden shift from D to G♭, low brass / bass voices enter, the climax of the piece begins** → G♭–B♭m–E♭–Fm–D♭–B♭m → **P104.9 lands on the final E♭ chord**, P105–117 natural decay.

## Edit table (film ← source)

| Segment | Film | Source P | Notes |
|---|---|---|---|
| S1 | 0.30–11.60 | {0.30+o['S1']:.2f}–{S['S1'][4]:.2f} | 2 s cosine fade-in from 0.3 s; the D pedal pad plays under the chapter card; at film ≈7.6 s the source swells for the first time, landing on the harbour-town wide shot |
| Pause | 11.60–12.40 | — | **The lamp goes out, a "drop into nothing"**: cosine fade-out over 11.48–11.60, then a synthetic room reverb tail (RT60 1.5 s, -7 dB) lets the music "breathe out"; 0.8 s with essentially no music |
| S2 | 12.40–42.00 | {S['S2'][3]:.3f}–{S['S2'][4]:.3f} | Resumes on the bass entry of the G chord (automatically aligned to the onset, measured in the film at {m['resume_measured']:.3f}); continuous all the way: pier → night forest → the source's own crescendo at film 34–35.5 → storm |
| Drop-out | 42.00 | hard cut at P{S['S2'][4]:.2f} | 50 ms cosine cut + synthetic reverb tail (RT60 1.6 s, -9 dB), "the wind blows the flame out"; after 0.5 s only a held tone at about -44 dBFS remains |
| S3 | {S['S3'][1]:.2f}–{S['S3'][2]:.2f} | {S['S3'][3]:.2f}–{S['S3'][4]:.2f} | The opening D pedal pad returns at {PAD_GAIN_DB:+.0f} dB as the only, very soft held tone; equal-power crossfade with S4 over 44.3–44.9 |
| S4 | 44.30–{m['F_cutA']:.2f} | {S['S4'][3]:.3f}–{S['S4'][4]:.3f} | The source's own build before the climax (A dominant pedal → D); **the G♭ downbeat at P{m['P_hit']:.3f} = film 53.500** |
| S5 | {m['F_cutA']:.2f}–76.50 | {m['P_arrival']:.3f}–{S['S5'][4]:.2f} | Jumps to the arrival of the final E♭ chord (bass onset), natural decay; cosine fade to 0 over 75.2–76.5 |

### Jump points

| Film position | From P | To P | Crossfade | Alignment |
|---|---|---|---|---|
| 11.60 → 12.40 | {S['S1'][4]:.2f} (B♭ chord decaying) | {m['P_resume']:.3f} (G-chord bass onset) | None (0.8 s pause + reverb tail in between) | The source itself has a phrase breath at P17.3; here it is stretched into a pause |
| 42.00 | {S['S2'][4]:.3f} | — | 50 ms fade-out + reverb tail | Cut just before the bass accent at P48.2, so that it is "swallowed" |
| 44.30 | opening pad P{S['S3'][3]:.2f} | {S['S4'][3]:.3f} | 0.6 s equal power | D pad → A/D dominant pedal, the same harmony |
| {m['F_cutA']:.3f} | {m['P_cutA']:.3f} (onset inside the Fm bar) | {m['P_arrival']:.3f} (bass onset of the E♭ arrival) | 60 ms equal power, crossfade ends at the onset | Pitch content in the 0.5 s before each side is C / F / D♭ on both; the E♭ onset is kept whole |

## The 53.5 hit point

- The climax is not made by an edit: it is the source's own D → G♭ modulation downbeat (bass voices enter, source energy below 250 Hz rises +{m['P_hit_rise']:.1f} dB within 40 ms). The whole of S4 is placed at the fixed offset `P_hit − 53.5`, so the accuracy of the hit depends only on locating the onset.
- `edit.py` searches the <250 Hz energy envelope of the source over P{P_HIT_GUESS-0.08:.2f}–{P_HIT_GUESS+0.08:.2f} (43 ms frames, 2.5 ms hop, 20 ms smoothing) for the steepest 40 ms rise and takes its midpoint as the onset, giving P_hit = {m['P_hit']:.4f}; S4 placement offset = P_hit − 53.5 = {o['S4']:.4f}; after rounding to 48 kHz samples the theoretical error is < 0.02 ms.
- Measured in the finished score.wav with the same detector (±150 ms search): onset at **{m['hit_measured']:.4f} s, error {m['hit_error_ms']:+.1f} ms** (requirement < 60 ms).
- So that it reads as "the full orchestra coming in" rather than just the top of a crescendo: a {-DUCK['depth_db']:.0f} dB "intake of breath" dip over {DUCK['start']:.2f}–{DUCK['full']:.2f}, recovering to 0 dB within 5 ms over {DUCK['release']:.3f}–{T_HIT:.3f}, and the downbeat comes in untouched. RMS of the 300 ms before {m['hit_pre_rms']:.1f} dB → 300 ms after {m['hit_post_rms']:.1f} dB (+{m['hit_post_rms']-m['hit_pre_rms']:.1f} dB).
- The build over 44.3–53.2 uses "level-following" automation: the source's 0.5 s short-term RMS is pulled towards a rising target line from {BUILD_TARGET[0]:.0f} dB to {BUILD_TARGET[1]:.0f} dB ({BUILD_CLAMP[0]:.0f}/+{BUILD_CLAMP[1]:.0f} dB clamp, 300 ms smoothing); the small peak at P71–72 is held down and the dip at P73–76 is lifted level, so in the film 44.5→52.75 is a steady crescendo (about -43 → -22 dBFS).

## Measured RMS (score.wav, dBFS)

| Film | Section | Section RMS | 0.4 s window max | 0.4 s window min |
|---|---|---|---|---|
{rows}

Overall RMS {m['overall_rms']:.1f} dBFS, sample peak {m['sample_peak']:.2f} dBFS (4× oversampled true peak ≤ -1.1 dBFS). No loudness normalisation.

Loudness curve, 1 s windows (dBFS, labelled by window start):
`{curve}`

## Gain automation (CONFIG in edit.py)

- Static gain points `GAIN_POINTS`: {', '.join(f'{a:g}s {b:+g}dB' for a, b in GAIN_POINTS)} (linear interpolation in dB)
- Ducking under the narration `NARR_DIP_DB`: {', '.join(f'{a:g}–{b:g} {d:+g}dB' for (a, b), d in NARR_DIP_DB.items())} (350 ms cosine transitions)
- 42.0–44.9 pedal pad {PAD_GAIN_DB:+g} dB
- 44.3–53.5: level-following crescendo; {DUCK['start']:.2f}–{T_HIT:.2f} intake of breath; 0 dB after 53.5
- 75.2–76.5: cosine fade-out to 0

## How to change it

Edit CONFIG at the top of `edit.py`: `T_HIT` moves the climax time (S4 shifts as a whole; the length of the build follows `T_SILENCE[1]`); `T_CAESURA` changes the lamp-out pause; `GAIN_POINTS` / `NARR_DIP_DB` change the loudness curve. Then run `../../../../.venv/bin/python edit.py` in this folder; score.wav, measure.json and CUES.md are updated together.
"""
    with open(os.path.join(OUT, "CUES.md"), "w") as f:
        f.write(txt)


if __name__ == "__main__":
    main()
