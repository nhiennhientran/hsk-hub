#!/usr/bin/env python3
"""Source-bound audio candidates and resumable unprompted actual-crop inference.

Candidate construction is deliberately separate from independent review and
runtime publication. Quiet edges and ASR matches never approve a segment here.
"""
from __future__ import annotations
import argparse
import collections
import dataclasses
import hashlib
import importlib.metadata
import json
import math
import os
import re
import subprocess
import sys
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_SOURCE = Path(__file__).read_bytes()
SCRIPT_SHA256 = hashlib.sha256(SCRIPT_SOURCE).hexdigest()

RATE = 16000
MODELS = {
    "small": ("Systran/faster-whisper-small", "536b0662742c02347bc0e980a01041f333bce120"),
    "medium": ("Systran/faster-whisper-medium", "08e178d48790749d25932bbc082711ddcfdfbc4f"),
}
OPTIONS = {"language": "zh", "task": "transcribe", "beam_size": 5,
           "best_of": 5, "temperature": 0.0, "word_timestamps": True,
           "vad_filter": False, "condition_on_previous_text": False,
           "initial_prompt": None, "prefix": None, "hotwords": None}
CERTIFICATION = {"asrOnly": True, "humanListening": False,
                 "nativeSpeakerReview": False, "pronunciationToneCertified": False,
                 "devicePlaybackCertified": False, "productionClipApproval": False}
_script_normalizer = None

def comparison_text(text):
    """Explicit script conversion only, preserving original ASR text elsewhere."""
    global _script_normalizer
    if _script_normalizer is None:
        try:
            from opencc import OpenCC
            _script_normalizer = OpenCC("t2s")
        except ImportError:
            _script_normalizer = False
    converted = _script_normalizer.convert(text) if _script_normalizer else text
    return cjk(converted)

def utc():
    return datetime.now(timezone.utc).isoformat()

def sha(data):
    return hashlib.sha256(data).hexdigest()

