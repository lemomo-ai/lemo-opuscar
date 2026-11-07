#!/usr/bin/env python3
"""Footage search, download and source records (standard library only).

Run inside the demo folder; records go to SOURCES.jsonl in the current folder, then `md` generates SOURCES.md.

  python3 footage.py search archive "hindenburg newsreel"      # Internet Archive
  python3 footage.py search commons "honeybee" --type video    # Wikimedia Commons（video / image / any）
  python3 footage.py search nasa "launch pad camera" --type video
  python3 footage.py files archive:<identifier>                # list the files of an Archive item

  python3 footage.py fetch archive:<identifier>[/<filename>] --name hind_a
  python3 footage.py fetch commons:"File:Xxx.webm" --name bee1
  python3 footage.py fetch nasa:<nasa_id> --name pad
  python3 footage.py fetch https://tile.loc.gov/...jpg --name fsa1 \
      --page https://www.loc.gov/item/... --license "No known restrictions (LOC)" --credit "Dorothea Lange, FSA"

  python3 footage.py used hind_a "12.0-15.5 s → in the film 3.2-5.0 s"
  python3 footage.py md                                        # generate SOURCES.md

fetch tries to record the licence, author and source page automatically; fill in whatever it can't get with --license/--credit/--page.
Don't use material whose licence is unclear. loc.gov's search page is blocked by Cloudflare: find items with WebSearch,
and download files directly from tile.loc.gov; many Library of Congress and National Archives files are also mirrored on Commons.
"""
import argparse, json, os, re, subprocess, sys, time, urllib.parse, urllib.request
from pathlib import Path

UA = "lemo-opuscar/1.0 (https://github.com/lemomo-ai/lemo-opuscar)"
LOG = Path("SOURCES.jsonl")


def get(url, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def getjson(url):
    return json.loads(get(url).decode("utf-8", "replace"))


def strip_html(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


# ---------- search ----------

def search_archive(q, n, kind):
    mt = {"video": " AND mediatype:(movies)", "image": " AND mediatype:(image)"}.get(kind, "")
    url = ("https://archive.org/advancedsearch.php?" + urllib.parse.urlencode(
        {"q": f"({q}){mt}", "rows": n, "output": "json"}) +
        "&fl[]=identifier&fl[]=title&fl[]=year&fl[]=licenseurl&fl[]=collection")
    for d in getjson(url)["response"]["docs"]:
        col = d.get("collection"); col = ",".join(col) if isinstance(col, list) else col
        print(f"archive:{d['identifier']}\t{d.get('year','')}\t{d.get('title','')[:80]}\t[{col}] {d.get('licenseurl','')}")


def search_commons(q, n, kind):
    ft = {"video": " filetype:video", "image": " filetype:bitmap"}.get(kind, "")
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "generator": "search", "gsrsearch": q + ft, "gsrnamespace": 6,
        "gsrlimit": n, "prop": "imageinfo", "iiprop": "size|mime|extmetadata", "format": "json"})
    pages = getjson(url).get("query", {}).get("pages", {})
    for p in sorted(pages.values(), key=lambda p: p.get("index", 0)):
        ii = (p.get("imageinfo") or [{}])[0]; em = ii.get("extmetadata", {})
        lic = em.get("LicenseShortName", {}).get("value", "?")
        dur = f"{ii.get('duration', 0):.0f}s " if ii.get("duration") else ""
        print(f"commons:\"{p['title']}\"\t{ii.get('width')}x{ii.get('height')} {dur}{ii.get('mime','')}\t{lic}")


def search_nasa(q, n, kind):
    mt = {"video": "video", "image": "image"}.get(kind, "image,video")
    url = "https://images-api.nasa.gov/search?" + urllib.parse.urlencode(
        {"q": q, "media_type": mt, "page_size": n})
    for it in getjson(url)["collection"]["items"][:n]:
        d = it["data"][0]
        print(f"nasa:{d['nasa_id']}\t{d.get('date_created','')[:10]}\t{d.get('media_type')}\t{d.get('title','')[:80]}")


def archive_files(ident):
    md = getjson(f"https://archive.org/metadata/{ident}")
    return md, [f for f in md.get("files", []) if f.get("source") in ("original", "derivative")]


