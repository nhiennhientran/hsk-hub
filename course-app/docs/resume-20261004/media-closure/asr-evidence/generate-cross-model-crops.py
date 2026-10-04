#!/usr/bin/env python3
"""Prepare the independently selected two sentences and one whole-word track."""
import hashlib
import json
import math
import subprocess
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
RATE = 16000
small = json.loads((HERE / "pilot-exact-match-report.json").read_text())
medium = json.loads((HERE / "medium-exact-match-report.json").read_text())
medium_targets = {target["id"]: target for track in medium["tracks"] for target in track["targets"]}
sentence_ids = {
    "hsk2-fltrp-2026:l04:text2:line3",
    "hsk2-fltrp-2026:l05:text2:line8:sentence2",
}
result = {
    "schemaVersion": 1, "purpose": "limited padded-crop unprompted ASR review; not production cuts",
    "smallExactReportSHA256": hashlib.sha256((HERE / "pilot-exact-match-report.json").read_bytes()).hexdigest(),
    "mediumExactReportSHA256": hashlib.sha256((HERE / "medium-exact-match-report.json").read_bytes()).hexdigest(),
    "selection": "Root/independent-QA selected two sentence priorities plus L4T8 original whole track containing only 颜色",
    "cropRule": "union of two raw ranges with 120ms before/150ms after; actual waveform boundary evidence remains unapproved",
    "blockedWholeTracks": [{"level": 2, "lesson": 5, "track": 2,
                             "reason": "medium severe repeated 上来 hallucination and subtitles; cannot validate small"}],
    "candidates": [], "productionApprovedCount": 0, "humanListening": False,
}
for track in small["tracks"]:
    metadata = track["track"]
    if metadata["lesson"] == 5 and metadata["track"] == 2:
        continue
    original = ROOT / "course-app/public" / metadata["file"]
    pcm_bytes = None
    for target in track["targets"]:
        if target["id"] not in sentence_ids and target["id"] != "hsk2-fltrp-2026:l04:word16":
            continue
        other = medium_targets[target["id"]]
        if not target["uniqueWholeWordOccurrence"] or not other["uniqueWholeWordOccurrence"]:
            continue
        left, right = target["exactOccurrences"][0], other["exactOccurrences"][0]
        if min(left["minimumRawProbability"], right["minimumRawProbability"]) < (.8 if target["unit"] == "word" else .5):
            continue
        delta = max(abs(left["rawStart"] - right["rawStart"]), abs(left["rawEnd"] - right["rawEnd"]))
        if delta > (.4 if target["unit"] == "word" else .2 + 1e-6):
            continue
        if pcm_bytes is None:
            if hashlib.sha256(original.read_bytes()).hexdigest() != metadata["sha256"]:
                raise ValueError("original track changed")
            pcm_bytes = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(original),
                                        "-ac", "1", "-ar", str(RATE), "-f", "f32le", "-"],
                                       check=True, capture_output=True).stdout
        pcm = np.frombuffer(pcm_bytes, dtype="<f4")
        start, end = max(0, min(left["rawStart"], right["rawStart"]) - .12), min(len(pcm) / RATE, max(left["rawEnd"], right["rawEnd"]) + .15)
        if target["id"] == "hsk2-fltrp-2026:l04:word16":
            start, end = 0.0, len(pcm) / RATE
        first, last = math.floor(start * RATE), math.ceil(end * RATE)
        def edge_db(a, b):
            values = pcm[max(0, int(a * RATE)):min(len(pcm), int(b * RATE))].astype(np.float64)
            return None if not len(values) else round(20 * math.log10(max(1e-12, float(np.sqrt(np.mean(values * values))))), 3)
        source_lesson = ROOT / f"course-app/content/hsk2/lesson-{metadata['lesson']:02d}.json"
        result["candidates"].append({
            "id": target["id"], "unit": "word" if target["unit"] == "word" else "sentence",
            "sourceText": target["zh"], "source": target["source"],
            "sourceLessonFile": source_lesson.relative_to(ROOT).as_posix(),
            "sourceLessonSHA256": hashlib.sha256(source_lesson.read_bytes()).hexdigest(),
            "sourceTrack": metadata["file"], "sourceSHA256": metadata["sha256"],
            "sourcePCM_SHA256": hashlib.sha256(pcm_bytes).hexdigest(),
            "smallRaw": {key: left[key] for key in ["rawStart", "rawEnd", "minimumRawProbability", "rawWordReferences"]},
            "mediumRaw": {key: right[key] for key in ["rawStart", "rawEnd", "minimumRawProbability", "rawWordReferences"]},
            "maximumModelEndpointDifference": delta,
            "start": first / RATE, "end": last / RATE, "sourceSampleRange16k": [first, last],
            "recipe": "whole-original-track-single-printed-word" if target["unit"] == "word" else
                      "two-model-range-union-with-120ms-before-150ms-after; unapproved",
            "cropPCM_SHA256": hashlib.sha256(pcm[first:last].tobytes()).hexdigest(),
            "boundaryRMSDbFS20ms": {"beforeStart": edge_db(start - .02, start),
                                      "afterStart": edge_db(start, start + .02),
                                      "beforeEnd": edge_db(end - .02, end), "afterEnd": edge_db(end, end + .02)},
            "status": "padded-crop-pending-independent-unprompted-ASR-and-source-boundary-review",
            "productionApproved": False, "humanListening": False,
        })
if len(result["candidates"]) != 3 or sum(candidate["unit"] == "word" for candidate in result["candidates"]) != 1:
    raise ValueError("limited review batch must remain one whole-word track + two independent-priority sentences")
expected = {"schemaVersion": 1, "purpose": "post-ASR comparison only; never inference input",
            "targets": [{"id": candidate["id"], "sourceText": candidate.pop("sourceText"),
                         "source": candidate["source"], "unit": candidate["unit"]}
                        for candidate in result["candidates"]]}
expected_path = HERE / "padded-crop-expected-source.json"
expected_path.write_text(json.dumps(expected, ensure_ascii=False, indent=2) + "\n")
result["expectedSourceComparisonSHA256"] = hashlib.sha256(expected_path.read_bytes()).hexdigest()
(HERE / "padded-crop-review-input.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"candidates": 3, "wholeWordTracks": 1, "sentences": 2,
                  "SHA256": hashlib.sha256((HERE / "padded-crop-review-input.json").read_bytes()).hexdigest()}))