def file_sha(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()

def plain(value):
    if dataclasses.is_dataclass(value):
        return plain(dataclasses.asdict(value))
    if hasattr(value, "_asdict"):
        return plain(value._asdict())
    if isinstance(value, dict):
        return {str(k): plain(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [plain(v) for v in value]
    if hasattr(value, "item"):
        return plain(value.item())
    if isinstance(value, float) and not math.isfinite(value):
        raise ValueError("non-finite evidence")
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    raise TypeError(type(value).__name__)

def save(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + ".tmp")
    temp.write_text(json.dumps(plain(value), ensure_ascii=False, indent=2,
                               allow_nan=False) + "\n", encoding="utf-8")
    temp.replace(path)

def read(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))

def root_path(explicit=None):
    if explicit:
        root = Path(explicit).resolve()
    else:
        root = next(p for p in Path(__file__).resolve().parents
                    if (p / "course-app/content/audio-manifest.json").is_file())
    return root

def rel(path, root):
    return Path(path).resolve().relative_to(root).as_posix()

def source_path(root, name):
    name = Path(name)
    if name.is_absolute() or ".." in name.parts:
        raise ValueError("source path must be repository-relative")
    direct = root / name
    if direct.is_file():
        return direct
    public = root / "course-app/public" / name
    if public.is_file():
        return public
    raise FileNotFoundError(str(name))

def cjk(text):
    return "".join(c for c in unicodedata.normalize("NFKC", text)
                   if "\u3400" <= c <= "\u9fff" or "\U00020000" <= c <= "\U000323af")

def split_sentences(text):
    return [s.strip() for s in re.findall(r"[^。！？!?]+[。！？!?]*", text) if cjk(s)]

def inventory(root, level, lessons=None):
    manifest_path = root / "course-app/content/audio-manifest.json"
    tracks = read(manifest_path)["tracks"]
    count = 15 if level == 2 else 18
    lessons = lessons or list(range(1, count + 1))
    targets = []
    for number in lessons:
        path = root / f"course-app/content/hsk{level}/lesson-{number:02d}.json"
        lesson = read(path)
        lesson_sha = file_sha(path)
        for word in lesson["vocabulary"]:
            track = next(t for t in tracks if t["level"] == level and
                         f"{t['lesson']}-{t['track']}" == word["audioTrack"])
            targets.append({"id": word["id"], "unit": "word", "level": level,
                            "lesson": number, "sourceZH": word["zh"],
                            "sourcePinyin": word["py"], "source": word["source"],
                            "sourceLessonFile": rel(path, root),
                            "sourceLessonSHA256": lesson_sha,
                            "sourceTrack": track["file"], "sourceSHA256": track["sha256"],
                            "trackKind": track["kind"], "sourceOrdinal": len(targets),
                            "sourceTextNumber": word["sourceText"]})
        for text in lesson["texts"]:
            track = next(t for t in tracks if t["level"] == level and
                         f"{t['lesson']}-{t['track']}" == text["audioTrack"])
            for line in text["lines"]:
                parts = split_sentences(line["zh"])
                for ordinal, part in enumerate(parts):
                    targets.append({"id": line["id"] if len(parts) == 1 else
                                    f"{line['id']}:sentence{ordinal + 1}",
                                    "unit": "sentence", "level": level, "lesson": number,
                                    "sourceZH": part, "sourcePinyin": line["py"] if len(parts) == 1 else "",
                                    "source": line["source"], "sourceLessonFile": rel(path, root),
                                    "sourceLessonSHA256": lesson_sha, "sourceTrack": track["file"],
                                    "sourceSHA256": track["sha256"], "trackKind": track["kind"],
                                    "parentLineId": line["id"] if len(parts) > 1 else None,
                                    "sentenceNumber": ordinal + 1, "sourceLineZH": line["zh"],
                                    "sourceOrdinal": len(targets),
                                    "sourceContextNote": "Source narration or stage directions are not automatically spoken."})
    if len({t["id"] for t in targets}) != len(targets):
        raise ValueError("duplicate semantic target ID")
    return {"schemaVersion": 1, "level": level, "lessons": lessons,
            "sourceAudioManifestSHA256": file_sha(manifest_path),
            "counts": dict(collections.Counter(t["unit"] for t in targets)),
            "targets": targets, "productionApprovedCount": 0,
            "certification": CERTIFICATION}

def decoded(root, target, cache):
    import numpy as np
    path = source_path(root, target["sourceTrack"])
    actual_sha = file_sha(path)
    if actual_sha != target["sourceSHA256"]:
        raise ValueError("source original SHA changed: " + target["sourceTrack"])
    key = actual_sha + "-mono16000-f32-v1"
    pcm_path = cache / (key + ".f32")
    meta_path = cache / (key + ".json")
    if pcm_path.is_file() and meta_path.is_file():
        meta = read(meta_path)
        if meta["sourceSHA256"] != actual_sha or file_sha(pcm_path) != meta["pcmSHA256"]:
            raise ValueError("corrupt decode cache")
        blob = pcm_path.read_bytes()
    else:
        blob = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(path),
                               "-map", "0:a:0", "-ac", "1", "-ar", str(RATE),
                               "-f", "f32le", "-"], check=True, capture_output=True,
                              timeout=120).stdout
        if not blob or len(blob) % 4:
            raise ValueError("empty or incomplete PCM decode")
        cache.mkdir(parents=True, exist_ok=True)
        tmp = pcm_path.with_suffix(".tmp")
        tmp.write_bytes(blob)
        tmp.replace(pcm_path)
        save(meta_path, {"sourceSHA256": actual_sha, "pcmSHA256": sha(blob),
                         "sampleRate": RATE, "samples": len(blob) // 4,
                         "format": "f32le", "ffmpegVersion": subprocess.run(
                             ["ffmpeg", "-version"], capture_output=True, text=True,
                             check=True).stdout.splitlines()[0]})
    return np.frombuffer(blob, dtype="<f4"), blob, pcm_path

def raw_files(root, level):
    base = root / "course-app/docs/resume-20261004/media-closure/asr-evidence"
    found = collections.defaultdict(list)
    for path in sorted(base.rglob(f"tracks/hsk{level}-*.json")):
        raw = read(path)
        if not raw.get("track") or not raw.get("rawSegments"):
            continue
        opt = raw.get("options", {})
        if opt.get("condition_on_previous_text") is not False or any(
                opt.get(k, "missing") is not None for k in ("initial_prompt", "prefix", "hotwords")):
            continue
        if raw.get("modelRevision") not in {v[1] for v in MODELS.values()}:
            continue
        found[raw["track"]["file"]].append((path, raw))
    return found

