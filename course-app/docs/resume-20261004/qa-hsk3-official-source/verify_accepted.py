"""Recheck frozen source identities and bindings; this is not visual QA."""
from pathlib import Path
import csv
import hashlib
import json

QA = Path(__file__).resolve().parent
SOURCE = QA.parent / "hsk23-source-closure"
APP = QA.parents[2]
PDF = Path("/workspace/scratch/28b55072841a/upload/HSK3 (3.0).pdf")
PDF_SHA = "7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951"
INPUTS = {
    "official-vi-glossary.tsv": "aea9a464ff839968750c51c30df22736ed2385ce49fa1c8ace996583f32cd5df",
    "official-vi-l01-06.json": "6ecc974a2fc390f6ca4db68f066a960d24c31a173fadc78f91188544815cfcb1",
    "official-vi-l07-12.json": "d36d94b7897b655c0830efe03b2742f284825f683e4fafba3bc21c87610fa5c4",
    "official-vi-l13-18.json": "452fde861c9899f90a1e16b82e4c8556414d563ed94fd6a7dac0502c59758449",
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify():
    assert sha(PDF) == PDF_SHA, "Official PDF identity changed"
    import fitz
    assert len(fitz.open(PDF)) == 212
    for filename, expected in INPUTS.items():
        assert sha(SOURCE / filename) == expected, filename
    report = json.loads((QA / "review.json").read_text())
    assert report["overall"]["status"] == "accepted-new-official-source-evidence"
    assert report["overall"]["stableSenseRows"] == 523
    glossary = list(csv.DictReader((SOURCE / "official-vi-glossary.tsv").open(), delimiter="\t"))
    assert len(glossary) == 487
    assert sum(row["headword"].startswith("*") for row in glossary) == 23
    assert next(row for row in glossary if row["headword"] == "关系")["printedPinyin"] == "guānxì"
    assert next(row for row in glossary if row["headword"].lstrip("*") == "客气")["headword"] == "*客气"
    initial = list(csv.DictReader((QA / "glossary-reviewed-initial.tsv").open(), delimiter="\t"))
    differences = [(before, after) for before, after in zip(initial, glossary) if before != after]
    assert len(initial) == len(glossary) and len(differences) == 1
    before, after = differences[0]
    assert before["headword"] == after["headword"] == "关系"
    assert before["printedPinyin"] == "guānxī" and after["printedPinyin"] == "guānxì"
    assert {key: value for key, value in before.items() if key != "printedPinyin"} == {
        key: value for key, value in after.items() if key != "printedPinyin"
    }
    rows = []
    raster_count = detail_count = 0
    for filename in INPUTS:
        if not filename.endswith(".json"):
            continue
        data = json.loads((SOURCE / filename).read_text())
        rows.extend(data["rows"])
        for evidence in data["pageEvidence"]:
            if "privateRaster" in evidence:
                assert sha(Path(evidence["privateRaster"])) == evidence["rasterSha256"]
                raster_count += 1
            else:
                for key in ("spread", "physicalSourcePage"):
                    item = evidence[key]
                    assert sha(Path(item["scratchPath"])) == item["sha256"]
                    raster_count += 1
        for item in data.get("detailEvidence", []):
            assert sha(Path(item["scratchPath"])) == item["sha256"]
            detail_count += 1
    assert len(rows) == len({row["id"] for row in rows}) == 523
    assert sorted(row["id"] for row in rows) == report["acceptedStableIds"]
    assert raster_count == 120 and detail_count == 4
    canonical = {
        word["id"]: word
        for path in (APP / "content/hsk3").glob("lesson-*.json")
        for word in json.loads(path.read_text())["vocabulary"]
    }
    assert set(canonical) == {row["id"] for row in rows}
    legend = {item["rawLabel"]: item["zh"] for item in report["posLegend"]["categories"]}
    for row in rows:
        current = canonical[row["id"]]
        assert row["zh"] == current["zh"]
        assert row["pdfPage"] == current["source"]["pdfPage"]
        assert row["printedPage"] == current["source"]["printedPage"]
        assert row["sourceText"] == current["sourceText"]
        assert row["pdfPage"] == row["printedPage"] + 12
        raw = row["printedPOSRaw"]
        expected = [] if raw is None else [legend[label.strip()] for label in raw.split("/")]
        assert (row["posCategory"] or []) == expected
        assert row["rawLabel"] == raw
    occurrences = {(row["id"].split(":")[1], row["pdfPage"], row["sourceList"], row["printedNumber"]) for row in rows}
    assert len(occurrences) == 491
    assert len({(row["id"].split(":")[1], row["sourceText"]) for row in rows}) == 72
    for lesson in range(1, 19):
        for source_list in ("new-words", "proper-names"):
            numbers = {row["printedNumber"] for row in rows if row["id"].split(":")[1] == f"l{lesson:02}" and row["sourceList"] == source_list}
            assert not numbers or numbers == set(range(1, max(numbers) + 1))
    glossary_bindings = {(row["headword"].lstrip("*"), lesson) for row in glossary for lesson in row["lessonNumbers"].split(",")}
    lesson_bindings = {(row["zh"], str(int(row["id"].split(":")[1][1:]))) for row in rows}
    assert glossary_bindings == lesson_bindings and len(lesson_bindings) == 491
    print("PASS: official PDF and 4 frozen inputs; 487 glossary rows; 523 IDs; 491 occurrences; 72 boxes; 120 + 4 raster hashes. Visual acceptance is recorded separately in review.json.")


if __name__ == "__main__":
    verify()
