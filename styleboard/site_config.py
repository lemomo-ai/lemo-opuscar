# The site's settings in one place: what a fork or a renamed repository changes, and where this machine keeps what git doesn't.
# Read by styleboard/pages.py, home.py, media.py, serve.py, check_site.py and gallery.py, and by tools/films_repo.sh. (The README's
# Markdown, written by build.py, keeps its own SITE_URL beside the code that uses it.)
import json, os
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..'))

# ---------------------------------------------------------------- a fork or a new name changes these
REPO = 'lemomo-ai/lemo-opuscar'
REPO_URL = f'https://github.com/{REPO}'
SITE_URL = 'https://lemomo-ai.github.io/lemo-opuscar/'      # canonical links, hreflang, share cards, sitemap, JSON-LD
BASE_PATH = urlparse(SITE_URL).path                          # '/lemo-opuscar/': 404.html's <base> (Pages serves it at any depth), serve.py's prefix
FILMS_URL = f'{REPO_URL}/releases/download/films'            # full quality, for "1080p ↓"
THANKS_URL = f'{REPO_URL}/releases/download/thanks'          # the thank-you films at full quality
MEDIA_RELEASE = 'site-media'                                 # the release holding site-media.tar (tools/site_media.sh --upload)

# Where the pages load the 720p films from. The styles' demo films (one per style in styleboard/catalog.json) are too many for one Pages site
# (GitHub documents 1 GB per site), so they have a Pages site of their own: the films repository, which tools/films_repo.sh fills
# from the "web" cuts and which lists what it holds in styleboard/films_repo.json (check_site.py checks the pages against that list).
# OPUSCAR 98, the thank-you films and the rest of the "web" release stay inside the site, at SITE_FILMS (pages.yml downloads them).
# A base is a path inside the site ending in / or an absolute URL ending in /. To preview locally with the style films inside the
# site too:  OPUSCAR_FILMS_BASE=films/ python3 styleboard/build.py --site _site --films .release/web
FILMS_REPO = 'lemomo-ai/lemo-opuscar-films'
FILMS_REPO_URL = 'https://lemomo-ai.github.io/lemo-opuscar-films/'                    # the films repository's Pages site
FILMS_BASE = os.environ.get('OPUSCAR_FILMS_BASE') or FILMS_REPO_URL                    # the style films
SITE_FILMS = 'films/'                                                                  # every other film
FILMS_LIST = os.path.join(HERE, 'films_repo.json')                                      # what the films repository holds

# ---------------------------------------------------------------- this machine (each has an environment variable)
WEB = os.environ.get('OPUSCAR_WEB') or os.path.join(ROOT, '.release', 'web')     # the 720p cuts (tools/web_cuts.sh)
# The site's media (posters, stills, sprites, the long take; tools/site_media.sh packs them): until the site-media release
# exists, a folder on this machine (.release/ is ignored by git; a symlink does).
MEDIA = os.environ.get('OPUSCAR_SITE_MEDIA') or os.path.join(ROOT, '.release', 'site-media')
# the thank-you films' 1080p masters (promo/<id>/<id>.mp4, not in git): media.py cuts their posters at 1920 from them
PROMO = os.environ.get('OPUSCAR_PROMO') or os.path.join(ROOT, 'promo')


_STYLES = None


def is_style(fid):
    """a style's demo film (a slug in styleboard/catalog.json, as tools/films_repo.sh counts them), as opposed to OPUSCAR 98, a
    thank-you film or another film of the project"""
    global _STYLES
    if _STYLES is None: _STYLES = {s['slug'] for s in json.load(open(os.path.join(HERE, 'catalog.json'), encoding='utf-8'))}
    return fid in _STYLES


def films_base(fid):
    """the base a film loads from: FILMS_BASE for a style's film, SITE_FILMS for the others"""
    return FILMS_BASE if is_style(fid) else SITE_FILMS


def in_site(fid):
    """whether the film is served from inside the site (films/<fid>.mp4), not from an absolute URL"""
    return '//' not in films_base(fid)


def film_url(fid, root=''):
    """a 720p film's address on a page whose way back to the site's root is `root` ('', '../', '../../')"""
    base = films_base(fid)
    return (base if '//' in base else root + base) + fid + '.mp4'
