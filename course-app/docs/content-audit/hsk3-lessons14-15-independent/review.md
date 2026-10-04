# Independent review: HSK3 lessons 14–15

Verdict: FIX REQUIRED (bounded content/artwork audit, not browser acceptance).

Frozen inputs verified:
- L14 bf733ba51dfd8516bb832d0c73ea7a6d1d4789fd5c5f8697ddf9763076882e94
- L15 f7e9568fba23f9d202a38c5ebdd560d30d940fc45733179aa024fa0662d94333

## Precise fixes
1. L15 `public/illustrations/hsk3-l15-city-beijing.svg` and `hsk3-l15-picture-1.svg`: central traditional building floats. Its wall ends at y278 while ground begins y328, leaving a 50px sky gap. Extend its wall/door to a coherent ground plane or draw an explicit continuous supporting terrace. Re-render both; the tourist currently conceals only part of the defect. Evidence: independently rasterized figures-6.png and figures-7.png.
2. L15 `hsk3-l15-warmup1-3.svg`: the three upright figures/shadows float around y318, above the bench seat at y348; the bench legs extend below the 400px canvas (transform 242 + 1.8*112 = 443.6). Redraw a coherent standing-by-bench or seated scene and fit all bench legs inside the canvas. If standing, change Chinese alt/description/title from 坐在… to 与…/在…旁; Vietnamese currently only says beside the bench. Evidence figures-4.png, exact SVG inspected.
3. L15 `hsk3-l15-text2-1.svg` and `hsk3-l15-city-nanjing.svg`: traditional tower stories are detached, with background gaps between the roof/story units. Connect the supporting tower body across tiers (or add visible pillars). Evidence figures-6.png and figures-8.png.
4. L15 `hsk3-l15-picture-2.svg`: both players appear side by side on the same side of the chessboard, while Chinese and Vietnamese alt/description/title/desc claim they sit facing each other. Either position them opposite each other, or describe exactly the visible people playing chess without the unsupported facing-each-other claim. Evidence figures-7.png.
5. L14 added activity `hsk3-fltrp-2026:l14:activity:text2-listening`, field `...:text2-question2`, option 找李文借书: Vietnamese `Nhờ Lý Văn mượn sách` means asking Li Wen to borrow a book, reversing who lends. Use `Mượn sách của Lý Văn` or `Tìm Lý Văn để mượn sách`. This wording is inherited from baseline, but the new activity repeats it; preserve frozen original baseline fields and correct the additive option only (or separately seek approval for a baseline correction).

No candidate or main files edited. After repairs regenerate asset hashes/freeze records and rerun checks; retain independentReview pending until repaired bytes are inspected.

## Executed checks and positive findings
- Independently rendered and personally inspected every textbook PDF page136–155 and answer PDF page19–22, rather than trusting author sheets. All 20 textbook page images and 4 answer images are present here.
- Independently invoked Inkscape on all 31 exact manifest SVGs, verified 640×400 output, hashes and XML parse, and personally inspected every image at full native size in eight 1280×850 sheets. Most scenes clearly communicate their intended concepts; defects above block an unqualified artwork pass.
- Recursively compared all 16 baseline top-level values against git commit d5feac8a01ec7095573da8dd9c4205c23bc7ed2b. All old values, nested keys, IDs, 30 homework and 4 supplemental listening items per lesson unchanged.
- L14:26 activities,63 fields,3 grammar explanations,13 figures. Fields:24 official,30 reference,9 open.
- L15:32 activities,86 fields,4 grammar explanations,18 figures. Fields:23 official,33 reference,30 open.
- Source-specific task counts checked: six warmup matches and two discussion prompts each; 8 listening +12 reading questions each; L14 nine grammar blanks,10 word-bank blanks,3+3+3 picture blanks,4 classroom blank rows with two fixed examples; L15 twelve grammar blanks,10 word-bank blanks,3+3+2 picture blanks,one city preference/reason response,2 vocabulary fields,10 independent understand/use row pairs,one improvement response.
- Read all seven full grammar explanations against source. L15 grammar2 is continuous across PDF148–149, not fabricated as two groups. Correct source mapping and no grammarPresentations split.
- Independently filled and read all 21 grammar-completion templates, six multi-blank picture dialogues and20 word-bank sentences in both languages; all blank counts match fields. Read all24 reading reference answers and the ambiguity explanation. These references are grammatically usable and contextually valid. Some inherited Vietnamese is concise, but no reference substitution leaves dangling/doubled components.
- All47 official fields have matching source answers: L14 warmup F A C D B E; listening B A/A B/A C/C A; word banks C A B D E/C E D B A. L15 warmup F E B A D C; listening C B/A [reference-only A or B]/B B/A B; words B D C E A/E B C D A. PDF20–22 page split provenance checked personally.
- L15 text2Q2: official A visibly on answerPDF21; textbookPDF147 optionB says 一千年以上, and PDF148 dialogue says 两千年以上. Added field remains select/reference, lacks answer/answerSource, correctly explains the overlap in both languages. No forced scoring.
- All nonofficial fields lack answer/answerSource. Unique field IDs checked. No L14 culture/review invented. L15 has four named cities, unavailable river video preserved, clearly non-video schematic, and all10 source review rows.
- `npm run content:check`:PASS, issues[]. Independent log retained.
- `npm test`:81/82; only failure is unchanged aggregate picture count351 vs320 in tests/activities.test.mjs. No shared tests edited.
- Typecheck with author audit-only dependency-resolution config:PASS. Independent log retained.

Not executed: browser interaction, responsive UI, persistence/reload, playback/audio, production build/integration, commit/upload/publish. No claim of these passing.
