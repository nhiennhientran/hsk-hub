#!/usr/bin/env python3
"""Verify actual 9-batch/208-track raw collection; no candidate promotion."""
import collections
import hashlib
import importlib.util
import json
import math
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
COLLECTION = HERE / "remaining-run-37219831025"
spec = importlib.util.spec_from_file_location("compare", HERE / "compare-raw-source.py")
compare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compare)


def read(path):
    return json.loads(path.read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require(condition, description):
    if not condition:
        raise ValueError(description)


ledger = read(COLLECTION / "artifact-download-ledger.json")
manifest = read(ROOT / "course-app/content/audio-manifest.json")
all_manifest = {track["id"]: track for track in manifest["tracks"]}
reference_model = read(HERE / "final-run-37217540172/run.json")["model"]["files"]
report = {
    "schemaVersion": 1, "runId": 37219831025,
    "sourceCommit": "3f7285359c2f7fc0c552157df68feb61c9758f53",
    "purpose": "verified diagnostic observations only, not precise clips",
    "producerSHA256": digest(Path(__file__)), "batches": [], "tracks": [],
    "currentLessonFileHashMismatches": [], "actualOriginalFullDecodeCount": 0,
    "humanListening": False, "productionApprovedClipCount": 0,
}
all_ids, all_lesson_ids = set(), set()
for artifact in ledger["artifacts"]:
    directory = COLLECTION / artifact["batchId"]
    require(digest(Path(artifact["zipPath"])) == artifact["expectedZIP_SHA256"], "actual ZIP SHA differs")
    run = read(directory / "run.json")
    preflight = read(directory / "preflight.json")
    sources = read(directory / "source-comparison-input.json")
    require(run["repositoryCommit"] == report["sourceCommit"] == artifact["headSHA"], "batch source commit differs")
    require(run["status"] == "completed-asr-evidence-awaiting-review", "batch did not complete raw evidence")
    require(run["scriptSHA256"] == digest(HERE / "transcribe-original-tracks.py"), "batch fixed script SHA differs")
    require(run["requirementsSHA256"] == digest(HERE / "requirements.txt"), "batch fixed requirements SHA differs")
    require(run["dependenciesMatchPinnedRequirements"], "batch fixed dependency guard did not pass")
    for line in (HERE / "requirements.txt").read_text().splitlines():
        if line and not line.startswith("#"):
            name, version = line.split("==")
            require(run["packages"][name] == version, "actual batch dependency version differs")
    require(run["model"]["requestedRevision"] == run["model"]["actualSnapshotRevision"] ==
            "536b0662742c02347bc0e980a01041f333bce120", "batch actual small model revision differs")
    require(run["model"]["files"] == reference_model, "recorded batch four model-file hashes differ from verified pilot")
    require(preflight["audioManifestSHA256"] == digest(ROOT / "course-app/content/audio-manifest.json"), "batch audio manifest SHA differs")
    require(digest(directory / "preflight.json") == run["preflightSHA256"], "batch preflight evidence SHA differs")
    require(digest(directory / "source-comparison-input.json") == preflight["sourceComparisonInputSHA256"], "batch frozen source-comparison input SHA differs")
    expected = {(lesson, track) for lesson in preflight["lessons"] for track in range(1, 9)}
    actual = {(track["lesson"], track["track"]) for track in preflight["tracks"]}
    require(expected == actual and len(actual) == len(preflight["tracks"]), "batch exact original-track coverage differs")
    require(len(run["completedTracks"]) == len(actual), "batch raw-track count differs from preflight")
    for source in sources["lessons"]:
        all_lesson_ids.add(source["id"])
        local_sha = digest(ROOT / source["file"])
        if source["sha256"] != local_sha:
            report["currentLessonFileHashMismatches"].append({"id": source["id"], "file": source["file"],
                                                            "workerSHA256": source["sha256"], "currentSHA256": local_sha})
    for completed in run["completedTracks"]:
        require(completed["id"] not in all_ids, "duplicate track across remaining batches")
        all_ids.add(completed["id"])
        raw_path = directory / completed["file"]
        require(digest(raw_path) == completed["sha256"], "batch raw evidence SHA differs")
        raw = read(raw_path)
        current = all_manifest[completed["id"]]
        compare.validate_raw_track(raw, current)
        original_path = ROOT / "course-app/public" / current["file"]
        require(digest(original_path) == current["sha256"], "actual original MP3 SHA differs")
        pcm = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(original_path),
                              "-map", "0:a:0", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                             check=True, capture_output=True).stdout
        require(hashlib.sha256(pcm).hexdigest() == raw["track"]["pcm"]["sha256"], "actual full original PCM SHA differs from worker")
        report["actualOriginalFullDecodeCount"] += 1
        words = [word for segment in raw["rawSegments"] for word in segment.get("words") or []]
        duration = raw["track"]["pcm"]["durationSeconds"]
        invalid = [index for index, word in enumerate(words) if
                   not 0 <= word["start"] < word["end"] <= duration]
        non_cjk = [{"index": index, "raw": word} for index, word in enumerate(words) if
                   any(character.isalnum() and not compare.cjk(character) for character in word["word"])]
        normalized = [compare.cjk(word["word"]) for word in words]
        repetitions = collections.Counter(item for item in normalized if item)
        holds = []
        if invalid: holds.append("invalid-or-zero-duration-word-observations")
        if non_cjk: holds.append("non-CJK-semantic-observations-require-source-domain-review")
        if max(repetitions.values(), default=0) >= 10:
            holds.append("high-token-repetition-requires-source-domain-review")
        report["tracks"].append({
            "id": completed["id"], "batch": artifact["batchId"], "kind": current["kind"],
            "originalMP3_SHA256": current["sha256"], "actualFullDecodeAndPCM_SHA": "passed",
            "rawFile": raw_path.relative_to(HERE).as_posix(), "rawSHA256": digest(raw_path),
            "rawWordCount": len(words), "invalidOrZeroDurationWordIndices": invalid,
            "rawWordsBelowHalfProbability": sum(word["probability"] < .5 for word in words),
            "nonCJKSemanticObservations": non_cjk,
            "maxIdenticalCJKTokenOccurrences": max(repetitions.values(), default=0),
            "emptyRawTranscript": not any(segment["text"].strip() for segment in raw["rawSegments"]),
            "holdReasons": holds, "preciseClipApproval": False,
        })
    report["batches"].append({
        "id": artifact["batchId"], "level": preflight["level"], "lessons": preflight["lessons"],
        "artifactId": artifact["artifactId"], "ZIP_SHA256": artifact["expectedZIP_SHA256"],
        "originalTrackAndRawCount": len(actual), "allSourceIntegrityChecks": "passed",
        "sourceLessonCount": len(sources["lessons"]), "totalDecodedSeconds": preflight["totalDecodedSeconds"],
        "totalInferenceSeconds": run["totalInferenceSeconds"], "realTimeFactor": run["realTimeFactor"],
        "peakResidentMemoryKiB": run["peakResidentMemoryKiB"],
    })
