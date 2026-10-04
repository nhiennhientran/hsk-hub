#!/usr/bin/env python3
"""Decode real raw-range probes and flag risks; never certify or promote clips."""
import collections
import hashlib
import importlib.util
import json
import math
import re
import subprocess
import wave
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
FINAL = HERE / "final-run-37217540172"
EXACT = HERE / "pilot-exact-match-report.json"
RATE = 16000
LOW_PROBABILITY_HOLD = 0.5  # conservative author gate, not an accuracy calibration


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text())


def db(pcm, start, end):
    begin, finish = max(0, math.floor(start * RATE)), min(len(pcm), math.ceil(end * RATE))
    values = pcm[begin:finish].astype(np.float64)
    return None if not len(values) else round(20 * math.log10(max(1e-12, float(np.sqrt(np.mean(values * values))))), 3)


spec = importlib.util.spec_from_file_location("compare", HERE / "compare-raw-source.py")
compare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compare)
exact = read(EXACT)
report = {
    "schemaVersion": 1, "inputExactReportSHA256": digest(EXACT),
    "producerSHA256": digest(Path(__file__)), "runId": 37217540172,
    "purpose": "Raw ASR-range WAV probes and author risk holds; not approved cuts",
    "policies": {"lowProbabilityHoldBelow": LOW_PROBABILITY_HOLD,
                 "internalOverlapHoldAboveSeconds": 0.02,
                 "wordInternalGapHoldAboveSeconds": 0.5,
                 "sentenceInternalGapHoldAboveSeconds": 1.5,
                 "activeRawBoundaryHoldAboveDbFS": -40,
                 "warning": "Conservative gates are author screening, not speech/human/semantic certification"},
    "sourceTargetCohorts": {}, "probes": [], "decodedOriginalTracks": [],
    "productionApprovedCount": 0, "humanListening": False,
}
out = HERE / "raw-range-probes"
out.mkdir(exist_ok=True)
for track_report in exact["tracks"]:
    track = track_report["track"]
    raw_path = FINAL / "tracks" / f"hsk{track['level']}-l{track['lesson']:02d}-t{track['track']}.json"
    raw = read(raw_path)
    original = ROOT / "course-app/public" / track["file"]
    if digest(original) != track["sha256"]:
        raise ValueError("original audio hash changed")
    pcm_bytes = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(original),
                                "-map", "0:a:0", "-ac", "1", "-ar", str(RATE),
                                "-f", "f32le", "-"], check=True, capture_output=True).stdout
    if hashlib.sha256(pcm_bytes).hexdigest() != raw["track"]["pcm"]["sha256"]:
        raise ValueError("probe full decode differs from worker PCM")
    pcm = np.frombuffer(pcm_bytes, dtype="<f4")
    report["decodedOriginalTracks"].append({"id": track["id"], "sha256": track["sha256"],
                                           "pcmSHA256": hashlib.sha256(pcm_bytes).hexdigest(),
                                           "fullDecode": "passed", "seconds": len(pcm) / RATE})
    flat = [(segment_index, word_index, word) for segment_index, segment in enumerate(raw["rawSegments"])
            for word_index, word in enumerate(segment.get("words") or [])]
    lookup = {(segment, index): ordinal for ordinal, (segment, index, word) in enumerate(flat)}
    for target in track_report["targets"]:
        if not target["uniqueWholeWordOccurrence"]:
            continue
        match = target["exactOccurrences"][0]
        indices = [lookup[(reference["segment"], reference["word"])] for reference in match["rawWordReferences"]]
        selected = [flat[index][2] for index in indices]
        all_between = [word for _, _, word in flat[indices[0]:indices[-1] + 1]]
        gaps = [current["start"] - previous["end"] for previous, current in zip(selected, selected[1:])]
        holds, notes = [], []
        if match["minimumRawProbability"] < LOW_PROBABILITY_HOLD:
            holds.append("low-raw-word-probability")
        if any(gap < -0.02 for gap in gaps):
            holds.append("overlapping-internal-ASR-word-times")
        max_gap = max(gaps, default=0)
        if max_gap > (0.5 if target["unit"] == "word" else 1.5):
            holds.append("long-internal-ASR-gap")
        if any(any(character.isalnum() and not compare.cjk(character) for character in word["word"])
               for word in all_between):
            holds.append("non-CJK-semantic-token-inside-candidate")
        segment_ids = {reference["segment"] for reference in match["rawWordReferences"]}
        if len(segment_ids) > 1:
            notes.append("crosses-ASR-segment; independent context check required")
        if target["unit"] == "word":
            for other in track_report["targets"]:
                if other["unit"] != "word" or other["id"] == target["id"]:
                    continue
                for occurrence in other["exactOccurrences"]:
                    if occurrence["status"] != "unreviewed-exact-ASR-candidate":
                        continue
                    a, b = occurrence["observedCJKRange"]
                    first, last = match["observedCJKRange"]
                    if a >= first and b <= last:
                        if compare.cjk(other["zh"]) == compare.cjk(target["zh"]):
                            notes.append("same-spelling-source-senses-share-one-observation:" + other["id"])
                        else:
                            holds.append("contains-other-printed-word-observation:" + other["id"])
        start, end = match["rawStart"], match["rawEnd"]
        if not 0 <= start < end <= len(pcm) / RATE:
            raise ValueError("invalid selected raw probe times")
        before = db(pcm, start - .02, start)
        after = db(pcm, end, end + .02)
        inside_start, inside_end = db(pcm, start, start + .02), db(pcm, end - .02, end)
        if any(value is not None and value > -40 for value in (before, after, inside_start, inside_end)):
            holds.append("active-energy-at-raw-cut-boundary")
        padded_start, padded_end = max(0, start - .12), min(len(pcm) / RATE, end + .15)
        previous = flat[indices[0] - 1][2] if indices[0] else None
        following = flat[indices[-1] + 1][2] if indices[-1] + 1 < len(flat) else None
        if previous and previous["end"] > start + .02:
            holds.append("previous-ASR-word-overlaps-candidate-start")
        if following and following["start"] < end - .02:
            holds.append("following-ASR-word-overlaps-candidate-end")
        first_sample, last_sample = math.floor(start * RATE), math.ceil(end * RATE)
        signal = np.clip(np.rint(pcm[first_sample:last_sample].astype(np.float64) * 32768),
                         -32768, 32767).astype("<i2")
        name = re.sub(r"[^A-Za-z0-9_-]", "_", target["id"]) + ".wav"
        path = out / name
        with wave.open(str(path), "wb") as file:
            file.setnchannels(1)
            file.setsampwidth(2)
            file.setframerate(RATE)
            file.writeframes(signal.tobytes())
        decoded = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(path),
                                  "-f", "f32le", "-"], check=True, capture_output=True).stdout
        if len(decoded) != len(signal) * 4:
            raise ValueError("real generated WAV probe failed sample-count/decode check")
        report["probes"].append({
            "id": target["id"], "unit": target["unit"], "sourceText": target["zh"], "source": target["source"],
            "sourceTrack": track["file"], "sourceSHA256": track["sha256"],
            "rawEvidenceSHA256": digest(raw_path), "rawWordReferences": match["rawWordReferences"],
            "rawStart": start, "rawEnd": end, "rawDurationSeconds": end - start,
            "minimumRawProbability": match["minimumRawProbability"], "maxInternalRawGapSeconds": max_gap,
            "sourceCJKRange": match["observedCJKRange"], "crossASRSegmentCount": len(segment_ids),
            "rawBoundaryRMSDbFS20ms": {"beforeStart": before, "afterStart": inside_start,
                                      "beforeEnd": inside_end, "afterEnd": after},
            "paddingProposalNotApproved": {"start": padded_start, "end": padded_end,
                                           "beforeStartDbFS": db(pcm, padded_start - .02, padded_start),
                                           "afterEndDbFS": db(pcm, padded_end, padded_end + .02),
                                           "previousASRWord": previous, "followingASRWord": following},
            "holdReasons": sorted(set(holds)), "contextNotes": sorted(set(notes)),
            "status": "held-for-independent-ASR/source/boundary-review" if holds else "unapproved-probe-awaiting-independent-review",
            "wavProbe": {"file": "raw-range-probes/" + name, "sha256": digest(path), "bytes": path.stat().st_size,
                         "samplingRate": RATE, "channels": 1, "sampleEncoding": "s16le",
                         "sourcePCMRange": [first_sample, last_sample], "fullDecode": "passed"},
            "humanListening": False, "acousticBoundaryApproved": False, "productionApproved": False,
        })