def raw_occurrences(target, path, raw):
    if raw["track"]["sha256"] != target["sourceSHA256"]:
        return []
    words = []
    chars, owners = [], []
    for si, segment in enumerate(raw["rawSegments"]):
        for wi, word in enumerate(segment.get("words") or []):
            text = comparison_text(word["word"])
            if not text:
                continue
            start = len(chars)
            words.append({**word, "segment": si, "wordIndex": wi,
                          "cjkStart": start, "cjkEnd": start + len(text)})
            chars.extend(text)
            owners.extend([len(words) - 1] * len(text))
    haystack = "".join(chars)
    needle = comparison_text(target["sourceZH"])
    result, cursor = [], 0
    while needle and (at := haystack.find(needle, cursor)) >= 0:
        cursor = at + 1
        first, last = owners[at], owners[at + len(needle) - 1]
        chosen = words[first:last + 1]
        complete = chosen[0]["cjkStart"] == at and chosen[-1]["cjkEnd"] == at + len(needle)
        if not complete or any(not 0 <= w["start"] < w["end"] for w in chosen):
            continue
        if any(a["end"] > b["end"] or a["start"] > b["start"] for a, b in zip(chosen, chosen[1:])):
            continue
        result.append({"start": chosen[0]["start"], "end": chosen[-1]["end"],
                       "method": "source-bound-existing-unprompted-whole-ASR-word-endpoints",
                       "rawEvidence": {"file": str(path), "sha256": file_sha(path),
                                       "modelRepository": raw["modelRepository"],
                                       "modelRevision": raw["modelRevision"],
                                       "minimumProbability": min(w["probability"] for w in chosen),
                                       "observedTranscript": "".join(w["word"] for w in chosen),
                                       "wordReferences": [{"segment": w["segment"], "word": w["wordIndex"]} for w in chosen],
                                       "previousWord": words[first - 1] if first else None,
                                       "followingWord": words[last + 1] if last + 1 < len(words) else None},
                       "comparisonNormalization": "NFKC+CJK+OpenCC t2s (raw transcript retained)" if _script_normalizer else "NFKC+CJK"})
    return result

def old_segments(root):
    found = {}
    for path in sorted((root / "course-app/content").glob("audio-segments-*.json")):
        value = read(path)
        for kind in ("words", "lines", "subsegments"):
            for key, segment in value.get(kind, {}).items():
                if kind == "lines" and segment.get("unit") != "sentence":
                    continue
                found[key] = {"start": segment["start"], "end": segment["end"],
                              "method": "recheck-existing-accepted-segment",
                              "repetition": segment.get("repetition"),
                              "oldRange": [segment["start"], segment["end"]],
                              "provenance": {"file": rel(path, root), "sha256": file_sha(path),
                                             "oldVerification": segment["verification"]}}
    return found

def acoustic_runs(pcm):
    """Speech-like energy runs are only order candidates; not semantic evidence."""
    import numpy as np
    hop = 160
    length = len(pcm) // hop
    if not length:
        return []
    rms = np.sqrt(np.mean(pcm[:length * hop].astype(np.float64).reshape(length, hop) ** 2, axis=1))
    db = 20 * np.log10(np.maximum(rms, 1e-12))
    active = db > -42
    intervals = []
    starts = np.flatnonzero(active & ~np.r_[False, active[:-1]])
    ends = np.flatnonzero(active & ~np.r_[active[1:], False]) + 1
    for first, last in zip(starts, ends):
        start, end = first / 100, last / 100
        if intervals and start - intervals[-1][1] <= .16:
            intervals[-1][1] = end
        else:
            intervals.append([start, end])
    return [x for x in intervals if x[1] - x[0] >= .06]

def quiet_boundary(pcm, timepoint, side):
    """Extend raw observations outward to a quiet window; never shrink phonemes."""
    import numpy as np
    if side == "start":
        nominal = max(0, timepoint - .10)
        search = np.arange(nominal, max(-.001, timepoint - .32), -.01)
    else:
        nominal = min(len(pcm) / RATE, timepoint + .12)
        search = np.arange(nominal, min(len(pcm) / RATE + .001, timepoint + .34), .01)
    for point in search:
        a, b = max(0, round((point - .01) * RATE)), min(len(pcm), round((point + .01) * RATE))
        values = pcm[a:b].astype(np.float64)
        if len(values) and np.sqrt(np.mean(values ** 2)) < 10 ** (-44 / 20):
            return max(0, min(len(pcm) / RATE, float(point)))
    return nominal

