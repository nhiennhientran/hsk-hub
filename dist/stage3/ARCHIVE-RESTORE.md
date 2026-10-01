# Restore the complete Step 3 review ZIP

The student HTML, teacher HTML, source, and evidence are stored as ordinary files in this branch. The complete ZIP is also preserved byte for byte in the two adjacent `.zip.part-*` files because the repository connector limits each request body to 16 MiB. These parts do not change any tested application file.

To restore the single ZIP from a checkout, run this command from the repository root. Python 3 is sufficient. It verifies both parts and the complete archive before replacing the output. The same archive can be reproduced from the ordinary source files with `python tools/package-stage3.py`.

```bash
python - <<'PYTHON'
import hashlib, json
from pathlib import Path
folder = Path('dist/stage3')
manifest = json.loads((folder / 'archive-parts.json').read_text())
chunks = []
for row in manifest['parts']:
    data = (folder / row['file']).read_bytes()
    assert len(data) == row['bytes']
    assert hashlib.sha256(data).hexdigest() == row['sha256']
    chunks.append(data)
archive = b''.join(chunks)
assert len(archive) == manifest['bytes']
assert hashlib.sha256(archive).hexdigest() == manifest['sha256']
(folder / manifest['file']).write_bytes(archive)
print('Restored:', folder / manifest['file'])
PYTHON
```

The resulting ZIP has 72 entries, including the two self-contained HTML deliverables, runnable module resources, documentation, source, and actual test evidence. See `package-manifest.json` for its complete contents and checksum. No production deployment is performed by restoring or opening this archive.
