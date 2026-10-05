#!/usr/bin/env python3
"""Read exact committed blob bytes as a bounded base64 transport slice."""
import argparse
import base64
import hashlib
import pathlib
import re
import subprocess
import sys

p = argparse.ArgumentParser()
p.add_argument("--repo", required=True)
p.add_argument("--sha", required=True)
p.add_argument("--offset", type=int, required=True)
p.add_argument("--bytes", type=int, required=True)
p.add_argument("--expected-total", type=int, required=True)
args = p.parse_args()
assert re.fullmatch("[a-f0-9]{40}", args.sha)
assert args.offset >= 0 and args.offset % 3 == 0 and 0 < args.bytes <= 524286
raw = subprocess.run(["git", "-C", str(pathlib.Path(args.repo).resolve(strict=True)), "cat-file", "blob", args.sha], capture_output=True, check=True).stdout
assert len(raw) == args.expected_total
assert hashlib.sha1(f"blob {len(raw)}\0".encode() + raw).hexdigest() == args.sha
part = raw[args.offset:args.offset + args.bytes]
assert len(part) == min(args.bytes, len(raw) - args.offset)
sys.stdout.write(base64.b64encode(part).decode())