# ---------- fetch ----------

def resolve(src):
    """Return (download URL, automatically recorded metadata)."""
    meta = {"input": src}
    if src.startswith("archive:"):
        ident, _, fname = src[8:].partition("/")
        md, files = archive_files(ident)
        m = md.get("metadata", {})
        if not fname:
            vids = [f for f in files if f["name"].lower().endswith((".mp4", ".mpeg4", ".m4v", ".mov", ".ogv", ".mkv"))]
            if not vids:
                imgs = [f for f in files if f["name"].lower().endswith((".jpg", ".jpeg", ".png", ".tif", ".tiff"))]
                vids = imgs
            if not vids:
                sys.exit("no video or image file in this item; list them with `files` and name one")
            vids.sort(key=lambda f: int(f.get("size", 0) or 0), reverse=True)
            fname = vids[0]["name"]
        meta.update(page=f"https://archive.org/details/{ident}", title=m.get("title"),
                    date=m.get("date") or m.get("year"), credit=m.get("creator"),
                    license=m.get("licenseurl") or m.get("rights") or "", file=fname)
        return f"https://archive.org/download/{ident}/{urllib.parse.quote(fname)}", meta
    if src.startswith("commons:"):
        title = src[8:].strip('"')
        if not title.startswith("File:"):
            title = "File:" + title
        url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
            "action": "query", "titles": title, "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata", "format": "json"})
        p = next(iter(getjson(url)["query"]["pages"].values()))
        if "imageinfo" not in p:
            sys.exit(f"not found on Commons: {title}")
        ii = p["imageinfo"][0]; em = ii.get("extmetadata", {})
        v = lambda k: strip_html(em.get(k, {}).get("value", ""))
        meta.update(page=ii.get("descriptionurl"), title=title, date=v("DateTimeOriginal"),
                    credit=v("Artist") or v("Credit"), license=v("LicenseShortName"),
                    license_url=v("LicenseUrl"), attribution_required=v("AttributionRequired"))
        return ii["url"], meta
    if src.startswith("nasa:"):
        nid = src[5:]
        items = [i["href"] for i in getjson(f"https://images-api.nasa.gov/asset/{urllib.parse.quote(nid)}")["collection"]["items"]]
        pick = None
        for pref in ("~orig.mp4", "~large.mp4", "~medium.mp4", "~orig.mov", "~orig.jpg", "~orig.png", "~large.jpg"):
            pick = next((h for h in items if h.endswith(pref)), None)
            if pick:
                break
        if not pick:
            sys.exit("no mp4/jpg in the NASA item:\n" + "\n".join(items[:20]))
        d = getjson(f"https://images-api.nasa.gov/search?nasa_id={urllib.parse.quote(nid)}")["collection"]["items"]
        d = d[0]["data"][0] if d else {}
        meta.update(page=f"https://images.nasa.gov/details/{nid}", title=d.get("title"),
                    date=(d.get("date_created") or "")[:10], credit=d.get("center") and f"NASA {d['center']}",
                    license="NASA media, generally not copyrighted (images.nasa.gov guidelines)")
        return pick.replace("http://", "https://"), meta
    return src, meta


def download(url, dest, max_mb):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
        total = int(r.headers.get("Content-Length") or 0)
        if total and total > max_mb * 1e6:
            f.close(); os.remove(dest)
            sys.exit(f"file is {total/1e6:.0f} MB, over --max-mb {max_mb}; raise it if you really need it")
        got, last = 0, time.time()
        while True:
            b = r.read(1 << 20)
            if not b:
                break
            f.write(b); got += len(b)
            if time.time() - last > 15:
                print(f"  … {got/1e6:.0f} MB", file=sys.stderr); last = time.time()


def probe(path):
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                              "stream=codec_type,width,height,r_frame_rate:format=duration",
                              "-of", "json", str(path)], capture_output=True, text=True).stdout
        j = json.loads(out); v = next((s for s in j.get("streams", []) if s["codec_type"] == "video"), {})
        has_a = any(s["codec_type"] == "audio" for s in j.get("streams", []))
        return {"w": v.get("width"), "h": v.get("height"), "fps": v.get("r_frame_rate"),
                "dur": float(j.get("format", {}).get("duration") or 0) or None, "audio": has_a}
    except Exception:
        return {}


