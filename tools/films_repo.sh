#!/bin/sh
# The films repository (styleboard/site_config.py: FILMS_REPO, served by its own GitHub Pages at FILMS_BASE): the styles' 720p demo
# films, which the site's pages play. They are too many for the site itself (GitHub Pages documents 1 GB per site); OPUSCAR 98 and
# the thank-you films stay in the site. Run it after tools/publish.sh, which makes the web cuts (tools/web_cuts.sh, .release/web).
# It copies the web cut of every style with a film (styleboard/catalog.json) into a local checkout of the repository, removes the
# films of styles that are gone, writes the repository's README.md, LICENSE, .nojekyll and .gitignore, and writes
# styleboard/films_repo.json here: what the repository holds, which check_site.py checks the pages against (commit it).
#   sh tools/films_repo.sh [DIR]          sync into DIR (default ../lemo-opuscar-films beside this repository: a clone of the
#                                         repository, or a new folder; a relative DIR is taken from where you run the script)
#   sh tools/films_repo.sh --push [DIR]   the same, then commit and push DIR (a clone of the repository); it prints what goes first
# Nothing is pushed without --push. Push the films repository before main, so the site never plays a film that isn't there yet.
set -e
CALLER=$(pwd)
cd "$(dirname "$0")/.."
PUSH=0; DIR=""
while [ $# -gt 0 ]; do
  case "$1" in
    --push) PUSH=1; shift ;;
    -*) sed -n '2,11p' tools/films_repo.sh; exit 2 ;;
    *) [ -z "$DIR" ] || { sed -n '2,11p' tools/films_repo.sh; exit 2; }; DIR=$1; shift ;;
  esac
