#!/usr/bin/env python3
"""Build a source-backed progress ledger; never promote partial evidence."""
import datetime
import hashlib
import json
import pathlib
import re


ROOT = pathlib.Path("/workspace/scratch/28b55072841a/hsk-hub-resume-recovered")
HELPER = pathlib.Path("/workspace/scratch/28b55072841a/source-recovery-sync-tools")


def ids(rows):
    result = []
    for row in rows:
        value = next((row[k] for k in ["sourceId", "sourceID", "id"] if isinstance(row, dict) and isinstance(row.get(k), str)), None)
        if value is not None:
            result.append(value)
    return result


def main():
    baseline = json.loads((ROOT / "course-app/docs/recovery-20261005/sync/initial-baseline/baseline-progress.json").read_text())
    receipts = [json.loads(p.read_text()) for p in (HELPER / "receipts").glob("*.json")]
    full = {r["freezeSHA256"]: r for r in receipts if r.get("allNewBytesVerified") and r["branch"] == "work/hsk-source-recovery-20261005"}
    shields = {}
    for r in receipts:
        if not r.get("allNewBytesVerified") or r["branch"] != "work/hsk-recovery-text-shield-20261005":
            continue
        document = json.loads((ROOT / r["freezePath"]).read_text())
        for scope in document["scopes"]:
            shields[scope["freezeSHA256"]] = r
    rows = []
    pending_independent = []
    full_independent = []
    for item in json.loads((HELPER / "sync-queue.json").read_text()):
        c = json.loads(pathlib.Path(item["capsule"]).read_text())
        freeze = json.loads((ROOT / c["freezePath"]).read_text())
        independent = c["qualification"].startswith("independent")
        whole_approved = independent and "repair-required" not in c["qualification"]
        folder = pathlib.PurePosixPath(c["freezePath"]).parent
        primary = folder / ("review.json" if independent else "source.json")
        versioned = [pathlib.PurePosixPath(x["path"]) for x in c["entries"] if re.fullmatch(r"source\.author-v[0-9]+\.json", pathlib.PurePosixPath(x["path"]).name)]
        if not independent and versioned:
            assert len(versioned) == 1, "Ambiguous staged source version"
            primary = versioned[0]
        if not (ROOT / primary).is_file():
            primary = folder / "source-transcription.json"
        if not (ROOT / primary).is_file():
            candidates = [pathlib.PurePosixPath(x["path"]) for x in c["entries"] if pathlib.PurePosixPath(x["path"]).name == "source.author-v2.json"]
            assert len(candidates) == 1, "Cannot resolve exact versioned primary source"
            primary = candidates[0]
        document = json.loads((ROOT / primary).read_text())
        if independent:
            records = document.get("decisions", document.get("sourceRecordDecisions", document.get("perSourceItem", [])))
            source_ids = ids(records)
            count_document = document.get("counts", {})
            accepted = document.get("acceptedOccurrenceCount", next((count_document[k] for k in ["accepted", "sourceAccepted", "perIDAccepted", "fullRecordAccepted"] if k in count_document), 0))
            body_count = accepted
            shared_count = document.get("acceptedSharedAppendixOccurrenceCount", 0)
        else:
            records = document.get("records", document.get("occurrences", []))
            appendix = document.get("appendixOccurrences", [])
            source_ids = ids(records) + ids(appendix)
            accepted = 0
            body_count = len(records)
            shared_count = len(appendix)
        full_receipt = full.get(c["freezeSHA256"])
        text_receipt = shields.get(c["freezeSHA256"])
        dependencies = item.get("wholeAcceptanceRequiresFreezeSHA256", [])
        dependencies_complete = all(d in full for d in dependencies)
        whole_full = bool(full_receipt and dependencies_complete and whole_approved)
        status = "independent-repair-required-full-evidence-readback" if independent and not whole_approved and full_receipt else "independent-repair-required-text-shield" if independent and not whole_approved and text_receipt else "independent-repair-required-local-only" if independent and not whole_approved else "independent-approved-and-full-exact-readback" if whole_full else "independent-approved-but-partial" if independent and (text_receipt or full_receipt) else "independent-approved-local-only" if independent else "author-only-full-exact-readback" if full_receipt else "author-only-text-shield" if text_receipt else "author-only-local-frozen"
        lesson = re.search(r"(hsk[123])-l([0-9]{2})", c["scope"])
        lesson_key = f"{lesson[1]}-l{lesson[2]}" if lesson else None
        row = {"scope": c["scope"], "lessonKey": lesson_key, "status": status, "qualification": c["qualification"], "stageSHA256": c["stageSHA256"], "freezePath": c["freezePath"], "freezeSHA256": c["freezeSHA256"], "primaryText": str(primary), "primaryTextSHA256": hashlib.sha256((ROOT / primary).read_bytes()).hexdigest(), "sourceIds": source_ids, "sourceIdCount": len(source_ids), "bodyOrLocalRecordCount": body_count, "sharedAppendixOccurrenceCountRequiringDedup": shared_count, "recordedIndependentAcceptedOccurrenceCount": accepted, "authorFreezeSHA256": document.get("authorFreezeSHA256", freeze.get("authorFreezeSHA256")), "independentFreezeSHA256": c["freezeSHA256"] if independent else None, "fullRequiredFileCount": len(c["entries"]), "fullReceipt": {k: full_receipt[k] for k in ["remoteCommit", "localAndRemoteTree", "remoteNetworkBlobsVerified", "verifiedAtUTC"]} if full_receipt else None, "textShieldReceipt": {k: text_receipt[k] for k in ["remoteCommit", "localAndRemoteTree", "remoteNetworkBlobsVerified", "verifiedAtUTC"]} if text_receipt else None, "websiteAlignmentAccepted": False, "runtimeActivated": False}
        rows.append(row)
        row["wholeSourceAcceptanceApproved"] = whole_approved
        row["wholeAcceptanceRequiresFreezeSHA256"] = dependencies
        row["wholeAcceptanceDependenciesFullReadback"] = dependencies_complete
        if whole_approved and lesson_key:
            (full_independent if whole_full else pending_independent).append(lesson_key)
    result = {"schemaVersion": 1, "updatedAtUTC": datetime.datetime.now(datetime.timezone.utc).isoformat(), "scope": "recovery source-fidelity and checkpoint durability; no complete website Vietnamese or native release acceptance", "restoredHistoricalIndependentLessons": baseline["sourceScope"]["restoredAcceptedLessons"], "restoredHistoricalSourceOccurrences": baseline["sourceScope"]["sumRecordedSourceOccurrenceCounts"], "newIndependentLessonsWithFullExactReadback": sorted(set(full_independent)), "independentApprovedLessonsPendingFullExactReadback": sorted(set(pending_independent)), "independentAcceptedAndFullSavedLessonCount": baseline["sourceScope"]["restoredAcceptedLessons"] + len(set(full_independent)), "totalLessonCount": 48, "uniquePhysicalPrintedOccurrenceCountClaimed": False, "packages": rows, "receiptCount": len(receipts), "productionDeploymentPerformed": False, "publicationAuthorized": False, "protectedRemoteHeads": baseline["protectedRemoteHeads"]}
    output = ROOT / "course-app/docs/recovery-20261005/sync/CURRENT-PROGRESS.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"ledger": str(output), "packages": len(rows), "independentFullSavedLessons": result["independentAcceptedAndFullSavedLessonCount"], "independentApprovedPendingFull": pending_independent, "statuses": {state: sum(r["status"] == state for r in rows) for state in sorted({r["status"] for r in rows})}}))


if __name__ == "__main__":
    main()
