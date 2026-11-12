#!/usr/bin/env python3
"""Generate one image with the Codex CLI's built-in image tool (image_gen), for the styles that draw with an image generator.

The library has no image model of its own. This script drives the user's Codex CLI, signed in to an account that can
generate images. A user with another image tool (an API, a web app, their own drawings) makes the images there from
the same prompts and saves them under the names the style's scripts expect; see core/README.md, "Image generation".

  gen_image.py --check
      Is the Codex CLI installed and signed in? Exit 0 if so, 4 if not. A film that needs images starts only after
      this passes or the user has said which other tool they will use. The first real image confirms that the account
      can generate images.
  gen_image.py "<prompt>" [--aspect 16:9] [--ref <image> ...] [--edit] [--out <dir>] [--name <base>]
               [--reasoning low] [--retries 1] [--timeout 480]
      Saves <out>/<name>_<date-time>.png and prints its path.

What it does:
- sends the prompt to `codex exec` on stdin (read-only sandbox), with every --ref image attached (-i), and an
  instruction to call image_gen once and do nothing else;
- takes the image from Codex's own records: depending on the Codex version it is written under
  $CODEX_HOME/generated_images/<thread>/ or embedded (base64) in the session log under $CODEX_HOME/sessions/; a token in
  the prompt finds this run's session; Codex is stopped once the image is there (it sometimes lingers);
- refuses a result that is a byte-for-byte copy of a reference, or smaller than 8 KB;
- with --aspect, puts the width:height at the top of the prompt and checks the result (5 % tolerance); a wrong ratio is
  retried, and if it is still wrong the image is kept as <name>_<date-time>_wrongaspect.png.

References:
- --ref adds a reference image (repeatable): a character or product sheet the new drawing must match. Composition is
  described in the prompt, never taken from a reference.
- --edit changes an existing image: the first --ref is the image to edit, the others are references.

Exit codes: 0 ok · 2 no image · 3 wrong aspect after the retries · 4 setup problem (no codex, not signed in, bad argument).
"""
import argparse
import base64
import glob
import hashlib
import json
import os
import signal
import subprocess
import sys
import time
from shutil import which

ONCE = ("Call image_gen exactly once. When it succeeds, reply DONE. When it fails, print the tool's error verbatim "
        "and stop. Do not run shell commands, do not look for or save files, do not print the image, do not retry.\n")
PREAMBLE = ("Use your built-in image generation tool (image_gen) to create one image.\n" + ONCE +
            "Any image attached with -i is a reference: match what the prompt says it is for (a character, a product, a "
            "drawing style); never copy its composition.\n\n")
EDIT_PREAMBLE = ("Use your built-in image generation tool (image_gen) to create one image.\n" + ONCE +
                 "The first attached image is the image to edit: change it as described below and keep everything "
                 "not mentioned exactly as it is. Any further attached images are references for the change (a "
                 "character or product sheet); never copy their layout.\n\n")
ASPECT_LINE = ("Required aspect ratio: {aspect} (width:height). Pick the landscape, portrait or square size that "
               "matches it, and fill the whole frame: no black or white borders, no frame, no letterboxing.\n\n")

MIN_BYTES = 8 * 1024
POLL_SEC = 2
ASPECT_TOL = 0.05
OTHER_TOOL = ("Or the user makes the images with another image tool they have (an image API or app, or their own "
              "drawings), from the same prompts and under the same file names (core/README.md, \"Image generation\"). "
              "Without any image generator, a film in a style marked ✦ cannot start.")
NO_CODEX = ("✗ codex not found: the Codex CLI is not installed here (or not on PATH). The styles marked ✦ draw with an "
            "image generator; to use Codex, the user installs the Codex CLI, signs in to an account that can generate "
            "images (`codex login`) and runs `gen_image.py --check` again. " + OTHER_TOOL)
NOT_SIGNED_IN = ("✗ {ver} is installed but not signed in. The user runs `codex login` (an account that can generate "
                 "images), then `gen_image.py --check` again. " + OTHER_TOOL)


class Parser(argparse.ArgumentParser):
    """A bad argument is a setup problem: exit 4, as documented (argparse's own 2 means "no image" here)."""

    def error(self, message):
        self.print_usage(sys.stderr)
        print(f"{self.prog}: error: {message}", file=sys.stderr)
        sys.exit(4)


