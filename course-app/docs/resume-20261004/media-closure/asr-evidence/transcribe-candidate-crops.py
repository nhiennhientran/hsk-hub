#!/usr/bin/env python3
"""Independently transcribe actual proposed PCM crops without source prompts.

Targets/source text are provenance-only; no expected text reaches inference.
This is a fixed 3-target second-stage pilot, not a batch expansion or release.
"""
import argparse
import hashlib
import importlib.metadata
import importlib.util
import resource
import sys
import time
from pathlib import Path
from datetime import datetime, timezone

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
spec = importlib.util.spec_from_file_location("original_asr", HERE / "transcribe-original-tracks.py")
asr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(asr)
MODELS = {
    "small": ("Systran/faster-whisper-small", "536b0662742c02347bc0e980a01041f333bce120"),
    "medium": ("Systran/faster-whisper-medium", "08e178d48790749d25932bbc082711ddcfdfbc4f"),
}
INPUT_SHA = "3ccb4354bc7ff3a899adb7543c97524989d6e9ca4ed5a348d7299456d7ee3ccf"


def main():
    import json
    import numpy as np
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", choices=MODELS, default="small")
    parser.add_argument("--input", default=str(HERE / "padded-crop-review-input.json"))
    parser.add_argument("--output", required=True)
    parser.add_argument("--cache", default=".repro-output/asr-model-cache")
    parser.add_argument("--preflight-only", action="store_true")
    args = parser.parse_args()
    input_path, output = Path(args.input).resolve(), Path(args.output).resolve()
    if asr.file_sha256(input_path) != INPUT_SHA:
        parser.error("candidate input differs from frozen limited review batch")
    if (output / "run.json").exists():
        parser.error("use a new evidence output directory")
    data = json.loads(input_path.read_text())
    if len(data["candidates"]) != 3:
        parser.error("only frozen 3-target limited review batch is authorized here")
    packages = {}
    expected = asr.fixed_requirements()
    for name in expected:
        try:
            packages[name] = importlib.metadata.version(name)
        except importlib.metadata.PackageNotFoundError:
            packages[name] = None
    model_id, revision = MODELS[args.model]
    run = {
        "schemaVersion": 1, "startedAt": datetime.now(timezone.utc).isoformat(),
        "scriptSHA256": asr.file_sha256(Path(__file__)),
        "originalASRScriptSHA256": asr.file_sha256(HERE / "transcribe-original-tracks.py"),
        "requirementsSHA256": asr.file_sha256(HERE / "requirements.txt"),
        "inputSHA256": INPUT_SHA, "repositoryCommit": asr.command_line(["git", "-C", str(ROOT), "rev-parse", "HEAD"]),
        "python": sys.version, "packages": packages,
        "options": asr.OPTIONS, "completedCrops": [],
        "certification": asr.CERTIFICATION, "status": "crop-preflight-started",
        "ffmpegVersion": asr.command_line(["ffmpeg", "-version"]),
    }
    output.mkdir(parents=True, exist_ok=True)
    asr.save_json(output / "run.json", run)
    started = time.perf_counter()
    try:
        source_pcm, crops = {}, []
        for candidate in data["candidates"]:
            source_file = candidate["sourceTrack"]
            path = ROOT / "course-app/public" / source_file
            if asr.file_sha256(path) != candidate["sourceSHA256"] or asr.file_sha256(ROOT / candidate["sourceLessonFile"]) != candidate["sourceLessonSHA256"]:
                raise ValueError("candidate original audio or frozen source lesson changed")
            if source_file not in source_pcm:
                source_pcm[source_file] = asr.decode(path)
            pcm_bytes = source_pcm[source_file]
            if hashlib.sha256(pcm_bytes).hexdigest() != candidate["sourcePCM_SHA256"]:
                raise ValueError("candidate original PCM differs from frozen local decode")
            first, last = candidate["sourceSampleRange16k"]
            if not 0 <= first < last <= len(pcm_bytes) // 4:
                raise ValueError("candidate crop source sample range invalid")
            crop_bytes = pcm_bytes[first * 4:last * 4]
            if hashlib.sha256(crop_bytes).hexdigest() != candidate["cropPCM_SHA256"]:
                raise ValueError("candidate actual crop PCM SHA differs")
            crops.append((candidate, np.frombuffer(crop_bytes, dtype="<f4").copy()))
        run["preflightPassedCrops"] = len(crops)
        asr.save_json(output / "run.json", run)
        if args.preflight_only:
            run["status"] = "3-actual-crop-preflight-passed-ASR-not-run"
        else:
            if any(packages[name] != version for name, version in expected.items()):
                raise ValueError("installed dependencies differ from all 26 fixed versions")
            from faster_whisper import WhisperModel
            from huggingface_hub import snapshot_download
            model_path = Path(snapshot_download(repo_id=model_id, revision=revision, allow_patterns=list(asr.MODEL_FILES),
                                                cache_dir=str(Path(args.cache).resolve()), token=False))
            if model_path.name != revision:
                raise ValueError("actual crop model snapshot differs from pinned revision")
            run["model"] = {"repository": model_id, "requestedRevision": revision,
                            "actualSnapshotRevision": model_path.name,
                            "files": [{"file": name, "sha256": asr.file_sha256(model_path / name),
                                       "bytes": (model_path / name).stat().st_size} for name in asr.MODEL_FILES],
                            "device": "cpu", "requestedComputeType": "int8", "cpuThreads": 2}
            asr.save_json(output / "run.json", run)
            model = WhisperModel(str(model_path), device="cpu", compute_type="int8", cpu_threads=2,
                                 num_workers=1, local_files_only=True)
            run["model"]["actualComputeType"] = str(model.model.compute_type)
            for index, (candidate, audio) in enumerate(crops):
                tick = time.perf_counter()
                segments, info = model.transcribe(audio, **asr.OPTIONS)
                raw_segments = [asr.plain(segment) for segment in segments]
                result = {"schemaVersion": 1, "candidateId": candidate["id"],
                          "originalSourceTrack": candidate["sourceTrack"], "originalSourceSHA256": candidate["sourceSHA256"],
                          "originalTrackOffsetSeconds": candidate["start"], "sourceSampleRange16k": candidate["sourceSampleRange16k"],
                          "cropPCM_SHA256": candidate["cropPCM_SHA256"], "cropDurationSeconds": len(audio) / 16000,
                          "options": asr.OPTIONS, "modelRepository": model_id, "modelRevision": revision,
                          "rawTranscriptionInfo": asr.plain(info), "rawSegments": raw_segments,
                          "elapsedInferenceSeconds": time.perf_counter() - tick, "certification": asr.CERTIFICATION}
                name = f"crops/crop-{index + 1:02d}.json"
                asr.save_json(output / name, result)
                run["completedCrops"].append({"candidateId": candidate["id"], "file": name,
                                               "sha256": asr.file_sha256(output / name)})
                asr.save_json(output / "run.json", run)
                print(f"Unprompted crop {index + 1}/3 saved", flush=True)
            run["status"] = "3-crop-ASR-evidence-complete-awaiting-independent-review"
        code = 0
    except Exception as error:
        run["status"] = "failed"
        run["failure"] = {"type": type(error).__name__, "message": str(error)[:1200]}
        print(f"Crop evidence failed: {type(error).__name__}: {str(error)[:500]}", file=sys.stderr)
        code = 1
    run["elapsedTotalSeconds"] = time.perf_counter() - started
    run["peakResidentMemoryKiB"] = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    run["finishedAt"] = datetime.now(timezone.utc).isoformat()
    asr.save_json(output / "run.json", run)
    return code


if __name__ == "__main__":
    raise SystemExit(main())
