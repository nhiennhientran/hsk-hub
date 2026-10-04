#!/usr/bin/env python3
"""Compare unprompted raw observations with printed targets; do not certify clips.

Without --raw-dir, produce only deterministic printed-group/track target cues.
With --raw-dir, preserve strict exact CJK matches and whole ASR-word endpoints.
No guessed character timestamps, phonetic substitutions or silence binding.
"""
from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import math
import re
import unicodedata
from pathlib import Path


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def cjk(text: str) -> str:
    # Compatibility normalization only. Traditional/simplified and homophones
    # remain differences requiring actual review, not convenient replacements.
    return "".join(character for character in unicodedata.normalize("NFKC", text)
                   if "\u3400" <= character <= "\u9fff" or
                   "\U00020000" <= character <= "\U000323af")


def sentences(text: str) -> list[str]:
    return [piece.strip() for piece in re.findall(r"[^。！？!?]+[。！？!?]*", text)
            if cjk(piece)]


def differences(expected: str, actual: str) -> dict:
    matcher = difflib.SequenceMatcher(None, expected, actual, autojunk=False)
    return {"expectedCJK": expected, "observedCJK": actual,
            "sequenceSimilarity": matcher.ratio(),
            "residuals": [{"operation": operation, "sourceRange": [i, j],
                           "source": expected[i:j], "asrRange": [a, b],
                           "asr": actual[a:b]}
                          for operation, i, j, a, b in matcher.get_opcodes()
                          if operation != "equal"]}


def observations(raw: dict) -> tuple[list[dict], str, list[int]]:
    words, characters, owners = [], [], []
    duration = raw.get("track", {}).get("pcm", {}).get("durationSeconds")
    for segment_index, segment in enumerate(raw["rawSegments"]):
        for word_index, word in enumerate(segment.get("words") or []):
            normalized = cjk(word["word"])
            if not normalized:
                continue
            index = len(words)
            words.append({"rawSegmentIndex": segment_index, "rawWordIndex": word_index,
                          "raw": word, "normalizedCJK": normalized,
                          "withinTrackBounds": duration is None or
                                               0 <= word["start"] <= word["end"] <= duration,
                          "cjkStart": len(characters), "cjkEnd": len(characters) + len(normalized)})
            characters.extend(normalized)
            owners.extend([index] * len(normalized))
    return words, "".join(characters), owners


def validate_raw_track(raw: dict, track: dict) -> None:
    for field in ("id", "sha256", "file", "level", "lesson", "track", "kind"):
        if raw["track"].get(field) != track.get(field):
            raise ValueError(f"raw ASR original-track mismatch in {field}")
    options = raw["options"]
    if (options.get("language") != "zh" or options.get("task") != "transcribe" or
        options.get("word_timestamps") is not True or
        options.get("condition_on_previous_text") is not False or
        any(field not in options or options[field] is not None
            for field in ("initial_prompt", "prefix", "hotwords"))):
        raise ValueError("raw ASR is not unprompted independent Chinese word-timestamp evidence")
    if not re.fullmatch(r"[0-9a-f]{40}", raw["modelRevision"]):
        raise ValueError("raw ASR model does not record an immutable revision")