def codex_home():
    return os.environ.get("CODEX_HOME", os.path.expanduser("~/.codex"))


def check():
    if which("codex") is None:
        print(NO_CODEX, file=sys.stderr)
        return 4
    ver = subprocess.run(["codex", "--version"], capture_output=True, text=True).stdout.strip()
    st = subprocess.run(["codex", "login", "status"], capture_output=True, text=True)
    if st.returncode != 0:
        print(NOT_SIGNED_IN.format(ver=ver or "codex"), file=sys.stderr)
        return 4
    print(f"✓ {ver}, signed in. The first image confirms the account can generate images.")
    return 0


def md5(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def parse_aspect(s):
    try:
        w, h = s.split(":")
        v = float(w) / float(h)
        if v > 0:
            return v
    except (ValueError, ZeroDivisionError):
        pass
    print(f"--aspect is width:height, e.g. 16:9, 2.35:1, 1:1; got {s}", file=sys.stderr)
    sys.exit(4)


def image_size(path):
    """(width, height) from the file header (PNG, JPEG, WebP), no Pillow needed; None if unreadable."""
    import struct
    with open(path, "rb") as f:
        head = f.read(64)
        if head[:8] == b"\x89PNG\r\n\x1a\n":
            return struct.unpack(">II", head[16:24])
        if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
            kind = head[12:16]
            if kind == b"VP8 ":
                w, h = struct.unpack("<HH", head[26:30])
                return w & 0x3FFF, h & 0x3FFF
            if kind == b"VP8L":
                b = head[21:25]
                return 1 + (((b[1] & 0x3F) << 8) | b[0]), 1 + (((b[3] & 0xF) << 10) | (b[2] << 2) | ((b[1] & 0xC0) >> 6))
            if kind == b"VP8X":
                return 1 + int.from_bytes(head[24:27], "little"), 1 + int.from_bytes(head[27:30], "little")
        if head[:2] == b"\xff\xd8":
            f.seek(2)
            while True:
                m = f.read(4)
                if len(m) < 4 or m[0] != 0xFF:
                    return None
                seg = struct.unpack(">H", m[2:4])[0]
                if m[1] in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                    h, w = struct.unpack(">HH", f.read(5)[1:5])
                    return w, h
                f.seek(seg - 2, 1)
    return None


def aspect_of(path):
    size = image_size(path)
    return size[0] / size[1] if size and size[1] else None


def find_result(start_ts, token):
    """The image this run produced (its session log carries the token), or None."""
    root = os.path.join(codex_home(), "sessions")
    found = None
    for f in sorted(glob.glob(os.path.join(root, "*", "*", "*", "rollout-*.jsonl")), key=os.path.getmtime):
        if os.path.getmtime(f) < start_ts - 5:
            continue
        try:
            with open(f, errors="ignore") as fh:
                text = fh.read()
        except OSError:
            continue
        if token not in text:
            continue
        for line in text.splitlines():
            if "image_gen" not in line and "image_generation_call" not in line:
                continue
            try:
                ev = json.loads(line).get("payload", {})
            except json.JSONDecodeError:
                continue
            item = ev.get("item", {})
            if item.get("status") == "completed":          # written to generated_images/<thread>/<item>.png
                png = os.path.join(codex_home(), "generated_images", ev.get("thread_id", ""), item.get("id", "") + ".png")
                if os.path.isfile(png):
                    with open(png, "rb") as src:
                        found = src.read()
            if ev.get("type") == "image_generation_call" and ev.get("status") == "completed" and ev.get("result"):
                try:
                    found = base64.b64decode(ev["result"])  # embedded in the session log
                except (ValueError, TypeError):
                    pass
    return found


def run_once(cmd, prompt, token, logpath, timeout):
    """One codex run; returns (image bytes or None, the end of Codex's output)."""
    start = time.time()
    with open(logpath, "w") as log:
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=log, stderr=log, text=True, start_new_session=True)
        try:
            p.stdin.write(prompt)
            p.stdin.close()
        except BrokenPipeError:
            pass
        data = None
        while time.time() - start < timeout:
            data = find_result(start, token)
            if data or p.poll() is not None:
                break
            time.sleep(POLL_SEC)
        if p.poll() is None:
            try:
                os.killpg(os.getpgid(p.pid), signal.SIGKILL)
            except (ProcessLookupError, PermissionError):
                p.kill()
    data = data or find_result(start, token)
    try:
        with open(logpath) as f:
            tail = f.read().strip()[-800:]
        os.remove(logpath)
    except OSError:
        tail = ""
    return data, tail