done
if [ -z "$DIR" ]; then DIR="$(cd .. && pwd)/lemo-opuscar-films"; else case "$DIR" in /*) ;; *) DIR="$CALLER/$DIR" ;; esac; fi
command -v python3 >/dev/null || { echo "✗ python3 is needed to run this script"; exit 1; }
REPO=$(python3 -c 'import sys; sys.dont_write_bytecode = True; sys.path.insert(0, "styleboard"); import site_config; print(site_config.FILMS_REPO)')

# DIR is a new or plain folder outside any git checkout, or a clone of the films repository (origin names FILMS_REPO). Anything
# else (this repository, a clone of it, a folder inside a checkout) is refused before anything is written.
# check_dir [push]: with "push", DIR must be that clone.
check_dir() {
  probe=$DIR; [ -d "$probe" ] || probe=$(dirname "$DIR")
  [ -d "$probe" ] || { echo "✗ no folder $probe"; exit 1; }
  top=$(git -C "$probe" rev-parse --show-toplevel 2>/dev/null || true)
  if [ -z "$top" ]; then
    [ "$1" != push ] || { echo "✗ $DIR is not a git checkout: clone https://github.com/$REPO there first"; exit 1; }
    return 0
  fi
  top=$(cd "$top" && pwd -P)
  here=""; [ -d "$DIR" ] && here=$(cd "$DIR" && pwd -P)
  [ "$top" = "$here" ] || { echo "✗ $DIR is inside the git checkout $top: give a clone of $REPO, or a folder outside any checkout"; exit 1; }
  origin=$(git -C "$top" remote get-url origin 2>/dev/null || true)
  case "$origin" in
    *[:/]"$REPO"|*[:/]"$REPO".git|*[:/]"$REPO"/) ;;
    *) echo "✗ $DIR is a git checkout of ${origin:-a repository without an origin}, not of $REPO"; exit 1 ;;
  esac
}
if [ "$PUSH" = 1 ]; then check_dir push; else check_dir; fi   # with --push, refuse a plain folder before copying 860 MB into it
mkdir -p "$DIR"
DIR=$(cd "$DIR" && pwd -P)

python3 -X utf8 - "$DIR" <<'PY'
import hashlib, json, os, shutil, sys
sys.dont_write_bytecode = True
sys.path.insert(0, 'styleboard')
import site_config as C

dest = sys.argv[1]
catalog = json.load(open('styleboard/catalog.json', encoding='utf-8'))
slugs = sorted(s['slug'] for s in catalog if s.get('dur', 0) > 0 and C.is_style(s['slug']))
if not slugs: sys.exit('✗ styleboard/catalog.json lists no style with a film (python3 styleboard/build.py on a machine with the films)')
missing = [s for s in slugs if not os.path.isfile(os.path.join(C.WEB, s + '.mp4'))]
if missing: sys.exit(f'✗ no web cut in {C.WEB} for {len(missing)} styles: {", ".join(missing[:10])}{" …" if len(missing) > 10 else ""} (sh tools/web_cuts.sh)')


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''): h.update(b)
    return h.hexdigest()


def same(a, b):
    if not os.path.isfile(b) or os.path.getsize(a) != os.path.getsize(b): return False
    with open(a, 'rb') as x, open(b, 'rb') as y:
        while True:
            p, q = x.read(1 << 20), y.read(1 << 20)
            if p != q: return False
            if not p: return True


added, changed, removed = [], [], []
for f in os.listdir(dest):
    if f.endswith('.mp4.part'): os.remove(os.path.join(dest, f))   # left by a run of this script that was stopped
for s in slugs:
    src, dst = os.path.join(C.WEB, s + '.mp4'), os.path.join(dest, s + '.mp4')
    if same(src, dst): continue
    (changed if os.path.exists(dst) else added).append(s)
    shutil.copyfile(src, dst + '.part'); os.replace(dst + '.part', dst)
for f in sorted(os.listdir(dest)):
    if f.endswith('.mp4') and f[:-4] not in slugs: os.remove(os.path.join(dest, f)); removed.append(f[:-4])

open(os.path.join(dest, '.nojekyll'), 'w').close()   # Pages serves the files as they are
open(os.path.join(dest, '.gitignore'), 'w').write('.DS_Store\n._*\nThumbs.db\ndesktop.ini\n*.part\n')
shutil.copyfile(os.path.join('LICENSES', 'CC-BY-4.0.txt'), os.path.join(dest, 'LICENSE'))
cat = {s['slug']: s['en'] for s in catalog}
VOICE = ['chalkboard', 'circuit-board', 'desktop-flythrough', 'isometric-picture-book', 'printed-long-take', 'news-package']   # LICENSE
voice = ', '.join(f'{cat[v]} (`{v}.mp4`)' for v in VOICE[:-1]) + f' and {cat[VOICE[-1]]} (`{VOICE[-1]}.mp4`)'
lic = f'{C.REPO_URL}/blob/main/LICENSE'
readme = f'''# Lemo-Opuscar films

The 720p demo films of the {len(slugs)} styles in [Lemo-Opuscar]({C.REPO_URL}), one per style, named after the style's folder (`<slug>.mp4` for `styles/<slug>/`). GitHub Pages serves them at `{C.FILMS_REPO_URL}<slug>.mp4` for the gallery, {C.SITE_URL}

They are made in the main repository and copied here by its `tools/films_repo.sh`: change them there, not here. The films at full quality are on the main repository's [films release]({C.REPO_URL}/releases/tag/films); each film's sources and credits are in `styles/<slug>/demo/CREDITS` there.

## Licence

The films are under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (its text: [LICENSE](LICENSE)), with the exceptions below. The main repository's [LICENSE]({lic}) is the one that counts: where this summary and it differ, it decides.

- Third-party material in them (footage, photographs, satellite imagery, maps, data, models, music) keeps its own licence, named in the film's `CREDITS`.
- The narration of six films, {voice}, is under no licence here: don't extract it or reuse it. Those films may still be shared whole, as published.
- Clawd, Anthropic's character (for example in Mascot Screencast), and third-party product interfaces, names, logos and trademarks are not licensed here.

Credit "Lemo-Opuscar by Lemomo (LemoLab)", with a link to {C.REPO_URL} and to the licence, and say if you changed the film. For the two styles contributed from outside, name their author too: "Memphis Diorama by EianLu, in Lemo-Opuscar by Lemomo (LemoLab)" and "Crayon World 3D by 2nd1st, in Lemo-Opuscar by Lemomo (LemoLab)".
'''
open(os.path.join(dest, 'README.md'), 'w', encoding='utf-8').write(readme)

held = {s: {'bytes': os.path.getsize(os.path.join(dest, s + '.mp4')), 'sha256': sha(os.path.join(dest, s + '.mp4'))} for s in slugs}
body = ',\n'.join(f'  {json.dumps(s)}: {json.dumps(v)}' for s, v in held.items())
open(C.FILMS_LIST, 'w', encoding='utf-8').write(f'{{"repo": {json.dumps(C.FILMS_REPO)}, "base": {json.dumps(C.FILMS_REPO_URL)}, "films": {{\n{body}\n}}}}\n')
mb = sum(v['bytes'] for v in held.values()) / 1e6
print(f'✓ {dest}: {len(slugs)} style films, {mb:.0f} MB ({len(added)} added, {len(changed)} changed, {len(removed)} removed)')
for k, v in (('added', added), ('changed', changed), ('removed', removed)):
    if v: print(f'  {k}: {", ".join(v)}')
print(f'✓ {os.path.relpath(C.FILMS_LIST)}: what the films repository holds (commit it)')
if mb > 900: print(f'! {mb:.0f} MB: GitHub Pages documents 1 GB per site, and this one is close to it')
PY

if [ "$PUSH" = 0 ]; then
  echo "Next: check $DIR, then push it before main:  sh tools/films_repo.sh --push \"$DIR\""
  exit 0
fi
check_dir push
remote=$(git -C "$DIR" remote get-url origin)
branch=$(git -C "$DIR" symbolic-ref --short HEAD)
# only what this script writes: the films (with the removed ones), README.md, LICENSE, .nojekyll, .gitignore
git -C "$DIR" add -- README.md LICENSE .nojekyll .gitignore
git -C "$DIR" add -A -- '*.mp4'
if ! git -C "$DIR" diff --cached --quiet; then
  git -C "$DIR" commit -q -m "Films from lemo-opuscar $(git rev-parse --short HEAD)"
fi
git -C "$DIR" rev-parse -q --verify HEAD >/dev/null || { echo "✓ $DIR has nothing to push"; exit 0; }
# what origin lacks (also commits left by a push that failed): ahead of origin/<branch>, or everything when it has none yet
if git -C "$DIR" rev-parse -q --verify "refs/remotes/origin/$branch" >/dev/null; then
  ahead=$(git -C "$DIR" rev-list --count "origin/$branch..HEAD")
  [ "$ahead" -gt 0 ] || { echo "✓ $DIR has nothing to push: origin/$branch has it all"; exit 0; }
  echo "Pushing $ahead commit(s) to $remote ($branch):"
  git -C "$DIR" log --oneline "origin/$branch..HEAD" | head -n 10
  git -C "$DIR" diff --stat "origin/$branch..HEAD" | tail -n 40
else
  echo "Pushing $branch to $remote for the first time:"
  git -C "$DIR" log --oneline | head -n 10
  git -C "$DIR" show --stat --format= HEAD | tail -n 5
fi
git -C "$DIR" push -u origin "$branch"
echo "✓ pushed. GitHub Pages serves the films a few minutes later (the first deployment of a new repository can take longer):"
echo "  curl -sI $(python3 -c 'import sys; sys.dont_write_bytecode = True; sys.path.insert(0, "styleboard"); import site_config; print(site_config.FILMS_REPO_URL)')woodcut.mp4   → 200, video/mp4"
echo "  Then commit styleboard/films_repo.json and push main."
