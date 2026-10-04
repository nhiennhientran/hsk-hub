#!/usr/bin/env python3
"""Read actual package CI ZIP bytes and exact Git objects; never build or deploy."""
import argparse
import ast
import base64
import hashlib
import io
import json
import math
import posixpath
import re
import subprocess
import tarfile
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def canonical(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()


class Git:
    def __init__(self, repo):
        self.repo = repo
        self.process = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=repo,
                                        stdin=subprocess.PIPE, stdout=subprocess.PIPE)

    def command(self, *args):
        return subprocess.check_output(['git', *args], cwd=self.repo)

    def blob(self, ref):
        self.process.stdin.write((ref + '\n').encode())
        self.process.stdin.flush()
        header = self.process.stdout.readline().decode().strip().split()
        assert len(header) == 3 and header[1] == 'blob', (ref, header)
        raw = self.process.stdout.read(int(header[2]))
        assert self.process.stdout.read(1) == b'\n'
        return raw

    def json(self, head, path):
        return json.loads(self.blob(head + ':' + path))

    def close(self):
        self.process.stdin.close()
        self.process.wait()


def report_cases(raw, browser, head, run, expected):
    report = json.loads(raw)
    stats = report['stats']
    assert stats['expected'] == expected
    assert all(stats[k] == 0 for k in ['skipped', 'unexpected', 'flaky'])
    assert report['errors'] == []
    metadata = report['config']['metadata']
    assert metadata['ci']['commitHash'] == metadata['gitCommit']['hash'] == head
    assert metadata['ci']['buildHref'].endswith('/' + str(run))
    cases = []

    def walk(suite):
        for spec in suite.get('specs', []):
            for test in spec['tests']:
                assert test['projectName'] == browser
                assert test['status'] == 'expected'
                assert len(test['results']) == 1
                result = test['results'][0]
                assert result['status'] == 'passed' and result['retry'] == 0
                assert not result.get('errors') and not result.get('error')
                cases.append({'project': browser, 'file': spec['file'],
                              'title': spec['title'], 'status': result['status'],
                              'retry': result['retry'],
                              'attachments': result.get('attachments', [])})
        for child in suite.get('suites', []):
            walk(child)

    for suite in report['suites']:
        walk(suite)
    assert len(cases) == expected
    assert len({(c['project'], c['file'], c['title']) for c in cases}) == expected
    return {'sha256': sha(raw), 'stats': stats, 'head': head, 'cases': cases}


def baseline_excluded(path):
    return bool(re.match(r'^(?:\.github|tools|qa)/', path) or
                re.search(r'\.(?:cjs|mjs|py|md)$', path))


