#!/usr/bin/env python3
"""Independent, read-only inventory verification against the real source bytes.

Uses Python gzip/base64 and ElementTree, not the author's SVG scanner/JSON walker.
Run from the repository root; writes only this QA directory.
"""
from pathlib import Path
import argparse
import base64
import collections
import datetime
import gzip
import hashlib
import json
import re
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path.cwd()
INVENTORY = ROOT / 'course-app/docs/resume-20261004/vi-inventory'
OUT = ROOT / 'course-app/docs/resume-20261004/qa-vi-inventory'
STRONG_VI = re.compile('[ăâđêôơưĂÂĐÊÔƠƯạảấầẩẫậắằẳẵặẹẻẽếềểễệỉĩịọỏốồổỗộớờởỡợụủũứừửữựỵỷỹẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈĨỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦŨỨỪỬỮỰỴỶỸ]')
EXPLICIT_KEY = re.compile(r'^(vi|vn|vn_title|title_vi|titleVi|promptVi|explanationVi|place_vn|meaning_vi|goal_vi|scope_note_vi|labelVi|label_vn)$', re.I)
SUFFIX_KEY = re.compile(r'(_vi|_vn|Vi|Vn)$')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def ptr(parts):
    return '/' + '/'.join(str(x).replace('~', '~0').replace('/', '~1') for x in parts)


def leaves(value, parts=()):
    if isinstance(value, dict):
        for key, child in value.items():
            yield from leaves(child, parts + (key,))
    elif isinstance(value, list):
        for i, child in enumerate(value):
            yield from leaves(child, parts + (i,))
    else:
        yield parts, value


