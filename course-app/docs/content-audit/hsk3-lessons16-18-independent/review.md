# Independent HSK3 lessons 16–18 review

Verdict: BOUNDED FIXES REQUIRED, two SVG geometry issues. No source/content coverage blocker found.

Reviewed candidate lesson SHA256:
- 16 c5ddb7ab8931d7cd2daa9f2cd692ddf9c1b44e3e3499af0994275a480bf3b7d7
- 17 c92106722aecffe7f78e40bd8e8ea6e65bd8d4fdf81442074ebaaaca37b26ce2
- 18 faa741bf1b730b9ff5ec05c53a075fab9521e9a3ea056393d3902301d9a3999d

## Required bounded fixes
1. course-app/public/illustrations/hsk3-l16-warmup1-1.svg: label 2 ends at (489,158), on the cream forehead, below the visible dark right ear. Move both endpoint and endpoint marker onto the exposed dark ear (for example approximately (498,146), then visually verify). This is the scored 耳朵 target, so exact anatomical binding matters. Independently rendered evidence: figures-1.png, ear-detail.png. Other four numbered targets pass.
2. course-app/public/illustrations/hsk3-l17-picture-3.svg: bag at x347–397,y233–300 floats beside the walker; both hands are around x315/325,y258, with no contact to bag/handle and no shoulder strap. Draw a supported carry relationship (hand gripping handle or continuous shoulder strap), retaining the one-person campus-walk context. Evidence: figures-6.png and individual hsk3-l17-picture-3.png.

After repairs update asset hashes, lesson hashes and frozen/audit manifests, rerasterize the exact revised bytes, and obtain delta review. Do not edit shared renderer or baseline values.

## Passed independent checks
- Personally rendered and read all textbook PDF156–185 and answer PDF22–27, not just author reports. Local book/answers sheets record this separate review evidence.
- All 16 original top-level values in each lesson recursively equal git base d5feac8a01ec7095573da8dd9c4205c23bc7ed2b. This includes original IDs, 30 homework and four supplemental listening questions per lesson, original translations, vocabulary and audio metadata.
- Exact activity/field/SVG totals 29/65/8, 29/68/14, 32/94/13. Assessment totals 71 official,105 reference,51 open.
- All 38 frozen-file hashes and all 30 audit-file hashes match actual bytes. Every manifest SVG assetSha256 matches its asset.
- Source counts: 24 listening,36 reading,36 grammar tasks (33 fill tasks and three approximate-number responses),30 word-bank slots,nine picture dialogues/33 blanks. Source-visible blanks matched the activities; programmatic Chinese and Vietnamese blank counts match fields for every grammar fill and picture dialogue.
- Official warmup/listening/word-bank letter sequences exactly match personally viewed answer pixels: L16 EDABC / BBACCACC / BACEDEBADC; L17 EDCFBA / CBBBACCC / ABECDCAEDB; L18 CBDAFE / CCCACBCC / ADBCEDCEBA. Per-field answer provenance reviewed. Answer PDF23's printed145 “课文4” typo correctly treated as text1 without altering BB.
- Read all 72 complete bilingual sentence/dialogue entries (96 filled slots), all36 reading references and three approximation samples. Chinese completions are grammatical and Vietnamese sentence composition is usable. Editorial references are ungraded and have no answer or answerSource. Minor optional consistency polish: new L17 text1-question3 reference uses “thầy Lý” while its copied prompt uses “cô Lý”; align new reference with preserved prompt or use neutral “thầy/cô Lý”, without changing baseline.
- L18 12 review rows have both understanding/use fields. Genuine 刚才/刚刚 explanation groups retain [0,1]/[2,3] and sources178/179; all three exercises stay reference-only, with explicit ambiguity note on third. Cross-page 只有172/173,只要180/181 and text-image168/179 bindings checked.
- L16 warmup is one five-target composite, no invented text2 photo. Optional fourth classroom ellipsis is visibly documented as offline extension and integration-needs.json preserves a bounded optional-field requirement rather than silently dropping it or making it mandatory.
- Inspected current renderer's activity-level illustrationIds, field illustrationId, exact text-owner and culture-owner paths. Independently verified all35 manifest figures have a reachable binding; no section-only orphan. L16 composite displays once; L17 seven-expression panel uses activity-level binding. This is static reachability, not browser execution.
- Independently rasterized all35 exact candidate SVGs with Inkscape into this directory; personally inspected all nine separate contact sheets, plus the ear detail. All remaining figures show legible schematic scenes, adequate support/ground geometry and matching bilingual alt descriptions. L16 culture is labeled an original topic illustration, no fabricated video controls/media.

## Not executed / integration limits
No browser UI, responsive behavior, persistence/history, keyboard interaction, audio listening, integrated build, upload, commit or publication was executed by this reviewer. Author's recorded81/82 unit result has only aggregate355-versus320 count failure; not rerun here and test unmodified. This is an independent static/source/bilingual/pixel audit, not a full production acceptance.
