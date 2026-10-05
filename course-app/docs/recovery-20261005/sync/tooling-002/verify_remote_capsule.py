#!/usr/bin/env python3
"""Download each new raw GitHub blob and verify exact committed bytes."""
import argparse
import concurrent.futures
import datetime
import hashlib
import json
import pathlib
import re
import urllib.parse
import urllib.request


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--capsule", required=True)
    p.add_argument("--remote-commit", required=True)
    p.add_argument("--remote-tree", required=True)
    p.add_argument("--remote-parent", required=True)
    p.add_argument("--output", required=True)
    args = p.parse_args()
    assert all(re.fullmatch("[a-f0-9]{40}", v) for v in [args.remote_commit, args.remote_tree, args.remote_parent])
    c = json.loads(pathlib.Path(args.capsule).read_text())
    assert c["repository"] == "nhiennhientran/hsk-hub"
    assert c["targetBranch"] in ["work/hsk-source-recovery-20261005", "work/hsk-recovery-text-shield-20261005"]
    assert c["localTree"] == args.remote_tree

    def readback(row):
        url = "https://raw.githubusercontent.com/nhiennhientran/hsk-hub/" + args.remote_commit + "/" + urllib.parse.quote(row["path"], safe="/")
        sha1 = hashlib.sha1(f"blob {row['bytes']}\0".encode())
        sha256 = hashlib.sha256()
        size = 0
        with urllib.request.urlopen(url, timeout=30) as response:
            assert response.status == 200
            while chunk := response.read(262144):
                size += len(chunk)
                sha1.update(chunk)
                sha256.update(chunk)
        result = {"path": row["path"], "actualBytes": size, "actualSHA256": sha256.hexdigest(), "actualGitBlobSHA": sha1.hexdigest(), "expectedMode": row["mode"], "actualNetworkRawRead": True, "matched": size == row["bytes"] and sha256.hexdigest() == row["sha256"] and sha1.hexdigest() == row["gitBlobSHA"]}
        assert result["matched"], f"Remote bytes differ: {row['path']}"
        print(json.dumps({"remoteBytesVerified": row["path"], "bytes": size}), flush=True)
        return result

    failures = []
    rows = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        jobs = {executor.submit(readback, row): row for row in c["entries"]}
        for future in concurrent.futures.as_completed(jobs):
            try:
                rows.append(future.result())
            except Exception as error:
                failures.append({"path": jobs[future]["path"], "error": str(error)})
    rows.sort(key=lambda row: row["path"])
    receipt = {"schemaVersion": 1, "verifiedAtUTC": datetime.datetime.now(datetime.timezone.utc).isoformat(), "scope": c["scope"], "qualification": c["qualification"], "repository": c["repository"], "branch": c["targetBranch"], "localCommit": c["localCommit"], "remoteCommit": args.remote_commit, "localAndRemoteTree": args.remote_tree, "actualRemoteParentCommit": args.remote_parent, "localCommitIsNotRemoteCommit": c["localCommit"] != args.remote_commit, "stageSHA256": c["stageSHA256"], "freezePath": c["freezePath"], "freezeSHA256": c["freezeSHA256"], "remoteNetworkBlobsVerified": len(rows), "expectedBlobs": len(c["entries"]), "fileByteReadback": rows, "failures": failures, "allNewBytesVerified": not failures and len(rows) == len(c["entries"]), "productionDeploymentPerformed": False, "publicationAuthorized": False}
    out = pathlib.Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"receipt": str(out), "scope": c["scope"], "verified": len(rows), "expected": len(c["entries"]), "failures": failures, "remoteCommit": args.remote_commit, "tree": args.remote_tree}), flush=True)
    raise SystemExit(0 if receipt["allNewBytesVerified"] else 1)


if __name__ == "__main__":
    main()
