from pathlib import Path
import os, json, hashlib, zipfile

repo = Path(__file__).resolve().parents[4]
browser = os.environ['HSK_PHASE2_BROWSER']
assert browser in ('chromium', 'webkit')
out = repo / 'course-app/.repro-output/continue-phase2' / browser
builds = json.loads((out / 'builds.json').read_text())
sha = lambda b: hashlib.sha256(b).hexdigest()
selected = []
target = out / 'compiled-client-bytes.zip'
assert not target.exists(), 'Never overwrite frozen client bytes'
with zipfile.ZipFile(target, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for group, rows in builds['compiled'].items():
        for row in rows:
            path = Path(row['path'])
            wanted = path.suffix in ('.html', '.js', '.css') or (path.suffix == '.json' and ('assets' in path.parts or path.name.endswith('manifest.json')))
            if not wanted:
                continue
            data = (repo / path).read_bytes()
            assert len(data) == row['bytes'] and sha(data) == row['sha256']
            relative = path.relative_to(Path('course-app/.repro-output/continue-phase2') / browser / 'package')
            archive.writestr(relative.as_posix(), data)
            selected.append(dict(group=group, path=relative.as_posix(), bytes=len(data), sha256=sha(data)))
    index = dict(schemaVersion=1, sourceCommit=builds['checkoutCommit'], sourceTree=builds['checkoutTree'], browser=browser, runId=builds['runId'], runAttempt=builds['runAttempt'],
                 scope='Actual compiled HTML/JS/CSS, emitted asset JSON and manifests from all four current output directories; immutable large media remain in full SHA vectors and fixed source Git.', files=selected)
    archive.writestr('index.json', json.dumps(index, ensure_ascii=False, indent=2) + '\n')
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == len(selected) + 1
    for row in selected:
        data = archive.read(row['path'])
        assert len(data) == row['bytes'] and sha(data) == row['sha256']
data = target.read_bytes()
receipt = dict(schemaVersion=1, sourceCommit=builds['checkoutCommit'], sourceTree=builds['checkoutTree'], browser=browser, runId=builds['runId'], runAttempt=builds['runAttempt'],
               file=target.name, bytes=len(data), sha256=sha(data), files=len(selected), verified=True, scope=index['scope'])
(out / 'compiled-client-bytes.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(receipt))