def cmd_fetch(a):
    url, meta = resolve(a.src)
    ext = Path(urllib.parse.urlparse(url).path).suffix.lower() or ".bin"
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    dest = out / f"{a.name}{ext}"
    if dest.exists() and not a.force:
        print(f"already there: {dest} (--force downloads it again)")
    else:
        print(f"downloading {url}", file=sys.stderr)
        download(url, dest, a.max_mb)
    for k in ("page", "license", "credit", "date", "title"):
        if getattr(a, k):
            meta[k] = getattr(a, k)
    rec = {"name": a.name, "file": str(dest), "url": url, **meta, **probe(dest),
           "note": a.note or "", "used": [], "fetched": time.strftime("%Y-%m-%d %H:%M")}
    recs = [r for r in load() if r["name"] != a.name] + [rec]
    save(recs)
    print(json.dumps({k: rec.get(k) for k in ("file", "w", "h", "dur", "audio", "license", "credit", "page")},
                     ensure_ascii=False))
    if not rec.get("license"):
        print("⚠ no licence information found: add it with --license, and if the licence is unclear, don't use it", file=sys.stderr)


def load():
    return [json.loads(l) for l in LOG.read_text().splitlines() if l.strip()] if LOG.exists() else []


def save(recs):
    LOG.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in recs))


def cmd_used(a):
    recs = load()
    for r in recs:
        if r["name"] == a.name:
            r.setdefault("used", []).append(a.span); save(recs); return
    sys.exit(f"{a.name} is not in SOURCES.jsonl")


def cmd_md(a):
    rows = ["# Sources", "", "Generated by `footage.py md` from SOURCES.jsonl. Every piece of footage used in the film is listed here.", "",
            "| Name | Title / author / date | Licence | Source page | Spec | Seconds used |", "|---|---|---|---|---|---|"]
    for r in load():
        spec = f"{r.get('w') or ''}×{r.get('h') or ''}" + (f" {r['dur']:.1f}s" if r.get("dur") else "")
        who = " / ".join(str(x) for x in (r.get("title"), r.get("credit"), r.get("date")) if x)
        cell = lambda s: str(s or "").replace("|", "\\|").replace("\n", " ")
        rows.append(f"| {r['name']} | {cell(who)} | {cell(r.get('license'))} | {cell(r.get('page') or r.get('url'))} "
                    f"| {spec} | {cell('; '.join(r.get('used', [])) or 'not marked')} |")
    Path("SOURCES.md").write_text("\n".join(rows) + "\n")
    print("wrote SOURCES.md")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    s = sp.add_parser("search"); s.add_argument("source", choices=["archive", "commons", "nasa"])
    s.add_argument("query"); s.add_argument("-n", type=int, default=15)
    s.add_argument("--type", default="any", choices=["any", "video", "image"])
    f = sp.add_parser("files"); f.add_argument("src")
    g = sp.add_parser("fetch"); g.add_argument("src"); g.add_argument("--name", required=True)
    g.add_argument("--out", default="raw"); g.add_argument("--max-mb", type=float, default=800)
    g.add_argument("--force", action="store_true")
    for k in ("page", "license", "credit", "date", "title", "note"):
        g.add_argument("--" + k)
    u = sp.add_parser("used"); u.add_argument("name"); u.add_argument("span")
    sp.add_parser("md")
    a = ap.parse_args()
    if a.cmd == "search":
        {"archive": search_archive, "commons": search_commons, "nasa": search_nasa}[a.source](a.query, a.n, a.type)
    elif a.cmd == "files":
        _, files = archive_files(a.src.removeprefix("archive:"))
        for fl in files:
            print(f"{fl['name']}\t{int(fl.get('size', 0) or 0)/1e6:.1f} MB\t{fl.get('format','')}")
    elif a.cmd == "fetch":
        cmd_fetch(a)
    elif a.cmd == "used":
        cmd_used(a)
    else:
        cmd_md(a)


if __name__ == "__main__":
    main()