def main():
    ap = Parser(description="Generate one image with the Codex CLI (see the docstring).")
    ap.add_argument("prompt", nargs="?")
    ap.add_argument("--check", action="store_true", help="is the Codex CLI installed and signed in?")
    ap.add_argument("--aspect", help="width:height, e.g. 16:9, 2.35:1, 1:1; stated in the prompt and checked")
    ap.add_argument("--ref", action="append", default=[], help="reference image (repeatable)")
    ap.add_argument("--edit", action="store_true", help="edit the first --ref; the others are references")
    ap.add_argument("--out", default=".")
    ap.add_argument("--name", default="image", help="file name base, e.g. char_ref")
    ap.add_argument("--reasoning", default="low", help="Codex reasoning effort (low is enough; medium for complex layouts)")
    ap.add_argument("--retries", type=int, default=1)
    ap.add_argument("--timeout", type=int, default=480, help="seconds per attempt")
    a = ap.parse_args()

    if a.check:
        return check()
    if not a.prompt:
        ap.error("a prompt is needed (or --check)")
    if which("codex") is None:
        print(NO_CODEX, file=sys.stderr)
        return 4
    want = parse_aspect(a.aspect) if a.aspect else None
    refs = [os.path.abspath(r) for r in a.ref]
    for r in refs:
        if not os.path.isfile(r):
            print(f"reference not found: {r}", file=sys.stderr)
            return 4
    if a.edit and not refs:
        print("--edit needs the image to edit as the first --ref", file=sys.stderr)
        return 4

    os.makedirs(a.out, exist_ok=True)
    target = os.path.abspath(os.path.join(a.out, f"{a.name}_{time.strftime('%Y%m%d-%H%M%S')}.png"))
    head = (EDIT_PREAMBLE if a.edit else PREAMBLE) + (ASPECT_LINE.format(aspect=a.aspect) if a.aspect else "")
    cmd = ["codex", "exec", "--skip-git-repo-check", "--sandbox", "read-only", "-c", f"model_reasoning_effort={a.reasoning}"]
    for r in refs:
        cmd += ["-i", r]   # the prompt goes on stdin: -i takes several values and would swallow a prompt after it
    ref_sums = {md5(r) for r in refs}

    last, wrong = "", None
    for attempt in range(a.retries + 1):
        token = f"RUN-{os.getpid()}-{int(time.time() * 1000)}"
        prompt = head + a.prompt + f"\n\n(job {token}; ignore this line)"
        data, tail = run_once(cmd, prompt, token, target + ".log", a.timeout)
        if data and len(data) >= MIN_BYTES:
            with open(target, "wb") as f:
                f.write(data)
            if md5(target) in ref_sums:
                tail += "\nthe result is a copy of a reference; retrying"
                os.remove(target)
            elif want is not None and (got := aspect_of(target)) is not None and abs(got / want - 1) > ASPECT_TOL:
                wrong = target.replace(".png", "_wrongaspect.png")
                os.replace(target, wrong)
                tail += f"\naspect {got:.3f} is not {a.aspect} ({want:.3f} ± 5 %); kept as {wrong}"
            else:
                print(target)
                return 0
        elif data:
            tail += f"\nthe result is too small ({len(data)} bytes) to be an image"
        last = tail.strip()[-800:]
        if attempt < a.retries:
            time.sleep(4 * (attempt + 1))

    if wrong and os.path.isfile(wrong):
        print(f"still the wrong aspect after the retries; the image is kept at {wrong} (crop it, or change the prompt).\n"
              f"End of Codex's output:\n{last}", file=sys.stderr)
        return 3
    print(f"no image from Codex. End of its output:\n{last}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
