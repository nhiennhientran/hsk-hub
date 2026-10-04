# Phase A6 media closure: actual candidate and remaining work

This is a current read-only inventory plus a small HSK1 scene-image implementation. It is not full audio, language, browser, pronunciation, or device acceptance. The original plan's Gate 11 covers images, audio segments and handwriting; the authorized autonomous plan additionally requires reporting precision separately from reliable whole-track fallbacks. A fallback does not close the precision backlog.

## Completed in this work unit

`inventory.py` reads the actual 48 lessons, source-activity sidecars, both audio authorities, all declared picture files, all shared public image files, all required stroke files and the stroke-provenance manifest. Its current `inventory.json` has **zero asset/hash/source-binding/stroke-schema issues**. It checks 671 unique required characters; all 671 stroke JSON files have valid nonempty paths, matching medians and finite coordinates, and match the provenance hashes. This does not certify textbook pedagogy, native handwriting interactions or physical-device writing.

All 45 frozen HSK1 main scenes now have an explicit mapping to 48 already independently reviewed original crops. The three additional pictures are the L2 text1 portrait and the L11 text2/text3 insets. `scene-figures.ts` checks the exact scene identity, lesson, source-book hash, printed/PDF page, crop hash, image kind and fixed path. Existing book identities, audio, source records, grades and fingerprints are untouched. Scene mapping itself awaits separate independent review; prior acceptance of the crops is not acceptance of this new mapping.

`text.ts` renders those pictures with source-page captions. The entire picture gallery shares `data-original-text` with the transcript and is hidden by hide-original/listen mode, including image alt text. The existing scene lifetime still aborts audio on scene switches. CSS constrains the pictures at narrow widths and explicitly preserves hidden-gallery display. All 45 runtime scenes currently resolve all 48 crops after root integrated current L4 and synchronized the shared assets.

The two existing scene-navigation unit IDs were retained and extended with gallery visibility assertions. Two necessary binding regressions cover all 45/48 mappings and reject changed book/image hashes, source pages, kind and path. **4/4 unit tests and TypeScript checking passed**. These are simulated-DOM and pure-service checks, not native layout/accessibility certification. The exact authored file hashes are in `scene-candidate-verification.json`.

`acoustic-boundary-audit.py` independently analyzed all 232 HSK2/3 original tracks currently outside a precision manifest. **232/232 SHA256 checks and full decodes passed**, totaling 5,670.597 seconds. `acoustic-boundary-observations.json` contains two-threshold RMS/pause observations and preserves the exact input inventory. It assigns **zero words or sentences**, approves **zero new runtime clips** and makes **zero human-listening claims**. Low-energy intervals can contain weak consonants and tails; they cannot be used as clip boundaries without source alignment and acoustic review.

## Exact runtime coverage

| Level | Main scenes | Original tracks | Vocabulary | Precise vocabulary | Dialogue lines | Declared line ranges | Runtime pictures |
|---|---:|---:|---:|---:|---:|---:|---|
| HSK1 | 45 | 93 | 342 rows / 344 senses | 328 rows / 330 senses | 203 | 203 inherited ranges | 150 original source-activity crops, of which 48 bind the 45 main scenes |
| HSK2 | 60 | 120 | 226 entries | 38 entries | 311 | 55 | 198 explicitly labeled auxiliary SVGs |
| HSK3 | 72 | 144 | 523 entries | 23 entries | 427 | 23 | 240 explicitly labeled auxiliary SVGs |

HSK1's 14 unavailable L4 words are declared unsupported by the supplied recordings. Do not fabricate isolated pronunciation or quietly substitute machine speech. Its 203 inherited dialogue ranges contain 248 punctuation-based sentence units, with 44 multi-sentence lines; the inherited range inventory is not proof that all 248 sentences have separately exposed clips. Only HSK1 L1–3 have the source-supported `*-7` tongue-twister tracks, and their main-text controls already expose the original text and full original tracks. Absence in L4–15 is expected, not missing media.

HSK2/3 precision is present only in **HSK2 L1–3 and HSK3 L1**. Those four lessons contain 74 vocabulary entries: 61 precise and 13 explicitly unresolved with group-track fallback. HSK2 L4–15 and HSK3 L2–18 add 675 further vocabulary entries with group fallback. The total remaining precision backlog is therefore **688 vocabulary entries and 660 dialogue lines** across 29 untouched lessons plus the 13 unresolved words in already worked lessons.

