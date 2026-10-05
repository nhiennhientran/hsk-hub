#!/usr/bin/env python3
"""Rehash every restored manifest reference without rewriting old evidence."""
import argparse
import hashlib
import json
import pathlib
import re


def digest(path):
    data = path.read_bytes()
    return hashlib.sha256(data).hexdigest(), len(data)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--repo", required=True)
    p.add_argument("--output", required=True)
    args = p.parse_args()
    repo = pathlib.Path(args.repo).resolve(strict=True)
    root = repo / "course-app/docs/resume-20261004"
    identical_freezes = {}
    for candidate in root.rglob("*.json"):
        if "freeze" in candidate.name.lower():
            identical_freezes.setdefault(digest(candidate)[0], []).append(candidate)
    results = []
    checked = 0
    failures = []
    skipped = []
    for freeze in sorted(root.rglob("*.json")):
        if "freeze" not in freeze.name.lower():
            continue
        document = json.loads(freeze.read_text())
        if not isinstance(document, dict):
            skipped.append({"path": str(freeze.relative_to(repo)), "reason": "non-manifest JSON"})
            continue
        containers = []
        for key in ["files", "entries", "artifacts", "authorFiles", "evidence"]:
            value = document.get(key)
            if isinstance(value, (list, dict)):
                containers.append((key, value))
        if not containers:
            skipped.append({"path": str(freeze.relative_to(repo)), "reason": "diagnostic JSON has no file manifest"})
            continue
        rows = []
        for container, values in containers:
            values = list(values.items()) if isinstance(values, dict) else values
            for value in values:
                if isinstance(value, tuple):
                    original_path, spec = value
                    if isinstance(spec, str):
                        expected_digest, expected_size = spec, None
                    elif isinstance(spec, dict):
                        expected_digest = spec.get("sha256", spec.get("SHA256"))
                        expected_size = spec.get("bytes", spec.get("size"))
                    else:
                        failures.append({"freeze": str(freeze.relative_to(repo)), "entry": str(original_path), "reason": "unrecognized dict entry"})
                        continue
                elif isinstance(value, dict):
                    original_path = value.get("file", value.get("path"))
                    expected_digest = value.get("sha256", value.get("SHA256"))
                    expected_size = value.get("bytes", value.get("size"))
                else:
                    failures.append({"freeze": str(freeze.relative_to(repo)), "reason": "unrecognized manifest entry"})
                    continue
                if not isinstance(original_path, str) or not re.fullmatch(r"[a-f0-9]{64}", str(expected_digest)):
                    failures.append({"freeze": str(freeze.relative_to(repo)), "entry": str(original_path), "reason": "missing exact path/SHA256"})
                    continue
                path = pathlib.Path(original_path)
                if path.is_absolute():
                    old_prefix = "/workspace/scratch/28b55072841a/hsk-hub-resume/"
                    if str(path).startswith(old_prefix):
                        path = repo / str(path)[len(old_prefix):]
                elif original_path.startswith(("course-app/", "hsk1-app/", "new-hsk1/", "hsk1/", ".github/")):
                    path = repo / original_path
                elif original_path.startswith("docs/resume-20261004/"):
                    path = repo / "course-app" / original_path
                else:
                    path = freeze.parent / original_path
                row = {"declaredPath": original_path, "container": container, "expectedSHA256": expected_digest, "expectedBytes": expected_size}
                if not path.exists() and not pathlib.Path(original_path).is_absolute():
                    for canonical in identical_freezes[digest(freeze)[0]]:
                        alternate = canonical.parent / original_path
                        if alternate.is_file() and digest(alternate)[0] == expected_digest:
                            path = alternate
                            row["relativePathResolution"] = {"basis": "byte-identical canonical freeze preserves original relative path semantics", "canonicalFreeze": str(canonical.relative_to(repo))}
                            break
                if not path.exists() and not pathlib.Path(original_path).is_absolute() and not original_path.startswith(("course-app/", "hsk1-app/", "new-hsk1/", "hsk1/", ".github/")):
                    for ancestor in freeze.parent.parents:
                        if not ancestor.is_relative_to(root):
                            break
                        alternate = ancestor / original_path
                        if alternate.is_file() and digest(alternate)[0] == expected_digest:
                            path = alternate
                            row["relativePathResolution"] = {"basis": "original manifest-relative ancestor directory and declared SHA256 match", "relativeBase": str(ancestor.relative_to(repo))}
                            break
                try:
                    actual_digest, size = digest(path)
                    row.update({"resolvedPath": str(path.relative_to(repo)) if path.is_relative_to(repo) else str(path), "actualSHA256": actual_digest, "actualBytes": size, "matched": actual_digest == expected_digest and (expected_size is None or expected_size == size)})
                except OSError as error:
                    row.update({"matched": False, "error": str(error)})
                checked += 1
                rows.append(row)
                if not row["matched"]:
                    failures.append({"freeze": str(freeze.relative_to(repo)), **row})
        results.append({"freeze": str(freeze.relative_to(repo)), "freezeSHA256": digest(freeze)[0], "declaredReferences": len(rows), "matchedReferences": sum(x["matched"] for x in rows), "status": "all-declared-references-match" if all(x["matched"] for x in rows) else "historical-reference-gap", "references": rows})
    result = {"schemaVersion": 1, "scope": "restored historical freeze bytes; no new semantic or native acceptance", "manifests": results, "skippedDiagnostics": skipped, "checkedReferences": checked, "matchedReferences": checked - sum(not x["matched"] for y in results for x in y["references"]), "issues": failures, "allDeclaredReferencesRestored": not failures}
    out = pathlib.Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"manifests": len(results), "references": checked, "skippedDiagnostics": len(skipped), "issues": len(failures), "issueSample": [{"freeze": x["freeze"], "entry": x.get("declaredPath", x.get("entry")), "reason": x.get("error", x.get("reason", "SHA256/byte mismatch"))} for x in failures[:10]], "output": str(out)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