def build_candidates(root, data, cache):
    raw_by_track = raw_files(root, data["level"])
    old = old_segments(root)
    candidates, statuses = [], []
    groups = collections.defaultdict(list)
    for target in data["targets"]:
        groups[target["sourceTrack"]].append(target)
    for source, group in groups.items():
        pcm, blob, _ = decoded(root, group[0], cache)
        runs = acoustic_runs(pcm)
        # Assign only exact-count, order-based proposals. Independent actual
        # crop ASR and neighbor/boundary review must establish each identity.
        vocab_heads = list(dict.fromkeys(t["sourceZH"] for t in group)) if group[0]["unit"] == "word" else []
        ordinal_proposals = {}
        if vocab_heads and len(runs) in (len(vocab_heads), len(vocab_heads) * 2):
            repeat = len(runs) // len(vocab_heads)
            for i, text in enumerate(vocab_heads):
                ordinal_proposals[text] = [{"start": runs[i * repeat + rep][0],
                                            "end": runs[i * repeat + rep][1],
                                            "method": "exact-acoustic-run-count-source-order-proposal-only",
                                            "repetition": rep + 1,
                                            "acousticOrder": {"runCount": len(runs), "sourceHeads": vocab_heads,
                                                              "expectedRepetitions": repeat, "assignedRunIndex": i * repeat + rep}}
                                           for rep in range(repeat)]
        for target in group:
            proposals = []
            if target["id"] in old:
                proposals.append(old[target["id"]])
            for path, raw in raw_by_track.get(source, []):
                proposals.extend(raw_occurrences(target, path, raw))
            proposals.extend(ordinal_proposals.get(target["sourceZH"], []))
            raw_ordered = sorted((p for p in proposals if p.get("rawEvidence")), key=lambda p: (p["start"], p["end"]))
            if target["unit"] == "word":
                occurrences = list(dict.fromkeys((round(p["start"], 3), round(p["end"], 3)) for p in raw_ordered))
                for p in raw_ordered:
                    p.setdefault("repetition", occurrences.index((round(p["start"], 3), round(p["end"], 3))) + 1)
            unique = {}
            for proposal in proposals:
                if not 0 <= proposal["start"] < proposal["end"] <= len(pcm) / RATE + .03:
                    continue
                if proposal["method"] == "recheck-existing-accepted-segment":
                    start, end = proposal["start"], proposal["end"]
                else:
                    start = quiet_boundary(pcm, proposal["start"], "start")
                    end = quiet_boundary(pcm, proposal["end"], "end")
                frames = [max(0, math.floor(start * RATE)), min(len(pcm), math.ceil(end * RATE))]
                key = tuple(frames)
                if key in unique:
                    unique[key]["alternativeProvenance"].append(proposal)
                    continue
                candidate = {**target, **proposal, "start": frames[0] / RATE,
                             "end": frames[1] / RATE, "rawRange": [proposal["start"], proposal["end"]],
                             "sourceSampleRange16k": frames, "sourcePCM_SHA256": sha(blob),
                             "alternativeProvenance": [], "status": "candidate-awaiting-actual-crop-independent-ASR-and-review",
                             "productionApproved": False, "humanListening": False}
                if candidate.get("rawEvidence"):
                    candidate["rawEvidence"]["file"] = rel(candidate["rawEvidence"]["file"], root)
                    candidate["sourceOccurrenceEvidence"] = {"kind": "source-bound-unprompted-ASR-observation",
                                                             **candidate["rawEvidence"]}
                elif candidate.get("acousticOrder"):
                    candidate["sourceOccurrenceEvidence"] = {"kind": "source-order-acoustic-candidate-not-semantic-approval",
                                                             "sourceTrack": source,
                                                             "sourceSHA256": target["sourceSHA256"],
                                                             "sourcePCM_SHA256": sha(blob),
                                                             "sourceSampleRange16k": frames,
                                                             **candidate["acousticOrder"]}
                elif candidate.get("provenance"):
                    candidate["sourceOccurrenceEvidence"] = {"kind": "existing-accepted-source-range-pending-new-review",
                                                             "id": target["id"], **candidate["provenance"]}
                unique[key] = candidate
            candidates.extend(unique.values())
            statuses.append({**target, "candidateCount": len(unique),
                             "status": "candidate-awaiting-independent-review" if unique else "needs-new-source-ASR-or-boundary-resolution",
                             "productionApproved": False, "absenceConfirmed": False})
        print(json.dumps({"sourceTrack": source, "targets": len(group),
                          "speechLikeRuns": len(runs), "totalCandidates": len(candidates)}), flush=True)
    return {**data, "targets": candidates, "targetStatus": statuses,
            "candidateCount": len(candidates), "createdAt": utc(),
            "scriptSHA256": SCRIPT_SHA256}

def monotonic_alignment(expected, observed):
    """Candidate character alignment only. It cannot certify any spoken word."""
    import numpy as np
    n, m = len(expected), len(observed)
    matrix = np.empty((n + 1, m + 1), np.float32)
    back = np.zeros((n + 1, m + 1), np.uint8)
    matrix[:, 0] = np.arange(n + 1)
    matrix[0, :] = np.arange(m + 1)
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            choices = (matrix[i - 1, j - 1] + (0 if expected[i - 1] == observed[j - 1] else 1.1),
                       matrix[i - 1, j] + 1, matrix[i, j - 1] + 1)
            key = min(range(3), key=choices.__getitem__)
            matrix[i, j], back[i, j] = choices[key], key
    mapping, i, j = {}, n, m
    while i or j:
        if i and j and back[i, j] == 0:
            mapping[i - 1] = j - 1
            i, j = i - 1, j - 1
        elif i and (not j or back[i, j] == 1):
            i -= 1
        else:
            j -= 1
    return mapping, float(matrix[n, m])

