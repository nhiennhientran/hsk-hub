#!/usr/bin/env python3
"""Read official tracks and write unprompted ASR evidence; never promote clips.

The source Chinese is saved separately for later comparison and is never passed
to Whisper. All timestamps remain machine observations, not listening approval.
--preflight-only needs only Python and ffmpeg, not an ASR installation.
"""
from __future__ import annotations

import argparse
import dataclasses
import hashlib
import importlib.metadata
import json
import math
import platform
import re
import resource
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

MODEL_REPO = "Systran/faster-whisper-small"
MODEL_REVISION = "536b0662742c02347bc0e980a01041f333bce120"
MODEL_FILES = ("config.json", "model.bin", "tokenizer.json", "vocabulary.txt")
SAMPLE_RATE = 16000
OPTIONS = {
    "language": "zh", "task": "transcribe", "beam_size": 5, "best_of": 5,
    "temperature": 0.0, "word_timestamps": True, "vad_filter": False,
    "condition_on_previous_text": False, "initial_prompt": None,
    "prefix": None, "hotwords": None,
}
CERTIFICATION = {
    "asrOnly": True, "humanListening": False, "nativeSpeakerReview": False,
    "acousticBoundaryApproval": False, "printedSourceMatchApproval": False,
    "productionClipApproval": False, "promotedClipCount": 0,
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for block in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def fixed_requirements() -> dict[str, str]:
    requirements = {}
    for line in Path(__file__).with_name("requirements.txt").read_text().splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        name, version = line.strip().split("==")
        requirements[name] = version
    return requirements


def plain(value: Any) -> Any:
    """Preserve raw fields from the installed version without lossy selection."""
    if dataclasses.is_dataclass(value):
        return plain(dataclasses.asdict(value))
    if hasattr(value, "_asdict"):
        return plain(value._asdict())
    if isinstance(value, dict):
        return {str(key): plain(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [plain(item) for item in value]
    if hasattr(value, "item"):
        return plain(value.item())
    if isinstance(value, float) and not math.isfinite(value):
        raise ValueError("non-finite evidence field")
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    raise TypeError(f"unsupported evidence value type: {type(value).__name__}")


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(plain(data), ensure_ascii=False, indent=2,
                                     allow_nan=False) + "\n", encoding="utf-8")
    temporary.replace(path)


def command_line(command: list[str]) -> str:
    return subprocess.run(command, check=True, capture_output=True,
                          text=True, timeout=30).stdout.splitlines()[0]


def repo_root(explicit: str | None) -> Path:
    if explicit:
        root = Path(explicit).resolve()
    else:
        root = next((parent for parent in Path(__file__).resolve().parents
                     if (parent / "course-app/content/audio-manifest.json").is_file()), None)
        if root is None:
            raise ValueError("cannot locate repository; pass --repo-root")
    if not (root / "course-app/content/audio-manifest.json").is_file():
        raise ValueError("repo-root does not contain the official audio manifest")
    return root


def decode(path: Path) -> bytes:
    result = subprocess.run([
        "ffmpeg", "-nostdin", "-v", "error", "-i", str(path), "-map", "0:a:0",
        "-ac", "1", "-ar", str(SAMPLE_RATE), "-f", "f32le", "-",
    ], check=True, capture_output=True, timeout=120)
    if not result.stdout or len(result.stdout) % 4:
        raise ValueError("invalid decoded mono float32 PCM")
    return result.stdout


def preflight(root: Path, level: int, lessons: list[int], output: Path) -> dict:
    manifest_path = root / "course-app/content/audio-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    tracks = sorted((track for track in manifest["tracks"]
                     if track["level"] == level and track["lesson"] in lessons),
                    key=lambda track: (track["lesson"], track["track"]))
    expected = {(lesson, track) for lesson in lessons for track in range(1, 9)}
    actual = [(track["lesson"], track["track"]) for track in tracks]
    if len(actual) != len(set(actual)) or set(actual) != expected:
        raise ValueError("batch must contain exactly tracks 1–8 for every requested lesson")
    results, sources = [], []
    for lesson in lessons:
        source_path = root / f"course-app/content/hsk{level}/lesson-{lesson:02d}.json"
        source = json.loads(source_path.read_text(encoding="utf-8"))
        if source["number"] != lesson or source["courseId"] != f"hsk{level}-fltrp-2026":
            raise ValueError("lesson identity mismatch")
        sources.append({
            "file": source_path.relative_to(root).as_posix(),
            "sha256": file_sha256(source_path), "id": source["id"],
            "source": source["source"],
            "texts": [{"id": text["id"], "audioTrack": text["audioTrack"],
                       "lines": [{key: line[key] for key in ("id", "zh", "source")}
                                 for line in text["lines"]]} for text in source["texts"]],
            "vocabulary": [{key: word.get(key) for key in
                            ("id", "zh", "audioTrack", "sourceText", "source")}
                           for word in source["vocabulary"]],
        })
    for track in tracks:
        wanted = f"course-assets/hsk{level}/audio/{track['lesson']}-{track['track']}.mp3"
        if track["file"] != wanted or not re.fullmatch(r"[0-9a-f]{64}", track["sha256"]):
            raise ValueError("noncanonical original audio path or SHA")
        path = root / "course-app/public" / wanted
        actual_sha = file_sha256(path)
        if actual_sha != track["sha256"] or path.stat().st_size != track["bytes"]:
            raise ValueError(f"original audio integrity mismatch: {wanted}")
        pcm = decode(path)
        duration = len(pcm) / (4 * SAMPLE_RATE)
        if abs(duration - track["duration"]) > 0.35:
            raise ValueError(f"decoded duration mismatch: {wanted}")
        results.append({
            "id": track["id"], "level": level, "lesson": track["lesson"],
            "track": track["track"], "kind": track["kind"], "text": track["text"],
            "file": wanted, "sha256": actual_sha, "bytes": path.stat().st_size,
            "manifestDurationSeconds": track["duration"],
            "pcm": {"format": "f32le", "sampleRate": SAMPLE_RATE, "channels": 1,
                    "samples": len(pcm) // 4, "durationSeconds": duration,
                    "sha256": sha256(pcm)}, "fullDecode": "passed",
        })
        print(f"preflight HSK{level} L{track['lesson']:02d} T{track['track']}: passed", flush=True)
    source_evidence = {
        "schemaVersion": 1, "purpose": "post-ASR comparison only; never model input",
        "lessons": sources,
    }
    save_json(output / "source-comparison-input.json", source_evidence)
    report = {
        "schemaVersion": 1, "level": level, "lessons": lessons,
        "expectedTrackCount": len(expected), "passedTrackCount": len(results),
        "audioManifestSHA256": file_sha256(manifest_path),
        "sourceComparisonInputSHA256": file_sha256(output / "source-comparison-input.json"),
        "totalDecodedSeconds": sum(track["pcm"]["durationSeconds"] for track in results),
        "tracks": results, "certification": CERTIFICATION,
    }
    save_json(output / "preflight.json", report)
    return report


