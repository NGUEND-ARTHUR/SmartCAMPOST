from __future__ import annotations

import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST_DIR = ROOT / "dist"
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "4173"))


class SpaRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
      super().__init__(*args, directory=str(DIST_DIR), **kwargs)

    def do_GET(self):
      path = self.path.split("?", 1)[0].split("#", 1)[0]
      candidate = (DIST_DIR / path.lstrip("/")).resolve()
      if path != "/" and not candidate.exists():
        self.path = "/index.html"
      return super().do_GET()

    def log_message(self, format, *args):
      return


if not DIST_DIR.exists():
  raise SystemExit(f"Missing build output directory: {DIST_DIR}")


server = ThreadingHTTPServer((HOST, PORT), SpaRequestHandler)
print(f"Serving {DIST_DIR} at http://{HOST}:{PORT}", flush=True)
server.serve_forever()