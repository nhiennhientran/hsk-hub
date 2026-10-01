"""Serve the unpublished HSK review package. No dependencies or uploads."""
from __future__ import annotations
import argparse
import http.server
import re
import os
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
    def send_head(self):
        file=Path(self.translate_path(self.path))
        if file.is_dir():file=file/'index.html'
        try:
            stream=file.open('rb');size=os.fstat(stream.fileno()).st_size
        except OSError:
            self.send_error(404,'File not found');return None
        first,last,status=0,size-1,200
        value=self.headers.get('Range')
        if value:
            match=re.fullmatch(r'bytes=(\d*)-(\d*)',value)
            if match and (match[1] or match[2]):
                first=int(match[1]) if match[1] else max(0,size-int(match[2]))
                last=min(last,int(match[2])) if match[1] and match[2] else last
            if not match or not (match[1] or match[2]) or first>last or first>=size:
                stream.close();self.send_response(416);self.send_header('Content-Range',f'bytes */{size}');self.end_headers();return None
            status=206
        self.send_response(status);self.send_header('Content-Type',self.guess_type(str(file)))
        self.send_header('Accept-Ranges','bytes');self.send_header('Content-Length',str(max(0,last-first+1)))
        if status==206:self.send_header('Content-Range',f'bytes {first}-{last}/{size}')
        self.end_headers();stream.seek(first);self.remaining=max(0,last-first+1);return stream
    def copyfile(self,source,outputfile):
        remaining=self.remaining
        while remaining:
            block=source.read(min(65536,remaining))
            if not block:break
            outputfile.write(block);remaining-=len(block)
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
