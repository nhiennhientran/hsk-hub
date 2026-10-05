#!/usr/bin/env python3
"""Validate one immutable owner stage and make a byte-exact upload capsule.

No index, refs, commits or network are changed by this program.
"""
import argparse
import hashlib
import json
import pathlib
import re
import subprocess
import sys


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def git_blob_sha(data):
    return hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest()


def git(repo, *args):
    result = subprocess.run(["git", "-C", str(repo), *args], capture_output=True, check=True)
    return result.stdout


def safe_path(repo, value):
    if not isinstance(value, str) or not value or "\0" in value or "\n" in value or "\r" in value:
        raise ValueError("Unsafe artifact path")
    relative = pathlib.PurePosixPath(value)
    if relative.is_absolute() or ".." in relative.parts:
        raise ValueError(f"Non-repository-relative artifact path: {value}")
    path = repo / relative
    resolved = path.resolve(strict=True)
    if not resolved.is_relative_to(repo) or path.is_symlink():
        raise ValueError(f"Artifact leaves repository or is symlink: {value}")
    if not path.is_file():
        raise ValueError(f"Artifact is not a regular file: {value}")
    return path


def frozen_rows(document):
    rows = document.get("files", document.get("entries"))
    if not isinstance(rows, list) or not rows:
        raise ValueError("Freeze must declare non-empty files or entries list")
    result = []
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("Invalid freeze entry")
        path = row.get("file", row.get("path"))
        digest = row.get("sha256", row.get("sha256Hex"))
        size = row.get("bytes", row.get("size"))
        if not isinstance(path, str) or not re.fullmatch(r"[0-9a-f]{64}", str(digest)):
            raise ValueError("Freeze entry lacks exact path/SHA256")
        if not isinstance(size, int) or isinstance(size, bool) or size < 0:
            raise ValueError("Freeze entry lacks exact byte count")
        result.append((path, digest, size))
    if len({row[0] for row in result}) != len(result):
        raise ValueError("Duplicate freeze paths")
    return result


def prepare(args):
    repo = pathlib.Path(args.repo).resolve(strict=True)
    stage_path = pathlib.Path(args.stage).resolve(strict=True)
    stage_data = stage_path.read_bytes()
    paths = stage_data.decode("utf-8").splitlines()
    if not paths or any(not p or p != p.strip() for p in paths) or len(set(paths)) != len(paths):
        raise ValueError("Stage must be a non-empty, duplicate-free exact path list")
    paths = sorted(paths)
    if any(not any(p.startswith(prefix) for prefix in args.allowed_prefix) for p in paths):
        raise ValueError("Stage contains a path outside the explicitly authorized namespace")
    freeze_path = safe_path(repo, args.freeze)
    freeze_data = freeze_path.read_bytes()
    if sha256(freeze_data) != args.freeze_sha256:
        raise ValueError("Owner freeze SHA256 mismatch")
    if args.freeze not in paths:
        raise ValueError("Freeze itself must be included in owner stage")
    freeze = json.loads(freeze_data)
    referenced = frozen_rows(freeze)
    external = []
    for path, digest, size in referenced:
        raw = safe_path(repo, path).read_bytes()
        if len(raw) != size or sha256(raw) != digest:
            raise ValueError(f"Frozen byte mismatch: {path}")
        if path not in paths:
            committed = git(repo, "show", f"HEAD:{path}")
            if committed != raw:
                raise ValueError(f"Unstaged frozen reference is not immutable HEAD content: {path}")
            external.append({"path": path, "bytes": size, "sha256": digest, "gitBlobSHA": git_blob_sha(raw)})
    entries = []
    blocked = []
    for path in paths:
        local_path = safe_path(repo, path)
        raw = local_path.read_bytes()
        mode = "100755" if local_path.stat().st_mode & 0o111 else "100644"
        row = {"path": path, "mode": mode, "type": "blob", "gitBlobSHA": git_blob_sha(raw), "bytes": len(raw), "sha256": sha256(raw)}
        entries.append(row)
        if len(raw) > args.max_blob_bytes:
            blocked.append(row)
    result = {
        "schemaVersion": 1,
        "repository": "nhiennhientran/hsk-hub",
        "targetBranch": "work/hsk-source-recovery-20261005",
        "scope": args.scope,
        "qualification": args.qualification,
        "stage": str(stage_path),
        "stageSHA256": sha256(stage_data),
        "freezePath": args.freeze,
        "freezeSHA256": args.freeze_sha256,
        "freezeReferencesVerified": len(referenced),
        "immutableExternalReferences": external,
        "expectedLocalParentCommit": git(repo, "rev-parse", "HEAD").decode().strip(),
        "expectedLocalParentTree": git(repo, "rev-parse", "HEAD^{tree}").decode().strip(),
        "entries": entries,
        "largeBlobBlockers": blocked,
        "productionPublicationAuthorized": False,
    }
    destination = pathlib.Path(args.output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"capsule": str(destination), "files": len(entries), "bytes": sum(e["bytes"] for e in entries), "freezeReferencesVerified": len(referenced), "externalImmutableReferences": len(external), "largeBlobBlockers": len(blocked), "scope": args.scope, "qualification": args.qualification}, ensure_ascii=False))
    return 3 if blocked else 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    parser.add_argument("--stage", required=True)
    parser.add_argument("--freeze", required=True)
    parser.add_argument("--freeze-sha256", required=True)
    parser.add_argument("--scope", required=True)
    parser.add_argument("--qualification", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--allowed-prefix", action="append", default=["course-app/docs/recovery-20261005/"])
    parser.add_argument("--max-blob-bytes", type=int, default=10_000_000)
    args = parser.parse_args()
    if not re.fullmatch(r"[0-9a-f]{64}", args.freeze_sha256):
        parser.error("freeze-sha256 must be a lowercase SHA256")
    try:
        sys.exit(prepare(args))
    except (ValueError, OSError, subprocess.CalledProcessError, json.JSONDecodeError) as error:
        print(json.dumps({"status": "validation-failed", "reason": str(error)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
