# Independent HSK2 L6 source correction v2 acceptance

The separate root-authored corrected source SHA256 `9df03d8b01446b998c1afe6e9fadb500106b525ad6c2d438388d0232641ba94d` is accepted for source transcription fidelity: **116 accepted / 0 repair / 0 held**.

All 115 unaffected records remain fully identical to the original source independently reviewed against actual PDF60–69. The target record `hsk2-official-vi:l06:p052:text4-whole-paragraph`, index84, changes only `viPrinted`: the second printed `rất` is restored before `mệt`. All its Chinese/POS/role/page/metadata fields stay unchanged. The corrected complete paragraph matches the independently viewed original PDF66/footer052 4× detail. The corrected source explicitly records original author, original source/freeze hashes and root as repair author; the only top-level changes are author/status/revision.

The repair evidence path is actually valid relative to repository root, resolves to a regular existing file, and has exact SHA256 `1a834e9f520ea99a398a441411d63ffaa4f5b2df80c92744cfedb66258a58c9b`. No path-layer repair is needed.

The original source/freeze and initial independent review/freeze remain unchanged. This sidecar separately binds the corrected source, inherited 115 original-page judgments and the one independently verified source correction. It does not claim a new full-page reread, website comparison, raw translation change, runtime activation, release or publication approval.

Reproduce from `course-app/`:

```sh
python docs/resume-20261004/qa-official-vi/hsk2-l06-source/v2-sidecar/verify-v2-source.py
```
