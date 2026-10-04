# HSK1 lesson 4 current original-crop revision

Author status: current revision constructed and structural protection checks passed; independent acceptance of the current JSON and browser integration are separate gates.

`hsk1-app/content/source-activities/lesson-04-current.json` is the new display revision. The original `lesson-04.json`, its 21 source-v2 activities, and its former schematic assets remain unchanged for historical receipts. All 36 activity IDs are preserved. Ten image-based activities and three original-text reading activities use `source-v3-original-crops`; the other 23 activities are identical to the original sidecar. Number tables and bonus metadata are unchanged.

Thirteen independently reviewed source crops are copied without modification into `hsk1-app/public/source-activities/figures/l04-*.png`. Their source manifest and independent crop review are `qa-l04/source-crop-candidates.json` and `qa-l04-current/crop-review.json`. The files, SHA256 values, printed/PDF pages and crop rectangles match the approved manifest.

The six warmup pictures retain their official objective answers D/A/C/F/E/B. Four picture-completion tasks retain their five ungraded written fields and nonunique editorial references. Current feedback for picture 1 describes the source image without referring to a former schematic. Alternative family relationships and ages remain explicit possibilities, never official answer keys or measured visual facts. Neutral alt text describes visible details without asserting numerical age or family identity. Three scene crops attach to existing text-1, text-2 and text-3 reading activities; no new questions or answer fields are created.

Run `python3 course-app/docs/resume-20261004/content-04-current/build_current.py` from the repository to reproduce the current revision and author verification. It verifies the independent crop manifest hash, copies exact approved bytes, asserts the base file stays unmodified, and records the unchanged canonical source-v2 activity digest. It does not declare independent acceptance, alter the runtime catalogue, commit code, or publish the site.

Integration responsibilities belong to the main thread: select the current revision for present-day display while retaining the original version for historical validation and receipts; run native browser checks for images, persistence and old-record handling. The complete official Vietnamese audit remains phase 2. No native browser, physical device, human audio listening or production release is certified by this author report.
