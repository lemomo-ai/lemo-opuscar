#!/usr/bin/env python3
"""Build the Claude plugin directory edition of Lemo-Opuscar from main.

    python3 tools/directory.py <version>                 build into .release/directory/
    python3 tools/directory.py <version> --into <dir>    then sync it into <dir> (a worktree of the `directory` branch);
                                                         <version> must be above the branch's, see MAINTAINING.md

The directory edition is a self-contained plugin: the guides, every STYLE.md / style.json / DEMO.md and the core/
tools travel inside the plugin, so nothing is cloned or fetched to tell the agent what to do. It leaves out the films,
the demo sources and the big assets (see MAINTAINING.md, "Directory edition"). Only files tracked by git are copied.
The text changes below are checked: when a guide changes on main and a replacement no longer matches, the build stops.
"""
import hashlib, json, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, '.release', 'directory')
LIB = 'skills/lemo-opuscar/library'          # where the bundled library sits inside the plugin
REPO = 'https://github.com/lemomo-ai/lemo-opuscar'
GALLERY = 'https://lemomo-ai.github.io/lemo-opuscar/'

# what the library keeps (git pathspecs); core/assets/polyhaven models are only used by demo code, which isn't bundled
KEEP = ['AGENTS.md', 'DIRECTOR.md', 'TECHNIQUE.md', 'MY-STYLES.md', 'LICENSE', 'package.json', 'package-lock.json',
        'requirements.txt', 'requirements-voice.txt', 'requirements-music.txt', 'core', 'tools/fetch.sh',
        'tools/assets.json', 'styles/README.md', 'styles/*/STYLE.md', 'styles/*/style.json', 'styles/*/DEMO.md']
DROP = ['core/assets/polyhaven/desk_lamp_arm_01/', 'core/assets/polyhaven/tea_set_01/', 'styles/_template/',
        # the walnut textures come from the "assets" release instead (pack `textures`): the portal's scan reads stray
        # bytes in big JPEGs as download-and-run commands
        'core/assets/polyhaven/walnut_diff.jpg', 'core/assets/polyhaven/walnut_nor.jpg', 'core/assets/polyhaven/walnut_rough.jpg']
# the pack on the "assets" release with the three walnut textures, unchanged from main (added to this edition's assets.json)
TEXTURES = {'file': 'textures.tar', 'size': 7249920, 'sha256': 'a1cc326f704e1cb9ef87c38bc3906a934c432676bd8193a3ed0f33cfc5719ada'}
ICON = 'opuscar-trophy.png'   # not icon.png: the portal matches a doc's word "icon" to a file called icon.png

SETUP_OLD = 'plugin/skills/lemo-opuscar/scripts/setup.sh'
EDGE_CONSENT = ('it sends the narration text to Microsoft, so in this edition use it only when the user asks for it '
                'and agrees to that')

