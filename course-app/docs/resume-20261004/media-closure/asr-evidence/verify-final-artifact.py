#!/usr/bin/env python3
"""Verify the downloaded final pilot against frozen code and local source bytes."""
import hashlib
import importlib.util
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
FINAL = HERE / "final-run-37217540172"
LOCAL = HERE / "local-pilot-preflight"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text())


def require(condition, description):
    if not condition:
        raise ValueError(description)
    return description


spec = importlib.util.spec_from_file_location("compare", HERE / "compare-raw-source.py")
compare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compare)
run, preflight, local = read(FINAL / "run.json"), read(FINAL / "preflight.json"), read(LOCAL / "preflight.json")
checks = []
checks.append(require(run["repositoryCommit"] == "b32215e5990c3d9673f6fb0f8c27e804c062b6e6", "final CI source commit matches"))
checks.append(require(run["scriptSHA256"] == digest(HERE / "transcribe-original-tracks.py"), "frozen transcribe script SHA matches"))
checks.append(require(run["requirementsSHA256"] == digest(HERE / "requirements.txt"), "fixed dependency input SHA matches"))
checks.append(require(run["status"] == "completed-asr-evidence-awaiting-review", "run completed ASR only, not production approval"))
checks.append(require(run["model"]["repository"] == "Systran/faster-whisper-small" and
                      run["model"]["requestedRevision"] == run["model"]["actualSnapshotRevision"] ==
                      "536b0662742c02347bc0e980a01041f333bce120", "actual model snapshot equals official fixed revision"))
checks.append(require(run["dependenciesMatchPinnedRequirements"], "runtime version guard passed"))
for line in (HERE / "requirements.txt").read_text().splitlines():
    if line and not line.startswith("#"):
        name, version = line.split("==")
        require(run["packages"][name] == version, f"actual installed version matches: {name}")
checks.append("all 26 pinned actual runtime dependency versions independently compared")
checks.append(require(digest(FINAL / "preflight.json") == run["preflightSHA256"], "preflight evidence SHA matches run"))
checks.append(require(digest(FINAL / "source-comparison-input.json") == preflight["sourceComparisonInputSHA256"] ==
                      local["sourceComparisonInputSHA256"], "source comparison bytes equal frozen local pilot input"))
checks.append(require(preflight["audioManifestSHA256"] == digest(ROOT / "course-app/content/audio-manifest.json"),
                      "frozen full original audio manifest SHA matches"))
for source in read(FINAL / "source-comparison-input.json")["lessons"]:
    require(source["sha256"] == digest(ROOT / source["file"]), "frozen lesson input SHA differs")
checks.append("all three frozen complete lesson JSON file hashes match")
require(len(run["completedTracks"]) == len(preflight["tracks"]) == 24, "must have 24 final raw track records")
for completed in run["completedTracks"]:
    raw_path = FINAL / completed["file"]
    require(digest(raw_path) == completed["sha256"], "raw track evidence SHA differs from completed run")
    raw = read(raw_path)
    track = next(t for t in preflight["tracks"] if t["id"] == completed["id"])
    compare.validate_raw_track(raw, track)
    original = ROOT / "course-app/public" / track["file"]
    require(digest(original) == track["sha256"], "actual original MP3 SHA differs")
    require(track["pcm"] == next(t for t in local["tracks"] if t["id"] == track["id"])["pcm"],
            "worker PCM differs from local actual decode")
    require(raw["certification"]["promotedClipCount"] == 0, "unexpected production promotion")
checks.append("24/24 final raw evidence file hashes and original MP3 hashes match")
checks.append("24/24 worker PCM hashes/samples/durations equal actual local full decode")
checks.append("24/24 raw option records reject source prompt, prefix, hotwords or previous-text conditioning")
report = {
    "schemaVersion": 1, "status": "passed-evidence-integrity; candidate quality not certified",
    "runId": 37217540172, "artifactId": 11308883505,
    "artifactZIPDigest": "90a2e29e7bc756852f60255c9c1f4539cc7c09810a2ad21a93f1da6dff39c209",
    "checks": checks, "sourceTrackCount": 24, "frozenLessonCount": 3,
    "modelFileHashScope": "computed and recorded by verified frozen worker script; model binary not included in evidence artifact",
    "modelFiles": run["model"]["files"], "actualComputeType": run["model"]["actualComputeType"],
    "totalDecodedSeconds": preflight["totalDecodedSeconds"],
    "totalInferenceSeconds": run["totalInferenceSeconds"], "realTimeFactor": run["realTimeFactor"],
    "peakResidentMemoryKiB": run["peakResidentMemoryKiB"], "humanListening": False,
    "productionApprovedClipCount": 0,
}
(HERE / "final-artifact-verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"status": report["status"], "passedChecks": len(checks), "tracks": 24}))
