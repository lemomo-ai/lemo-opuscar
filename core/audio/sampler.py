"""Sampled instruments (offline, numpy/soxr): load CC0/CC-BY real-instrument samples by name, with automatic transposition / velocity layers / round-robin / sustain looping.
Every note/hit returns mono float32 @ SR; render returns stereo (N,2). Usage: see INSTRUMENTS.md.

    from core.audio import sampler as S
    x = S.note('cellos', 'D3', 2.0, vel=.7)            # cello section, 2 s long note (crossfade-extended automatically if the sample is too short)
    y = S.hit('snare', 'roll', .6)                       # unpitched percussion
    mix = S.render([(0, 'piano', 'C4', 1, .7, -.2), (0, 'violins', 'E5', 4, .6, .3)], 6)
"""
import os, re, json, math, glob, threading
from collections import OrderedDict
import numpy as np
import soundfile as sf
import soxr
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.ndimage import uniform_filter1d

try:
    from .sfx import SR, add, limit
except ImportError:  # when sampler is imported directly
    from sfx import SR, add, limit

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instruments')
INDEX = os.path.join(ROOT, 'index.json')
_rng = np.random.default_rng(20260925)
_lock = threading.RLock()


def seed(n):
    """Reset the round-robin/random seed (same call order → same result)"""
    global _rng; _rng = np.random.default_rng(n)


# —— Pitch ——
_PC = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def midi(p):
    """'C#4' / 'Db3' / 'Bb-1' / 61 / 61.5 → midi (C4=60; fractions allowed = microtones)"""
    if isinstance(p, (int, float, np.integer, np.floating)): return float(p)
    m = re.fullmatch(r'\s*([A-Ga-g])([#sb♯♭]*)(-?\d+)\s*', str(p))
    if not m: raise ValueError(f'cannot parse pitch {p!r}')
    acc = m.group(2).count('#') + m.group(2).count('s') + m.group(2).count('♯') - m.group(2).count('b') - m.group(2).count('♭')
    return float(12 * (int(m.group(3)) + 1) + _PC[m.group(1).upper()] + acc)


def hz(p): return 440.0 * 2 ** ((midi(p) - 69) / 12)


