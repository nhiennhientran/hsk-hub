#!/usr/bin/env python3
"""The sole sync owner commits exactly one validated immutable capsule."""
import argparse
import hashlib
import json
import pathlib
import subprocess


def command(repo, *args, input=None):
    return subprocess.run(["git", "-C", str(repo), *args], input=input, capture_output=True, check=True).stdout


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    parser.add_argument("--capsule", required=True)
    parser.add_argument("--message", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    repo = pathlib.Path(args.repo).resolve(strict=True)
    capsule = json.loads(pathlib.Path(args.capsule).read_text())
    assert not capsule["largeBlobBlockers"], "Direct upload limit exceeded"
    assert command(repo, "rev-parse", "HEAD").decode().strip() == capsule["expectedLocalParentCommit"], "Local parent advanced; reprepare"
    assert command(repo, "diff", "--cached", "--name-only", "-z") == b"", "Index belongs to another operation"
    rows = capsule["entries"]
    for row in rows:
        raw = (repo / row["path"]).read_bytes()
        assert len(raw) == row["bytes"] and hashlib.sha256(raw).hexdigest() == row["sha256"], f"Capsule drift: {row['path']}"
    paths = b"".join(row["path"].encode() + b"\0" for row in rows)
    command(repo, "add", "--pathspec-from-file=-", "--pathspec-file-nul", input=paths)
    staged = command(repo, "diff", "--cached", "--name-only", "-z").decode().rstrip("\0").split("\0")
    changed_paths = {row["path"] for row in rows if not row.get("alreadyMatchesLocalParent", False)}
    assert set(staged) == changed_paths, "Staged changed path set mismatch"
    for row in rows:
        obj = command(repo, "rev-parse", f":{row['path']}").decode().strip()
        raw = command(repo, "cat-file", "blob", obj)
        assert obj == row["gitBlobSHA"] and len(raw) == row["bytes"] and hashlib.sha256(raw).hexdigest() == row["sha256"], f"Index byte mismatch: {row['path']}"
        assert (repo / row["path"]).read_bytes() == raw, f"Frozen worktree changed after stage: {row['path']}"
    command(repo, "diff", "--cached", "--check")
    command(repo, "-c", "user.name=Codex", "-c", "user.email=codex@users.noreply.github.com", "commit", "-m", args.message)
    head = command(repo, "rev-parse", "HEAD").decode().strip()
    tree = command(repo, "rev-parse", "HEAD^{tree}").decode().strip()
    parent = command(repo, "rev-parse", "HEAD^").decode().strip()
    assert parent == capsule["expectedLocalParentCommit"]
    actual = command(repo, "diff-tree", "--no-commit-id", "--name-only", "-r", "-z", parent, head).decode().rstrip("\0").split("\0")
    assert set(actual) == changed_paths
    assert command(repo, "diff", "--cached", "--name-only", "-z") == b""
    result = {**capsule, "localCommit": head, "localTree": tree, "localParentCommit": parent, "message": args.message, "changedPathCount": len(changed_paths)}
    pathlib.Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"localCommit": head, "localTree": tree, "files": len(rows), "capsule": args.output}))


if __name__ == "__main__":
    main()
