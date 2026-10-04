"""Read-only, reproducible 48-lesson media binding and precision inventory.

Run from the repository root. Outputs stay beside this script. An asset/hash/range
check is not a listening, pronunciation, semantic-image or browser certification.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
inputs: dict[str, str] = {}
issues: list[dict] = []


def digest(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def read(relative: str):
    p = ROOT / relative
    inputs[relative] = digest(p)
    return json.loads(p.read_text())


def issue(kind: str, owner: str, detail: str):
    issues.append({"kind": kind, "owner": owner, "detail": detail})


def asset(relative: str, expected: str | None, owner: str) -> dict:
    p = ROOT / relative
    result = {"path": relative, "exists": p.is_file()}
    if not p.is_file():
        issue("missing-asset", owner, relative)
        return result
    result["sha256"] = digest(p)
    if expected:
        result["expectedSHA256"] = expected
        result["hashMatches"] = result["sha256"] == expected
        if not result["hashMatches"]:
            issue("asset-hash-mismatch", owner, relative)
    return result


def hans(value: str) -> set[str]:
    return {c for c in value if "\u3400" <= c <= "\u9fff" or "\uf900" <= c <= "\ufaff" or "\U00020000" <= c <= "\U000323af"}


def sentences(text: str) -> int:
    return len([x for x in re.split(r"[。！？!?]", text) if x.strip()])


book = read("hsk1-app/content/textbook.json")
media = read("hsk1-app/content/media-references.json")
catalog = read("hsk1-app/content/stage3-catalog.json")
manifest = read("course-app/content/audio-manifest.json")
source_index = read("course-app/docs/source-inventory.json")
segments = {k: {} for k in ["words", "lines", "subsegments"]}
unresolved = {}
precision_tracks = set()
for path in sorted((ROOT / "course-app/content").glob("audio-segments-*.json")):
    value = read(str(path.relative_to(ROOT)))
    precision_tracks.update(value.get("tracks", {}))
    for kind in segments:
        for key, item in value.get(kind, {}).items():
            if key in segments[kind]:
                issue("duplicate-segment", key, str(path))
            segments[kind][key] = item
    unresolved.update({x["id"]: x for x in value.get("unresolved", [])})

tracks = {(t["level"], f'{t["lesson"]}-{t["track"]}'): t for t in manifest["tracks"]}
h1_tracks = {t["id"]: t for t in media["originalTracks"]}
h1_senses = {x["id"]: x for x in catalog["vocabulary"]}
lessons = []
all_required_hanzi = set()
hanzi_by_lesson = {}
all_image_assets = []
all_track_assets = []
missing_precision = {"words": [], "lines": []}
pending_tracks = []
hsk23_scene_images = []

for level in [1, 2, 3]:
    values = book["lessons"] if level == 1 else [read(str(p.relative_to(ROOT))) for p in sorted((ROOT / f"course-app/content/hsk{level}").glob("lesson-*.json"))]
    for lesson in values:
        n = lesson["id"] if level == 1 else lesson["number"]
        owner = f"HSK{level} L{n:02}"
        required_chars = hans((lesson.get("hanzi", {}).get("chars", "") if level == 1 else "") + "".join(w["zh"] for w in lesson["vocab" if level == 1 else "vocabulary"]))
        all_required_hanzi.update(required_chars)
        hanzi_by_lesson[owner] = sorted(required_chars)
        counts = {"level": level, "lesson": n, "hanziRequired": len(required_chars)}
        if level == 1:
            senses = [h1_senses[s] for w in lesson["vocab"] for s in w["catalogIds"]]
            lines = [x for t in lesson["scenes"] for x in t["lines"]]
            counts.update({"wordRows": len(lesson["vocab"]), "wordSenses": len(senses), "wordSensePrecise": sum(x["audio"] is not None for x in senses), "wordSenseUnavailable": sum(x["audio"] is None for x in senses), "wordPrecise": sum(any(h1_senses[key]["audio"] is not None for key in word["catalogIds"]) for word in lesson["vocab"]), "texts": len(lesson["scenes"]), "lines": len(lines), "linePrecise": 0, "wholeTracks": len([t for t in h1_tracks.values() if t["lesson"] == n]), "tongueTrack": f"{n}-7" if n <= 3 else None, "mainTextImageRenderer": True})
            for scene in lesson["scenes"]:
                key = scene["source"]["audioTrack"]
                rows = media["textbookSegments"]["text"].get(key, [])
                if len(rows) != len(scene["lines"]):
                    issue("hsk1-line-binding", scene["id"], "line/range cardinality differs")
                for idx, line in enumerate(scene["lines"]):
                    if idx < len(rows):
                        start, end = rows[idx]
                        if not (0 <= start < end <= h1_tracks[key]["duration_s"]):
                            issue("segment-range", line["id"], repr(rows[idx]))
                        counts["linePrecise"] += 1
            for track in h1_tracks.values():
                if track["lesson"] != n:
                    continue
                # Standalone course-assets.ts serves/copies protected new-hsk1
                # tracks. Their absence from public/ is intentional.
                for host in ["new-hsk1/hsk1", "course-app/public/course-assets"]:
                    all_track_assets.append(asset(f'{host}/audio/{track["id"]}.mp3', track["sha256"], owner))
            source_path = ROOT / f"hsk1-app/content/source-activities/lesson-{n:02}.json"
            current_four = ROOT / "hsk1-app/content/source-activities/lesson-04-current.json"
            if n == 4 and current_four.exists():
                source_path = current_four
            source = read(str(source_path.relative_to(ROOT))) if source_path.exists() else None
            counts["sourceFigures"] = len(source.get("figures", [])) if source else 0
            counts["originalCrops"] = sum(f["kind"] == "original-crop" for f in source.get("figures", [])) if source else 0
            counts["schematicImages"] = sum(f["kind"] == "original-schematic" for f in source.get("figures", [])) if source else 0
            counts["originalFiguresNotActivityBound"] = []
            if source:
                refs = set()
                for activity in source["activities"]:
                    refs.update(activity.get("figures", []))
                    if activity.get("figure"):
                        refs.add(activity["figure"])
                    if activity.get("audio"):
                        key = activity["audio"]["track"]
                        if key not in h1_tracks or h1_tracks[key]["lesson"] != n:
                            issue("source-activity-track-binding", activity["id"], key)
                for fig in source["figures"]:
                    if fig["kind"] == "original-crop":
                        for host in ["hsk1-app/public", "course-app/public"]:
                            all_image_assets.append(asset(f'{host}/source-activities/{fig["file"]}', fig["sha256"], owner + ":" + fig["id"]))
                        if fig["id"] not in refs:
                            counts["originalFiguresNotActivityBound"].append(fig["id"])
                    elif fig["kind"] == "original-schematic":
                        all_image_assets.append(asset("hsk1-app/content/source-activities/" + fig["file"], fig["sha256"], owner + ":" + fig["id"]))
        else:
            words = lesson["vocabulary"]
            lines = [x for t in lesson["texts"] for x in t["lines"]]
            expected_sentences = sum(sentences(x["zh"]) for x in lines)
            verified_lines = [x for x in lines if x["id"] in segments["lines"]]
            sentence_units = sum(len(segments["lines"][x["id"]].get("subsegments", [])) or 1 for x in verified_lines)
            counts.update({"wordRows": len(words), "wordPrecise": sum(x["id"] in segments["words"] for x in words), "wordExplicitUnresolved": sum(x["id"] in unresolved for x in words), "wordGroupFallback": sum(x["id"] not in segments["words"] for x in words), "texts": len(lesson["texts"]), "lines": len(lines), "linePrecise": len(verified_lines), "expectedSentenceUnits": expected_sentences, "preciseSentenceUnits": sentence_units, "wholeTracks": 8, "tongueTrack": None, "originalCrops": 0, "schematicImages": 0, "mainTextImageRenderer": True})
            for text in lesson["texts"]:
                key = (level, text["audioTrack"])
                if key not in tracks or tracks[key]["kind"] != "text" or tracks[key]["text"] != text["number"]:
                    issue("text-track-binding", text["id"], repr(key))
                for line in text["lines"]:
                    s = segments["lines"].get(line["id"])
                    if s and (s["sourceText"] != line["zh"] or s["sourcePinyin"] != line["py"] or s["track"] != tracks[key]["file"]):
                        issue("line-segment-source", line["id"], "text/pinyin/track differs")
                    if not s:
                        missing_precision["lines"].append({"level": level, "lesson": n, "id": line["id"], "zh": line["zh"], "py": line["py"], "track": tracks[key]["file"], "source": line["source"]})
            for word in words:
                key = (level, word["audioTrack"])
                if key not in tracks or tracks[key]["kind"] != "vocab" or tracks[key]["text"] != word["sourceText"]:
                    issue("word-track-binding", word["id"], repr(key))
                s = segments["words"].get(word["id"])
                if s and (s["sourceText"] != word["zh"] or s["sourcePinyin"] != word["py"] or s["track"] != tracks[key]["file"]):
                    issue("word-segment-source", word["id"], "text/pinyin/track differs")
                if not s:
                    missing_precision["words"].append({"level": level, "lesson": n, "id": word["id"], "zh": word["zh"], "py": word["py"], "track": tracks[key]["file"], "explicitUnresolved": word["id"] in unresolved, "source": word["source"]})
            for idx in range(1, 9):
                track = tracks[(level, f"{n}-{idx}")]
                result = asset("course-app/public/" + track["file"], track["sha256"], owner)
                all_track_assets.append(result)
                if track["file"] not in precision_tracks:
                    pending_tracks.append(track)
            for pic in lesson.get("illustrationManifest", []):
                counts["originalCrops"] += pic.get("originalTextbookImage") is True or pic["kind"] == "original-crop"
                counts["schematicImages"] += pic.get("originalTextbookImage") is False
                if pic.get("file"):
                    all_image_assets.append(asset("course-app/public/" + pic["file"], pic.get("assetSha256"), pic["id"]))
            counts["mainTextBoundPictures"] = sum(pic.get("textbookRelation", {}).get("owner") in {t["id"] for t in lesson["texts"]} for pic in lesson.get("illustrationManifest", []))
            for text in lesson["texts"]:
                bound = [pic for pic in lesson.get("illustrationManifest", []) if pic.get("textbookRelation", {}).get("owner") == text["id"]]
                hsk23_scene_images.append({"level": level, "lesson": n, "textId": text["id"], "source": text["source"], "runtimePictures": [{"id": pic["id"], "file": pic.get("file"), "originalTextbookImage": pic.get("originalTextbookImage"), "kind": pic["kind"], "source": pic["source"], "relation": pic.get("textbookRelation")} for pic in bound], "absenceInterpretation": None if bound else "No picture binding exists. Original page must determine whether the printed text actually has a picture; do not assume every text does."})
        lessons.append(counts)

stroke_assets = []
for char in sorted(all_required_hanzi):
    relative = f"course-app/public/course-assets/hanzi/{char}.json"
    check = asset(relative, None, char)
    if check["exists"]:
        data = json.loads((ROOT / relative).read_text())
        strokes, medians = data.get("strokes"), data.get("medians")
        valid = isinstance(strokes, list) and bool(strokes) and all(isinstance(p, str) and p.strip() for p in strokes) and isinstance(medians, list) and len(medians) == len(strokes) and all(isinstance(s, list) and len(s) > 1 and all(isinstance(p, list) and len(p) == 2 and all(isinstance(n, (int, float)) and math.isfinite(n) for n in p) for p in s) for s in medians)
        check.update({"character": char, "validStrokeStructure": bool(valid), "strokes": len(strokes) if isinstance(strokes, list) else None})
        if not valid:
            issue("stroke-structure", char, relative)
    stroke_assets.append(check)

provenance_path = ROOT / "course-app/public/course-assets/HANZI-PROVENANCE.json"
if provenance_path.exists():
    provenance = read(str(provenance_path.relative_to(ROOT)))
    by_char = {x["character"]: x for x in provenance["characters"]}
    for data in stroke_assets:
        if data.get("character") not in by_char or by_char[data["character"]]["sha256"] != data.get("sha256"):
            issue("stroke-provenance", data.get("character", data["path"]), "missing/stale manifest hash")
else:
    issue("stroke-provenance", "all", "HANZI-PROVENANCE.json absent")

summary = {}
for level in [1, 2, 3]:
    rows = [x for x in lessons if x["level"] == level]
    keys = ["wordRows", "wordPrecise", "wordSenses", "wordSensePrecise", "texts", "lines", "linePrecise", "wholeTracks", "originalCrops", "schematicImages"]
    summary[f"hsk{level}"] = {"lessons": len(rows), **{k: sum(x.get(k, 0) for x in rows) for k in keys}}
summary.update({"requiredUniqueHanzi": len(all_required_hanzi), "validStrokeAssets": sum(x.get("validStrokeStructure", False) for x in stroke_assets), "hsk23RemainingPrecisionWords": len(missing_precision["words"]), "hsk23RemainingPrecisionLines": len(missing_precision["lines"]), "hsk23RemainingPrecisionTracks": len(pending_tracks), "explicitUnresolvedWords": len(unresolved), "assetBindingIssues": len(issues)})
public_images = [{"path": str(p.relative_to(ROOT)), "sha256": digest(p)} for p in sorted((ROOT / "course-app/public").rglob("*")) if p.is_file() and p.suffix.lower() in {".svg", ".png", ".jpg", ".jpeg", ".webp"}]
result = {"generatedAt": datetime.now(timezone.utc).isoformat(), "scope": "48 runtime lessons; file identity, declared binding, range cardinality and stroke-schema checks only", "humanListening": False, "pronunciationToneCertified": False, "devicePlaybackCertified": False, "semanticImageReviewPerformed": False, "summary": summary, "lessons": lessons, "issues": issues, "inputHashes": inputs, "trackAssetChecks": all_track_assets, "imageAssetChecks": all_image_assets, "allCoursePublicImageFiles": public_images, "hsk23MainTextImageBindings": hsk23_scene_images, "hanziByLesson": hanzi_by_lesson, "strokeAssetChecks": stroke_assets, "missingPrecision": missing_precision, "pendingPrecisionTracks": pending_tracks}
(OUT / "inventory.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(summary, ensure_ascii=False, indent=2))