for unit in ["word", "line", "sentence"]:
    targets = [target for track in exact["tracks"] for target in track["targets"] if target["unit"] == unit]
    probes = [probe for probe in report["probes"] if probe["unit"] == unit]
    report["sourceTargetCohorts"][unit] = {
        "sourceTargets": len(targets), "strictUniqueRawTargets": len(probes),
        "unmatched": sum(not target["exactOccurrences"] for target in targets),
        "nonuniqueOrBlocked": sum(bool(target["exactOccurrences"]) and not target["uniqueWholeWordOccurrence"] for target in targets),
        "heldUniqueRawTargets": sum(bool(probe["holdReasons"]) for probe in probes),
        "otherUniqueRawTargetsAwaitingIndependentReview": sum(not probe["holdReasons"] for probe in probes),
        "distinctRawTimeRanges": len({(probe["sourceTrack"], probe["rawStart"], probe["rawEnd"]) for probe in probes}),
        "approvedPrecisionCount": 0,
    }
report["summary"] = {
    "realGeneratedAndFullDecodedWAVProbes": len(report["probes"]),
    "heldRawTargets": sum(bool(probe["holdReasons"]) for probe in report["probes"]),
    "holdReasonCounts": dict(collections.Counter(reason for probe in report["probes"] for reason in probe["holdReasons"])),
}
(HERE / "candidate-boundary-evidence.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(report["summary"]))