def sentence_candidates(root, data, cache):
    by_track = raw_files(root, data["level"])
    old = old_segments(root)
    groups = collections.defaultdict(list)
    for target in data["targets"]:
        if target["unit"] == "sentence":
            groups[target["sourceTrack"]].append(target)
    candidates, held, diagnostics = [], [], []
    for track, targets in groups.items():
        pcm, blob, _ = decoded(root, targets[0], cache)
        choices = by_track.get(track, [])
        choices.sort(key=lambda p: ("small" not in p[1]["modelRepository"], str(p[0])))
        if not choices:
            for target in targets:
                if target["id"] in old:
                    candidate = {**target, **old[target["id"]], "sourcePCM_SHA256": sha(blob),
                                 "status": "old-range-pending-actual-crop-independent-review"}
                    candidates.append(candidate)
                else:
                    held.append({**target, "holdReasons": ["no-raw-ASR-or-existing-accepted-range"]})
            continue
        path, raw = choices[0]
        if raw["track"]["sha256"] != targets[0]["sourceSHA256"]:
            raise ValueError("full source-ASR audio identity changed")
        tokens, owners, chars = [], [], ""
        for si, segment in enumerate(raw["rawSegments"]):
            for wi, word in enumerate(segment.get("words") or []):
                text = comparison_text(word["word"])
                tokens.append({**word, "segment": si, "wordIndex": wi})
                chars += text
                owners.extend([len(tokens) - 1] * len(text))
        expected = "".join(comparison_text(t["sourceZH"]) for t in targets)
        mapping, cost = monotonic_alignment(expected, chars)
        raw_binding = {"file": rel(path, root), "sha256": file_sha(path),
                       "modelRepository": raw["modelRepository"], "modelRevision": raw["modelRevision"]}
        diagnostics.append({"sourceTrack": track, "sourceSHA256": targets[0]["sourceSHA256"],
                            "rawEvidence": raw_binding, "expectedCharacters": len(expected),
                            "observedCharacters": len(chars), "globalEditDistance": round(cost, 4)})
        offset = 0
        for target in targets:
            text = comparison_text(target["sourceZH"])
            source_positions = list(range(offset, offset + len(text)))
            matched = [mapping[i] for i in source_positions if i in mapping]
            if not matched:
                held.append({**target, "holdReasons": ["source-not-observed-in-global-alignment"]})
                offset += len(text)
                continue
            first, last = matched[0], matched[-1]
            fi, li = owners[first], owners[last]
            fw, lw = tokens[fi], tokens[li]
            if not 0 <= fw["start"] < lw["end"] <= len(pcm) / RATE + .03:
                held.append({**target, "holdReasons": ["raw-ASR-range-invalid"]})
                offset += len(text)
                continue
            start, end = quiet_boundary(pcm, fw["start"], "start"), quiet_boundary(pcm, lw["end"], "end")
            frames = [max(0, math.floor(start * RATE)), min(len(pcm), math.ceil(end * RATE))]
            omitted = [expected[i] for i in source_positions if i not in mapping]
            substitutions = [{"source": expected[i], "observed": chars[mapping[i]], "sourceOffset": i - offset}
                             for i in source_positions if i in mapping and expected[i] != chars[mapping[i]]]
            boundary_inside = [first > 0 and owners[first - 1] == fi,
                               last + 1 < len(owners) and owners[last + 1] == li]
            candidates.append({**target, "start": frames[0] / RATE, "end": frames[1] / RATE,
                               "sourceSampleRange16k": frames, "sourcePCM_SHA256": sha(blob),
                               "method": "monotonic-source-to-unprompted-ASR-character-candidate-only",
                               "rawRange": [fw["start"], lw["end"]],
                               "rawEvidence": {**raw_binding,
                                               "wordReferences": [{"segment": w["segment"], "word": w["wordIndex"]} for w in tokens[fi:li + 1]],
                                               "previousWord": tokens[fi - 1] if fi else None,
                                               "followingWord": tokens[li + 1] if li + 1 < len(tokens) else None},
                               "comparisonNormalization": "NFKC+CJK+OpenCC t2s (raw transcript retained)" if _script_normalizer else "NFKC+CJK",
                               "candidateDiagnostics": {"omittedSourceCharacters": omitted,
                                                        "substitutions": substitutions,
                                                        "boundaryInsideRawToken": boundary_inside,
                                                        "normalizedObservedExcerpt": chars[first:last + 1]},
                               "status": "candidate-awaiting-actual-crop-independent-ASR-and-review",
                               "productionApproved": False, "humanListening": False})
            offset += len(text)
    return {**data, "targets": candidates, "held": held, "diagnostics": diagnostics,
            "counts": {"sentence": sum(t["unit"] == "sentence" for t in data["targets"])},
            "candidateCount": len(candidates), "productionApprovedCount": 0,
            "scriptSHA256": SCRIPT_SHA256, "createdAt": utc()}

