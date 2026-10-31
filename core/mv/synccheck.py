"""Picture-to-song sync check: python core/mv/synccheck.py events.json song.json [--lyrics lyrics.json] [--fps 24] [--tol 1]
events.json comes from `node core/render/events.mjs <project>`. Every event with an `on` field is checked against the nearest
time of that kind in the song: "bar" (downbeats), "beat", "kick", "snare", "hat" (drum hits), "line" (a lyric line's start, needs
--lyrics), "char" (a sung character's start). Events without `on` are ignored.
Prints the worst offsets and a summary; an event further than --tol frames from its target fails.
Exit codes: 0 all within tolerance; 1 some are off; 2 usage.
"""
import sys, json, argparse, bisect


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('events'); ap.add_argument('song'); ap.add_argument('--lyrics')
    ap.add_argument('--fps', type=float, default=24); ap.add_argument('--tol', type=float, default=1, help='frames')
    a = ap.parse_args()
    ev = json.load(open(a.events))['ev']; s = json.load(open(a.song))
    targets = {'bar': s['downbeats'], 'beat': s['beats'], **{k: [t for t, _ in v] for k, v in s['hits'].items()}}
    if a.lyrics:
        L = json.load(open(a.lyrics, encoding='utf-8'))['lines']
        targets['line'] = [l['t0'] for l in L]; targets['char'] = sorted(c['t0'] for l in L for c in l['chars'])
    rows, bad, unknown = [], 0, set()
    for e in ev:
        on = e.get('on')
        if not on: continue
        ts = targets.get(on)
        if not ts: unknown.add(on); continue
        i = bisect.bisect_left(ts, e['t']); near = min((ts[j] for j in (i - 1, i) if 0 <= j < len(ts)), key=lambda x: abs(x - e['t']))
        d = (e['t'] - near) * a.fps; rows.append((abs(d), d, e, near)); bad += abs(d) > a.tol
    rows.sort(key=lambda r: -r[0])
    for ad, d, e, near in rows[:15]:
        print(f"{'✗' if ad > a.tol else ' '} {e['t']:8.3f}  {e.get('type', ''):12s} on {e['on']:6s} → {near:8.3f}  {d:+.2f} frames")
    if unknown: print(f"! unknown 'on' kinds: {', '.join(sorted(unknown))} (use bar, beat, kick, snare, hat, line, char)")
    print(f"{len(rows)} synced events, {bad} off by more than {a.tol:g} frame(s)" + (f", worst {rows[0][1]:+.2f}" if rows else ''))
    sys.exit(1 if bad or unknown else 0)


if __name__ == '__main__': main()
