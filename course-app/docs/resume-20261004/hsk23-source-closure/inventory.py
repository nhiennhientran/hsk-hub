"""Read-only inventory of current source bindings; existence is not source acceptance."""
import collections
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
APP = HERE.parents[2]
OFFICIAL_HSK3_REVISION = 'hsk3-official-vi-20261004'
OFFICIAL_HSK3_SHA = '7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def inventory(level):
    catalogue_path = APP / f"content/hsk{level}-lexicon.json"
    catalogue = json.loads(catalogue_path.read_text())
    bindings = {}
    for sense in catalogue["senses"]:
        for source in sense["sources"]:
            word_id = source.get("wordId", source.get("sourceWordId"))
            bindings[word_id] = (sense, source)
    lessons = []
    issues = []
    additional_issues = []
    for path in sorted((APP / f"content/hsk{level}").glob("lesson-*.json")):
        lesson = json.loads(path.read_text())
        registries = lesson.get('additionalSourceRevisions', [])
        registry_ids = [r.get('id') for r in registries]
        if len(registry_ids) != len(set(registry_ids)):
            additional_issues.append({'id': lesson['id'], 'issue': 'duplicate additional source registry'})
        registry_by_id = {r.get('id'): r for r in registries}
        rows = []
        for word in lesson["vocabulary"]:
            additional = word.get('additionalSourceEvidence', [])
            revision_ids = [e.get('sourceRevisionId') for e in additional]
            if len(revision_ids) != len(set(revision_ids)):
                additional_issues.append({'id': word['id'], 'issue': 'duplicate additional source word evidence'})
            for evidence in additional:
                revision = registry_by_id.get(evidence.get('sourceRevisionId'))
                if revision is None:
                    additional_issues.append({'id': word['id'], 'issue': 'additional word evidence has no lesson registry'})
                elif evidence.get('sourceRevisionId') == OFFICIAL_HSK3_REVISION and revision.get('sha256') != OFFICIAL_HSK3_SHA:
                    additional_issues.append({'id': word['id'], 'issue': 'additional official source SHA mismatch'})
                if evidence.get('sourceRevisionId') == OFFICIAL_HSK3_REVISION:
                    vocab, glossary = evidence.get('vocabulary', {}), evidence.get('glossary', {})
                    body_source, glossary_source = vocab.get('source', {}), glossary.get('source', {})
                    valid_binding = (
                        vocab.get('headword') == word['zh']
                        and body_source.get('pdfPage') == word['source']['pdfPage']
                        and body_source.get('printedPage') == word['source']['printedPage']
                        and glossary.get('headword') == word['zh']
                        and lesson['number'] in glossary.get('lessonNumbers', [])
                        and type(vocab.get('printedNumber')) is int and vocab['printedNumber'] > 0
                        and vocab.get('printedPOSLanguage') == 'vi'
                        and vocab.get('posPrinted') == (vocab.get('printedPOSRaw') is not None)
                        and type(glossary_source.get('pdfPage')) is int
                        and type(glossary_source.get('printedPage')) is int
                        and glossary_source['pdfPage'] - glossary_source['printedPage'] == 12
                    )
                    if not valid_binding:
                        additional_issues.append({'id': word['id'], 'issue': 'additional official word/head/page/number/POS/lesson binding mismatch'})
            binding = bindings.get(word["id"])
            sense, binding_source = binding if binding else (None, None)
            if sense is None:
                issues.append({"id": word["id"], "issue": "missing canonical binding"})
            else:
                for key in ["zh", "py", "vi", "pos"]:
                    if sense[key] != word[key]:
                        issues.append({"id": word["id"], "field": key, "issue": "stale canonical value"})
                for key in ["sourceText", "audioTrack", "source"]:
                    if binding_source[key] != word[key]:
                        issues.append({"id": word["id"], "field": key, "issue": "stale canonical provenance"})
                for key, expected in [("lessonId", lesson["id"]), ("lesson", lesson["number"])]:
                    if binding_source[key] != expected:
                        issues.append({"id": word["id"], "field": key, "issue": "stale canonical lesson binding"})
            rows.append({
                "id": word["id"], "zh": word["zh"], "py": word["py"], "pos": word["pos"],
                "source": word["source"], "sourceText": word["sourceText"],
                "appendixSource": word.get("appendixSource"),
                "appendixMetadata": word.get("appendixMetadata"),
                "sourceNumberPosSource": word.get("sourceNumberPosSource"),
                "supplementarySyllabus": word.get("supplementarySyllabus"),
                "canonicalSenseId": sense["id"] if sense else None,
                "additionalSourceEvidence": additional,
            })
        lessons.append({"id": lesson["id"], "path": str(path.relative_to(APP)),
                        "sha256": sha(path), "wordRows": rows,
                        "additionalSourceRevisions": registries})
    rows = [row for lesson in lessons for row in lesson["wordRows"]]
    official_evidence = [e for row in rows for e in row['additionalSourceEvidence']
                         if e.get('sourceRevisionId') == OFFICIAL_HSK3_REVISION]
    return {"level": level, "scope": "Current JSON inventory only; not fresh source-pixel acceptance",
            "catalogueSha256": sha(catalogue_path),
            "counts": {"lessons": len(lessons), "senseRows": len(rows),
                       "chineseForms": len({r["zh"] for r in rows}),
                       "appendixBound": sum(r["appendixSource"] is not None for r in rows),
                       "numberPosMetadata": sum(r["appendixMetadata"] is not None for r in rows),
                       "numberPosSource": sum(r["sourceNumberPosSource"] is not None for r in rows),
                       "starredSenseRows": sum(r["supplementarySyllabus"] is True for r in rows),
                       "additionalOfficialWordEvidence": len(official_evidence),
                       "additionalOfficialLessonRegistries": sum(any(r.get('id') == OFFICIAL_HSK3_REVISION for r in l['additionalSourceRevisions']) for l in lessons),
                       "additionalOfficialGlossaryAnchors": sum(e.get('glossary',{}).get('source') is not None for e in official_evidence),
                       "additionalOfficialNumberPosMetadata": sum(type(e.get('vocabulary',{}).get('printedNumber')) is int and 'printedPOSRaw' in e.get('vocabulary',{}) for e in official_evidence),
                       "additionalOfficialNumberPosSources": sum(e.get('vocabulary',{}).get('source') is not None for e in official_evidence)},
            "canonicalIssues": issues, "additionalSourceBindingIssues": additional_issues,
            "lessons": lessons}

if __name__ == "__main__":
    result = {"schemaVersion": 1, "authorReviewStatus": "inventory-only", "independentReview": "not-granted",
              "courses": [inventory(2), inventory(3)]}
    (HERE / "current-inventory.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps([{**c["counts"], "level": c["level"], "canonicalIssues": len(c["canonicalIssues"]),
                       "additionalSourceBindingIssues": len(c['additionalSourceBindingIssues'])}
                      for c in result["courses"]], ensure_ascii=False))
