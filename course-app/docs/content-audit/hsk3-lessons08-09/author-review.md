# HSK3 lessons 08–09: author candidate

Date: 2026-10-04. Baseline: `9b7c76702e9724b4c647750138d800605254a116`.

Status: author candidate only. Independent source/Chinese–Vietnamese/figure review and integrated browser acceptance are pending. Historical `reviewStatus` records remain historical; they do not certify this upgrade.

## Source identity and inspected pages

- Textbook: 新HSK教程3, 212 PDF pages, 75,121,060 bytes. SHA-256 `33a9c743f73f634f97a9864aa0423ac4e3568b3febbf57b63e983b5dcc0932f2`.
- Official objective answers: 27 PDF pages, 7,228,714 bytes. SHA-256 `7cc42aa78c6b1c32f03f6deccac606c31bd787fd1f72717d45afafa29155e473`.
- Inspected actual rendered textbook PDF79–97 (printed67–85), plus objective-answer PDF11–13. Full books and textbook pixels are not included in this candidate.
- `lesson-08-source-map.json` and `lesson-09-source-map.json` bind each response field and figure to the precise source page and existing owner. These are implementation source mappings, not acceptance certificates.

## Preserved corpus and scoped corrections

The baseline comparison preserved all eight core texts, all 64 vocabulary/POS-sense entries, all seven grammar units and their 21 examples and original practices, all question IDs, all 60 homework questions, all supplemental listening, and existing source sections. Changes to old keys are limited to:

1. L8 text2 context attribution: PDF81/printed69, distinct from text body/scene PDF82/printed70.
2. L8 text4 context attribution: PDF84/printed72, distinct from text body/scene PDF85/printed73.
3. L9 comprehensive Q2, PDF94/printed82: `在那里做运动` → `在那儿做运动`.
4. L9 comprehensive Q7, PDF95/printed83: `他们以前年年都是第一名` → `他们以前每年都是第一名`.

Both wording corrections are also present in their new activity prompts. Existing answer records are not migrated or overwritten; shared persistence regression is the integration lane's gate.

## New source-bound interaction coverage

Each lesson has 29 activities. L8 has 68 independently saved fields; L9 has 94.

- Three optional objective checks per lesson.
- Six-picture warmup matching per lesson: L8 official keys D C F / A B E (answer PDF11); L9 B D A / F E C (answer PDF12). Warmup pair discussion remains open and non-unique.
- Four separate listen-twice tasks per lesson, bound to tracks 8/9-1,3,5,7, with eight objective choices and precise per-item page attribution. L8 keys CC/CA/CA/AB, answer PDF11. L9 keys BC/CB on PDF12, AB/AA on PDF13. L9 text4 Q2 retains its actual textbook PDF94 provenance.
- Three role-reading tasks and one read-aloud task per lesson. All 24 post-reading questions have bilingual editorial reference answers based on the texts. References are for post-submission self-check; none uses exact-string correctness. Medical answers explicitly remain textbook-scenario retelling.
- Four L8 and three L9 source grammar explanation paragraphs, transcribed from source Chinese with Vietnamese translations, alongside the preserved editorial rules/examples. Grammar practices have 12 independent L8 blanks and 10 independent L9 blanks, including the two distinct L9 potential-complement blanks. All use editorial reference assessment, never official exact matching.
- Two separate five-word banks and ten officially graded blanks per lesson. L8 D B E A C / E B A D C; Q1–3 answer PDF11 and Q4–10 PDF12. L9 D C B E A / B C A E D; all answer PDF13, with textbook Q1–5 PDF94 and Q6–10 PDF95.
- Three picture dialogues per lesson: L8 3+3+3 fields, third panel PDF87; L9 4+3+3 fields, all PDF95. Every field has a bilingual editorial, non-unique reference. Original complete dialogues and source task directive remain available.
- Six source classroom discussion prompts per lesson remain open. L8 keeps the privacy/fictional-scenario/health caveat. L9 retains the four-person instruction and adds source-directed speaker selection and presentation-outline response fields.
- L9 review: two separate vocabulary fields, eleven rows × two independent grammar checks (22 total), and one effort reflection. First two grammar rows cite PDF96, remaining nine PDF97. No correctness grade. No L9 culture video was invented.

## Original figures and author pixel review

The 25 SVG files contain original vectors, not textbook crops. `publicationStatus: approved` means these original assets may render; their independent review explicitly remains pending. Each manifest includes source relationship, field/activity bindings and SHA-256.

L8's 13 figures: six warmups (PDF79), gym pair (PDF80), classroom ear discomfort (PDF82), hospital-room scene (PDF85), two picture dialogues (PDF86), cast/crutches dialogue (PDF87), and stethoscope/heart culture card (PDF87). No standalone L8 text3 scene was invented.

L9's 12 figures: six warmups (PDF88), campus entrance (PDF89), badminton practice (PDF91), television match viewers (PDF92), and three picture dialogues (PDF95). No standalone L9 text4 figure was invented.

Every image was rasterized with Inkscape and inspected at native 640×400 resolution across seven contact sheets. Five revised images were reopened individually. Repairs included replacing a basketball-court backdrop with a tennis court/net in L9 picture2, aligning L8 runners to their treadmill surfaces, clarifying L8 leg-check anatomy, adding face detail to the waist-measurement scene, and distinguishing L9's group-viewing practice image from its text scene. The committed contact sheets show only original author assets.

Warmup figures contain no answer letters or vocabulary labels; only scene-relevant numerals occur (6–4 scoreboard and thermometer). Alt/zoom descriptions give visual features rather than official matching words. Original legacy editorial descriptions remain in the data; the mapped warmup UI does not currently render them as answer fields.

## Author checks and remaining gates

Passed scoped author assertions: baseline legacy-key preservation with only the four enumerated changes, unique new IDs, exact independent-blank counts, bilingual references for all reading responses, non-official fields without official answer keys, matching asset hashes, and absence of embedded images/scripts in all SVG files. Existing `verifyActivities` returns no issues for either lesson. See `author-validation.json` for counts.

Not claimed: independent review, integrated browser pass, full audio listening, physical-device testing, native-speaker acceptance, production deployment, or completion of lessons beyond 08–09. The missing culture video 8-1 remains honestly unavailable; no transcript or playable substitute was fabricated. Shared tests/build/CI and recoverable Git checkpoint are integration responsibilities.