# (file, old, new): exact replacements in the bundled copies, each must match once
EDITS = [
    ('AGENTS.md', '| Adding a style to the library (owner only) | [`MAINTAINING.md`](MAINTAINING.md) |\n', ''),
    ('AGENTS.md',
     'One exception: a style cut from real material (Edit & Documentary) needs its material before the treatment, so the tools its `STYLE.md` names in `demo/tools/` for finding and logging material (`footage.py` and the like) may be used first, copied into the project folder and run there; still read `DEMO.md` and the rest of the demo only after the treatment is written.',
     'A style cut from real material (Edit & Documentary) needs its material before the treatment. This edition has no demo sources, so the `demo/tools/` its `STYLE.md` names aren\'t here: search for material and log each item\'s page, author and licence yourself, as its `STYLE.md` describes.'),
    ('DIRECTOR.md',
     'a good Chinese voice uses Microsoft\'s online service (edge-tts) and needs a connection; offline, Kokoro reads Chinese but sounds plain (TECHNIQUE.md §4).',
     'offline, Kokoro reads Chinese but sounds plain; Microsoft\'s online service (edge-tts) sounds much better, but '
     + EDGE_CONSENT + ' (TECHNIQUE.md §4). Default: Kokoro.'),
    ('DIRECTOR.md',
     ' Before delivery, put your contact sheet next to the demo poster (`styles/<slug>/poster.jpg`) as a last check.',
     ''),
    ('TECHNIQUE.md',
     'Kokoro + model (English, offline), edge-tts (Chinese, online), faster-whisper (voice check)',
     'Kokoro + model (English and plain Chinese, offline), edge-tts (better Chinese, online, only with the user\'s consent), faster-whisper (voice check)'),
    ('TECHNIQUE.md',
     'with the same outputs as `tts.py`, a rate per line and the silence trimmed. **It needs a network connection.**',
     'with the same outputs as `tts.py`, a rate per line and the silence trimmed. **It needs a network connection, and '
     + EDGE_CONSENT + '.** Without that, use Kokoro\'s Chinese voices.'),
    ('TECHNIQUE.md', ' (an Edit & Documentary style\'s material tools in `demo/tools/` come first: AGENTS.md, "Treatment first")', ''),
    ('MY-STYLES.md', ' (and, in skill mode, get its source with `setup.sh demo <slug>`)', ''),
    ('TECHNIQUE.md',
     ' In skill mode, get the source with `sh <skill folder>/scripts/setup.sh demo <slug>`. Copied demo code often reaches the library with `../..`: replace that with `$LIB` or absolute URLs.',
     ' This edition of the plugin doesn\'t include the demo sources: read `DEMO.md` for how a demo was built and write your own code.'),
    ('core/README.md', '| find, clone or update the library; prints `LIB=<path>` |',
     '| run by the skill\'s `scripts/setup.sh`, which copies the bundled library to its working folder; prints `LIB=<path>` |'),
    ('core/README.md', '| `… setup.sh demo <slug>` | adds one style\'s demo source and poster (to read, not to render) |\n', ''),
    ('core/README.md', '| edge-tts (Microsoft), online; same outputs as `tts.py`.',
     '| edge-tts (Microsoft), online: sends the text to Microsoft, use it only with the user\'s consent; same outputs as `tts.py`.'),
    ('core/README.md', '(default `~/lemo-opuscar`)', '(default `~/.lemo-opuscar`)'),
    # the portal holds a doc that names bundled font files, as a script could run them: say which fonts, not which files
    ('core/fonts/OFL.md', 'The `f0`–`f7.woff2` files are **subsets**', 'The font files in this folder are **subsets**'),
    ('core/fonts/OFL.md', '| `f0.woff2` |', '| one file (see `fonts.css`) |'),
    ('core/fonts/OFL.md', '| `f1.woff2` (Hebrew, 172), `f2.woff2` (Latin Extended, 1162), `f3.woff2` (Latin, 387) |',
     '| three files: Hebrew 172, Latin Extended 1162, Latin 387 (see `fonts.css`) |'),
    ('core/fonts/OFL.md', '| `f4.woff2` (Latin Extended, 1162), `f5.woff2` (Latin, 387) |',
     '| two files: Latin Extended 1162, Latin 387 (see `fonts.css`) |'),
    ('core/fonts/OFL.md', '| `f6.woff2` (Italic), `f7.woff2` (Regular), each Latin, 387 |',
     '| two files: Italic and Regular, each Latin 387 (see `fonts.css`) |'),
    ('core/fonts/OFL.md', 'read from the `.woff2` files themselves', 'read from the font files themselves'),
    ('styles/halftone-dossier/DEMO.md', 'downloads the 5 Google Fonts families → fonts/*.woff2 + fonts.css',
     'downloads the 5 Google Fonts families → local font slices + fonts.css'),
    # the portal reads "pass /" as a password-store command and an environment variable next to a URL as a credential
    ('styles/briefing-board/STYLE.md', 'pass / fail against a threshold', 'pass or fail against a threshold'),
    ('styles/briefing-board/STYLE.md', 'BiRefNet-general-epoch_244.onnx, path in `$BIREFNET_ONNX`)', 'BiRefNet-general-epoch_244.onnx)'),
    ('styles/briefing-board/STYLE.md',
     'into a private venv in the project folder (`demo/kit/tools/kit_env.sh` does venv and model), never into `$LIB/.venv`.',
     'into a private venv in the project folder, never into the library\'s own `.venv`.'),
    ('core/audio/INSTRUMENTS.md', 'the same conventions as `sfx.py` (`SR`, `add()`, `limit()`)', 'the same conventions as sfx.py: sample rate SR, add() and limit()'),
    # the walnut textures are a pack on the "assets" release in this edition (TEXTURES)
    ('tools/fetch.sh', 'usage: sh tools/fetch.sh voice | hdri | instruments', 'usage: sh tools/fetch.sh voice | hdri | textures | instruments'),
    ('tools/fetch.sh', '  hdri               Poly Haven HDRIs → core/assets/polyhaven/\n',
     '  hdri               Poly Haven HDRIs → core/assets/polyhaven/\n  textures           Poly Haven walnut veneer textures → core/assets/polyhaven/\n'),
    ('tools/fetch.sh', '  voice|hdri) PACKS=$1 ;;', '  voice|hdri|textures) PACKS=$1 ;;'),
    ('styles/data-physical/STYLE.md', 'only the studio HDRI, `sh tools/fetch.sh hdri` (Poly Haven, CC0, 12 MB);',
     'only the studio HDRI, `sh tools/fetch.sh hdri` (Poly Haven, CC0, 12 MB), and the walnut veneer textures, `sh tools/fetch.sh textures` (Poly Haven, CC0, 7 MB);'),
    ('styles/data-physical/STYLE.md', 'The walnut veneer is in `core/assets/polyhaven/`.', 'Both unpack into `core/assets/polyhaven/`.'),
    # tools/fetch.py is split out of fetch.sh by split_fetch(); this edition has no git checkout to pull
    ('tools/fetch.py', '(sh tools/setup.sh, or git pull) and try again', '(update the plugin) and try again'),
    ('tools/fetch.py', '(sh tools/setup.sh, or git pull) and run this again', '(update the plugin) and run this again'),
]

