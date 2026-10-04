# HSK3 lessons 12–13: frozen author candidate

Base: `d5feac8a01ec7095573da8dd9c4205c23bc7ed2b`. Isolated detached worktree: the isolated author checkout. This is an uncommitted author candidate, not independent acceptance or a published release.

## Source inspection

Personally rendered and inspected all actual textbook pages PDF116–135 (printed104–123) and answer PDF16–19. Rechecked full PDF SHA256 identities. Reused the completed source inventory and prior lesson12/13 independent corpus reviews without treating historical reviews as acceptance of this new interaction layer. Raw source PDFs and source-page renders remain outside the candidate/public files.

## Additions and preservation

- L12: 32 activities, 97 fields: 24 official, 35 non-unique editorial references, 38 open fields. Twelve grammar frames/twelve fields; picture dialogues 5+3+3; 11 review rows with 22 independently saved checks, two vocabulary fields, one improvement response. Thirteen original SVGs.
- L13: 26 activities, 66 fields: 24 official, 33 non-unique editorial references, nine open fields. Nine grammar frames/eleven independent fields (first grammar 1+2+2); picture dialogues 3+3+4. Twelve original SVGs.
- Both lessons preserve all 16 original top-level keys and all nested values, stable IDs, four texts, original vocabulary, grammar, sections, 30 homework and four supplemental listening questions. Only additive top-level fields were introduced.
- All eight listening activities retain original odd-numbered tracks and the listen-twice directive. Reading answers are editorial, bilingual, non-unique and ungraded.
- Seven complete source grammar explanations. L12 就 preserves both source paragraphs and groups original examples 0–1 versus 2–3. L13 把(4) paragraph/formula is sourced to PDF130, not its English continuation; 一边 retains the shortened form and negative driving example in unchanged corpus.
- All official response mappings point to actual answer-book pages. L12 first answer-bearing page is PDF17; answer PDF16 is only the heading boundary. L13 text2 listening Q2 remains textbook PDF130, and comprehensive Q10 remains PDF135.
- L13 legacy word-bank/directive `kind: question` blocks were deliberately not rewritten: the additive layer selects exact source roles/pointers and supplies no spurious response field.
- L12 picture dialogue3 preserves A/B/B/A. The classroom task keeps six questions plus optional continuation (not a seventh fixed factual question), and per-row review sources cross PDF125–126 correctly. L13 remains a four-person open discussion with all four original prompts and a clearly editorial response scaffold.
- Neither lesson gets an invented text4 figure. L12 culture uses an original four-scene composite with no city names or fake controls; the unavailable-video notice remains unchanged. L13 has no invented culture or review task.

## Bilingual and visual author QA

Inserted all references/official word completions into every new translated blank sentence and read the resulting Chinese and Vietnamese. `complete-sentence-ledger.json` records all 47 completed grammar/picture/word-bank frames; `reference-ledger.json` records all 68 editorial reference fields including reading questions. Natural Vietnamese word order is independently scaffolded for 把 rather than literal “đem”. Contextual word-bank translations fit their completed sentences. The medication frame is explicitly fictional language practice, not medical advice. Editorial answers stay non-unique, with no official grading keys. This is author linguistic review, not native-speaker certification.

Rendered every original SVG with Inkscape at its full 640×400 viewport; inspected all 25 in seven 1280×860 sheets. Fixed extra-arm artifacts in painter/knocking scenes and an unnecessary connecting limb in the adult pair; reopened all three repaired images individually. Final sheets include the repairs. All images have bilingual accessible descriptions, safe inline vector primitives and independent figure identities. No source pixels, embedded external images, scripts, logos, answer letters or video controls. Manifest `approved` permits displaying our own original artwork; it does not claim independent content acceptance.

## Validation

- `validate.py`: all baseline values preserved; inventory/source/page mappings, response boundaries, official answer sequences, cross-page fields, grammar/picture counts, review checks, all SVG XML and hashes pass.
- `schema-source-guards.json`: zero activity-schema, source-guard or release lexicon issues across the complete local corpus.
- Full shared unit suite: 81 pass, one fails. Only failure is the existing global illustration constant `320`; this candidate adds 25 and yields 345. Every per-asset existence, SHA and safety assertion passes before that total assertion. Shared tests were not edited.
- Direct original typecheck initially could not resolve dependencies because this isolated worktree has no node_modules. The dedicated audit-local `tsconfig.validation.json` resolves the already-installed dependency types without changing shared configs or files; full source/config typecheck then passes (`typecheck-resolved.log`).
- Frozen JSON/SVG hashes are in `frozen-hashes.json`. Only lesson12/13 JSON, original hsk3-l12/l13 SVGs and this dedicated audit directory are changed. No commit, upload, push or publication.

## Pending independent gates

Independent source and Vietnamese/reference review of the frozen candidate; independent SVG pixel review; browser desktop/mobile rendering, precise blank binding, answer concealment, reset/reload and persisted-response regressions (especially all 11 L13 grammar fields and the 22 L12 checks); final integrated schema/unit total update and full regression after combining other lanes. Fresh audio checksum/decode/semantic tests were not rerun: the original audio and corpus remain byte-for-byte outside this additive lane, with prior evidence only. Publication remains unrequested and unperformed.