def name(m):
    m = int(round(m)); return ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][m % 12] + str(m // 12 - 1)


# —— Instrument registry ——
# src: directory relative to instruments/ (or (directory, filename regex)); kind: sus = extendable long note / dec = natural decay (when dur is reached, stops with rel) / hit = unpitched
# pp: pitch parsing upper (filename C#4) | lower (karoryfer lowercase ab2) | sal | organ | detect (no name, measured with yin) | sfz
# rel: default release time (s); var: variants of unpitched / multi-drum instruments {name: filename regex}; lic: licence key (see LIC)
V, C, F, K, SAL = 'vsco2ce/', 'vcsl/', 'freepats/', 'karoryfer/', 'salamander/'
VI, VM = C + 'Idiophones/Struck Idiophones/', C + 'Membranophones/Struck Membranophones/'
REG = {
    # Strings (弦乐)
    'violins':        dict(src=V + 'Strings/Violin Section/susVib', kind='sus', rel=.35, fam='strings', desc='violin section, sustained (vibrato)'),
    'violins_trem':   dict(src=V + 'Strings/Violin Section/Trem', kind='sus', rel=.3, fam='strings', desc='violin section, tremolo'),
    'violins_pizz':   dict(src=V + 'Strings/Violin Section/Pizz', kind='dec', rel=.15, fam='strings', desc='violin section, pizzicato'),
    'violins_spic':   dict(src=V + 'Strings/Violin Section/Spic', kind='dec', rel=.1, fam='strings', desc='violin section, spiccato (short)'),
    'violin':         dict(src=V + 'Strings/Solo Violin/Arco Vib', kind='sus', rel=.3, fam='strings', desc='solo violin, sustained'),
    'violin_pizz':    dict(src=V + 'Strings/Solo Violin/Pizz', kind='dec', rel=.15, fam='strings', desc='solo violin, pizzicato'),
    'violas':         dict(src=V + 'Strings/Viola Section/susvib', kind='sus', rel=.35, fam='strings', desc='viola section, sustained'),
    'violas_pizz':    dict(src=V + 'Strings/Viola Section/pizz', kind='dec', rel=.15, fam='strings', desc='viola section, pizzicato'),
    'cellos':         dict(src=V + 'Strings/Cello Section/susvib', kind='sus', rel=.4, fam='strings', desc='cello section, sustained'),
    'cellos_pizz':    dict(src=V + 'Strings/Cello Section/pizzT', kind='dec', rel=.2, fam='strings', desc='cello section, pizzicato'),
    'cellos_spic':    dict(src=V + 'Strings/Cello Section/spic', kind='dec', rel=.12, fam='strings', desc='cello section, spiccato'),
    'contrabass':     dict(src=V + 'Strings/Solo Contrabass/SusVib', kind='sus', rel=.4, fam='strings', desc='contrabass, sustained'),
    'contrabass_pizz': dict(src=V + 'Strings/Solo Contrabass/Pizz', kind='dec', rel=.2, fam='strings', desc='contrabass, classical pizzicato'),
    'harp':           dict(src=C + 'Chordophones/Composite Chordophones/Concert Harp', kind='dec', rel=1.2, fam='strings', desc='harp'),
    # Woodwinds (木管)
    'flute':          dict(src=V + 'Woodwinds/Flute/susvib', kind='sus', rel=.25, fam='woodwinds', desc='flute, sustained'),
    'flute_stac':     dict(src=V + 'Woodwinds/Flute/stac', kind='dec', rel=.1, fam='woodwinds', desc='flute, staccato'),
    'piccolo':        dict(src=V + 'Woodwinds/Piccolo/Sus', kind='sus', rel=.2, fam='woodwinds', desc='piccolo'),
    'clarinet':       dict(src=V + 'Woodwinds/Clarinet/susLong', kind='sus', rel=.25, fam='woodwinds', desc='clarinet, sustained'),
    'clarinet_stac':  dict(src=V + 'Woodwinds/Clarinet/stac', kind='dec', rel=.1, fam='woodwinds', desc='clarinet, staccato'),
    'oboe':           dict(src=V + 'Woodwinds/Oboe/Vib', kind='sus', rel=.25, fam='woodwinds', desc='oboe, sustained'),
    'oboe_stac':      dict(src=V + 'Woodwinds/Oboe/Stacc', kind='dec', rel=.1, fam='woodwinds', desc='oboe, staccato'),
    'bassoon':        dict(src=V + 'Woodwinds/Bassoon/sus', kind='sus', rel=.25, fam='woodwinds', desc='bassoon, sustained'),
    'bassoon_stac':   dict(src=V + 'Woodwinds/Bassoon/stac', kind='dec', rel=.1, fam='woodwinds', desc='bassoon, staccato'),
    'recorder':       dict(src=C + 'Aerophones/Edge-blown Aerophones/Baroque Alto Recorder/Sustain', kind='sus', rel=.15, fam='woodwinds', desc='alto recorder (baroque)'),
    'ocarina':        dict(src=(C + 'Aerophones/Edge-blown Aerophones/Ocarina, Typical/Sustains', r'_Sus_'), kind='sus', rel=.15, fam='woodwinds', desc='ocarina'),
    'tenor_sax':      dict(src=C + 'Aerophones/Reed Aerophones/Tenor Saxophone/Vibrato', kind='sus', rel=.2, fam='woodwinds', desc='tenor sax, vibrato'),
    'tenor_sax_nv':   dict(src=C + 'Aerophones/Reed Aerophones/Tenor Saxophone/Non-Vibrato', kind='sus', rel=.2, fam='woodwinds', desc='tenor sax, straight tone'),
    'tenor_sax_stac': dict(src=C + 'Aerophones/Reed Aerophones/Tenor Saxophone/Staccato', kind='dec', rel=.08, fam='woodwinds', desc='tenor sax, staccato'),
    'alto_sax':       dict(src=K + 'weresax/Samples/alto', kind='sus', rel=.2, pp='lower', fam='woodwinds', desc='alto sax (Weresax)'),
    'harmonica':      dict(src=(C + 'Aerophones/Free Aerophones/Harmonica-Hohner-Super64/Sustains', r'_Normal'), kind='sus', rel=.15, fam='woodwinds', desc='chromatic harmonica'),
    # Brass (铜管)
    'trumpet':        dict(src=V + 'Brass/Trumpet/sus', kind='sus', rel=.25, fam='brass', desc='trumpet, sustained'),
    'trumpet_stac':   dict(src=V + 'Brass/Trumpet/stac', kind='dec', rel=.1, fam='brass', desc='trumpet, staccato'),
    'trumpet_mute':   dict(src=V + 'Brass/Trumpet/straightM-sus', kind='sus', rel=.2, fam='brass', desc='trumpet, straight mute'),
    'horn':           dict(src=V + 'Brass/F Horn/sus', kind='sus', rel=.35, fam='brass', desc='French horn, sustained'),
    'horn_stac':      dict(src=V + 'Brass/F Horn/stac', kind='dec', rel=.12, fam='brass', desc='French horn, staccato'),
    'trombone':       dict(src=V + 'Brass/Tenor Trombone/sus', kind='sus', rel=.3, fam='brass', desc='trombone, sustained'),
    'trombone_stac':  dict(src=V + 'Brass/Tenor Trombone/stac', kind='dec', rel=.12, fam='brass', desc='trombone, staccato'),
    'tuba':           dict(src=V + 'Brass/Tuba/sus', kind='sus', rel=.3, fam='brass', desc='tuba, sustained'),
    'tuba_stac':      dict(src=V + 'Brass/Tuba/stac', kind='dec', rel=.12, fam='brass', desc='tuba, staccato'),
    # Pitched percussion (打击)
    'timpani':        dict(src=V + 'Percussion/Timpani', kind='dec', rel=1.5, pp='detect', fam='percussion', desc='timpani (5 drums; pitch = measured (1,1) main mode)',
                           roots={'drum1': 41.47, 'drum2': 46.81, 'drum3': 49.57, 'drum4': 52.5, 'drum5': 54.63},
                           var={f'drum{i}': f'Timpani{i}_' for i in range(1, 6)}),
    'glockenspiel':   dict(src=VI + 'Glockenspiel', kind='dec', rel=1.5, fam='percussion', desc='glockenspiel'),
    'xylophone':      dict(src=VI + 'Xylophone/Medium Mallets', kind='dec', rel=.5, fam='percussion', desc='xylophone'),
    'marimba':        dict(src=VI + 'Marimba', kind='dec', rel=.8, fam='percussion', desc='marimba'),
    'vibraphone':     dict(src=VI + 'Vibraphone/Soft Mallets', kind='dec', rel=1.5, fam='percussion', desc='vibraphone, soft mallets'),
    'vibraphone_hard': dict(src=VI + 'Vibraphone/Hard Mallets', kind='dec', rel=1.5, fam='percussion', desc='vibraphone, hard mallets'),
    'vibraphone_bowed': dict(src=VI + 'Vibraphone/Bowed', kind='sus', rel=1.0, fam='percussion', desc='vibraphone, bowed (airy sustain)'),
    'tubular_bells':  dict(src=VI + 'Tubular Bells 1', kind='dec', rel=3.0, retune=False, fam='percussion', desc='tubular bells'),
    'hand_chimes':    dict(src=VI + 'Hand Chimes', kind='dec', rel=2.0, fam='percussion', desc='hand chimes (soft bells)'),
    'kalimba':        dict(src=F + 'kalimba', kind='dec', rel=1.2, pp='sfz', fam='percussion', desc='kalimba (thumb piano)'),
    'mbira':          dict(src=C + 'Idiophones/Plucked Idiophones/Kalimba, Tanzania', kind='dec', rel=1.2, fam='percussion', desc='mbira / Tanzanian kalimba (grittier; tuned from measured pitch to equal temperament)'),
    'hang':           dict(src=F + 'hang', kind='dec', rel=3.0, pp='sfz', fam='percussion', desc='hang drum (D minor; sounds best on its own notes)'),
    'glass':          dict(src=F + 'glass', kind='dec', rel=2.0, pp='sfz', fam='percussion', desc='glass harp'),
    # Keyboards (键盘)
    'piano':          dict(src=SAL + 'samples', kind='dec', rel=.4, pp='sal', fam='keyboards', desc='Salamander grand piano (Yamaha C5, 5 velocity layers)', lic='salamander'),
    'upright':        dict(src=V + 'Keys/Upright Nr1', kind='dec', rel=.35, retune=False, fam='keyboards', desc='upright piano (warm, slightly worn)'),
    'honky_tonk':     dict(src=F + 'piano_fb', kind='dec', rel=.4, pp='sfz', fam='keyboards', desc='old player piano (saloon honky-tonk)'),
    'harpsichord':    dict(src=C + 'Chordophones/Zithers/Harpsichord, Italian/Sustains', kind='dec', rel=.15, fam='keyboards', desc='harpsichord (Italian)'),
    'organ':          dict(src=(V + 'Keys/Organ/Loud', r'Man3'), kind='sus', rel=.2, pp='organ', oct=0, fam='keyboards', desc='pipe organ, full manual (with 16\' stop, heavy)'),
    'organ_soft':     dict(src=(V + 'Keys/Organ/Quiet', r'Man3'), kind='sus', rel=.2, pp='organ', oct=0, fam='keyboards', desc='pipe organ, soft manual stops'),
    'organ_pedal':    dict(src=(V + 'Keys/Organ', r'Pedal'), kind='sus', rel=.3, pp='detect', fam='keyboards', desc='pipe organ, pedal bass (measured pitch)'),
    'accordion':      dict(src=F + 'accordion', kind='sus', rel=.13, pp='sfz', fam='keyboards', desc='button accordion'),
    # Plucked (拨弦) / Folk (民族)
    'guitar_nylon':   dict(src=F + 'spanish_guitar', kind='dec', rel=.3, pp='sfz', fam='plucked', desc='nylon-string classical guitar'),
    'ukulele':        dict(src=F + 'ukulele', kind='dec', rel=.3, pp='sfz', fam='plucked', desc='ukulele'),
    'electric_guitar': dict(src=F + 'eguitar_clean', kind='dec', rel=.3, pp='sfz', fam='plucked', desc='clean electric guitar'),
    'electric_bass':  dict(src=F + 'finger_bass', kind='dec', rel=.12, pp='sfz', fam='plucked', desc='electric bass, fingered'),
    'jazz_bass':      dict(src=K + 'sneakybass/Samples/finger', kind='dec', rel=.15, pp='lower', oct=-12, fam='plucked', desc='double bass, jazz pizzicato (Sneakybass)'),
    'strumstick':     dict(src=C + 'Chordophones/Composite Chordophones/Strumstick/Finger', kind='dec', rel=.4, fam='plucked', desc='Strumstick, dulcimer-like steel-string folk pluck'),
    'dan_tranh':      dict(src=C + 'Chordophones/Zithers/Dan Tranh/Normal', kind='dec', rel=1.0, fam='plucked', desc='Vietnamese zither đàn tranh (kin to the guzheng; works as one)'),
    'dan_tranh_trem': dict(src=C + 'Chordophones/Zithers/Dan Tranh/Tremolo', kind='sus', rel=.5, fam='plucked', desc='đàn tranh, tremolo'),
    'erhu':           dict(src=K + 'erhu/Samples/sus', kind='sus', rel=.25, pp='lower', fam='folk', desc='erhu, sustained'),
    'erhu_stac':      dict(src=K + 'erhu/Samples/stac', kind='dec', rel=.1, pp='lower', fam='folk', desc='erhu, short bow'),
    'bagpipe':        dict(src=F + 'bagpipe', kind='sus', rel=.4, pp='sfz', fam='folk', desc='bagpipe (chanter; G2/G3 are the drones)'),
    # Unpitched percussion (打击)
    'bass_drum':      dict(src=(V + 'Percussion', r'^BDrumNewhit'), kind='hit', fam='percussion', desc='concert bass drum (7 velocity layers)'),
    'gran_cassa':     dict(src=VM + 'Bass Drum 2', kind='hit', fam='percussion', desc='bass drum 2 (with rolls / crescendos)',
                           var={'hit': r'_hit_', 'roll': r'_roll_(pp|mp|mf|ff|f)\.', 'roll_fast': r'_roll_fast_\w+(?<!_rel)\.', 'cresc': r'_cresc_', 'rub': r'_rub'}),
    'snare':          dict(src=(V + 'Percussion', r'^Snare2-'), kind='hit', fam='percussion', desc='snare drum (orchestral)',
                           var={'on': r'HitSN', 'off': r'HitNS', 'roll': r'rollSN', 'roll_off': r'rollNS'}),
    'snare2':         dict(src=VM + 'Snare Drum, Modern 1', kind='hit', fam='percussion', desc='snare drum 2 (close-miked)',
                           var={'on': r'HitSN', 'off': r'HitNS', 'roll': r'rollSN', 'stick': r'_stick_', 'taps': r'_taps_'}),
    'toms':           dict(src=(VM, r'Tom [12]/'), kind='hit', fam='percussion', desc='toms (high/low × sticks/mallets)',
                           var={'high': r'TomH_HitS', 'low': r'TomL_HitS', 'high_mallet': r'TomH_HitM', 'low_mallet': r'TomL_HitM', 'roll': r'Roll'}),
    'crash':          dict(src=(V + 'Percussion', r'^cymbal-crash1'), kind='hit', fam='percussion', desc='crash cymbals (orchestral)'),
    'clash':          dict(src=VI + 'Clash Cymbals 1', kind='hit', fam='percussion', desc='crash cymbals 2', var={'crash': r'crash1_(pp|mp|mf|ff)\d', 'short': r'short'}),
    'sus_cymbal':     dict(src=VI + 'Suspended Cymbal 1', kind='hit', fam='percussion', desc='suspended cymbal (soft mallet/stick/bell/roll/crescendo/bowed)',
                           var={'hit': r'_hit_(pp|mp|f|fff)\d', 'stick': r'_hit_stick', 'bell': r'_hit_bell', 'roll': r'_roll_\w+_nloop',
                                'cresc': r'_cresc_', 'bow': r'_bow_', 'scrape': r'_scrape'}),
    'gong':           dict(src=(V + 'Percussion', r'^gongHit'), kind='hit', fam='percussion', desc='tam-tam / gong'),
    'gong2':          dict(src=VI + 'Gong 1', kind='hit', fam='percussion', desc='gong 2 (incl. small gong, scrapes)', var={'big': r'^gong_(p|mf|f|fff)\.', 'small': r'gong_2_', 'scrape': r'scrape'}),
    'triangle':       dict(src=VI + 'Triangles', kind='hit', fam='percussion', desc='triangle',
                           var={'open': r'_Hit_', 'muted': r'_HitM_', 'semi': r'(?i)_hitFM_', 'roll': r'_Roll'}),
    'tambourine':     dict(src=(V + 'Percussion', r'^Tamb1'), kind='hit', fam='percussion', desc='tambourine'),
    'claves':         dict(src=(V + 'Percussion', r'^Claves1'), kind='hit', fam='percussion', desc='claves'),
    'cowbell':        dict(src=(V + 'Percussion', r'^Cowbell1'), kind='hit', fam='percussion', desc='cowbell'),
    'sleighbells':    dict(src=(V + 'Percussion', r'^Sleighbells'), kind='hit', fam='percussion', desc='sleigh bells'),
    'log_drum':       dict(src=(V + 'Percussion', r'^LogDrum'), kind='hit', fam='percussion', desc='log drum / slit drum', var={'hi': 'LogDrumHi', 'lo': 'LogDrumLo'}),
    'woodblock':      dict(src=VI + 'Woodblock', kind='hit', fam='percussion', desc='woodblock', var={'a': r'wood_click_', 'b': r'wood_click2', 'c': r'wood_click3'}),
    'frame_drum':     dict(src=VM + 'Frame Drum', kind='hit', fam='percussion', desc='frame drum',
                           var={'large': r'HDrumL_Hit_', 'small': r'HDrumS_Hit_', 'large_muted': r'HDrumL_HitMuted', 'small_muted': r'HDrumS_HitMuted', 'hand': r'_Hand'}),
    'hihat':          dict(src=VI + 'Hi-Hat Cymbal', kind='hit', fam='percussion', desc='hi-hat', var={'closed': r'HitC_', 'open': r'HitO_', 'loose': r'HitLoose', 'pedal': r'_Close_'}),
    'cajon':          dict(src=VI + 'Cajon', kind='hit', fam='percussion', desc='cajón', var={'bass': 'hit1', 'slap': 'hit2', 'tone': 'hit3'}),
    'conga':          dict(src=VM + 'Conga', kind='hit', fam='percussion', desc='conga', var={'conga': r'^Conga_HitN', 'quinto': r'^Quinto_HitN', 'tumba': r'^Tumba_HitN', 'muted': r'HitFM'}),
    'claps':          dict(src=VI + 'Claps', kind='hit', fam='percussion', desc='claps', var={'group': r'^Clap_', 'solo': r'^SoloClap'}),
    'shaker':         dict(src=VI + 'Shaker, Small', kind='hit', fam='percussion', desc='shaker', var={'down': r'Double_Down', 'up': r'Double_Up', 'slap': r'Slap', 'roll': r'Roll'}),
    'nepal_bells':    dict(src=VI + 'Hand Bells, Nepalese', kind='hit', fam='percussion', desc='Nepalese hand bells'),
    'world_perc':     dict(src=F + 'world_perc', kind='hit', pp='sfz', fam='percussion', desc='world percussion (cajón/bongo/egg shaker/castanets/darbuka…; variants in info())'),
    'drum_kit':       dict(src=F + 'muldjord_kit', kind='hit', pp='sfz', fam='percussion', desc='pop drum kit MuldjordKit (CC BY 4.0)', lic='muldjord'),
}
ALIASES = {'strings': 'violins', 'cello': 'cellos', 'viola': 'violas', 'double_bass': 'contrabass', 'upright_bass_pizz': 'jazz_bass',
           'french_horn': 'horn', 'glock': 'glockenspiel', 'vibes': 'vibraphone', 'chimes': 'tubular_bells', 'grand_piano': 'piano',
           'acoustic_guitar': 'guitar_nylon', 'guzheng': 'dan_tranh', 'zither': 'dan_tranh', 'sax': 'tenor_sax', 'kick': 'bass_drum',
           'cymbal': 'crash', 'tamtam': 'gong', 'celesta': 'glockenspiel'}

LIC = {
    'vsco2ce': ('VS Chamber Orchestra: Community Edition (Versilian Studios)', 'CC0 1.0', ''),
    'vcsl': ('Versilian Community Sample Library (Versilian Studios)', 'CC0 1.0', ''),
    'freepats': ('FreePats project (freepats.zenvoid.org)', 'CC0 1.0', ''),
    'karoryfer': ('Karoryfer Samples / sfzinstruments', 'CC0 1.0', ''),
    'salamander': ('Salamander Grand Piano V3 by Alexander Holm', 'CC BY 3.0',
                   'Piano: "Salamander Grand Piano V3" by Alexander Holm, licensed under CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)'),
    'muldjord': ('MuldjordKit by Lars Muldjord (FreePats version)', 'CC BY 4.0',
                 'Drums: "MuldjordKit" by Lars Muldjord (drumgizmo.org), FreePats version, licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)'),
}


def _lic(nm):
    s = REG[ALIASES.get(nm, nm)]
    if s.get('lic'): return s['lic']
    return (s['src'][0] if isinstance(s['src'], tuple) else s['src']).split('/')[0]


# —— Filename parsing ——
_DYN = {'pppp': 1, 'ppp': 2, 'pp': 3, 'p': 4, 'mp': 5, 'mf': 6, 'f': 7, 'ff': 8, 'fff': 9, 'soft': 3, 'quiet': 3,
        'med': 6, 'medium': 6, 'normal': 6, 'loud': 8, 'accented': 8}


def _toks(stem): return [t for t in re.split(r'[_\s\-\.]+', stem) if t]


def _parse_pitch(stem, mode):
    tk = _toks(stem)
    if mode == 'sal':
        m = re.match(r'([A-G]#?)(\d)v(\d+)$', stem); return midi(m.group(1) + m.group(2)) if m else None
    if mode == 'organ':
        n = next((int(t) for t in tk if re.fullmatch(r'\d{2,3}', t)), None)
        if n is None: return None
        ped = 'Pedal' in stem; n -= (63 if ped else 121) if n > 61 else 0
        return float((23 if ped else 35) + n)
    rx = r'([A-G])(#|b)?(-?\d)' if mode == 'upper' else r'([a-g])(#|b)?(\d)'
    for t in tk:
        m = re.fullmatch(rx, t)
        if m: return midi(m.group(1).upper() + (m.group(2) or '') + m.group(3))
    return None


def _parse_vel(stem, mode='upper'):
    tk = [t for t in _toks(stem) if not (mode == 'lower' and re.fullmatch(r'[a-g](#|b)?\d', t))]
    for t in tk:  # explicit dynamic markers first (v3 / vl2 / dyn1 / pp / mf2), then words such as soft/loud
        m = re.fullmatch(r'(?i)v(?:l)?(\d+)|dyn(\d)', t)
        if m: return int(m.group(1) or m.group(2))
        b = re.sub(r'\d+$', '', t)
        if re.fullmatch(r'p{1,4}|mp|mf|f{1,3}', b): return _DYN[b]
    for t in tk:
        if t.lower() in _DYN: return _DYN[t.lower()]
    return None


def _parse_rr(stem):
    for t in _toks(stem):
        m = re.fullmatch(r'(?i)r{1,2}(\d+)', t)
        if m: return int(m.group(1))
    return 1


# —— SFZ parsing (freepats family) ——
def _sfz(path):
    txt = open(path, encoding='utf-8', errors='ignore').read()
    zones, glob_, grp, lab, pending = [], {}, {}, None, None
    for line in txt.splitlines():
        s = line.strip()
        if s.startswith('//'):
            c = s[2:].strip()
            if c and not c.startswith('+'): pending = c
            continue
        for part in re.split(r'(<\w+>)', s):
            part = part.strip()
            if not part: continue
            if part.startswith('<'):
                h = part[1:-1]
                if h in ('global', 'control'): cur = glob_ = {}
                elif h in ('group', 'master'): grp = dict(glob_); cur = grp; lab = pending or lab
                elif h == 'region': cur = dict(grp); zones.append(cur); cur['_lab'] = lab
                pending = None if h != 'region' else pending
                continue
            for k, v in re.findall(r'(\w+)=(.*?)(?=\s+\w+=|$)', part):
                cur[k] = v.strip()
    return zones


def _sfz_zones(d):
    fs = [f for f in glob.glob(os.path.join(ROOT, d, '*.sfz'))]
    if not fs: return []
    out, seen = [], {}
    for r in _sfz(fs[0]):
        if 'sample' not in r or r.get('trigger', 'attack') not in ('attack', 'first'): continue  # skip release-triggered samples
        p = os.path.normpath(os.path.join(os.path.dirname(fs[0]), r['sample'].replace('\\', '/')))
        if not os.path.exists(p): continue
        key = r.get('pitch_keycenter', r.get('key'))
        root = float(key) - float(r.get('tune', 0)) / 100 if key is not None else None
        lo, hi = int(r.get('lovel', 1)), int(r.get('hivel', 127))
        rel = os.path.relpath(p, ROOT)
        if rel in seen:  # the same sample in several velocity groups → merge the velocity ranges
            z = seen[rel]; z['_lo'] = min(z['_lo'], lo); z['_hi'] = max(z['_hi'], hi); continue
        var = (r.get('_lab') or os.path.basename(os.path.dirname(p)))
        import unicodedata
        var = re.sub(r'[^a-z0-9]+', '_', unicodedata.normalize('NFKD', var).encode('ascii', 'ignore').decode().lower()).strip('_')
        z = dict(f=rel, root=root, _lo=lo, _hi=hi, rr=len(out), var=var,
                 loop=[int(r['loop_start']), int(r['loop_end'])] if 'loop_start' in r and 'loop_end' in r else None,
                 db=float(r.get('volume', 0)))
        seen[rel] = z; out.append(z)
    for z in out: z['vel'] = (z.pop('_lo') + z.pop('_hi')) / 2
    return out


def _scan(nm):
    """Collect all of this instrument's samples per the registry → list of zones (not yet analysed)"""
    s = REG[nm]; src = s['src']; mode = s.get('pp', 'upper')
    if mode == 'sfz':
        zs = _sfz_zones(src)
    else:
        d, rx = src if isinstance(src, tuple) else (src, None)
        fs = sorted(glob.glob(os.path.join(ROOT, d, '**', '*.*'), recursive=True))
        zs = []
        for p in fs:
            if not p.lower().endswith(('.flac', '.wav')): continue
            rel = os.path.relpath(p, ROOT); st = os.path.splitext(os.path.basename(p))[0]
            if rx and not re.search(rx, os.path.relpath(p, os.path.join(ROOT, d))): continue
            v = int(st.split('v')[-1]) if mode == 'sal' else _parse_vel(st, mode)
            zs.append(dict(f=rel, root=None if mode == 'detect' else _parse_pitch(st, mode), vel=v, rr=_parse_rr(st), var=None, loop=None, db=0.0))
    var = s.get('var')
    if var:
        for z in zs:
            b = os.path.relpath(os.path.join(ROOT, z['f']), os.path.join(ROOT, src[0] if isinstance(src, tuple) else src))
            z['var'] = next((k for k, r in var.items() if re.search(r, b) or re.search(r, os.path.basename(b))), None)
        zs = [z for z in zs if z['var']]
    elif s['kind'] != 'hit':
        for z in zs: z['var'] = None
    if s['kind'] != 'hit' and mode != 'detect':
        zs = [z for z in zs if z['root'] is not None]
    return zs


# —— Analysis (onset / level / yin-measured pitch); results go to index.json ——
def _read(path):
    x, sr = sf.read(os.path.join(ROOT, path), dtype='float32', always_2d=True)
    return x.mean(1), sr


def _onset(x):
    pk = np.abs(x).max() + 1e-12
    i = int(np.argmax(np.abs(x) > pk * 10 ** (-40 / 20)))
    return max(0, i - 96)


def _yin(x, sr, guess):
    try: import librosa
    except ImportError: raise ImportError('building the sample index needs librosa (maintainers): pip install -r requirements-dev.txt') from None
    y = x[:int(sr * 1.6)].astype(np.float64)
    if guess is None: fmin, fmax = 40.0, 2000.0
    else:
        g = 440 * 2 ** ((guess - 69) / 12); fmin, fmax = max(28.0, g / 4.2), min(sr / 4, g * 4.2)
    fl = int(2 ** math.ceil(math.log2(max(2048, 3 * sr / fmin))))
    try:
        f = librosa.yin(y, fmin=fmin, fmax=fmax, sr=sr, frame_length=fl, hop_length=fl // 4)
    except Exception: return None, 0.0
    e = uniform_filter1d(y ** 2, fl)[::fl // 4]; k = min(len(e), len(f)); e, f = e[:k], f[:k]
    ok = e > e.max() * 0.05
    if ok.sum() < 3: return None, 0.0
    m = 69 + 12 * np.log2(f[ok] / 440); med = float(np.median(m))
    return med, float(np.mean(np.abs(m - med) < .5))


def _analyze(nm, zs):
    s = REG[nm]; pitched = s['kind'] != 'hit'
    def one(z):
        x, sr = _read(z['f']); on = _onset(x); y = x[on:]
        w = int(sr * (.4 if s['kind'] == 'sus' else .1)); seg = y[:int(sr * 4)].astype(np.float64)  # rms = loudest window in the first 4 s (0.4 s window for sustained / 0.1 s for decaying)
        r = np.sqrt(uniform_filter1d(seg ** 2, w)[w // 2::w // 4].max()) if len(seg) > w else np.sqrt(np.mean(seg ** 2))
        z.update(on=on, n=len(y), sr=sr, rms=float(r) + 1e-9, pk=float(np.abs(y).max() + 1e-9))
        if pitched:
            det, conf = _yin(y, sr, z['root'])
            z.update(det=det, conf=conf)
        return z
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(8) as ex: zs = list(ex.map(one, zs))
    if pitched:
        good = [z for z in zs if z.get('det') is not None and z['conf'] > .6 and z['root'] is not None]
        off = 0
        if good:
            ks = [round((z['det'] - z['root']) / 12) * 12 for z in good]
            k = max(set(ks), key=ks.count)
            if ks.count(k) > len(ks) * .6: off = k
        off = s.get('oct', off)   # the registry can force the octave (yin wavers on low notes / pipe organ)
        if s.get('roots'):        # the registry gives the pitches directly (timpani: yin can't lock onto the main vibration mode)
            for z in zs: z['root'] = s['roots'][z['var']]
            return zs, 0
        for z in zs:
            if z['root'] is None:  # detect mode: use the measured pitch directly
                z['root'] = round(z['det'], 2) if z.get('det') is not None else 48.0
                continue
            z['root'] += off
            dev = (z['det'] - z['root']) if z.get('det') is not None else 0
            if s.get('pp') not in ('sal', 'sfz') and s.get('retune', True) and z['conf'] > .6 and .08 < abs(dev) < .8:
                z['root'] = round(z['root'] + dev, 3)   # fine-tune to equal temperament from the yin measurement (<80 cents; except piano / sfz libraries / tubular bells)
        return zs, off
    return zs, 0


def build_index(names=None, force=False):
    """Scan + analyse all (or the given) instruments and write instruments/index.json (downloaded with the sample packs; normally no need to run)"""
    idx = _load_index()
    for nm in (names or REG):
        if nm in idx and not force: continue
        zs, off = _analyze(nm, _scan(nm))
        idx[nm] = dict(zones=zs, octave_fix=off)
        print(f'{nm:18s} {len(zs):4d} zones  octave_fix={off:+d}', flush=True)
    tmp = INDEX + f'.{os.getpid()}.tmp'
    with open(tmp, 'w', encoding='utf-8') as f: json.dump(idx, f, ensure_ascii=False, separators=(',', ':'))
    os.replace(tmp, INDEX)
    global _IDX; _IDX = idx
    return idx


_IDX = None


def _load_index():
    global _IDX
    if _IDX is None:
        _IDX = json.load(open(INDEX, encoding='utf-8')) if os.path.exists(INDEX) else {}
    return _IDX


# —— Instrument object ——
class Inst:
    def __init__(self, nm):
        self.name, self.spec = nm, REG[nm]
        src = self.spec['src']; self.lib = (src[0] if isinstance(src, tuple) else src).split('/')[0]
        if not (os.path.isdir(os.path.join(ROOT, self.lib)) and os.path.exists(INDEX)):
            raise RuntimeError(f'{nm}: its sample library "{self.lib}" is not downloaded. Run, from the library root: sh tools/fetch.sh instruments {self.lib}')
        idx = _load_index()
        if nm not in idx:
            zs, off = _analyze(nm, _scan(nm)); idx[nm] = dict(zones=zs, octave_fix=off)
        self.zones = [dict(z, id=i) for i, z in enumerate(idx[nm]['zones'])]
        if not self.zones:
            raise RuntimeError(f'{nm}: no samples found in {ROOT}/{self.lib}. The download looks incomplete; run again: sh tools/fetch.sh instruments {self.lib}')
        self.kind, self.rel = self.spec['kind'], self.spec.get('rel', .3)
        # velocity layers → 0..1 position (ranked separately within each variant)
        groups = {}
        for z in self.zones: groups.setdefault(z.get('var'), []).append(z)
        for g in groups.values():
            vs = sorted({z['vel'] for z in g if z['vel'] is not None})
            for z in g:
                z['vp'] = .8 if z['vel'] is None or len(vs) < 2 else (vs.index(z['vel']) + .5) / len(vs)
        self.layers = max(len({z['vel'] for z in g}) for g in groups.values())
        vs = list(OrderedDict.fromkeys(z['var'] for z in self.zones if z.get('var')))
        order = list(self.spec.get('var') or {})  # the first variant listed in the registry = default
        self.vars = [v for v in order if v in vs] + [v for v in vs if v not in order]
        # level normalisation: pitched → median rms of the layer at velocity ≈0.8; percussion → each variant normalised by its own peak (so rolls/bowed hits work as well as single hits)
        self.vgain = {}
        for k, g in groups.items():
            d0 = min(abs(z['vp'] - .8) for z in g); ref = [z for z in g if abs(z['vp'] - .8) <= d0 + 1e-6]
            self.vgain[k] = (.1 / np.median([z['rms'] for z in ref])) if self.kind != 'hit' else (.4 / np.median([z['pk'] for z in ref]))
        allref = [z for z in self.zones if abs(z['vp'] - .8) <= min(abs(w['vp'] - .8) for w in self.zones) + 1e-6]
        self.gain = (.1 / np.median([z['rms'] for z in allref])) if self.kind != 'hit' else 1.0
        if self.kind != 'hit':
            rs = [z['root'] for z in self.zones]; self.lo, self.hi = min(rs), max(rs)
        self._rr = 0

    def pick(self, m, vel, var=None):
        zs = [z for z in self.zones if var is None or z.get('var') == var] or self.zones
        if self.kind == 'hit' or m is None:
            cost = [abs(z['vp'] - vel) for z in zs]
        else:
            cost = [abs(z['root'] - m) + (.35 if z['root'] < m else 0) * min(1, abs(z['root'] - m)) + 4 * abs(z['vp'] - vel) for z in zs]
        c0 = min(cost); cand = [z for z, c in zip(zs, cost) if c <= c0 + .01]
        self._rr += 1
        return cand[int(_rng.integers(len(cand)))] if len(cand) > 1 else cand[0]

    def __repr__(self):
        r = f'{name(self.lo)}–{name(self.hi)}' if self.kind != 'hit' else 'unpitched'
        return f'<Inst {self.name} {self.kind} {len(self.zones)} zones {r} layers={self.layers}' + (f' vars={self.vars}' if self.vars else '') + '>'


_INST = {}


def load(nm):
    """Load an instrument by name (lazy load + cache). Returns an Inst (zones/range/vars can be inspected)"""
    nm = ALIASES.get(nm, nm)
    if nm not in REG: raise KeyError(f'unknown instrument {nm!r}; available: {", ".join(sorted(REG))}')
    with _lock:
        if nm not in _INST: _INST[nm] = Inst(nm)
    return _INST[nm]


FAMILIES = ('strings', 'woodwinds', 'brass', 'percussion', 'keyboards', 'plucked', 'folk')
FAM_ALIASES = {'弦乐': 'strings', '木管': 'woodwinds', '铜管': 'brass', '打击': 'percussion', '键盘': 'keyboards', '拨弦': 'plucked', '民族': 'folk'}   # the Chinese names still work


def instruments(fam=None):
    """Instrument names, all or one family: strings / woodwinds / brass / percussion / keyboards / plucked / folk (the Chinese names are accepted too)"""
    if isinstance(fam, str): fam = FAM_ALIASES.get(fam, fam.lower())
    if fam is not None and fam not in FAMILIES: raise KeyError(f'unknown family {fam!r}; families: {", ".join(FAMILIES)}')
    return [k for k, v in REG.items() if fam is None or v['fam'] == fam]


# —— Sample reading / transposition cache ——
class _LRU(OrderedDict):
    def __init__(self, n): super().__init__(); self.n = n
    def get_or(self, k, fn):
        with _lock:
            if k in self: self.move_to_end(k); return self[k]
        v = fn()
        with _lock:
            self[k] = v
            while len(self) > self.n: self.popitem(last=False)
        return v


_RAW, _SHIFT = _LRU(160), _LRU(320)


def _raw(z):
    def f():
        x, sr = _read(z['f']); x = x[z['on']:].copy(); x[:96] *= np.linspace(0, 1, min(96, len(x)))
        return x, sr
    return _RAW.get_or(z['f'], f)


def _shifted(z, semis):
    """Transpose by semis semitones and resample to SR (soxr HQ)"""
    k = (z['f'], round(semis, 3))
    def f():
        x, sr = _raw(z)
        r = 2 ** (semis / 12)
        return soxr.resample(x, sr * r, SR, quality='HQ').astype(np.float32)
    return _SHIFT.get_or(k, f)


def _region(z, y, r):
    """Loopable steady section [a,b) (in sample coordinates after transposition)"""
    if z.get('loop'):
        a, b = z['loop']; a = int((a - z['on']) * SR / (z['sr'] * r)); b = int((b - z['on']) * SR / (z['sr'] * r))
        if 0 < a < b <= len(y) and b - a > SR * .05: return a, b
    hop = int(.02 * SR); e = np.sqrt(uniform_filter1d(y.astype(np.float64) ** 2, hop)[::hop] + 1e-12)
    pk = e.max(); st = max(int(.3 * SR / hop), int(np.argmax(e > .5 * pk)))
    thr = .45 * np.median(e[e > .1 * pk]) if (e > .1 * pk).any() else 0
    good = e > thr; best, cur, bs = (0, 0), 0, 0
    for i in range(st, len(e)):
        if good[i]:
            if cur == 0: bs = i
            cur += 1
            if cur > best[1] - best[0]: best = (bs, i + 1)
        else: cur = 0
    a, b = best[0] * hop, best[1] * hop
    if b - a < .3 * SR: a, b = int(len(y) * .3), int(len(y) * .8)
    m = int((b - a) * .06); return a + m, b - m


def _extend(y, n, a, b, f0):
    """Crossfaded grain extension: take random grains from the steady section, phase-align them to the fundamental period and splice, up to n samples"""
    if len(y) >= n: return y[:n]
    per = int(SR / f0) if f0 else 600
    L = b - a
    X = int(min(.1 * SR, L / 4)); W = min(X, 2048)
    G = int(min(max(.4 * SR, L * .5), L - X - W - 2 * per))
    if G < .05 * SR:  # steady section too short: fall back to period-aligned repeats of the last 0.2 s
        a, b = max(0, len(y) - int(.45 * SR)), len(y) - int(.05 * SR); L = b - a
        X = int(min(.06 * SR, L / 4)); W = min(X, 2048); G = max(int(L - X - W - 2 * per), int(.05 * SR))
    buf = np.zeros(n + G + X, np.float32); m = min(b, len(y)); buf[:m] = y[:m]
    fade = (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, X))).astype(np.float32)
    ref_rms = np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9
    while m < n:
        lo, hi = a + X + W, max(a + X + W + 1, b - G - 2 * per)
        s = int(_rng.integers(lo, hi))
        ref = buf[m - W:m]; seg = y[s - W:s + 2 * per]
        c = np.correlate(seg, ref, 'valid')
        en = np.sqrt(np.convolve(seg ** 2, np.ones(W), 'valid') + 1e-9)
        s += int(np.argmax(c / en[:len(c)]))
        g = float(np.clip(ref_rms / (np.sqrt(np.mean(y[s:s + G] ** 2)) + 1e-9), .75, 1.33))  # each grain matched to the steady section's mean level, so the level doesn't drift cumulatively
        buf[m - X:m] = buf[m - X:m] * (1 - fade) + y[s - X:s] * g * fade
        buf[m:m + G] = y[s:s + G] * g; m += G
    return buf[:n]


def _vel_tone(x, vel, single):
    """Single-velocity-layer instruments: darken slightly when played soft (real instruments have less treble when soft)"""
    if not single or vel >= .78: return x
    fc = float(np.clip(18000 * (vel / .8) ** 2.2, 900, 18000))
    return sosfilt(butter(1, fc, 'low', fs=SR, output='sos'), x).astype(np.float32)


def note(inst, pitch, dur, vel=.8, release=None, attack=0.0, var=None):
    """One note: inst name or Inst; pitch 'C#4'/midi (fractions allowed); dur = held time (s); vel 0..1;
    release = release after note-off (s, per-instrument default); attack>0 adds a fade-in (for string pads). Returns float32 @SR, length ≈ dur+release"""
    I = inst if isinstance(inst, Inst) else load(inst)
    if I.kind == 'hit': return hit(I, var, vel)
    m = midi(pitch); vel = float(np.clip(vel, .01, 1))
    z = I.pick(m, vel, var)
    semis = m - z['root']; y = _shifted(z, semis)
    rel = I.rel if release is None else release
    dn, rn = int(dur * SR), int(max(rel, .005) * SR)
    if I.kind == 'sus' and len(y) < dn + rn:
        a, b = _region(z, y, 2 ** (semis / 12))
        y = _extend(y, dn + rn, a, b, hz(m))
    y = y[:dn + rn].copy()
    if len(y) > dn:  # release: exponential decay to -60 dB, last 5 ms forced to zero
        t = np.arange(len(y) - dn) / SR
        env = np.exp(-6.9 * t / max(rel, .005)); env[-min(240, len(env)):] *= np.linspace(1, 0, min(240, len(env)))
        y[dn:] *= env.astype(np.float32)
    if attack > 0:
        k = min(len(y), int(attack * SR)); y[:k] *= (np.sin(np.linspace(0, np.pi / 2, k)) ** 2).astype(np.float32)
    single = I.layers < 2
    g = I.gain * 10 ** (z.get('db', 0) / 20) * ((vel / .8) ** 1.2 if single else float(np.clip((vel / z['vp']) ** .6, .5, 1.6)))
    return _vel_tone(y, vel, single) * np.float32(g)


def hit(inst, name_or_index=None, vel=.8, dur=None):
    """Unpitched percussion: hit('snare','roll',.6) / hit('drum_kit','snare1') / hit('timpani',2) (the 3rd drum).
    name may be a prefix; dur can truncate (adds a 30 ms fade-out). Works on pitched instruments too: plays the whole natural decay"""
    I = inst if isinstance(inst, Inst) else load(inst)
    var, m = name_or_index, None
    if isinstance(var, (int, np.integer)):
        if I.vars: var = I.vars[int(var) % len(I.vars)]
        else: rs = sorted({z['root'] for z in I.zones}); m = rs[int(var) % len(rs)]; var = None
    elif isinstance(var, str) and var not in I.vars:
        q = re.sub(r'[^a-z0-9]', '', var.lower()); key = {v: v.replace('_', '') for v in I.vars}
        c = [v for v in I.vars if key[v].startswith(q)] or [v for v in I.vars if q in key[v]]
        if c: var = c[0]
        elif I.kind != 'hit': m, var = midi(var), None
        else: raise KeyError(f'{I.name} has no variant {var!r}; available: {I.vars}')
    vel = float(np.clip(vel, .01, 1))
    if var is None and I.vars and I.kind == 'hit': var = I.vars[0]
    z = I.pick(m, vel, var)
    y = _shifted(z, 0).copy()
    if dur is not None and len(y) > dur * SR:
        y = y[:int(dur * SR) + 1440]; y[-1440:] *= np.linspace(1, 0, 1440, dtype=np.float32)
    single = len({w['vel'] for w in I.zones if w.get('var') == z.get('var')}) < 2
    g = (I.vgain[z.get('var')] if I.kind == 'hit' else I.gain) * 10 ** (z.get('db', 0) / 20) * ((vel / .8) ** 1.3 if single else float(np.clip((vel / z['vp']) ** .7, .4, 1.8)))
    return y * np.float32(g)


def chord(inst, pitches, dur, vel=.8, strum=0.0, **kw):
    """Chord (mono): with strum>0 each note is delayed strum seconds after the previous (guitar strum / harp arpeggio)"""
    xs = [note(inst, p, dur, vel * (1 - .04 * i), **kw) for i, p in enumerate(pitches)]
    n = max(len(x) + int(i * strum * SR) for i, x in enumerate(xs)); out = np.zeros(n, np.float32)
    for i, x in enumerate(xs): s = int(i * strum * SR); out[s:s + len(x)] += x
    return out


def render(events, dur=None, master=True):
    """Score: events = [(t, inst, pitch, dur, vel, pan[, gain]), ...] or dict(t=,inst=,pitch=,dur=,vel=,pan=,gain=,release=,attack=).
    For unpitched percussion, write pitch as the variant name or None. Returns stereo float32 (N,2); with master=True, per-channel look-ahead limiting to 0.95"""
    evs = []
    for e in events:
        if isinstance(e, dict): evs.append(e)
        else:
            k = ['t', 'inst', 'pitch', 'dur', 'vel', 'pan', 'gain']; evs.append(dict(zip(k, e)))
    if dur is None: dur = max(e['t'] + (e.get('dur') or 1) + 3 for e in evs)
    buf = np.zeros((int(dur * SR), 2), np.float32)
    for e in evs:
        I = load(e['inst']); kw = {k: e[k] for k in ('release', 'attack') if e.get(k) is not None}
        if I.kind == 'hit': x = hit(I, e.get('pitch'), e.get('vel', .8), e.get('dur'))
        else: x = note(I, e['pitch'], e.get('dur') or .5, e.get('vel', .8), var=e.get('var'), **kw)
        add(buf, x, e['t'], e.get('gain', 1.0) if e.get('gain') is not None else 1.0, e.get('pan', 0.0) or 0.0)
    if master and np.abs(buf).max() > .95:
        buf = np.stack([limit(buf[:, 0], .95), limit(buf[:, 1], .95)], 1).astype(np.float32)
    return buf


def room(x, size=.5, mix=.2, predelay=.015, damp=.5, seed_=3):
    """Simple convolution reverb: decorrelated exponentially decaying noise IR (treble decays faster). x mono or (N,2); returns (N,2), same length.
    size 0..1 → RT60 0.4–3.4 s; mix = wet proportion; damp 0..1, higher = darker"""
    x = np.asarray(x, np.float32); st = x if x.ndim == 2 else np.stack([x, x], 1)
    rt = .4 + 3.0 * size; n = int(rt * SR); t = np.arange(n) / SR
    r = np.random.default_rng(seed_); out = np.zeros_like(st)
    for c in range(2):
        w = r.standard_normal(n)
        lp_ = sosfilt(butter(1, 9000 * (1 - .75 * damp) + 1500, 'low', fs=SR, output='sos'), w)
        k = np.clip(t / rt, 0, 1) ** .6
        ir = (w * (1 - k) + lp_ * k * 1.4) * np.exp(-6.9 * t / rt)
        ir[:int(.004 * SR)] *= np.linspace(0, 1, int(.004 * SR))
        ir = np.concatenate([np.zeros(int(predelay * SR)), ir]); ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
        out[:, c] = fftconvolve(st[:, c], ir)[:len(st)] * .5
    return (st * (1 - mix) + out * mix * 2.2).astype(np.float32)


def info(nm=None):
    """Print an overview of one or all instruments (range / velocity layers / variants / licence)"""
    for k in ([ALIASES.get(nm, nm)] if nm else REG):
        I = load(k); print(I, '|', REG[k]['desc'], '|', LIC[_lic(k)][1])


def credits(names):
    """From the instrument names used, return the attribution lines the end CREDITS need (CC BY ones are required; CC0 ones listed as thanks)"""
    need, thanks = [], set()
    for n in names:
        n = ALIASES.get(n, n); l = _lic(n)
        if LIC[l][2]: need.append(LIC[l][2])
        else: thanks.add(LIC[l][0])
    return list(OrderedDict.fromkeys(need)) + ([f'Samples (CC0): {", ".join(sorted(thanks))}'] if thanks else [])
