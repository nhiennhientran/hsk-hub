"""Structural/source-reference checks only, not independent language review."""
from pathlib import Path
from collections import Counter
import hashlib
import json

here = Path(__file__).resolve().parent
source = json.loads((here / 'source-transcription.json').read_text())
renders = json.loads((here / 'render-manifest.json').read_text())
rows = source['occurrences']
ids = [r['occurrenceId'] for r in rows]
assert len(ids) == len(set(ids)) == source['coverage']['occurrenceCount']
assert dict(Counter(r['category'] for r in rows)) == source['coverage']['byCategory']
assert source['independentReview']['status'] == 'pending'
assert source['sourcePDF']['sha256'] == renders['sourcePDFSHA256']
assert source['pdfPages'] == [p['pdfPage'] for p in renders['pages']]
for row in rows:
    assert row['lesson'] == source['lesson'] and row['pdfPage'] in source['pdfPages']
    parts = []
    for fragment in row['fragments']:
        lines = fragment['lineTexts']
        joiners = fragment.get('lineJoiners', [' '] * (len(lines) - 1))
        assert len(joiners) == len(lines) - 1
        parts.append(''.join(line + (joiners[i] if i < len(joiners) else '') for i, line in enumerate(lines)))
    assert row['viText'] == ' '.join(parts)
    assert (here / row['renderRef']).is_file()
for word in source['wordTableRows']:
    assert word['glossOccurrenceId'] in ids
    assert word['posOccurrenceId'] in ids if word['rawPosLabel'] else word['posOccurrenceId'] is None
for image in renders['pages'] + renders.get('crops', []):
    path = here / 'renders' / Path(image['file']).name
    image_bytes = path.read_bytes()
    assert len(image_bytes) == image['bytes'] and hashlib.sha256(image_bytes).hexdigest() == image['sha256']
print(json.dumps({'status': 'structural-check-passed-only', 'occurrences': len(rows), 'byPage': dict(Counter(r['pdfPage'] for r in rows)), 'wordTableRows': len(source['wordTableRows']), 'independentLanguageAccepted': 0}, ensure_ascii=False))
