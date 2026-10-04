#!/usr/bin/env python3
"""Check real three-crop artifacts, source bytes, and explicit script variants.

This report preserves both raw versions and their low probabilities. It does
not lower thresholds, approve Chinese script conversions or promote segments.
"""
import hashlib
import importlib.util
import json
import math
import subprocess
import wave
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
spec = importlib.util.spec_from_file_location("compare", HERE / "compare-raw-source.py")
compare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compare)
recipe_path = HERE / "padded-crop-review-input.json"
recipe = json.loads(recipe_path.read_text())
expected_path = HERE / "padded-crop-expected-source.json"
expected = {target["id"]: target for target in json.loads(expected_path.read_text())["targets"]}
script_equivalents = {"為": "为", "歡": "欢", "們": "们", "別": "别", "氣": "气"}
models = {"small": "536b0662742c02347bc0e980a01041f333bce120",
          "medium": "08e178d48790749d25932bbc082711ddcfdfbc4f"}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require(value, description):
    if not value:
        raise ValueError(description)


def read(path):
    return json.loads(path.read_text())


def db(pcm, a, b):
    values = pcm[max(0, int(a * 16000)):min(len(pcm), int(b * 16000))].astype(np.float64)
    return None if not len(values) else round(20 * math.log10(max(1e-12, float(np.sqrt(np.mean(values * values))))), 3)


require(digest(recipe_path) == "3ccb4354bc7ff3a899adb7543c97524989d6e9ca4ed5a348d7299456d7ee3ccf", "frozen recipe changed")
require(digest(expected_path) == recipe["expectedSourceComparisonSHA256"], "separate expected-source input changed")
report = {
    "schemaVersion": 1, "runId": 37219656715,
    "repositoryCommit": "70e001fa0cee9f6a01fe2dc7fed2a04d1cd5db5f",
    "recipeSHA256": digest(recipe_path), "expectedSourceSHA256": digest(expected_path),
    "producerSHA256": digest(Path(__file__)),
    "scriptEquivalenceProposalForIndependentReview": script_equivalents,
    "normalizationScope": "NFKC+CJK then five explicit traditional-to-simplified glyph proposals only; no homophone or missing-erhua repair",
    "models": {}, "candidates": [], "productionApprovedCount": 0,
    "humanListening": False, "nativeSpeakerCertification": False,
}
crop_directory = HERE / "guarded-three-crop-wav-probes"
crop_directory.mkdir(exist_ok=True)
for model, revision in models.items():
    directory = HERE / "crop-run-37219656715" / model
    run = read(directory / "run.json")
    require(run["status"] == "3-crop-ASR-evidence-complete-awaiting-independent-review", "crop run incomplete")
    require(run["repositoryCommit"] == report["repositoryCommit"], "crop run source head differs")
    require(run["inputSHA256"] == digest(recipe_path), "crop run input SHA differs")
    require(run["scriptSHA256"] == digest(HERE / "transcribe-candidate-crops.py"), "crop worker script SHA differs")
    require(run["originalASRScriptSHA256"] == digest(HERE / "transcribe-original-tracks.py"), "original helper script SHA differs")
    require(run["requirementsSHA256"] == digest(HERE / "requirements.txt"), "crop fixed dependency input SHA differs")
    for line in (HERE / "requirements.txt").read_text().splitlines():
        if line and not line.startswith("#"):
            name, version = line.split("==")
            require(run["packages"][name] == version, "crop installed fixed dependency version differs")
    require(run["model"]["requestedRevision"] == run["model"]["actualSnapshotRevision"] == revision, "crop model fixed revision differs")
    require(len(run["completedCrops"]) == 3, "crop run must complete exactly three")
    report["models"][model] = {"runSHA256": digest(directory / "run.json"),
                                "model": run["model"], "elapsedTotalSeconds": run["elapsedTotalSeconds"],
                                "peakResidentMemoryKiB": run["peakResidentMemoryKiB"], "provenanceChecks": "passed"}