def main():
    parser = argparse.ArgumentParser()
    for key in ['repo', 'head', 'tree', 'browser', 'zip', 'digest', 'output']:
        parser.add_argument('--' + key, required=True)
    parser.add_argument('--run', type=int, required=True)
    parser.add_argument('--artifact', type=int, required=True)
    args = parser.parse_args()
    raw_zip = Path(args.zip).read_bytes()
    assert sha(raw_zip) == args.digest.removeprefix('sha256:')
    git = Git(args.repo)
    assert git.command('rev-parse', args.head + '^{tree}').decode().strip() == args.tree
    production = '2da6a5c80c62d4ff5bdfa72a5bdb929b2b1ff3d4'
    production_tree = '34dc16aa1e042f5f6fc6ea6edb80b9b6926cb344'
    assert git.command('rev-parse', production + '^{tree}').decode().strip() == production_tree
    with zipfile.ZipFile(args.zip) as archive:
        assert archive.testzip() is None
        names = archive.namelist()
        assert len(names) == len(set(names))
        for name in names:
            assert not name.startswith('/') and '\\' not in name
            assert '..' not in name.split('/')
        archived = {name: archive.read(name) for name in names if not name.endswith('/')}

    def one(suffix):
        found = [raw for name, raw in archived.items() if name.endswith(suffix)]
        assert len(found) == 1, (suffix, len(found))
        return found[0]

    assembly_raw = one('/.repro-output/flow-package-assembly.json')
    assembly = json.loads(assembly_raw)
    manifest_raw = one('/unified-site-flow-package/course-engine/unified-release-manifest.json')
    manifest = json.loads(manifest_raw)
    assert manifest['schemaVersion'] == 2 and manifest['mode'] == 'checkpoint'
    assert manifest['app'] == 'hsk123-unified' and manifest['lessons'] == 48
    assert manifest['sourceCommit'] == assembly['sourceCommit'] == args.head
    assert manifest['sourceDirty'] is False and assembly['sourceDirty'] is False
    assert manifest['buildProvenance'] == assembly['buildProvenance'] == 'built-from-recorded-worktree'
    assert manifest['protectedProduction'] == assembly['productionCommit'] == production
    assert assembly['productionTree'] == production_tree
    assert assembly['status'] == 'assembled-checkpoint-not-release'
    assert assembly['unifiedManifestSHA256'] == sha(manifest_raw)
    assert sha(canonical(assembly['files'])) == assembly['inventorySHA256']
    assert len(assembly['files']) == assembly['assembledFiles']
    declared = {row['path']: row for row in assembly['files']}
    new_files = {row['path']: row for row in manifest['files']}
    assert len(declared) == len(assembly['files'])
    assert len(new_files) == len(manifest['files'])
    assert len(new_files) + 1 == assembly['packageFiles']
    assert all(declared[p] == row for p, row in new_files.items())
    assert declared['course-engine/unified-release-manifest.json'] == {
        'path': 'course-engine/unified-release-manifest.json',
        'bytes': len(manifest_raw), 'sha256': sha(manifest_raw)}

    # The manifest snapshot is checked against actual immutable Git blobs.
    packager = git.blob(args.head + ':course-app/tools/package-unified.mjs')
    scopes = ast.literal_eval(re.search(rb'export const runtimeSourceScopes=(\[[^;]+\]);', packager)[1].decode())
    paths = git.command('ls-tree', '-r', '-z', '--name-only', args.head, '--', *scopes).decode().split('\0')
    source_inventory = {}
    snapshot = []
    for path in sorted(p for p in paths if p):
        raw = git.blob(args.head + ':' + path)
        source_inventory[path] = {'bytes': len(raw), 'sha256': sha(raw)}
        snapshot.append({'path': path, 'sha256': sha(raw)})
    assert snapshot == manifest['sourceSnapshot']['files']
    snapshot_sha = sha(canonical(snapshot))
    assert snapshot_sha == manifest['sourceSnapshot']['sha256'] == assembly['sourceSnapshotSHA256']

    # Independently rehash every uploaded consumer, including protected old chunks.
    uploaded = {}
    for name, raw in archived.items():
        marker = '/unified-site-flow-package/'
        if marker not in '/' + name:
            continue
        path = ('/' + name).split(marker, 1)[1]
        assert path in declared, path
        assert declared[path]['bytes'] == len(raw) and declared[path]['sha256'] == sha(raw), path
        uploaded[path] = raw
    entries = ['index.html', 'new-hsk1/index.html', 'new-hsk1/hsk1/index.html',
               'new-hsk1/hsk1/lesson.html', 'new-hsk1/hsk1/learning.html',
               'new-hsk1/hsk1/lesson9-pilot.html', 'new-hsk2/index.html',
               'new-hsk2/hsk2/index.html', 'new-hsk3/index.html', 'new-hsk3/hsk3/index.html']
    asset_paths = {p for p in declared if re.fullmatch(r'course-engine/assets/.+\.(?:js|css|json)', p)}
    assert set(uploaded) == set(entries) | asset_paths | {'course-engine/unified-release-manifest.json'}
    bundled_json_sources = []
    for path in sorted(p for p in asset_paths if p.endswith('.json')):
        assert json.loads(uploaded[path]) is not None
        name = re.fullmatch(r'(.+)-[A-Za-z0-9_-]{8}\.json', posixpath.basename(path))[1]
        source = 'hsk1-app/content/' + name + '.json'
        expected = git.blob(args.head + ':' + source)
        assert uploaded[path] == expected, (path, source)
        bundled_json_sources.append({'path': path, 'sourcePath': source, 'bytes': len(expected), 'sha256': sha(expected)})

    # Reconstruct the one untransformed build HTML and all10 entry aliases.
    source_html = uploaded['new-hsk2/index.html'].decode().replace(
        '<meta name="hsk-level" content="2"><meta name="asset-base" content="../course-engine/"><meta name="hsk-entry-view" content="courses">',
        '<meta name="hsk-level" content="2">').replace('"../course-engine/assets/', '"./assets/')
    input_files = {row['path']: row for row in manifest['inputFiles']}
    assert len(input_files) == len(manifest['inputFiles'])
    assert sha(source_html.encode()) == input_files['index.html']['sha256']
    assert len(source_html.encode()) == input_files['index.html']['bytes']
    for path in entries:
        level = int(re.search(r'new-hsk([123])', path)[1]) if path != 'index.html' else 1
        depth = path.count('/')
        base = '../' * depth + 'course-engine/' if depth else './course-engine/'
        view = 'portal' if path == 'index.html' else 'courses'
        expected = source_html.replace('<meta name="hsk-level" content="2">',
            f'<meta name="hsk-level" content="{level}"><meta name="asset-base" content="{base}"><meta name="hsk-entry-view" content="{view}">').replace('"./assets/', '"' + base + 'assets/')
        assert uploaded[path] == expected.encode(), path
    for path, row in input_files.items():
        if path == 'index.html':
            continue
        output = declared['course-engine/' + path]
        assert output['bytes'] == row['bytes'] and output['sha256'] == row['sha256']

    # Verify all protected baseline declarations from real2da blobs.
    baseline = {}
    tree_rows = git.command('ls-tree', '-r', '-z', production).decode().split('\0')
    for line in filter(None, tree_rows):
        metadata, path = line.split('\t')
        mode, kind, oid = metadata.split()
        assert mode == '100644' and kind == 'blob'
        raw = git.blob(oid)
        baseline[path] = {'bytes': len(raw), 'sha256': sha(raw), 'blob': oid}
    assert len(baseline) == assembly['baselineFiles'] == 1446
    exclusions = {row['path'] for row in assembly['baselineUnservedExclusions']}
    assert exclusions == {path for path in baseline if baseline_excluded(path)}
    assert len(exclusions) == 55 and not exclusions.intersection(declared)
    replacements = {row['path']: row for row in assembly['authorizedReplacements']}
    assert set(replacements) == set(entries) | {'course-engine/content-manifest.json'}
    assert len(replacements) == 11
    for path, row in replacements.items():
        assert row['beforeGitBlob'] == baseline[path]['blob']
        assert row['beforeSHA256'] == baseline[path]['sha256']
        assert row['afterSHA256'] == declared[path]['sha256']
    protected = set(baseline) - exclusions - set(replacements)
    assert len(protected) == assembly['protectedPublicFiles'] == 1380
    for path in protected:
        assert declared[path]['bytes'] == baseline[path]['bytes']
        assert declared[path]['sha256'] == baseline[path]['sha256']
    assert set(declared) == (set(baseline) - exclusions) | set(new_files) | {'course-engine/unified-release-manifest.json'}
    assert not any(baseline_excluded(p) or re.search(r'\.(?:pdf|zip|rar|map)$', p, re.I) for p in declared)

    # Source PNG/SVG/audio/glyph bytes are intentionally omitted from the ZIP.
    # Reconcile their declarations with exact source blobs and trusted authorities.
    entry_dirs = ['', 'new-hsk1', 'new-hsk1/hsk1', 'new-hsk2', 'new-hsk2/hsk2', 'new-hsk3', 'new-hsk3/hsk3']
    crops = {}
    for number in range(1, 16):
        filename = 'lesson-04-current.json' if number == 4 else f'lesson-{number:02}.json'
        lesson = git.json(args.head, 'hsk1-app/content/source-activities/' + filename)
        for figure in lesson['figures']:
            path = 'source-activities/' + figure['file']
            assert path not in crops and figure['kind'] == 'original-crop'
            assert figure['source']['textbookSHA256'] == lesson['textbookSHA256']
            source_row = source_inventory['hsk1-app/public/' + path]
            assert source_row['sha256'] == figure['sha256']
            crops[path] = source_row
            for target in ['course-engine/' + path] + [(d + '/' if d else '') + path for d in entry_dirs]:
                assert declared[target]['sha256'] == figure['sha256']
                assert declared[target]['bytes'] == source_row['bytes']
    assert len(crops) == manifest['originalSourceCrops'] == 150
    assert {r['path']: r['sha256'] for r in manifest['sourceFigures']} == {p: r['sha256'] for p, r in crops.items()}
    illustrations = {}
    for level, count in [(2, 15), (3, 18)]:
        for number in range(1, count + 1):
            lesson = git.json(args.head, f'course-app/content/hsk{level}/lesson-{number:02}.json')
            for figure in lesson['illustrationManifest']:
                path = figure['file']
                assert figure['publicationStatus'] == 'approved'
                source_row = source_inventory['course-app/public/' + path]
                assert figure['assetSha256'] == source_row['sha256']
                assert declared['course-engine/' + path]['sha256'] == source_row['sha256']
                illustrations[path] = source_row['sha256']
    assert len(illustrations) == 438
    assert {r['path']: r['sha256'] for r in manifest['auxiliaryIllustrations']} == illustrations
    tracks = git.json(args.head, 'course-app/content/audio-manifest.json')['tracks']
    tracks += [{**row, 'file': 'course-assets/audio/' + row['id'] + '.mp3'} for row in
               git.json(args.head, 'hsk1-app/content/media-references.json')['originalTracks']]
    assert len(tracks) == manifest['originalAudioTracks'] == 357
    for track in tracks:
        path = track['file']
        if path.startswith('course-assets/audio/'):
            # Generated shared H1 copies are ignored build output. Rehash the
            # precise original input used by sync-shared-assets, and production.
            original = git.blob(args.head + ':' + track['path'])
            expected = {'sha256': sha(original), 'bytes': len(original)}
            assert baseline[track['path']]['sha256'] == expected['sha256']
            assert baseline[track['path']]['bytes'] == expected['bytes']
        else:
            expected = source_inventory['course-app/public/' + path]
        assert track['sha256'] == expected['sha256'] and track['bytes'] == expected['bytes']
        assert declared['course-engine/' + path]['sha256'] == expected['sha256']
        assert declared['course-engine/' + path]['bytes'] == expected['bytes']
    # Reconstruct the generated glyph provenance from the exact Git inputs and
    # the package-lock integrity verified npm tarball, without trusting a local
    # generated public directory or pretending it belongs to sourceSnapshot.
    one_textbook = git.json(args.head, 'hsk1-app/content/textbook.json')
    text = ''.join(l['hanzi']['chars'] + ''.join(w['zh'] for w in l['vocab']) for l in one_textbook['lessons'])
    for level, count in [(2, 15), (3, 18)]:
        for number in range(1, count + 1):
            lesson = git.json(args.head, f'course-app/content/hsk{level}/lesson-{number:02}.json')
            text += ''.join(w['zh'] for w in lesson['vocabulary'])
    # Match the browser/build engine's Unicode Script=Han character semantics.
    characters = json.loads(subprocess.check_output(['node', '-e',
        "const t=require('fs').readFileSync(0,'utf8');process.stdout.write(JSON.stringify([...new Set(t.match(/\\p{Script=Han}/gu)??[])].sort()))"],
        input=text.encode()))
    lock = git.json(args.head, 'course-app/package-lock.json')['packages']['node_modules/hanzi-writer-data']
    assert lock['version'] == '2.0.1'
    algorithm, expected_integrity = lock['integrity'].split('-', 1)
    digest_hex = base64.b64decode(expected_integrity).hex()
    npm_cache = Path(subprocess.check_output(['npm', 'config', 'get', 'cache'], text=True, stderr=subprocess.DEVNULL).strip())
    tar_path = npm_cache / '_cacache/content-v2' / algorithm / digest_hex[:2] / digest_hex[2:4] / digest_hex[4:]
    tar_bytes = tar_path.read_bytes()
    assert base64.b64encode(hashlib.new(algorithm, tar_bytes).digest()).decode() == expected_integrity
    npm_tar = tarfile.open(fileobj=io.BytesIO(tar_bytes), mode='r:gz')
    glyph_sources = []
    for character in characters:
        path = 'course-assets/hanzi/' + character + '.json'
        source_path = 'hsk1-app/public/' + path
        protected_path = 'new-hsk1/assets/hanzi-data/' + character + '.json'
        if source_path in source_inventory:
            raw = git.blob(args.head + ':' + source_path)
            origin = 'protected-hsk1-source'
        elif protected_path in baseline:
            raw = git.blob(args.head + ':' + protected_path)
            assert sha(raw) == baseline[protected_path]['sha256']
            origin = 'protected-hsk1-source'
        else:
            raw = npm_tar.extractfile('package/' + character + '.json').read()
            origin = 'npm:hanzi-writer-data@2.0.1'
        assert sha(raw) == declared['course-engine/' + path]['sha256']
        assert len(raw) == declared['course-engine/' + path]['bytes']
        glyph = json.loads(raw)
        assert len(glyph['strokes']) == len(glyph['medians']) > 0
        assert all(isinstance(s, str) and s.strip() for s in glyph['strokes'])
        assert all(len(m) > 1 and all(len(v) == 2 and all(math.isfinite(c) for c in v) for v in m) for m in glyph['medians'])
        glyph_sources.append({'character': character, 'origin': origin, 'strokes': len(glyph['strokes']), 'sha256': sha(raw)})
    assert len(glyph_sources) == 671
    provenance = {'schemaVersion': 1, 'source': 'https://github.com/chanind/hanzi-writer-data', 'packageVersion': '2.0.1',
                  'license': 'HANZI-DATA-LICENSE.txt', 'characters': glyph_sources}
    provenance_bytes = (json.dumps(provenance, ensure_ascii=False, indent=2) + '\n').encode()
    provenance_row = declared['course-engine/course-assets/HANZI-PROVENANCE.json']
    assert provenance_row['sha256'] == sha(provenance_bytes) and provenance_row['bytes'] == len(provenance_bytes)
    for name in ['HANZI-DATA-LICENSE.txt', 'HANZI-WRITER-LICENSE.txt']:
        path = 'course-assets/' + name
        assert source_inventory['hsk1-app/public/' + path]['sha256'] == declared['course-engine/' + path]['sha256']
    npm_tar.close()

    dependencies = []

    def require(owner, ref):
        url = urlsplit(urljoin('https://checkpoint.invalid/' + owner, ref))
        if url.netloc != 'checkpoint.invalid':
            return
        target = unquote(url.path.lstrip('/'))
        if target.endswith('/'):
            assert any(p.startswith(target) for p in declared), (owner, target)
        else:
            assert target in declared, (owner, target)
        dependencies.append({'owner': owner, 'reference': ref, 'target': target})

    for path in entries:
        for ref in re.findall(r'(?:src|href)="([^"]+\.(?:js|css)(?:[?#][^"]*)?)"', uploaded[path].decode()):
            require(path, ref)
    for path in asset_paths:
        if not path.endswith('.js'):
            continue
        code = uploaded[path].decode()
        for match in re.finditer(r'new URL\(\s*(["\'`])([^"\'`]+)\1\s*,\s*import\.meta\.url\s*\)', code):
            if '${' not in match[2]:
                require(path, match[2])
        for ref in re.findall(r'["\'`]((?:\./|assets/)[A-Za-z0-9_./-]+\.(?:js|css))["\'`]', code):
            require(path, '../' + ref if ref.startswith('assets/') else ref)

    package = report_cases(one('/.repro-output/package-closure-browser.json'), args.browser, args.head, args.run, 9)
    legacy = report_cases(one('/flow-compat-review/legacy-native-results.json'), args.browser, args.head, args.run, 3)
    expected_package = {f'unified packaged entry {d or "portal"} loads actual source crops with nonempty legacy state' for d in entry_dirs} | {
        'nested HSK1 textbook originals and original audio resolve against shared course engine',
        'assembled HTTP bytes match frozen identity and private baseline/source paths are not served'}
    assert {c['title'] for c in package['cases']} == expected_package
    assert {c['title'] for c in legacy['cases']} == {
        'verified assembled old HSK1 HSK2 HSK3 and both HSK4 routes preserve nonempty histories and extra HSK4 gate',
        'verified assembled HSK2 nested default and explicit cross-level deep links survive reload',
        'verified assembled HSK3 nested default and explicit cross-level deep links survive reload'}
    workflow = git.blob(args.head + ':.github/workflows/hsk-flow-package-checkpoint.yml')
    assert b'FLOW_LEGACY_LOCAL_PAKO' not in workflow
    assert not any(name.endswith('legacy-local-dependency.json') for name in archived)
    git.close()
    result = {
        'schemaVersion': 1, 'reviewer': 'release_assembly', 'checkedAtUTC': datetime.now(timezone.utc).isoformat(),
        'status': 'accepted-actual-clean-package-consumer-and-native-evidence-not-release',
        'head': args.head, 'tree': args.tree, 'runId': args.run, 'artifactId': args.artifact,
        'browser': args.browser, 'zip': {'path': args.zip, 'sha256': sha(raw_zip), 'bytes': len(raw_zip),
                                      'crc': 'passed', 'uniqueSafeMembers': len(names)},
        'source': {'sourceDirty': False, 'buildProvenance': manifest['buildProvenance'],
                   'runtimeFilesRehashedFromExactGit': len(snapshot), 'sourceSnapshotSHA256': snapshot_sha},
        'assembly': {'reportSHA256': sha(assembly_raw), 'assembledFiles': len(declared),
                     'packageFiles': assembly['packageFiles'], 'inventorySHA256': assembly['inventorySHA256'],
                     'manifestSHA256': sha(manifest_raw), 'baselineGitBlobsRehashed': len(baseline),
                     'protectedPublicDeclaredByteMatches': len(protected), 'unservedExclusions': len(exclusions),
                     'authorizedReplacements': len(replacements)},
        'downloadedConsumers': {'actualRehashedFiles': len(uploaded), 'compiledAssets': len(asset_paths),
                                'compiledExtensions': dict(Counter(posixpath.splitext(p)[1] for p in asset_paths)),
                                'htmlEntries': entries, 'sourceInputHTMLReconstructedAndSHAValidated': True,
                                'newCompiledAssets': sum(p in new_files for p in asset_paths),
                                'oldProtectedCompiledAssets': sum(p in protected for p in asset_paths),
                                'files': [{'path': p, 'bytes': len(uploaded[p]), 'sha256': sha(uploaded[p])} for p in sorted(uploaded)],
                                'bundledJSONExactSourceBytes': bundled_json_sources},
        'omittedAssetDeclarationsReconciledToExactGitAndLockedNpm': {'sourceCrops': 150, 'cropPathCopies': 1200,
                                                        'auxiliarySVGs': 438, 'originalMP3': 357,
                                                        'trustedGlyphs': 671, 'licensesAndProvenance': 3,
                                                        'glyphOrigins': dict(Counter(g['origin'] for g in glyph_sources)),
                                                        'npmTarball': {'version': lock['version'], 'integrity': lock['integrity'],
                                                                       'actualBytes': len(tar_bytes), 'actualSHA256': sha(tar_bytes)},
                                                        'generatedProvenanceReconstructedSHA256': sha(provenance_bytes)},
        'dependencies': dependencies, 'actualNative': {'package': package, 'normalNetworkLegacy': legacy},
        'limitations': ['Actual ZIP bytes independently rehashed only for manifest,132compiledassets,10HTML plus reports.',
                        'Full3894 actual assembled files were not downloaded. Omitted media/glyph declarations match exact Git/locked npm source authority; actual assembler/browsers supply execution evidence.',
                        'Recorded1110-file snapshot excludes ignored generated H1 audio/glyph copies. Their authoritative root originals and locked npm bytes were independently reconciled here. Root original paths are outside runtimeSourceScopes; release must separately verify their clean/input identity.',
                        'H4 extra stage is explicitly authorized in a synthetic session; classroom password validation is outside legacy test scope.',
                        'Partial4 and font2 perengine are independently reviewed by separate workers; do not duplicate their counts here.',
                        'No production deployment,formal16passed,fullVietnamese,human-listening orphysical-device claim.']}
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': result['status'], 'browser': args.browser, 'head': args.head,
                      'assembly': result['assembly'], 'actualConsumerFiles': len(uploaded),
                      'compiledAssets': len(asset_paths), 'bundledJSONMatchesExactGit': len(bundled_json_sources)}))


if __name__ == '__main__':
    main()
