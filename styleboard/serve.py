# Local preview of the built site. Use this, not python3 -m http.server: films need byte ranges (http.server answers every request
# with the whole file, so a browser can't seek into a film it hasn't downloaded), any unknown address gets 404.html as on GitHub Pages,
# and the site's own path (/lemo-opuscar/…, from site_config.BASE_PATH) works too, which 404.html's <base> needs.
#   python3 styleboard/serve.py [port] [--dir _site] [--bind 127.0.0.1]      (port 8000 by default)
import argparse, http.server, io, os, re, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from site_config import BASE_PATH as PREFIX


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):                                         # the site's path on GitHub Pages works here too
        if path.startswith(PREFIX): path = path[len(PREFIX) - 1:]
        return super().translate_path(path)

    def send_head(self):
        rng = self.headers.get('Range')
        path = self.translate_path(self.path)
        nf = os.path.join(self.directory, '404.html')
        if not os.path.exists(path) and not os.path.exists(path.rstrip('/') + '/index.html') and os.path.exists(nf):
            body = open(nf, 'rb').read()                                   # as GitHub Pages does: any unknown address gets 404.html
            self.send_response(404); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            return io.BytesIO(body)
        if not rng or not os.path.isfile(path): return super().send_head()
        m = re.match(r'bytes=(\d*)-(\d*)$', rng.strip())
        size = os.path.getsize(path)
        if not m: return super().send_head()
        a, b = m.group(1), m.group(2)
        start, end = (int(a), int(b) if b else size - 1) if a else (max(0, size - int(b)), size - 1)
        if start >= size: self.send_error(416); return None
        end = min(end, size - 1)
        f = open(path, 'rb'); f.seek(start)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.send_header('Accept-Ranges', 'bytes')
        self.end_headers()
        self._left = end - start + 1
        return f

    def copyfile(self, src, dst):
        left = getattr(self, '_left', None)
        if left is None: return super().copyfile(src, dst)
        while left > 0:
            buf = src.read(min(1 << 16, left))
            if not buf: break
            try: dst.write(buf)
            except (BrokenPipeError, ConnectionResetError): break
            left -= len(buf)

    def end_headers(self):
        if not self.headers.get('Range'): self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def log_message(self, *a): pass


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('port', nargs='?', type=int, default=8000)
    ap.add_argument('--dir', default='_site', help='the built site (default: _site)')
    ap.add_argument('--bind', default='127.0.0.1')
    a = ap.parse_args()
    d = os.path.abspath(a.dir)
    if not os.path.isfile(os.path.join(d, 'index.html')): sys.exit(f'serve.py: no index.html in {d} (python3 styleboard/build.py --site {a.dir} …)')
    print(f'http://{a.bind}:{a.port}/  (also {PREFIX})  ← {d}')
    http.server.ThreadingHTTPServer((a.bind, a.port), lambda *x, **k: Handler(*x, directory=d, **k)).serve_forever()