for index, candidate in enumerate(recipe["candidates"]):
    source = expected[candidate["id"]]
    path = ROOT / "course-app/public" / candidate["sourceTrack"]
    require(digest(path) == candidate["sourceSHA256"], "actual original MP3 SHA differs")
    require(digest(ROOT / candidate["sourceLessonFile"]) == candidate["sourceLessonSHA256"], "actual frozen lesson SHA differs")
    pcm_bytes = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(path),
                                "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                               check=True, capture_output=True).stdout
    require(hashlib.sha256(pcm_bytes).hexdigest() == candidate["sourcePCM_SHA256"], "original full PCM SHA differs")
    first, last = candidate["sourceSampleRange16k"]
    crop_bytes = pcm_bytes[first * 4:last * 4]
    require(hashlib.sha256(crop_bytes).hexdigest() == candidate["cropPCM_SHA256"], "actual source-frame crop SHA differs")
    full = np.frombuffer(pcm_bytes, dtype="<f4")
    crop = np.frombuffer(crop_bytes, dtype="<f4")
    edges = {"beforeStart": db(full, candidate["start"] - .02, candidate["start"]),
             "afterStart": db(full, candidate["start"], candidate["start"] + .02),
             "beforeEnd": db(full, candidate["end"] - .02, candidate["end"]),
             "afterEnd": db(full, candidate["end"], candidate["end"] + .02)}
    # The frozen author diagnostics used union seconds before floor/ceil to
    # 16k source frames. Recompute at the actual saved frame positions instead
    # of silently asserting those diagnostic windows are byte-identical.
    declared_edges = candidate["boundaryRMSDbFS20ms"]
    edge_deltas = {key: None if edges[key] is None or declared_edges[key] is None else
                   round(edges[key] - declared_edges[key], 3) for key in edges}
    wav_path = crop_directory / f"guarded-crop-{index + 1:02d}.wav"
    signal = np.clip(np.rint(crop.astype(np.float64) * 32768), -32768, 32767).astype("<i2")
    with wave.open(str(wav_path), "wb") as file:
        file.setnchannels(1); file.setsampwidth(2); file.setframerate(16000); file.writeframes(signal.tobytes())
    decoded = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(wav_path), "-f", "f32le", "-"],
                             check=True, capture_output=True).stdout
    require(len(decoded) == len(crop) * 4, "guarded real WAV probe full decode/sample count differs")
    target = {"id": candidate["id"], "unit": candidate["unit"], "sourceText": source["sourceText"],
              "source": source["source"], "recipe": candidate,
              "sourceAndActualFrameSHA": "passed", "boundaryRMSDbFS20ms": edges,
              "declaredPreFrameQuantizationBoundaryRMSDbFS20ms": declared_edges,
              "actualMinusDeclaredEdgeDb": edge_deltas,
              "diagnosticWindowScope": "Author declared edge energy before 16k floor/ceil; actual edges above recomputed from frozen source frame positions",
              "edgeEnergyGuardBelow45DbFS": all(value is None or value <= -45 for value in edges.values()),
              "waveProbe": {"file": wav_path.relative_to(HERE).as_posix(), "sha256": digest(wav_path), "fullDecode": "passed"},
              "rawModelObservations": {}, "productionApproved": False}
    for model, revision in models.items():
        directory = HERE / "crop-run-37219656715" / model
        run = read(directory / "run.json")
        completed = next(item for item in run["completedCrops"] if item["candidateId"] == candidate["id"])
        raw_path = directory / completed["file"]
        require(digest(raw_path) == completed["sha256"], "actual crop raw evidence file SHA differs")
        raw = read(raw_path)
        require(raw["cropPCM_SHA256"] == candidate["cropPCM_SHA256"] and raw["sourceSampleRange16k"] == [first, last], "worker actual source frames/crop hash differ")
        require(raw["originalSourceSHA256"] == candidate["sourceSHA256"] and raw["originalSourceTrack"] == candidate["sourceTrack"], "worker original audio differs")
        require(raw["modelRevision"] == revision and raw["options"] == run["options"], "raw crop model/options differ")
        require(all(raw["options"][field] is None for field in ["initial_prompt", "prefix", "hotwords"]) and
                raw["options"]["condition_on_previous_text"] is False, "crop source conditioning detected")
        raw_text = "".join(segment["text"] for segment in raw["rawSegments"])
        observed = compare.cjk(raw_text)
        normalized = observed.translate(str.maketrans(script_equivalents))
        intended = compare.cjk(source["sourceText"])
        words = [word for segment in raw["rawSegments"] for word in segment.get("words") or []]
        low = [word for word in words if word["probability"] < .5]
        target["rawModelObservations"][model] = {
            "rawFile": raw_path.relative_to(HERE).as_posix(), "rawSHA256": digest(raw_path),
            "rawTranscript": raw_text, "strictCJKSourceExact": observed == intended,
            "afterExplicitGlyphProposalCJKSourceExact": normalized == intended,
            "recognizedNeighborCJKAfterGlyphProposal": normalized != intended,
            "minimumRawWordProbability": min(word["probability"] for word in words),
            "rawLowProbabilityWordsBelowHalf": low,
            "invalidOrZeroDurationWords": [word for word in words if not 0 <= word["start"] < word["end"] <= len(crop) / 16000],
            "allRawWords": words,
        }
    target["status"] = "whole-word-track-awaiting-independent-source-certification" if candidate["unit"] == "word" else "sentence-crop-awaiting-independent-glyph-and-low-probability-review"
    report["candidates"].append(target)
report["summary"] = {
    "actualCrops": 3, "actualUnpromptedCropTranscriptions": 6,
    "sourcePCMAndSourceFramesVerified": 3,
    "realWAVProbesFullDecodePassed": 3,
    "actualPhysicalOrQuietEnergyEdgesBelow45DbFS": sum(candidate["edgeEnergyGuardBelow45DbFS"] for candidate in report["candidates"]),
    "strictCJKExactRawVersions": sum(raw["strictCJKSourceExact"] for candidate in report["candidates"] for raw in candidate["rawModelObservations"].values()),
    "afterExplicitFiveGlyphProposalExactRawVersions": sum(raw["afterExplicitGlyphProposalCJKSourceExact"] for candidate in report["candidates"] for raw in candidate["rawModelObservations"].values()),
    "rawVersionsWithWordBelowHalf": sum(bool(raw["rawLowProbabilityWordsBelowHalf"]) for candidate in report["candidates"] for raw in candidate["rawModelObservations"].values()),
    "productionApproval": 0,
}
(HERE / "three-crop-crosscheck-verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(report["summary"]))