def exact_occurrences(target: dict, words: list[dict], text: str, owners: list[int]) -> dict:
    needle = cjk(target["zh"])
    unsupported_source = any(character.isalnum() and not cjk(character)
                             for character in unicodedata.normalize("NFKC", target["zh"]))
    matches, start = [], 0
    if needle:
        while (index := text.find(needle, start)) >= 0:
            first, last = words[owners[index]], words[owners[index + len(needle) - 1]]
            complete_words = first["cjkStart"] == index and last["cjkEnd"] == index + len(needle)
            matched_words = words[owners[index]:owners[index + len(needle) - 1] + 1]
            positive_times = all(math.isfinite(word["raw"]["start"]) and
                                 math.isfinite(word["raw"]["end"]) and
                                 0 <= word["raw"]["start"] < word["raw"]["end"] and
                                 word["withinTrackBounds"] for word in matched_words)
            ordered_times = all(previous["raw"]["start"] <= current["raw"]["start"] and
                                previous["raw"]["end"] <= current["raw"]["end"]
                                for previous, current in zip(matched_words, matched_words[1:]))
            viable = complete_words and positive_times and ordered_times and not unsupported_source
            match = {
                "observedCJKRange": [index, index + len(needle)],
                "fullASRWordEndpoints": complete_words,
                "positiveOrderedWordTimes": positive_times and ordered_times,
                "rawWordReferences": [{"segment": word["rawSegmentIndex"],
                                      "word": word["rawWordIndex"]}
                                     for word in words[owners[index]:owners[index + len(needle) - 1] + 1]],
                "rawStart": first["raw"]["start"], "rawEnd": last["raw"]["end"],
                "minimumRawProbability": min(word["raw"]["probability"] for word in
                                             words[owners[index]:owners[index + len(needle) - 1] + 1]),
                "status": ("blocked-source-has-non-CJK-letters-or-digits" if unsupported_source else
                           "unreviewed-exact-ASR-candidate" if viable else
                           "blocked-partial-ASR-word-no-character-timestamp" if not complete_words else
                           "blocked-invalid-ASR-word-times"),
                "acousticBoundaryApproved": False, "productionApproved": False,
            }
            matches.append(match)
            start = index + 1
    return {**target, "sourceHasNonCJKLettersOrDigits": unsupported_source, "exactOccurrences": matches,
            "uniqueWholeWordOccurrence": len(matches) == 1 and
                                         matches[0]["status"] == "unreviewed-exact-ASR-candidate",
            "status": "ASR-exact-observations-awaiting-review" if matches else
                      "unmatched-in-unprompted-ASR; keep whole-track fallback"}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", default=str(Path(__file__).resolve().parents[5]))
    parser.add_argument("--level", type=int, choices=(2, 3), default=2)
    parser.add_argument("--lessons", default="4,5,6")
    parser.add_argument("--raw-dir")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    root = Path(args.repo_root).resolve()
    source_root = root / "course-app/content"
    manifest_path = source_root / "audio-manifest.json"
    manifest = json.loads(manifest_path.read_text())
    lessons = sorted(set(int(value) for value in args.lessons.split(",")))
    raw_directory = Path(args.raw_dir).resolve() if args.raw_dir else None
    result = {
        "schemaVersion": 1, "mode": "raw-ASR-source-comparison" if raw_directory else "source-target-cues-only",
        "sourceAudioManifestSHA256": digest(manifest_path),
        "normalization": "NFKC+CJK-only; no script/phonetic/erhua replacements",
        "deterministicCueScope": "Printed source-to-track group identity/order only; no intra-track time cues",
        "tracks": [], "promotedClipCount": 0, "humanListening": False,
    }
    for lesson_number in lessons:
        lesson_path = source_root / f"hsk{args.level}/lesson-{lesson_number:02d}.json"
        lesson = json.loads(lesson_path.read_text())
        for number in range(1, 9):
            track = next(t for t in manifest["tracks"] if
                         (t["level"], t["lesson"], t["track"]) == (args.level, lesson_number, number))
            targets = []
            if track["kind"] == "text":
                text = next(text for text in lesson["texts"] if
                            text["audioTrack"] == f"{lesson_number}-{number}")
                for line in text["lines"]:
                    units = sentences(line["zh"])
                    targets.append({"id": line["id"], "unit": "line", "zh": line["zh"],
                                    "source": line["source"], "sentenceCount": len(units)})
                    if len(units) > 1:
                        targets.extend({"id": f"{line['id']}:sentence{index + 1}", "unit": "sentence",
                                        "zh": unit, "source": line["source"], "parentLineId": line["id"]}
                                       for index, unit in enumerate(units))
            else:
                targets = [{"id": word["id"], "unit": "word", "zh": word["zh"],
                            "source": word["source"], "sourceText": word["sourceText"]}
                           for word in lesson["vocabulary"] if
                           word["audioTrack"] == f"{lesson_number}-{number}"]
            report = {"track": track, "sourceLessonSHA256": digest(lesson_path), "targets": targets,
                      "timeCuesWithoutASR": [], "cueTimeCertification": "none"}
            if raw_directory:
                raw_path = raw_directory / "tracks" / f"hsk{args.level}-l{lesson_number:02d}-t{number}.json"
                if not raw_path.exists():
                    report["rawEvidenceStatus"] = "missing; no alignment attempted"
                else:
                    raw = json.loads(raw_path.read_text())
                    validate_raw_track(raw, track)
                    words, text, owners = observations(raw)
                    report.update({
                        "rawEvidenceFile": raw_path.name, "rawEvidenceSHA256": digest(raw_path),
                        "rawModelRevision": raw["modelRevision"], "rawCJK": text,
                        "targets": [exact_occurrences(target, words, text, owners) for target in targets],
                    })
                    ordered = [target for target in targets if target["unit"] in ("word", "line")]
                    source_cjk = "".join(cjk(target["zh"]) for target in ordered)
                    if track["kind"] == "text":
                        report["wholeSourceResidual"] = differences(source_cjk, text)
                    else:
                        report["repetitionPatternDiagnosticsNotBinding"] = {
                            "eachWordOnce": differences(source_cjk, text),
                            "eachWordRepeatedTwice": differences("".join(cjk(target["zh"]) * 2
                                                                     for target in ordered), text),
                            "wholeGroupRepeatedTwice": differences(source_cjk * 2, text),
                        }
            result["tracks"].append(report)
    targets = [target for track in result["tracks"] for target in track["targets"]]
    result["sourceTargetCounts"] = {
        "tracks": len(result["tracks"]), "vocabularyEntries": sum(t["unit"] == "word" for t in targets),
        "lines": sum(t["unit"] == "line" for t in targets),
        "singleSentenceLines": sum(t["unit"] == "line" and t["sentenceCount"] == 1 for t in targets),
        "multiSentenceChildren": sum(t["unit"] == "sentence" for t in targets),
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(result["sourceTargetCounts"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