def db(pcm, first, last):
    import numpy as np
    values = pcm[max(0, first):min(len(pcm), last)].astype(np.float64)
    if not len(values):
        return None
    return round(20 * math.log10(max(1e-12, float(np.sqrt(np.mean(values ** 2))))), 3)

def prepare_crops(root, data, output, cache):
    decoded_tracks = {}
    processed = []
    for i, original in enumerate(data["targets"]):
        target = dict(original)
        lesson = root / target["sourceLessonFile"]
        if file_sha(lesson) != target["sourceLessonSHA256"]:
            raise ValueError("source lesson changed for " + target["id"])
        identity = (target["sourceTrack"], target["sourceSHA256"])
        if identity not in decoded_tracks:
            decoded_tracks[identity] = decoded(root, target, cache)
        pcm, blob, pcm_path = decoded_tracks[identity]
        frames = target.get("sourceSampleRange16k") or [math.floor(target["start"] * RATE), math.ceil(target["end"] * RATE)]
        if not all(isinstance(x, int) for x in frames) or not 0 <= frames[0] < frames[1] <= len(pcm):
            raise ValueError("invalid actual source sample range for " + target["id"])
        if target.get("sourcePCM_SHA256") and target["sourcePCM_SHA256"] != sha(blob):
            raise ValueError("source decode changed for " + target["id"])
        crop = blob[frames[0] * 4:frames[1] * 4]
        crop_sha = sha(crop)
        path = output / "candidate-crops" / (crop_sha + ".f32")
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists() and file_sha(path) != crop_sha:
            raise ValueError("corrupt existing actual crop")
        if not path.exists():
            path.write_bytes(crop)
        first, last = frames
        target.update({"sourceSampleRange16k": frames, "sourcePCM_SHA256": sha(blob),
                       "sourcePCMFile": rel(pcm_path, root), "cropPCM_SHA256": crop_sha,
                       "cropPCMFile": rel(path, root), "cropDurationSeconds": (last - first) / RATE,
                       "start": first / RATE, "end": last / RATE,
                       "boundaryRMSDbFS20ms": {"beforeStart": db(pcm, first - 320, first),
                                                "afterStart": db(pcm, first, first + 320),
                                                "beforeEnd": db(pcm, last - 320, last),
                                                "afterEnd": db(pcm, last, last + 320)},
                       "actualCropPrepared": True, "sampleRate": RATE,
                       "productionApproved": False, "humanListening": False})
        if target["unit"] == "word":
            runs = acoustic_runs(pcm[first:last])
            target["wordPronunciationRunCount"] = len(runs)
            target["wordPronunciationAcousticRuns"] = [[round(a + first / RATE, 6), round(b + first / RATE, 6)] for a, b in runs]
            target["wordSinglePronunciationAcousticPolicy"] = "Multiple separated speech-like runs require explicit repetition/phoneme review; ASR may suppress repeated words."
        target["candidateId"] = sha((target["id"] + ":" + target["sourceSHA256"] + ":" + str(frames)).encode())[:24]
        processed.append(target)
    result = {**data, "targets": processed, "actualCropPreparedCount": len(processed),
              "candidateInputPolicy": "Source ZH is comparison provenance only; never inference input.",
              "updatedAt": utc(), "scriptSHA256": SCRIPT_SHA256}
    save(output / "candidates.json", result)
    return result

def bind_inference(root, data, output, model_name):
    bound_count = 0
    for binding in data["targets"]:
        crop_sha = binding["cropPCM_SHA256"]
        evidence = output / model_name / "crops" / (crop_sha + ".json")
        if not evidence.is_file():
            continue
        result = read(evidence)
        if result.get("cropPCM_SHA256") != crop_sha or result.get("options") != OPTIONS or result.get("modelRevision") != MODELS[model_name][1]:
            raise ValueError("checkpoint model or actual-crop identity differs")
        if file_sha(root / binding["cropPCMFile"]) != crop_sha:
            raise ValueError("checkpoint actual crop changed")
        filename = re.sub(r"[^A-Za-z0-9_.-]", "_", binding["id"])
        bound = output / model_name / "bindings" / filename / (binding["candidateId"] + ".json")
        save(bound, {**result, "candidateId": binding["id"], "proposalId": binding["candidateId"],
                     "originalSourceTrack": binding["sourceTrack"], "originalSourceSHA256": binding["sourceSHA256"],
                     "sourceSampleRange16k": binding["sourceSampleRange16k"],
                     "originalTrackOffsetSeconds": binding["start"],
                     "deduplicatedRawASRFile": rel(evidence, root), "deduplicatedRawASRSHA256": file_sha(evidence)})
        bound_count += 1
    return {"boundCandidates": bound_count, "totalCandidates": len(data["targets"])}

