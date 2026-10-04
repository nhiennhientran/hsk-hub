from pathlib import Path
import hashlib
import json

OWN = Path(__file__).resolve().parent
COURSE = OWN.parents[2]
REPO = COURSE.parent

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def read(path):
    return json.loads(path.read_text())

raw = read(OWN / 'native-results.json')
assert raw['stats']['expected'] == 2
assert raw['stats']['unexpected'] == raw['stats']['flaky'] == raw['stats']['skipped'] == 0
assert raw['config']['workers'] == 1
specs = raw['suites'][0]['specs']
assert len(specs) == 2
for spec in specs:
    assert spec['ok'] and len(spec['tests']) == 1
    test = spec['tests'][0]
    assert test['projectName'] == 'chromium' and test['annotations'] == []
    assert len(test['results']) == 1
    assert test['results'][0]['status'] == 'passed' and test['results'][0]['retry'] == 0
    assert test['results'][0]['errors'] == []

source = {}
source_hashes = []
for number in [3, 6, 7, 12, 13, 14, 15]:
    path = REPO / f'hsk1-app/content/source-activities/lesson-{number:02}.json'
    source[number] = read(path)
    source_hashes.append({'path': str(path.relative_to(REPO)), 'sha256': sha(path)})
expected_fields = []
expected_tables = []
for number, lesson in source.items():
    for activity in lesson['activities']:
        if number >= 12:
            for field in activity['fields']:
                if field.get('pinyin'):
                    expected_fields.append({'lesson': number, 'activityId': activity['id'],
                        'activityVersion': activity['version'], 'fieldId': field['id'],
                        'label': field['label'], 'pinyin': field['pinyin'],
                        'source': field.get('source', activity['source'])})
        if number < 12 and any(col['zh'] == col['vi'] == '' for col in activity.get('table', {}).get('columns', [])):
            table = activity['table']
            expected_tables.append({'lesson': number, 'activityId': activity['id'],
                'activityVersion': activity['version'], 'source': activity['source'],
                'columns': table['columns'], 'blankHeaderIndexes': [i for i, col in enumerate(table['columns']) if col['zh'] == col['vi'] == ''],
                'rowCount': len(table['rows']), 'blankBodyCells': sum(not cell.get('text') and not cell.get('fieldId') for row in table['rows'] for cell in row['cells'])})
assert len(expected_fields) == 24 and len(expected_tables) == 5
ledgers = sorted((OWN / 'native-output').glob('*/source-font-evidence.json'))
assert len(ledgers) == 2
results = []
for path in ledgers:
    data = read(path)
    assert data['fieldCount'] == 24 and data['tableCount'] == 5
    assert data['project'] == 'chromium' and data['glyphFontCertification'] is False
    assert [{key: item[key] for key in expected_fields[0]} for item in data['fields']] == expected_fields
    assert [{key: item[key] for key in expected_tables[0]} for item in data['tables']] == expected_tables
    assert len(data['screenshots']) == len(set(data['screenshots'])) == 17
    assert len(list(path.parent.glob('*.png'))) == 17
    assert all((path.parent / name).is_file() for name in data['screenshots'])
    results.append({'viewport': data['viewport'], 'fieldCount': 24, 'tableCount': 5,
        'pngCount': 17, 'ledger': str(path.relative_to(OWN)), 'ledgerSHA256': sha(path)})
assert sorted(row['viewport']['width'] for row in results) == [320, 1440]

manifest_path = OWN.parent / 'flow-compat-review/frozen-repaired-build.json'
assert sha(manifest_path) == '9e348d9560ce27c49e70bc86e38d18f7952cad8da836967354325f2f19bfa20c'
manifest = read(manifest_path)
build = Path(manifest['root'])
assert raw['config']['webServer']['env']['FLOW_DIST_DIR'] == str(build)
expected_files = {item['path'] for item in manifest['files']}
actual_files = {str(path.relative_to(build)) for path in build.rglob('*') if path.is_file()}
assert actual_files == expected_files and len(expected_files) == 1717
for item in manifest['files']:
    path = build / item['path']
    assert path.stat().st_size == item['bytes'] and sha(path) == item['sha256']

report = {'status': 'local-string-layout-probe-passed-font-unverified',
    'rawReporter': {'path': 'native-results.json', 'sha256': sha(OWN / 'native-results.json'), 'passed': 2, 'skipped': 0, 'retries': 0},
    'results': results, 'sourceInputs': source_hashes,
    'servedBuild': {'root': str(build), 'manifest': str(manifest_path.relative_to(REPO)),
        'manifestSHA256': sha(manifest_path), 'fileCount': 1717, 'allBytesAndSHAExact': True, 'noExtraOrMissing': True},
    'glyphFontCertification': False,
    'scope': 'Actual local Chromium DOM strings/layout only, previously accepted immutable core flow consumer; no new partial-sentence consumer, remote Noto glyph, WebKit, physical-device, audio listening or password-entry certification.'}
(OWN / 'local-evidence-review.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'passed': 2, 'fieldsPerViewport': 24, 'tablesPerViewport': 5, 'pngs': 34, 'frozenBuildFilesExact': 1717, 'glyphFontCertification': False}))