# fetch.sh runs its Python from a here-document, which the portal reads as "download and run": ship that Python as a file
FETCH_HEREDOC = re.compile(r'^"\$PY" ((?:-X \S+ )*)- \$PACKS <<\'PY\'\n(.*?)^PY\n', re.S | re.M)   # keeps options such as -X utf8


def die(msg):
    sys.exit(f'✗ {msg}')


def tracked():
    out = subprocess.run(['git', '-C', ROOT, 'ls-files', '-z', '--', *KEEP], capture_output=True, text=True, check=True).stdout
    return sorted(f for f in out.split('\0') if f and not any(f.startswith(d) for d in DROP))


def write(rel, text):
    path = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f: f.write(text)


def build(version):
    if not re.fullmatch(r'\d+\.\d+\.\d+', version): die(f'version must look like 1.0.0, not {version!r}')
    shutil.rmtree(OUT, ignore_errors=True)
    files = tracked()
    for f in files:
        dst = os.path.join(OUT, LIB, f)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(os.path.join(ROOT, f), dst)
    # the library's own setup script replaces the clone-and-update one: every guide points to it
    shutil.copy2(os.path.join(ROOT, 'tools', 'directory', 'library-setup.sh'), os.path.join(OUT, LIB, 'tools', 'setup.sh'))
    split_fetch()
    for dirpath, _, names in os.walk(os.path.join(OUT, LIB)):
        for n in names:
            p = os.path.join(dirpath, n)
            if not n.endswith(('.md', '.txt', '.py', '.sh', '.mjs', '.js')): continue
            s = open(p, encoding='utf-8').read()
            if SETUP_OLD in s:
                open(p, 'w', encoding='utf-8').write(s.replace(SETUP_OLD, 'tools/setup.sh'))
    for rel, old, new in EDITS:
        p = os.path.join(OUT, LIB, rel)
        s = open(p, encoding='utf-8').read()
        if s.count(old) != 1: die(f'{rel}: the text to replace is gone or not unique (update EDITS in tools/directory.py):\n  {old[:120]}')
        open(p, 'w', encoding='utf-8').write(s.replace(old, new))
    # plugin files
    src = os.path.join(ROOT, 'tools', 'directory')
    styles = sum(1 for f in files if f.endswith('/STYLE.md'))
    for name, rel in [('SKILL.md', 'skills/lemo-opuscar/SKILL.md'), ('README.md', 'README.md')]:
        write(rel, open(os.path.join(src, name), encoding='utf-8').read().replace('{STYLES}', str(styles)).replace('{VERSION}', version))
    os.makedirs(os.path.join(OUT, 'skills/lemo-opuscar/scripts'), exist_ok=True)
    shutil.copy2(os.path.join(src, 'setup.sh'), os.path.join(OUT, 'skills/lemo-opuscar/scripts/setup.sh'))
    shutil.copy2(os.path.join(src, 'SECURITY.md'), os.path.join(OUT, 'SECURITY.md'))
    shutil.copy2(os.path.join(ROOT, 'LICENSE'), os.path.join(OUT, 'LICENSE'))
    os.makedirs(os.path.join(OUT, '.claude-plugin'), exist_ok=True)
    shutil.copy2(os.path.join(src, ICON), os.path.join(OUT, '.claude-plugin', ICON))
    add_textures_pack()
    # setup.sh copies the library out again when this stamp changes: the version plus a hash of the library's files
    h = hashlib.sha256()
    for d, _, ns in sorted(os.walk(os.path.join(OUT, LIB))):
        for n in sorted(ns):
            p = os.path.join(d, n); h.update(os.path.relpath(p, OUT).encode()); h.update(open(p, 'rb').read())
    write(f'{LIB}/.edition', f'{version}-{h.hexdigest()[:12]}\n')
    plugin = {
        'name': 'lemo-opuscar',
        'displayName': 'Lemo-Opuscar',
        'version': version,
        'description': f'{styles} film styles, each with a short film made entirely in code. Pick a style, bring your own story, '
                       'and let Claude direct the film. No video model, no stock footage.',
        'author': {'name': 'Lemomo', 'url': 'https://github.com/lemomo-ai'},
        'homepage': REPO,
        'repository': REPO,
        'documentationUrl': f'{REPO}#how-to-use',                     # else the portal picks the first link in our README
        'privacyPolicyUrl': f'{REPO}/blob/directory/README.md#privacy-and-outside-services',
        'keywords': ['video', 'film', 'animation', 'motion-graphics', 'explainer', 'film-styles', 'code-generated-video'],
        'license': 'MIT',
        'icon': f'.claude-plugin/{ICON}',
    }
    write('.claude-plugin/plugin.json', json.dumps(plugin, indent=2, ensure_ascii=False) + '\n')
    check()
    total = sum(os.path.getsize(os.path.join(d, n)) for d, _, ns in os.walk(OUT) for n in ns)
    count = sum(len(ns) for _, _, ns in os.walk(OUT))
    print(f'✓ directory edition {version}: {count} files, {total / 2**20:.1f} MiB → {os.path.relpath(OUT, ROOT)}/')