def infer(root, data, output, cache, model_name, threads, model_path=None, limit=None):
    import numpy as np
    from faster_whisper import WhisperModel
    from huggingface_hub import snapshot_download
    repository, revision = MODELS[model_name]
    if model_path:
        snapshot = Path(model_path).resolve()
    else:
        snapshot = Path(snapshot_download(repo_id=repository, revision=revision,
                                         cache_dir=str(cache), token=False,
                                         allow_patterns=["config.json", "model.bin", "tokenizer.json", "vocabulary.*"]))
    if snapshot.name != revision:
        raise ValueError("model snapshot path does not match immutable revision")
    names = ["config.json", "model.bin", "tokenizer.json"]
    vocabulary = sorted(snapshot.glob("vocabulary.*"))
    if not vocabulary or any(not (snapshot / name).is_file() for name in names):
        raise ValueError("incomplete immutable ASR model snapshot")
    model_files = [{"file": p.name, "sha256": file_sha(p), "bytes": p.stat().st_size}
                   for p in [*(snapshot / n for n in names), *vocabulary]]
    packages = {}
    for name in ("faster-whisper", "ctranslate2", "numpy", "huggingface-hub"):
        packages[name] = importlib.metadata.version(name)
    # source text is absent from this model call and the cache identity.
    engine = WhisperModel(str(snapshot), device="cpu", compute_type="int8",
                          cpu_threads=threads, num_workers=1, local_files_only=True)
    unique = {}
    crop_targets = collections.defaultdict(list)
    for target in data["targets"]:
        unique.setdefault(target["cropPCM_SHA256"], target)
        crop_targets[target["cropPCM_SHA256"]].append(target)
    if limit:
        unique = dict(list(unique.items())[:limit])
    output.mkdir(parents=True, exist_ok=True)
    results = []
    started = time.perf_counter()
    inference_identity = sha(json.dumps({"model": model_files, "revision": revision,
                                        "options": OPTIONS, "packages": packages}, sort_keys=True).encode())
    for index, (crop_sha, target) in enumerate(unique.items()):
        path = root / target["cropPCMFile"]
        if file_sha(path) != crop_sha:
            raise ValueError("actual crop changed before independent inference")
        evidence = output / model_name / "crops" / (crop_sha + ".json")
        reused = False
        if evidence.is_file():
            result = read(evidence)
            if result.get("cropPCM_SHA256") != crop_sha or result.get("inferenceIdentity") != inference_identity:
                raise ValueError("ASR checkpoint identity differs; use a fresh output directory")
            reused = True
        else:
            audio = np.frombuffer(path.read_bytes(), dtype="<f4").copy()
            tick = time.perf_counter()
            segments, info = engine.transcribe(audio, **OPTIONS)
            raw_segments = [plain(s) for s in segments]
            result = {"schemaVersion": 1, "cropPCM_SHA256": crop_sha,
                      "cropDurationSeconds": len(audio) / RATE,
                      "inferenceIdentity": inference_identity,
                      "options": OPTIONS, "modelRepository": repository,
                      "modelRevision": revision, "modelFiles": model_files,
                      "packages": packages, "rawTranscriptionInfo": plain(info),
                      "rawSegments": raw_segments, "elapsedInferenceSeconds": time.perf_counter() - tick,
                      "scriptSHA256": SCRIPT_SHA256,
                      "certification": CERTIFICATION, "createdAt": utc()}
            save(evidence, result)
        # A crop can serve several semantic senses. Keep one model execution,
        # but bind every actual source-frame proposal to that immutable result.
        for binding in crop_targets[crop_sha]:
            filename = re.sub(r"[^A-Za-z0-9_.-]", "_", binding["id"])
            bound = output / model_name / "bindings" / filename / (binding["candidateId"] + ".json")
            bound_result = {**result, "candidateId": binding["id"],
                            "proposalId": binding["candidateId"],
                            "originalSourceTrack": binding["sourceTrack"],
                            "originalSourceSHA256": binding["sourceSHA256"],
                            "sourceSampleRange16k": binding["sourceSampleRange16k"],
                            "originalTrackOffsetSeconds": binding["start"],
                            "deduplicatedRawASRFile": rel(evidence, root),
                            "deduplicatedRawASRSHA256": file_sha(evidence)}
            save(bound, bound_result)
        results.append({"cropPCM_SHA256": crop_sha, "file": rel(evidence, root),
                        "sha256": file_sha(evidence), "reused": reused})
        save(output / model_name / "run.json", {"schemaVersion": 1, "model": model_name,
                                               "modelRepository": repository, "modelRevision": revision,
                                               "inferenceIdentity": inference_identity,
                                               "options": OPTIONS, "modelFiles": model_files,
                                               "completedCrops": results, "targetCandidates": len(data["targets"]),
                                               "uniqueActualCrops": len(unique), "status": "in-progress",
                                               "updatedAt": utc(), "certification": CERTIFICATION})
        print(json.dumps({"model": model_name, "completed": index + 1, "total": len(unique),
                          "reused": reused, "elapsedSeconds": round(time.perf_counter() - started, 2)}), flush=True)
    summary = {"schemaVersion": 1, "model": model_name, "modelRepository": repository,
               "modelRevision": revision, "inferenceIdentity": inference_identity,
               "options": OPTIONS, "modelFiles": model_files, "completedCrops": results,
               "targetCandidates": len(data["targets"]), "uniqueActualCrops": len(unique),
               "status": "actual-crop-ASR-complete-awaiting-independent-review",
               "elapsedSeconds": time.perf_counter() - started, "updatedAt": utc(),
               "certification": CERTIFICATION}
    save(output / model_name / "run.json", summary)
    return summary

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("inventory", "build-candidates", "sentence-candidates", "prepare-crops", "prepare-fulltracks", "infer", "bind-inference"))
    parser.add_argument("--repo-root")
    parser.add_argument("--level", type=int, choices=(2, 3))
    parser.add_argument("--lessons")
    parser.add_argument("--units", default="word,sentence")
    parser.add_argument("--input")
    parser.add_argument("--output", required=True)
    parser.add_argument("--pcm-cache", default="course-app/.repro-output/final-quality/audio-pcm-cache")
    parser.add_argument("--cache", default="course-app/.repro-output/final-quality/asr-model-cache")
    parser.add_argument("--model", choices=MODELS, default="small")
    parser.add_argument("--model-path")
    parser.add_argument("--threads", type=int, default=2)
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()
    root = root_path(args.repo_root)
    output = Path(args.output)
    output = output.resolve() if output.is_absolute() else (root / output).resolve()
    producer = output / "producers" / (SCRIPT_SHA256 + ".py")
    producer.parent.mkdir(parents=True, exist_ok=True)
    if not producer.exists():
        producer.write_bytes(SCRIPT_SOURCE)
    cache = (root / args.pcm_cache).resolve()
    if args.command in ("inventory", "build-candidates", "sentence-candidates"):
        if not args.level:
            parser.error("--level required")
        lessons = sorted(set(int(x) for x in args.lessons.split(","))) if args.lessons else None
        data = inventory(root, args.level, lessons)
        units = set(args.units.split(","))
        if not units <= {"word", "sentence"}:
            parser.error("--units must be word and/or sentence")
        data["targets"] = [t for t in data["targets"] if t["unit"] in units]
        data["counts"] = dict(collections.Counter(t["unit"] for t in data["targets"]))
        if args.command == "inventory":
            save(output / "inventory.json", data)
            print(json.dumps(data["counts"]))
        elif args.command == "sentence-candidates":
            candidates = sentence_candidates(root, data, cache)
            save(output / "source-candidates.json", candidates)
            result = prepare_crops(root, candidates, output, cache)
            print(json.dumps({"sourceSentences": candidates["counts"]["sentence"],
                              "actualCandidates": len(result["targets"]), "held": len(result["held"])}))
        else:
            candidates = build_candidates(root, data, cache)
            save(output / "source-candidates.json", candidates)
            result = prepare_crops(root, candidates, output, cache)
            save(output / "target-status.json", {"schemaVersion": 1, "counts": data["counts"],
                                                "targets": result["targetStatus"],
                                                "actualCandidateCount": len(result["targets"]),
                                                "productionApprovedCount": 0})
            print(json.dumps({"sourceTargets": len(data["targets"]), "actualCandidates": len(result["targets"])}))
    else:
        if not args.input:
            parser.error("--input required")
        data = read(Path(args.input) if Path(args.input).is_absolute() else root / args.input)
        if args.command == "bind-inference":
            print(json.dumps(bind_inference(root, data, output, args.model)))
        elif args.command == "prepare-fulltracks":
            for target in data["targets"]:
                pcm, blob, _ = decoded(root, target, cache)
                target.update({"start": 0.0, "end": len(pcm) / RATE,
                               "sourceSampleRange16k": [0, len(pcm)],
                               "sourcePCM_SHA256": sha(blob),
                               "unit": "original-track", "status": "original-track-unprompted-transcription-only"})
            result = prepare_crops(root, data, output, cache)
            print(json.dumps({"actualFullTracks": len(result["targets"])}))
        elif args.command == "prepare-crops":
            result = prepare_crops(root, data, output, cache)
            print(json.dumps({"actualCandidates": len(result["targets"])}))
        else:
            result = infer(root, data, output, (root / args.cache).resolve(),
                           args.model, args.threads, args.model_path, args.limit)
            print(json.dumps({"status": result["status"], "uniqueActualCrops": result["uniqueActualCrops"]}))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
