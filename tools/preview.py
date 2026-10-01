"""Serve the unpublished HSK review package. No dependencies or uploads."""
from __future__ import annotations
import argparse
import http.server
from pathlib import Path
import threading
import urllib.parse
import webbrowser
ROOT=Path(__file__).resolve().parents[1]
PREFIX='/hsk-hub/'
class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self,path:str)->str:
        route=urllib.parse.unquote(urllib.parse.urlsplit(path).path)
        if not route.startswith(PREFIX):return str(ROOT/'__not_found__')
        parts=route[len(PREFIX):].split('/')
        if any(part.startswith('.') for part in parts if part):return str(ROOT/'__not_found__')
        target=(ROOT/'/'.join(parts)).resolve()
        try:target.relative_to(ROOT)
        except ValueError:return str(ROOT/'__not_found__')
        return str(target)
    def list_directory(self,path:str):
        self.send_error(403,'Directory listing is disabled');return None
    def end_headers(self)->None:
        self.send_header('Cache-Control','no-store');super().end_headers()
def main()->None:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port',type=int,default=18768)
    parser.add_argument('--lan',action='store_true',help='Allow local-network devices; do not expose to the Internet')
    parser.add_argument('--no-open',action='store_true')
    args=parser.parse_args()
    if not 1<=args.port<=65535:parser.error('port must be 1..65535')
    try:server=http.server.ThreadingHTTPServer(('0.0.0.0' if args.lan else '127.0.0.1',args.port),Handler)
    except OSError as exc:raise SystemExit(f'Cannot start preview on port {args.port}: {exc}. Close the other preview or choose --port.') from exc
    url=f'http://127.0.0.1:{args.port}/hsk-hub/new-hsk1/hsk1/index.html'
    print('Unpublished HSK1 review. Production is unchanged.',flush=True);print(url,flush=True)
    print(f'Human review: http://127.0.0.1:{args.port}/hsk-hub/tools/review/hsk1-listening-device-review.html',flush=True)
    if args.lan:print('Use this computer\'s LAN IPv4 address on the phone; do not forward this port to the Internet.',flush=True)
    print('Keep this terminal open. Press Ctrl+C to stop.',flush=True)
    if not args.no_open:threading.Timer(0.5,lambda:webbrowser.open(url)).start()
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
if __name__=='__main__':main()