def split_fetch():
    """Move the Python that tools/fetch.sh runs from a here-document into tools/fetch.py, and run that file instead."""
    sh = os.path.join(OUT, LIB, 'tools', 'fetch.sh')
    s = open(sh, encoding='utf-8').read()
    m = FETCH_HEREDOC.search(s)
    if not m or len(FETCH_HEREDOC.findall(s)) != 1: die('tools/fetch.sh: the here-document that runs its Python is gone (update split_fetch in tools/directory.py)')
    head = '# Downloads the asset packs named on the command line from the "assets" release; run by tools/fetch.sh.\n'
    with open(os.path.join(OUT, LIB, 'tools', 'fetch.py'), 'w', encoding='utf-8') as f: f.write(head + m.group(2))
    with open(sh, 'w', encoding='utf-8') as f: f.write(s[:m.start()] + '"$PY" ' + m.group(1) + 'tools/fetch.py $PACKS\n' + s[m.end():])


def add_textures_pack():
    """List the walnut textures pack in this edition's tools/assets.json, so `sh tools/fetch.sh textures` can get it."""
    p = os.path.join(OUT, LIB, 'tools', 'assets.json')
    man = json.load(open(p, encoding='utf-8'))
    if man['packs'].get('textures', TEXTURES) != TEXTURES: die('tools/assets.json has another `textures` pack (update TEXTURES in tools/directory.py)')
    man['packs']['textures'] = TEXTURES
    with open(p, 'w', encoding='utf-8') as f: f.write(json.dumps(man, indent=2, ensure_ascii=False) + '\n')