def transcribe(root: Path, output: Path, cache: Path, report: dict,
               threads: int, model_id: str, model_revision: str, run: dict) -> None:
    import numpy as np
    from faster_whisper import WhisperModel
    from huggingface_hub import snapshot_download

    started = time.perf_counter()
    model_path = Path(snapshot_download(
        repo_id=model_id, revision=model_revision, cache_dir=str(cache),
        allow_patterns=list(MODEL_FILES), token=False,
    ))
    if model_path.name != model_revision:
        raise ValueError("downloaded model snapshot revision differs from pinned revision")
    model_files = []
    for filename in MODEL_FILES:
        path = model_path / filename
        if not path.is_file() or path.stat().st_size == 0:
            raise ValueError(f"missing model file: {filename}")
        model_files.append({"file": filename, "bytes": path.stat().st_size,
                            "sha256": file_sha256(path)})
    run["model"] = {
        "repository": model_id, "requestedRevision": model_revision,
        "actualSnapshotRevision": model_path.name, "files": model_files,
        "device": "cpu", "requestedComputeType": "int8",
        "cpuThreads": threads, "numWorkers": 1,
    }
    save_json(output / "run.json", run)
    model = WhisperModel(str(model_path), device="cpu", compute_type="int8",
                         cpu_threads=threads, num_workers=1, local_files_only=True)
    run["model"]["actualComputeType"] = str(model.model.compute_type)
    run["model"]["downloadAndLoadSeconds"] = time.perf_counter() - started
    run["status"] = "transcribing"
    save_json(output / "run.json", run)
    for track in report["tracks"]:
        pcm = decode(root / "course-app/public" / track["file"])
        if sha256(pcm) != track["pcm"]["sha256"]:
            raise ValueError("PCM changed between preflight and inference")
        audio = np.frombuffer(pcm, dtype="<f4").copy()
        started = time.perf_counter()
        segments, info = model.transcribe(audio, **OPTIONS)
        raw_segments = [plain(segment) for segment in segments]
        elapsed = time.perf_counter() - started
        name = f"hsk{track['level']}-l{track['lesson']:02d}-t{track['track']}.json"
        words = [word for segment in raw_segments for word in (segment.get("words") or [])]
        invalid_times = [index for index, word in enumerate(words)
                         if not 0 <= word["start"] <= word["end"] <=
                         track["pcm"]["durationSeconds"] + 0.1]
        # Invalid/hallucinated ASR observations are retained and flagged, not fixed.
        result = {
            "schemaVersion": 1, "track": track, "options": OPTIONS,
            "modelRepository": model_id, "modelRevision": model_revision,
            "rawTranscriptionInfo": plain(info), "rawSegments": raw_segments,
            "elapsedInferenceSeconds": elapsed,
            "realTimeFactor": elapsed / track["pcm"]["durationSeconds"],
            "observationChecks": {"rawWordCount": len(words),
                                  "invalidWordTimeIndices": invalid_times,
                                  "nonemptyTranscript": any(segment.get("text", "").strip()
                                                             for segment in raw_segments)},
            "certification": CERTIFICATION,
        }
        save_json(output / "tracks" / name, result)
        run["completedTracks"].append({
            "id": track["id"], "file": "tracks/" + name,
            "sha256": file_sha256(output / "tracks" / name),
            "elapsedInferenceSeconds": elapsed, "rawWordCount": len(words),
            "invalidWordTimeCount": len(invalid_times),
        })
        save_json(output / "run.json", run)
        print(f"ASR HSK{track['level']} L{track['lesson']:02d} T{track['track']}: "
              f"{len(words)} raw word observations, {elapsed:.2f}s", flush=True)
    run["status"] = "completed-asr-evidence-awaiting-review"
    run["totalInferenceSeconds"] = sum(t["elapsedInferenceSeconds"] for t in run["completedTracks"])
    run["realTimeFactor"] = run["totalInferenceSeconds"] / report["totalDecodedSeconds"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root")
    parser.add_argument("--level", type=int, choices=(2, 3), default=2)
    parser.add_argument("--lessons", default="4,5,6")
    parser.add_argument("--output", required=True)
    parser.add_argument("--cache", default=".repro-output/asr-model-cache")
    parser.add_argument("--cpu-threads", type=int, default=2)
    parser.add_argument("--model-id", default=MODEL_REPO,
                        help="official Systran converted model; default is pinned small pilot")
    parser.add_argument("--model-revision", default=MODEL_REVISION,
                        help="full immutable HF commit; verify model-specific commit before use")
    parser.add_argument("--preflight-only", action="store_true")
    parser.add_argument("--allow-expanded-batch", action="store_true",
                        help="root may enable only after pilot performance/quality review")
    args = parser.parse_args()
    if not re.fullmatch(r"[1-9][0-9]*(,[1-9][0-9]*)*", args.lessons):
        parser.error("lessons must be comma-separated positive integers")
    lessons = sorted(int(value) for value in args.lessons.split(","))
    if len(lessons) != len(set(lessons)) or len(lessons) > 3:
        parser.error("batch must contain one to three unique lessons")
    if any(lesson > (15 if args.level == 2 else 18) for lesson in lessons):
        parser.error("lesson number outside official course")
    if args.cpu_threads not in (1, 2, 4, 8):
        parser.error("cpu-threads must be 1, 2, 4 or 8")
    if not re.fullmatch(r"Systran/faster-whisper-(tiny|base|small|medium|large-v2|large-v3)", args.model_id):
        parser.error("model-id must name an official Systran multilingual model")
    if not re.fullmatch(r"[0-9a-f]{40}", args.model_revision):
        parser.error("model-revision must be a full 40-character immutable commit")
    if args.model_id != MODEL_REPO and args.model_revision == MODEL_REVISION:
        parser.error("alternative model requires its own verified model-revision")
    if (args.level, lessons) != (2, [4, 5, 6]) and not args.preflight_only and not args.allow_expanded_batch:
        parser.error("expanded inference requires explicit pilot-review gate override")
    root = repo_root(args.repo_root)
    output = Path(args.output).resolve()
    if output == root or (output.is_relative_to(root) and "public" in output.relative_to(root).parts):
        parser.error("evidence output must not be website public content")
    if (output / "run.json").exists():
        parser.error("run.json already exists: use a fresh evidence output directory")
    output.mkdir(parents=True, exist_ok=True)
    packages = {}
    expected_packages = fixed_requirements()
    for package in [*expected_packages, "pip"]:
        try:
            packages[package] = importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError:
            packages[package] = None
    try:
        git_commit = command_line(["git", "-C", str(root), "rev-parse", "HEAD"])
    except subprocess.SubprocessError:
        git_commit = None
    run = {
        "schemaVersion": 1, "startedAt": datetime.now(timezone.utc).isoformat(),
        "mode": "preflight-only" if args.preflight_only else "unprompted-asr",
        "scriptSHA256": file_sha256(Path(__file__)), "repositoryCommit": git_commit,
        "requirementsSHA256": file_sha256(Path(__file__).with_name("requirements.txt")),
        "requestedModel": {"repository": args.model_id, "revision": args.model_revision},
        "python": sys.version, "platform": platform.platform(), "packages": packages,
        "dependenciesMatchPinnedRequirements": all(packages[name] == version
                                                    for name, version in expected_packages.items()),
        "ffmpegVersion": command_line(["ffmpeg", "-version"]),
        "options": OPTIONS, "certification": CERTIFICATION,
        "status": "preflight-started", "completedTracks": [],
    }
    save_json(output / "run.json", run)
    started = time.perf_counter()
    try:
        report = preflight(root, args.level, lessons, output)
        run["preflightSHA256"] = file_sha256(output / "preflight.json")
        run["preflightSeconds"] = time.perf_counter() - started
        run["requestedTrackCount"] = report["expectedTrackCount"]
        if args.preflight_only:
            run["status"] = "preflight-passed-asr-not-run"
        else:
            if not run["dependenciesMatchPinnedRequirements"]:
                raise ValueError("installed dependency versions differ from fixed requirements")
            transcribe(root, output, Path(args.cache).resolve(), report, args.cpu_threads,
                       args.model_id, args.model_revision, run)
        return_code = 0
    except Exception as error:
        run["status"] = "failed"
        # Errors are diagnostics, not credential/environment dumps or prompts.
        run["failure"] = {"type": type(error).__name__, "message": str(error)[:1500]}
        print(f"Evidence run failed: {type(error).__name__}: {str(error)[:500]}", file=sys.stderr)
        return_code = 1
    run["elapsedTotalSeconds"] = time.perf_counter() - started
    run["peakResidentMemoryKiB"] = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    run["finishedAt"] = datetime.now(timezone.utc).isoformat()
    save_json(output / "run.json", run)
    return return_code


if __name__ == "__main__":
    raise SystemExit(main())