def svg_nodes(root):
    result = []

    def walk(element, xpath):
        tag = element.tag.rsplit('}', 1)[-1]
        text = ''.join(element.itertext()).strip()
        if tag in ('title', 'desc', 'text') and text:
            result.append({'tag': tag, 'xpath': xpath, 'value': text,
                           'elementId': element.attrib.get('id')})
        for attr in ('alt', 'title', 'aria-label', 'aria-description'):
            if element.attrib.get(attr):
                result.append({'tag': 'attribute', 'attribute': attr,
                               'xpath': xpath + '/@' + attr,
                               'value': element.attrib[attr], 'elementId': element.attrib.get('id')})
        counts = collections.Counter()
        for child in element:
            name = child.tag.rsplit('}', 1)[-1]
            counts[name] += 1
            walk(child, f'{xpath}/{name}[{counts[name]}]')
    walk(root, '/svg[1]')
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--final', action='store_true', help='Only use after the author freezes generated inputs.')
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    rows = json.loads(gzip.decompress((INVENTORY / 'inventory.json.gz').read_bytes()))
    summary = json.loads((INVENTORY / 'summary.json').read_text())
    files = json.loads((INVENTORY / 'runtime-files.json').read_text())
    bindings = json.loads((INVENTORY / 'semantic-consumers.json').read_text())
    bank_info = json.loads((INVENTORY / 'legacy-practice-banks.json').read_text())
    consumers = json.loads((INVENTORY / 'legacy-practice-consumers.json').read_text())
    indexed = collections.defaultdict(list)
    for row in rows:
        if 'pointer' in row:
            indexed[(row['file'], row['pointer'])].append(row)
    problems = []
    checks = []

    def check(name, condition, details=None):
        checks.append({'name': name, 'passed': bool(condition), 'details': details})

    check('all row IDs and semantic keys remain unique', len({r['recordId'] for r in rows}) == len(rows) == len({r['semanticKey'] for r in rows}))
    check('row count agrees with actual compressed primary inventory', len(rows) == summary['records'], len(rows))
    check('no official semantic decisions started', all(r['officialAuditStatus'] == 'pending-phase-B' for r in rows))
    source_inputs = []
    for file in files:
        data = (ROOT / file['file']).read_bytes()
        original = subprocess.check_output(['git', 'show', summary['gitHead'] + ':' + file['file']])
        source_inputs.append({'file': file['file'], 'bytes': len(data), 'sha256': sha(data),
                              'matchesSourceCommit': data == original, 'matchesRecordedHash': sha(data) == file['sha256']})
    check('every enumerated source byte matches the declared source commit and SHA256',
          all(f['matchesSourceCommit'] and f['matchesRecordedHash'] for f in source_inputs), len(source_inputs))
    named_json_vi = 0
    for file in files:
        if file.get('format') != 'json':
            continue
        obj = json.loads((ROOT / file['file']).read_bytes())
        for parts, value in leaves(obj):
            if isinstance(value, str) and value.strip() and (EXPLICIT_KEY.search(str(parts[-1])) or SUFFIX_KEY.search(str(parts[-1]))):
                named_json_vi += 1
                matching = [r for r in indexed[(file['file'], ptr(parts))] if r['component'] == file['component'] and r['value'] == value]
                if len(matching) != 1:
                    problems.append({'kind': 'explicit-json-primary-omission', 'file': file['file'], 'pointer': ptr(parts), 'value': value})
    check('every source-schema named JSON VI leaf appears exactly in primary inventory', not problems, named_json_vi)
    listening = json.loads((ROOT / 'hsk1-app/content/stage3-catalog.json').read_bytes())['listening']
    listening_check_count = 0
    for qi, question in enumerate(listening):
        for field in ['options', 'optionFeedback']:
            for oi, value in enumerate(question[field]):
                position = f'/listening/{qi}/{field}/{oi}'
                found = [r for r in indexed[('hsk1-app/content/stage3-catalog.json', position)]
                         if r['component'] == 'hsk1-stage3' and r['value'] == value and
                         r['itemId'] == question['id'] and r.get('confidence') == 'schema-explicit']
                listening_check_count += 1
                if len(found) != 1:
                    problems.append({'kind': 'listening-options-feedback-omission', 'questionId': question['id'], 'pointer': position})
    check('all 600 original HSK1 listening option/feedback leaves retain question identity and array index',
          listening_check_count == 600 and not [p for p in problems if p['kind'] == 'listening-options-feedback-omission'])
    bank_results = []
    question_checks = []
    metadata_checks = []
    ascii_schema = []
    for level, prefix, part_count, producer, question_count in [
        (1, 'hsk1-v5.0', 4, 'hsk1/app-practice.js', 360),
        (2, 'hsk2-v5.8', 5, 'assets/lesson-practice.js', 360),
        (3, 'hsk3-v1.1', 9, 'hsk3/app-practice.js', 640),
    ]:
        paths = [f'practice/reviewed/{prefix}.part{i:02}.b64' for i in range(1, part_count + 1)]
        chunks = [(ROOT / path).read_bytes() for path in paths]
        packed = base64.b64decode(b''.join(x.strip() for x in chunks), validate=True)
        decoded = gzip.decompress(packed)
        bank = json.loads(decoded)
        course = f'legacy-hsk{level}'
        meta = next(b for b in bank_info if b['course'] == course)
        virtual = f"legacy-runtime://practice/hsk{level}/{bank['version']}"
        qcount = 0
        leaf_count = 0
        vi_count = 0
        for li, lesson in enumerate(bank['lessons']):
            for tier in ['basic', 'advanced']:
                for qi, q in enumerate(lesson[tier]):
                    qcount += 1
                    base = ('lessons', li, tier, qi)
                    expected = {ptr(base + p): v for p, v in leaves(q)}
                    leaf_count += len(expected)
                    matches = [c for c in consumers if c['course'] == course and c['sourceQuestionId'] == q['id']]
                    good = len(matches) == 1
                    if good:
                        c = matches[0]
                        good = c['semanticId'] == f"{meta['component']}:{bank['version']}:{q['id']}" and c['questionPointer'] == ptr(base) and c['lesson'] == lesson['lesson_id'] and c['tier'] == tier and c['producer'] == producer and c['originalAnswer'] == q['answer'] and c['originalOptions'] == q.get('options') and c['originalSegments'] == q.get('segments') and c['originalAnswerIndex'] == (q['options'].index(q['answer']) if 'options' in q else None) and {leaf['pointer']: leaf['value'] for leaf in c['leaves']} == expected and len(c['leaves']) == len(expected)
                    identity = f"{meta['component']}:{bank['version']}:{q['id']}"
                    primary_bindings = [c for c in bindings if c.get('semanticId') == identity]
                    good = good and len(primary_bindings) == 1 and primary_bindings[0].get('questionPointer') == ptr(base) and primary_bindings[0].get('questionLeafCount') == len(expected)
                    question_checks.append({'id': q['id'], 'course': course, 'semanticId': identity,
                                            'originalQuestionIndex': qi, 'tier': tier, 'pointer': ptr(base),
                                            'leafCount': len(expected), 'passed': good})
                    truth = q.get('type') == '判断题' and set(q.get('options', [])) == {'Đúng', 'Sai'}
                    for parts, value in leaves(q):
                        named = isinstance(value, str) and (str(parts[-1]).endswith('_vi') or str(parts[-1]).endswith('_vn'))
                        schema = truth and parts[0] in ['options', 'answer']
                        strong = isinstance(value, str) and bool(STRONG_VI.search(value))
                        if named or schema or strong:
                            vi_count += 1
                            key = (virtual, ptr(base + parts))
                            found = [r for r in indexed[key] if r['value'] == value and r['itemId'] == q['id'] and r['component'] == meta['component'] and r['revisionService'].startswith(producer) and r['consumers']]
                            if len(found) != 1:
                                problems.append({'kind': 'bank-primary-VI-omission', 'id': q['id'], 'file': virtual, 'pointer': key[1], 'value': value})
                            if schema:
                                good_schema = len(found) == 1 and found[0].get('confidence') == 'schema-explicit'
                                ascii_schema.append({'questionId': q['id'], 'pointer': key[1], 'value': value, 'passed': good_schema})
                    for parts, value in leaves(q):
                        if not isinstance(value, str):
                            continue
                        for row in indexed[(virtual, ptr(base + parts))]:
                            if row['value'] != value or row['itemId'] != q['id']:
                                problems.append({'kind': 'bank-primary-leaf-provenance-mismatch', 'id': q['id'], 'pointer': ptr(base + parts)})
        for parts, value in leaves(bank):
            if isinstance(value, str) and STRONG_VI.search(value) and not ('basic' in parts or 'advanced' in parts):
                found = [r for r in indexed[(virtual, ptr(parts))] if r['value'] == value]
                metadata_checks.append({'course': course, 'pointer': ptr(parts), 'value': value, 'passed': len(found) == 1})
        actual_vi_rows = [r for r in rows if r['file'] == virtual]
        bank_results.append({'course': course, 'version': bank['version'], 'questions': qcount,
                             'questionLeaves': leaf_count, 'primaryInventoryOccurrences': len(actual_vi_rows),
                             'independentExplicitSchemaOrStrongVIOccurrences': vi_count,
                             'questionsCorrect': qcount == question_count, 'producer': producer,
                             'sourceChunks': [{'file': p, 'sha256': sha(v)} for p, v in zip(paths, chunks)],
                             'gzipSHA256': sha(packed), 'decodedJSONSHA256': sha(decoded),
                             'decodeMatchesAuthorHash': sha(decoded) == meta['decodedJSONSHA256'] and sha(packed) == meta['gzipSHA256'],
                             'mappedToUploadedBooks': False})
    check('all three actual fetched banks decode and agree with recorded input hashes', len(bank_results) == 3 and all(b['questionsCorrect'] and b['decodeMatchesAuthorHash'] for b in bank_results), bank_results)
    check('all 1360 stable questions, original question/option indices and 15630 leaf values bind main semantic consumers', len(question_checks) == 1360 and all(q['passed'] for q in question_checks) and sum(q['leafCount'] for q in question_checks) == 15630)
    check('all 186 Vietnamese truth-choice options/answers include uppercase Sai in primary inventory', len(ascii_schema) == 186 and all(q['passed'] for q in ascii_schema), {'leaves': len(ascii_schema), 'capitalizedSai': sum(q['value'] == 'Sai' for q in ascii_schema)})
    check('independent explicit/schema/strong VI bank leaves have no main-list omissions', not [p for p in problems if p['kind'].startswith('bank-')])
    check('bank-wide VI metadata is retained separately from question metadata', all(m['passed'] for m in metadata_checks), metadata_checks)
    svg_files = [f for f in files if f.get('format') == 'svg']
    svg_bindings = json.loads((INVENTORY / 'svg-consumers.json').read_text())
    svg_result = []
    approved = []
    for level, count in [(2, 15), (3, 18)]:
        for lesson in range(1, count + 1):
            name = f'course-app/content/hsk{level}/lesson-{lesson:02}.json'
            obj = json.loads((ROOT / name).read_text())
            for i, picture in enumerate(obj.get('illustrationManifest', [])):
                if picture.get('publicationStatus') == 'approved' and picture.get('file', '').endswith('.svg'):
                    approved.append((name, i, picture))
    check('exact 438 approved SVG manifest identities', len(approved) == 438 and len(svg_bindings) == 438 and len({p['id'] for _, _, p in approved}) == 438)
    for file in svg_files:
        data = (ROOT / file['file']).read_bytes()
        parsed = ET.fromstring(data)
        nodes = svg_nodes(parsed)
        actual = [{k: v for k, v in n.items() if k in ['tag', 'attribute', 'xpath', 'value', 'elementId']} for n in file['stringNodes']]
        # Author order puts node text/attributes before children, like this independent parser.
        if nodes != actual:
            problems.append({'kind': 'svg-full-string-node-mismatch', 'file': file['file']})
        for node in nodes:
            if STRONG_VI.search(node['value']):
                found = [r for r in indexed[(file['file'], node['xpath'])] if r['value'] == node['value'] and r.get('xmlTag') == node['tag'] and r.get('assetSHA256') == sha(data)]
                good = len(found) == 1
                svg_result.append({'file': file['file'], 'xpath': node['xpath'], 'value': node['value'], 'passed': good})
                if not good:
                    problems.append({'kind': 'svg-primary-VI-omission', 'file': file['file'], 'xpath': node['xpath'], 'value': node['value']})
    check('Python XML parser exactly reproduces every full string/attribute node in all 452 source SVG assets', len(svg_files) == 452 and not [p for p in problems if p['kind'] == 'svg-full-string-node-mismatch'], sum(len(f['stringNodes']) for f in svg_files))
    check('all 412 embedded VI SVG source strings occur exactly in primary inventory', len(svg_result) == 412 and all(r['passed'] for r in svg_result))
    for name, i, picture in approved:
        file = 'course-app/public/' + picture['file']
        matching = [b for b in svg_bindings if b['assetId'] == picture['id']]
        good = len(matching) == 1
        if good:
            binding = matching[0]
            primary = [b for b in bindings if b.get('kind') == 'approved-svg-asset' and b.get('semanticId') == picture['id']]
            good = binding['assetFile'] == file and binding['assetSHA256'] == sha((ROOT / file).read_bytes()) == picture['assetSha256'] and binding['manifestPointer'] == f'/illustrationManifest/{i}' and binding['manifestFile'] == name and len(primary) == 1 and primary[0] == binding
        if not good:
            problems.append({'kind': 'svg-asset-binding-mismatch', 'id': picture['id']})
        for field in ['alt', 'description', 'title', 'label']:
            if isinstance(picture.get(field), dict) and isinstance(picture[field].get('vi'), str) and picture[field]['vi'].strip():
                position = f'/illustrationManifest/{i}/{field}/vi'
                found = [r for r in indexed[(name, position)] if r['value'] == picture[field]['vi']]
                if len(found) != 1:
                    problems.append({'kind': 'svg-outer-json-consumer-omission', 'id': picture['id'], 'pointer': position})
    check('all SVG asset identities and separate outer JSON VI consumers bind actual sources', not [p for p in problems if p['kind'] in ['svg-asset-binding-mismatch', 'svg-outer-json-consumer-omission']])
    check('all main-list/supplement coverage checks contain zero omissions', not problems, len(problems))
    author_files = []
    for name in ['build-inventory.mjs', 'validate-inventory.mjs', 'supplement-svg-scan.mjs', 'inventory.json.gz', 'summary.json', 'runtime-files.json', 'semantic-consumers.json', 'legacy-practice-banks.json', 'legacy-practice-consumers.json', 'svg-consumers.json', 'legacy-content-contracts.json', 'validation.json']:
        p = INVENTORY / name
        author_files.append({'file': str(p.relative_to(ROOT)), 'sha256': sha(p.read_bytes()), 'bytes': p.stat().st_size})
    result = {'schemaVersion': 1, 'status': 'passed' if all(c['passed'] for c in checks) else 'failed',
              'freezeState': 'final-requested' if args.final else 'provisional-until-author-freeze',
              'recordedUTC': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'sourceHead': summary['gitHead'], 'sourceTree': summary['gitTree'],
              'actualWorkspaceHeadAtVerification': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
              'primaryRows': len(rows), 'checks': checks, 'checksPassed': sum(c['passed'] for c in checks),
              'checksTotal': len(checks), 'problems': problems, 'banks': bank_results,
              'bankQuestionIdentityChecks': question_checks, 'truthChoiceChecks': ascii_schema,
              'SVGVIPrimaryChecks': svg_result, 'sourceInputs': source_inputs, 'authorFrozenCandidates': author_files,
              'officialVietnameseSemanticAuditPerformed': False, 'productionEdits': [],
              'limits': ['Field occurrences/candidates are not full-site semantic units, native execution certificates or textbook match counts.',
                         'Independent named/schema/strong Vietnamese presence checks do not certify all unknown ASCII-only literal language classification.',
                         '412 SVG desc nodes are asset/accessibility metadata; outer img alt/caption/zoom text are separate JSON consumers. Native assistive technology exposure is not certified.',
                         'Three legacy bank question identities and string-based option authority are retained; lesson ordinals do not map their 15/15/20 course to the uploaded 15/15/18 sources.',
                         'The old 43073 occurrence baseline omitted the fetched external banks and embedded SVG rows. Neither the old nor current row total is a completed whole-site official VI audit.',
                         'Dynamic templates and runtime static literals still need reachability/source-context resolution during Phase B. No textbook VI decision or replacement is made here.']}
    (OUT / ('independent-review.json' if args.final else 'provisional-review.json')).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': result['status'], 'checksPassed': result['checksPassed'], 'checksTotal': result['checksTotal'], 'primaryRows': len(rows), 'problems': problems[:10]}, ensure_ascii=False))
    raise SystemExit(0 if result['status'] == 'passed' else 1)


if __name__ == '__main__':
    main()
