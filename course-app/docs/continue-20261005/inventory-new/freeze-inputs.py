#!/usr/bin/env python3
"""Materialize an exact Git source snapshot for a new, separately versioned inventory.

Only this evidence directory is written. It is never a reconstruction of the
missing B10 gzip. No Git refs or website work files are changed.
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
BASELINE = "1874b4a42ed0bb5afa6a0ed1d17bd882ed85d36b"


def git(*args):
    return subprocess.check_output(["git", *args], cwd=REPO)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-ref", default=BASELINE)
    args = parser.parse_args()
    head = git("rev-parse", args.source_ref).decode().strip()
    tree = git("rev-parse", head + "^{tree}").decode().strip()
    destination = HERE / "input-snapshot"
    if destination.exists():
        raise SystemExit("Snapshot already exists. Use a new version directory; never overwrite frozen inputs.")
    prefixes = (
        "hsk1-app/src/", "hsk1-app/content/", "course-app/src/", "course-app/content/",
        "assets/", "hsk3/", "hsk4/", "hsk4up/", "data/", "hsk1/", "new-hsk1/hsk1/",
        "new-hsk1/assets/", "practice/reviewed/",
    )
    exact = {
        "index.html", "hsk2.html", "lesson.html", "help.html", "new-hsk1/index.html",
        "hsk1-app/index.html", "hsk1-app/public/help.html", "course-app/index.html",
        "course-app/tools/package-unified.mjs", "course-app/tools/package-core.mjs",
        "course-app/package.json", "course-app/package-lock.json",
        "hsk1-app/package.json", "hsk1-app/package-lock.json", "curriculum/grammar-manifest.json",
    }
    extensions = (".ts", ".tsx", ".js", ".html", ".json", ".css", ".b64")
    entries = []
    # git ls-tree and cat-file read exact commit objects, not mutable work files.
    for raw in git("ls-tree", "-r", "-z", head).split(b"\0"):
        if not raw:
            continue
        metadata, raw_name = raw.split(b"\t", 1)
        mode, kind, blob = metadata.decode().split()
        name = raw_name.decode()
        if kind != "blob":
            continue
        selected = name in exact or name.endswith(".svg") or (
            name.startswith(prefixes) and name.endswith(extensions)
        ) or (name.startswith("HSK2_Bai") and name.endswith(".html"))
        if not selected:
            continue
        if mode != "100644":
            raise SystemExit(f"Unexpected non-regular source file {name}: {mode}")
        payload = git("cat-file", "blob", blob)
        target = destination / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload)
        entries.append({"file": name, "gitBlob": blob, "bytes": len(payload),
                        "sha256": hashlib.sha256(payload).hexdigest()})
    manifest = {"schemaVersion": 1, "status": "exact-git-input-materialization-for-new-inventory",
                "sourceHEAD": head, "sourceTree": tree,
                "directory": "input-snapshot", "inputFiles": sorted(entries, key=lambda x: x["file"]),
                "source": "git ls-tree plus git cat-file blob; no working-source bytes copied",
                "oldB10PayloadRestored": False, "gitMutations": False,
                "snapshotIsNotFinalChangedWebsite": True}
    (HERE / "input-snapshot-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"sourceHEAD": head, "sourceTree": tree, "materializedFiles": len(entries),
                      "bytes": sum(x["bytes"] for x in entries)}))


if __name__ == "__main__":
    main()