def check():
    """The directory's automatic checks that can be run here, plus our own rule: no personal info."""
    bad = []
    # the maintainer's home folder is read here at run time, so no name is written into this file
    pat = re.compile('|'.join([re.escape(os.path.expanduser('~')), r'[\w.+-]+@gmail\.com', r'/Users/', r'\.DS_Store']))
    for d, _, ns in os.walk(OUT):
        for n in ns:
            p = os.path.join(d, n); rel = os.path.relpath(p, OUT); size = os.path.getsize(p)
            if n in ('.DS_Store', 'Thumbs.db'): bad.append(f'{rel}: not allowed')
            if size >= 5 * 2**20: bad.append(f'{rel}: {size / 2**20:.1f} MiB (limit 5 MiB)')
            if size >= 256 * 2**10 and not n.endswith(('.jpg', '.jpeg', '.png', '.webp', '.svg', '.woff2', '.woff', '.ttf', '.otf')):
                bad.append(f'{rel}: {size // 1024} KiB, not an image or font (over 256 KiB goes to a reviewer)')
            if n.endswith(('.md', '.txt', '.py', '.sh', '.mjs', '.js', '.json')) and pat.search(open(p, encoding='utf-8').read()):
                bad.append(f'{rel}: personal info or a local path')
    if sum(len(ns) for _, _, ns in os.walk(OUT)) > 512: bad.append('more than 512 files')
    if bad: die('the directory edition fails a check:\n  ' + '\n  '.join(bad))


def sync(into):
    if not os.path.isdir(os.path.join(into, '.git')) and not os.path.isfile(os.path.join(into, '.git')):
        die(f'{into} is not a git worktree (git worktree add <dir> directory)')
    for name in os.listdir(into):
        if name == '.git': continue
        p = os.path.join(into, name)
        shutil.rmtree(p) if os.path.isdir(p) and not os.path.islink(p) else os.remove(p)
    shutil.copytree(OUT, into, dirs_exist_ok=True)
    print(f'✓ synced into {into}: review with git -C <dir> status, then commit')


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args or args[0].startswith('-'): die('usage: python3 tools/directory.py <version> [--into <worktree of the directory branch>]')
    if '--into' in args:
        i = args.index('--into')
        if i + 1 >= len(args): die('--into needs a folder')
        into = os.path.abspath(args[i + 1])
        # every release the directory publishes needs a higher version; --same-version only for fixes before the first publish
        old = os.path.join(into, '.claude-plugin', 'plugin.json')
        if os.path.exists(old) and '--same-version' not in args:
            have = json.load(open(old, encoding='utf-8'))['version']
            if tuple(map(int, args[0].split('.'))) <= tuple(map(int, have.split('.'))):
                die(f'the directory branch is at {have}: give a higher version (or --same-version for a fix that was never published)')
    build(args[0])
    if '--into' in args: sync(into)