require(len(all_ids) == 208 and len(all_lesson_ids) == 26, "remaining collection must contain exactly26 lessons/208 originals")
report["summary"] = {
    "actualZIPsVerified": len(report["batches"]), "originalTracksAndRawRecordsVerified": len(all_ids),
    "frozenSourceLessons": len(all_lesson_ids), "currentLessonHashMismatches": len(report["currentLessonFileHashMismatches"]),
    "allActualOriginalsFullDecodedAndPCM_SHA_Matched": report["actualOriginalFullDecodeCount"],
    "rawWordObservations": sum(track["rawWordCount"] for track in report["tracks"]),
    "tracksWithInvalidOrZeroWordTimes": sum(bool(track["invalidOrZeroDurationWordIndices"]) for track in report["tracks"]),
    "invalidOrZeroWordObservations": sum(len(track["invalidOrZeroDurationWordIndices"]) for track in report["tracks"]),
    "tracksWithNonCJKSemanticObservations": sum(bool(track["nonCJKSemanticObservations"]) for track in report["tracks"]),
    "tracksWithHighTokenRepetition": sum(track["maxIdenticalCJKTokenOccurrences"] >= 10 for track in report["tracks"]),
    "emptyRawTracks": sum(track["emptyRawTranscript"] for track in report["tracks"]),
    "productionApprovedClipCount": 0,
}
(COLLECTION / "verified-collection.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(report["summary"]))
