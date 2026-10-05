#!/usr/bin/env python3
"""Check the byte/identity evidence accompanying a manually viewed source review.

This verifier does not read printed glyphs or certify website consumers. It never
changes the author inputs. Re-running without --output is read-only.
"""
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone
import argparse
import csv
import hashlib
import json
import sys
from PIL import Image


BASE = Path(__file__).resolve().parent
REPO = next(p for p in BASE.parents if (p / "course-app").is_dir())
AUTHOR = REPO / "course-app/docs/resume-20261004/official-vi-source-prep/hsk2-l03"
PDF = Path("/workspace/scratch/28b55072841a/upload/HSK2 ( 3.0).pdf")
PDF_SHA = "6465777a77f8d9cb0d29b47f00b36a8e9e9ff627509f0f02a9909c7aaeaa231b"
INPUT_HASHES = {
    "source-transcription.json": "1751c64e4a0960f57aa8823b4186e59beac2691f7e43d7969a1446013bf9ce11",
    "freeze-manifest.json": "937883b645ee405e4d343a362ec559ed19a7d30ab40daf69e9ee708930434dc9",
    "source-page-evidence.json": "e839608ef93e0ce1a6a86d573c5531a03a9b4b0a6fb4443090840bbf9469c6b6",
    "source-detail-crop-evidence.json": "650a7612d20a1bfd0585838a8f4bd87a74b056804bd81336e9401886b4d119a7",
}
EXPECTED_PAGE_COUNTS = {33: 10, 34: 14, 35: 10, 36: 12, 37: 7, 38: 20, 39: 12, 40: 4, 41: 12, 42: 14}
EXPECTED_POS = ["đgt.", "đt.", "đgt.", "phó.", "đgt.", "đgt.", "đt.", "đgt.", "dt.", None, "tt.", "đgt.", "đgt.", "đt.", "tt."]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(path):
    return json.loads(path.read_text())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="write one initial actual verification receipt")
    args = parser.parse_args()
    checks, issues = [], []

    def check(name, condition, detail=None):
        entry = {"check": name, "passed": bool(condition)}
        if detail is not None:
            entry["detail"] = detail
        checks.append(entry)
        if not condition:
            issues.append(entry)

    check("original-PDF-SHA-and-byte-size", digest(PDF) == PDF_SHA and PDF.stat().st_size == 69855983)
    for name, expected in INPUT_HASHES.items():
        original, copy = AUTHOR / name, BASE / "author-input" / name
        check(f"author-input-unchanged:{name}", digest(original) == expected)
        check(f"author-input-byte-copy:{name}", digest(copy) == expected and copy.read_bytes() == original.read_bytes())

    author = read_json(BASE / "author-input/source-transcription.json")
    review = read_json(BASE / "source-review.json")
    manifest = read_json(BASE / "detail-evidence-manifest.json")
    author_rows, rows = author["records"], review["records"]
    author_ids, ids = [x["sourceId"] for x in author_rows], [x["sourceId"] for x in rows]
    check("115-unique-identities-exact-author-order", len(ids) == len(set(ids)) == 115 and ids == author_ids)
    check("exact-source-hash-linked-in-review", review["sourcePDFSHA256"] == PDF_SHA and review["sourcePDFBytes"] == PDF.stat().st_size and review["authorTranscriptionSHA256"] == INPUT_HASHES["source-transcription.json"])
    check("different-source-author-and-independent-reviewer", review["author"] == author["author"] == "qa_hsk1_05_08" and review["independentReviewer"] == "native_catalogue" and review["independentReviewer"] != review["author"])
    check("source-only-boundaries", all(review[k] is False for k in ("websiteRead", "websiteComparisonPerformed", "runtimeEdited", "OCRUsed", "textLayerUsed", "reviewedSourceItemCountIsWebsiteCoverage")))
    check("all-115-visually-accepted-no-repair-no-pending", review["sourceAccepted"] is True and review["reviewedSourceItems"] == 115 and review["pendingSourceItems"] == 0 and review["repairs"] == [] and review["missingOccurrences"] == [] and all(x["decision"] == "accept-original-page-visual" and x["repairRequired"] is False for x in rows))
    basic_fields = {"sourceId", "pdfPage", "printedPage", "section", "zhAnchor", "viPrinted", "reviewStatus"}
    for original, verdict in zip(author_rows, rows):
        expected_meta = {k: v for k, v in original.items() if k not in basic_fields}
        check(f"source-value-and-metadata:{original['sourceId']}", all(verdict[k] == original[k] for k in ("sourceId", "pdfPage", "printedPage", "section", "zhAnchor")) and verdict["authorViPrinted"] == verdict["expectedViPrinted"] == original["viPrinted"] and verdict["authorMetadata"] == expected_meta)
    check("actual-primary-page-counts", dict(Counter(x["pdfPage"] for x in rows)) == EXPECTED_PAGE_COUNTS)
    check("actual-scope-10-pages-including-summary-continuation", author["scope"]["actualPDFPages"] == [33, 42] and author["scope"]["actualPrintedPages"] == [19, 28] and author["scope"]["primaryLessonPageCount"] == 9 and author["scope"]["supplementalConnectedSummaryPageCount"] == 1)

    words = [x for x in author_rows if "printedNumber" in x]
    check("15-word-ordinals-and-literal-POS", [x["printedNumber"] for x in words] == list(range(1, 16)) and [x["printedPOSRaw"] for x in words] == EXPECTED_POS and all(x["posPrinted"] is (x["printedPOSRaw"] is not None) for x in words) and all(x["sourceWordKind"] == "ordinary-numbered-word" for x in words))
    roles = [x for x in author_rows if "printedRoleVi" in x]
    check("16-role-lines-grouped-5-5-6", len(roles) == 16 and dict(Counter(x["printedTextNumber"] for x in roles)) == {1: 5, 2: 5, 3: 6})
    for text, expected_count in ((1, 5), (2, 5), (3, 6)):
        group = [x for x in roles if x["printedTextNumber"] == text]
        check(f"role-ordinal-and-name-separation:text{text}", [x["printedDialogueOrdinal"] for x in group] == list(range(1, expected_count + 1)) and all((x["printedRoleZh"], x["printedRoleVi"]) in (("刘明", "Lưu Minh"), ("王一雪", "Vương Nhất Tuyết")) and not x["viPrinted"].startswith(x["printedRoleVi"] + ":") for x in group))
    paragraphs = [x for x in author_rows if x["section"] == "text4-whole-paragraph"]
    check("text4-single-unlabelled-printed-semantic-difference", len(paragraphs) == 1 and paragraphs[0]["printedSpeaker"] is None and paragraphs[0]["noWebsiteLinePartitionInferred"] is True and "很累" in paragraphs[0]["zhAnchor"] and "rất bận" in paragraphs[0]["viPrinted"] and "rất mệt" not in paragraphs[0]["viPrinted"])
    summary = [x for x in author_rows if "printedTableRowOrdinal" in x]
    check("9-summary-rows-on-actual-page42-with-Chinese-examples", [x["printedTableRowOrdinal"] for x in summary] == list(range(1, 10)) and all(x["pdfPage"] == 42 and x["printedPage"] == 28 and x["sourceScope"] == "supplemental-connected-learning-summary-continuation" and x["printedChineseExampleWithinVietnameseCell"] is True and x["noVietnameseExampleTranslationInvented"] is True for x in summary))
    spans = [x for x in rows if "pdfPages" in x["authorMetadata"]]
    check("2-cross-page-cases-3-records", len(spans) == 3 and Counter(tuple(x["authorMetadata"]["pdfPages"]) for x in spans) == Counter({(36, 37): 2, (38, 39): 1}))
    for row in spans:
        meta = row["authorMetadata"]
        check(f"cross-page-evidence:{row['sourceId']}", all(f"original-full-pdf{p:03}" in row["evidence"] for p in meta["pdfPages"]) and meta["printedPages"] == [p - 14 for p in meta["pdfPages"]])
        if "viPrintedFragments" in meta:
            check("grammar3-fragments-joined-once-with-final-clause", " ".join(x["viPrinted"] for x in meta["viPrintedFragments"]) == row["expectedViPrinted"] and meta["viPrintedFragments"][0]["pdfPage"] == 38 and meta["viPrintedFragments"][1]["pdfPage"] == 39 and meta["viPrintedFragments"][1]["viPrinted"].startswith("còn "))

    full_evidence_ids = set()
    check("10-independent-full-pages-listed", [x["pdfPage"] for x in review["pages"]] == list(range(33, 43)))
    for page in review["pages"]:
        path = Path(page["renderPath"])
        with Image.open(path) as im:
            dimensions = list(im.size)
            im.verify()
        check(f"full-page-SHA-decode-observed-footer:{page['pdfPage']}", digest(path) == page["renderSHA256"] and path.stat().st_size == page["renderBytes"] and dimensions == [1421, 1990] and page["expectedPrintedFooter"] == page["observedPrintedFooter"] == f"{page['pdfPage'] - 14:03}" and page["independentFullPageReviewed"] is True and page["renderDPI"] == 180 and page["originalPDFCropBoxRendered"] is True)
        full_evidence_ids.add(page["evidenceId"])
    details = manifest["entries"]
    check("9-permanent-evidence-images-exact-inventory", len(details) == manifest["permanentImageCount"] == 9 and set(x["path"] for x in details) == {str(x.relative_to(BASE)) for x in (BASE / "evidence").glob("*.png")})
    detail_ids = set()
    for item in details:
        path = BASE / item["path"]
        with Image.open(path) as im:
            dimensions = list(im.size)
            im.verify()
        rect = item["originalRotatedCropBoxPixelRectXYWH"]
        check(f"permanent-PNG-SHA-and-source:{path.name}", digest(path) == item["sha256"] and path.stat().st_size == item["bytes"] and dimensions == item["dimensions"] and item["sourcePDFSHA256"] == PDF_SHA and item["printedPage"] == item["pdfPage"] - 14 and item["independentlyVisuallyViewed"] is True and item["decision"] == "accept-readable-original-print")
        if rect:
            check(f"direct-original-360dpi-crop:{path.name}", item["origin"] == "direct-original-PDF-CropBox" and item["renderDPI"] == 360 and dimensions == rect[2:] and str(PDF) in item["renderCommandArgv"] and "-cropbox" in item["renderCommandArgv"])
        else:
            check("page42-permanent-copy-is-original-byte-evidence", item["pdfPage"] == 42 and item["renderDPI"] == 180 and item["origin"] == "original-full-page-byte-copy" and digest(Path(item["originalFullPagePath"])) == item["sha256"])
        detail_ids.add(item["evidenceId"])
    check("all-row-evidence-identities-resolve", all(set(x["evidence"]) <= full_evidence_ids | detail_ids and f"original-full-pdf{x['pdfPage']:03}" in x["evidence"] for x in rows))
    with (BASE / "source-review.tsv").open(newline="") as f:
        tabular = list(csv.DictReader(f, delimiter="\t"))
    check("TSV-all115-identities-and-print-values", len(tabular) == 115 and [x["sourceId"] for x in tabular] == ids and all(x["expectedViPrinted"] == y["expectedViPrinted"] and x["decision"] == y["decision"] and x["repairRequired"] == "False" for x, y in zip(tabular, rows)))
    structure = read_json(BASE / "structure-audit.json")
    check("structural-audit-attribution-no-visual-claim", structure["auditor"] == "h2l3_source_structure" and structure["boundaries"]["originalPDFImagesVisuallyViewedByThisAuditor"] is False and structure["boundaries"]["visualOrPrintedTextAcceptanceClaimed"] is False and structure["input"]["sourceTranscriptionSHA256"] == INPUT_HASHES["source-transcription.json"])

    freeze = BASE / "review-freeze.json"
    if freeze.exists():
        inventory = read_json(freeze)["artifacts"]
        actual = {str(p.relative_to(BASE)) for p in BASE.rglob("*") if p.is_file() and p != freeze}
        check("final-freeze-complete-artifact-path-set", set(x["path"] for x in inventory) == actual)
        for item in inventory:
            path = BASE / item["path"]
            check(f"final-freeze-byte-integrity:{item['path']}", digest(path) == item["sha256"] and path.stat().st_size == item["bytes"])

    result = {
        "schemaVersion": 1,
        "verificationUTC": datetime.now(timezone.utc).isoformat(),
        "verifier": "native_catalogue",
        "verificationKind": "actual-byte-identity-metadata-image-integrity-checks",
        "automatedChecksAreVisualReading": False,
        "sourcePDFSHA256": PDF_SHA,
        "authorTranscriptionSHA256": INPUT_HASHES["source-transcription.json"],
        "sourceReviewSHA256": digest(BASE / "source-review.json"),
        "sourceOnlyAccepted": not issues,
        "websiteAlignmentCertified": False,
        "sourceItems": len(rows),
        "fullPages": len(review["pages"]),
        "permanentImages": len(details),
        "checksPassed": sum(x["passed"] for x in checks),
        "checksTotal": len(checks),
        "checks": checks,
        "issues": issues,
    }
    if args.output:
        if freeze.exists():
            raise SystemExit("Frozen review is read-only; --output cannot mutate it.")
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({k: v for k, v in result.items() if k not in ("checks",)}, ensure_ascii=False, indent=2))
    return 1 if issues else 0


if __name__ == "__main__":
    sys.exit(main())