The HSK2/3 corpus has 1,001 punctuation-based sentence units. Existing 78 line ranges expose **95 actual precise sentence units** through 62 single-sentence lines and 33 subsegments belonging to 16 multi-sentence parents. Remaining coverage is **906 sentence units**. The 61 word + 78 parent-line + 33 subsegment = 172 records must never be reported as 172 sentences or 172 independently heard clips.

## Picture scope and evidence

The repository-wide/public/content search found no HSK2/3 runtime original-crop or source-support image package. `inventory.json` records every public image file and all 132 HSK2/3 text slots, so this conclusion is not based only on a media manifest. The current 438 HSK2/3 illustrations are all self-authored auxiliary SVGs; the code has original-crop capability, but the current lesson data do not use it. Private source rasters and reviewer contact sheets are audit evidence, not runtime original pictures.

Among the 132 HSK2/3 main texts, 111 have a picture binding: 47 HSK2 and 64 HSK3 text slots, with 113 total SVG pictures because two slots have multiple pictures. The other 21 text slots have no picture binding. This is **not automatically 21 missing source pictures**: prior source reviews explicitly establish some texts have no printed picture. The original page must decide whether a crop should exist. No picture should be invented for a genuinely pictureless text.

The old Gate 11 is a general media-verification gate; its original content contract specifically described auxiliary artwork and no raw book image publication. The newly authorized A3 expressly requires HSK1 original pictures and this candidate fulfills the main-scene binding portion. If the final original-image scope includes replacing all HSK2/3 auxiliary SVGs, each required printed picture needs a source-specific crop and independent semantic/binding review; this inventory must not be presented as that replacement being complete. Original Vietnamese-book crops can carry their own verified hash and page offset, while the Chinese text's original-source reference stays unchanged. A full book or answer book must not enter public assets.

## Concrete remaining execution

1. **Finish acceptance of the new HSK1 scene gallery.** Independently compare the 45/48 mapping ledger to source/previous crop evidence, then check natural image sizes, no overflow and hide/listen accessible-tree suppression on both hosts and all four widths. Include scene switching, Back/Forward, active-audio abort and nonempty record preservation. The present unit checks do not close that native gate.
2. **Close HSK2/3 precision in 2–3 lesson batches.** Begin HSK2 L4–6, then L7–9/L10–12/L13–15; do HSK3 L2–4/L5–7/L8–10/L11–13/L14–16/L17–18. `missingPrecision` and `pendingPrecisionTracks` in the inventory are actual per-ID/per-source-file worklists. Restore the earlier ASR/word-time evidence if available, or obtain a local transcription/alignment model before assigning source units to acoustic observations. Current workspace contains no complete 264-track ASR output, and the referenced historical alignment paths are not present. No faster-whisper/Whisper/Torch package or Hugging Face model cache was found in the tested Python environment. These are an evidence/tooling gap, not permission to invent timings.
3. **Review the 13 retained unresolved words separately.** Preserve existing group fallback, identity, pinyin and uncertainty until an isolated crop's intended word and complete onset/tail are actually established. In particular, HSK2 L3 手/少 machine-recognition ambiguity remains unresolved.
4. **Validate handwriting and media interactions natively on the exact integration candidate.** The structural character mapping is complete. Check loading, missing/invalid stroke recovery, animation/practice/reset, disposal on route changes, audio seeking/rate/end/replay and no stale playback. Existing browser fixtures and final release regression cover these; do not duplicate previous certified checks without a new candidate or failure.
5. **Record actual limits at release.** Human listening, pronunciation/tone, and physical-device certifications remain false unless those checks are really performed. Waveforms, decode success, file hashes, ASR and browser tests each establish different facts.

## Reproducible commands

From repository root:

```sh
python course-app/docs/resume-20261004/media-closure/inventory.py
python course-app/docs/resume-20261004/media-closure/acoustic-boundary-audit.py
```

From `hsk1-app`:

```sh
node --experimental-strip-types --test tests/textbook-scene-navigation.test.mjs
npm run check
```

The acoustic input inventory is frozen separately. Re-running the current inventory after later integration does not silently replace the historical input hash supporting its observations. No production publication was performed by this work unit.
