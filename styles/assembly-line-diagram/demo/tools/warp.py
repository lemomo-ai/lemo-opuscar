"""Film time ↔ story time. cues.json "stretch" slows the title hold down: story [at, at+story] plays over
film [at, at+story+add] with a smooth speed dip (speed 1 → about 0.02 → 1), so the title signs stay longer
without a cut; everything after it moves later by `add` seconds. "tail" holds the last frame a little longer.
cues.json, timeline.json and the code all speak story time; the page (film.js), the mix and the .srt map it.
Same formula as STORY() in film.js."""
import json, math, os
K = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'cues.json')))
A, l, D = K['stretch']['at'], K['stretch']['story'], K['stretch']['add']
L = l + D
STORY_END = K['storyDur']
FILM_DUR = STORY_END + D + K['tail']

def story(f):
    if f <= A: return f
    if f >= A + L: return f - D
    u = f - A
    return A + u - (D / L) * (u - L / (2 * math.pi) * math.sin(2 * math.pi * u / L))

def film(s):
    """story → film (inverse of story(), by bisection inside the stretch)"""
    if s <= A: return s
    if s >= A + l: return s + D
    lo, hi = A, A + L
    for _ in range(60):
        m = (lo + hi) / 2
        if story(m) < s: lo = m
        else: hi = m
    return (lo + hi) / 2
