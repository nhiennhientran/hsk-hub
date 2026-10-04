#!/usr/bin/env python3
"""Read-only source consumer review. Writes only this documentation directory."""
import base64
import collections
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
declared_snapshot = json.loads((OUT / 'summary.json').read_text())
HEAD = os.environ.get('VI_SOURCE_REF', declared_snapshot['gitHead'])
TREE = declared_snapshot['gitTree']

def sha(b): return hashlib.sha256(b).hexdigest()
def read(p): return (ROOT / p).read_bytes()
def load(p): return json.loads(read(p))
def dump(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
def git(*args): return subprocess.check_output(['git', *args], cwd=ROOT)
def frozen(p):
    blob = git('show', f'{HEAD}:{p}')
    actual = read(p)
    if actual != blob: raise ValueError('Source differs from requested HEAD: ' + p)
    return blob
def manifest(p):
    blob = frozen(p)
    return {'file': p, 'bytes': len(blob), 'sha256': sha(blob), 'matchesRequestedHEAD': True}
def pointer(parts): return '/' + '/'.join(str(v).replace('~','~0').replace('/','~1') for v in parts)

assert git('rev-parse', f'{HEAD}^{{tree}}').decode().strip() == TREE
summary = load(str(OUT.relative_to(ROOT) / 'summary.json'))
assert summary['gitHead'] == HEAD and summary['gitTree'] == TREE
records = json.loads(gzip.decompress((OUT / 'inventory.json.gz').read_bytes()))
inputs = load(str(OUT.relative_to(ROOT) / 'runtime-files.json'))
bindings = load(str(OUT.relative_to(ROOT) / 'semantic-consumers.json'))
unique_input_paths = sorted({r['file'] for r in inputs})
head_inputs = [manifest(p) for p in unique_input_paths]
for row in inputs:
    assert sha(read(row['file'])) == row['sha256'], row['file']
dump('supplement-head-input-validation.json', {
    'status': 'exact-requested-HEAD-source-inputs-verified',
    'requestedHEAD': HEAD, 'requestedTree': TREE,
    'currentHEADAtSupplement': git('rev-parse', 'HEAD').decode().strip(),
    'definition': 'Every actual inventory input byte equals its tracked blob at requested HEAD; documentation working changes are separate.',
    'runtimeFileOccurrences': len(inputs), 'uniqueRuntimeInputFiles': len(head_inputs),
    'allMatchRequestedHEAD': True, 'inputs': head_inputs,
    'inventoryExtractionChecksPassed': sum(c['passed'] for c in load(str(OUT.relative_to(ROOT) / 'validation.json'))['checks']),
    'claimLimits': 'No official VI textbook audit or native visibility certification. Generator/output files were not in requested HEAD.'
})

# Follow the real legacy fetch lists, not globbing historical chunk alternatives.
configurations = [
    (1, 'hsk1-v5.0', 4, 'hsk1/app-practice.js', 15, 360),
    (2, 'hsk2-v5.8', 5, 'assets/lesson-practice.js', 15, 360),
    (3, 'hsk3-v1.1', 9, 'hsk3/app-practice.js', 20, 640),
]
viet = re.compile(r'[ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]', re.I)
ascii_viet = re.compile(r'\b(?:chọn|chon|cau|bai|khong|dung|sai|hoc|nghe|nhap|tu|nghia)\b', re.I)
all_questions, vi_rows, banks = [], [], []
base_files = {r['file'] for r in records}
current_pointer_values = {(r['file'],r.get('pointer'),r['value']) for r in records}
for level, prefix, count, producer, lesson_count, question_count in configurations:
    producer_bytes = frozen(producer)
    chunk_paths = [f'practice/reviewed/{prefix}.part{i:02}.b64' for i in range(1, count + 1)]
    chunks = [frozen(p) for p in chunk_paths]
    b64 = ''.join(b.decode().strip() for b in chunks)
    compressed = base64.b64decode(b64, validate=True)
    decoded = gzip.decompress(compressed)
    bank = json.loads(decoded)
    assert len(bank['lessons']) == lesson_count
    questions = []
    local_vi = []
    for li, lesson in enumerate(bank['lessons']):
        for tier in ['basic', 'advanced']:
            for qi, q in enumerate(lesson.get(tier, [])):
                question_pointer = ['lessons', li, tier, qi]
                assert isinstance(q['id'], str)
                assert q.get('prompt_vi') and q.get('explanation_vi')
                options = q.get('options', [])
                if options: assert q['answer'] in options
                binding = {
                    'semanticId': f'legacy-hsk{level}-reviewed-practice:{bank["version"]}:{q["id"]}',
                    'sourceQuestionId': q['id'], 'course': f'legacy-hsk{level}',
                    'lesson': lesson['lesson_id'], 'tier': tier,
                    'producer': producer, 'pointer': pointer(question_pointer),
                    'promptVietnamese': q['prompt_vi'], 'chineseStem': q.get('stem'),
                    'originalOptions': options, 'originalSegments': q.get('segments'),
                    'answer': q['answer'], 'originalAnswerIndex': options.index(q['answer']) if options else None,
                    'explanationVietnamese': q['explanation_vi'],
                    'currentConsumer': 'retained legacy route; not unified new course bank',
                    'officialAuditStatus': 'pending-phase-B',
                    'sourceRelation': 'editorial-assessment; locate a direct book counterpart before source attribution',
                    'identityRule': 'course + bank revision + question ID + original field/index; never merge by repeated wording or same lesson ordinal'
                }
                questions.append(binding)
                def visit(value, parts, key=''):
                    if isinstance(value, dict):
                        for k, v in value.items(): visit(v, parts+[k], k)
                    elif isinstance(value, list):
                        for i, v in enumerate(value): visit(v, parts+[i], key)
                    elif isinstance(value, str):
                        explicit = bool(re.search(r'(?:^|_)(?:vi|vn)$', key))
                        if explicit or viet.search(value) or ascii_viet.search(value):
                            identity = binding['semanticId'] + ':' + pointer(parts[len(question_pointer):])
                            local_vi.append({
                                'recordId': sha(identity.encode())[:24], 'semanticKey': identity,
                                'semanticQuestionId': binding['semanticId'], 'sourceQuestionId': q['id'],
                                'course': f'legacy-hsk{level}', 'lesson': lesson['lesson_id'],
                                'bankVersion': bank['version'], 'pointer': pointer(parts),
                                'value': value, 'chineseContext': q.get('stem'),
                                'classification': 'explicit-language-field' if explicit else 'language-detection-candidate',
                                'consumer': 'legacy renderReviewedQuestion / feedback',
                                'officialAuditStatus': 'pending-phase-B'
                            })
                for k, v in q.items(): visit(v, question_pointer+[k], k)
    assert len(questions) == question_count == bank['qa']['total_questions']
    assert len({q['sourceQuestionId'] for q in questions}) == question_count
    banks.append({
        'course': f'legacy-hsk{level}', 'bankVersion': bank['version'],
        'lessons': len(bank['lessons']), 'questionSemanticIds': len(questions),
        'VietnameseFieldOccurrences': len(local_vi),
        'explicitVietnameseFieldOccurrences': sum(r['classification']=='explicit-language-field' for r in local_vi),
        'producer': manifest(producer), 'fetchChunkInputs': [manifest(p) for p in chunk_paths],
        'base64DecodedGzipSHA256': sha(compressed), 'decodedJSONSHA256': sha(decoded),
        'decodedJSONBytes': len(decoded),
        'presentInExpandedInventory': all((f'legacy-runtime://practice/hsk{level}/{bank["version"]}',v['pointer'],v['value']) in current_pointer_values for v in local_vi),
        'coverageFindingBeforeExpansion': 'This decoded bank was absent from the prior 43073-row generator; the final builder now includes it.',
        'excludedHistoricalAlternatives': 'Unfetched .gz.b64 and split backup parts not scanned as active banks',
        'projectionCompatibility': 'Legacy choice grading compares option strings to answer string. If Vietnamese options change, preserve original index/value authority or update matching display and answer together with a new bank version; do not silently rewrite old storage.'
    })
    all_questions.extend(questions); vi_rows.extend(local_vi)
assert len({r['recordId'] for r in vi_rows}) == len(vi_rows)
dump('supplement-legacy-practice-bank-inputs.json', {
    'requestedHEAD': HEAD, 'status': 'source-decoded-not-native-tested-not-textbook-reviewed',
    'banks': banks, 'totalQuestionSemanticIds': len(all_questions),
    'totalVietnameseFieldOccurrences': len(vi_rows),
    'totalExplicitVietnameseFieldOccurrences': sum(r['classification']=='explicit-language-field' for r in vi_rows),
    'semanticIdentityOverlapWithCurrentBindings': sorted(set(q['semanticId'] for q in all_questions) & set(b['semanticId'] for b in bindings)),
    'decision': 'Supplement independently checks decoded legacy practice consumers now added to the main inventory; these duplicate evidence records must not be added again to the main count. No textbook completion percentage or changes to current 48 lessons.'
})
(OUT / 'supplement-legacy-practice-inventory.json.gz').write_bytes(gzip.compress(json.dumps({'questions': all_questions, 'VietnameseOccurrences': vi_rows}, ensure_ascii=False).encode(), compresslevel=9, mtime=0))

templates = [r for r in records if r['sourceKind']=='dynamic-template']
dump('supplement-dynamic-template-consumers.json', {
    'requestedHEAD': HEAD,
    'templateProducerOccurrences': len(templates),
    'activeSourceTemplateOccurrences': sum(r['component']=='active-ui' for r in templates),
    'byComponent': dict(collections.Counter(r['component'] for r in templates)),
    'definition': 'Producer identities are not every possible runtime sentence. Nested content refs and number/profile/error branches need consumer tests.',
    'requiredPilotBranches': [
        {'consumer':'H1 exercise archive scope', 'file':'hsk1-app/src/features/exercises/archive.ts', 'line':132, 'inputs':['route.lesson','setLabel.vi','group.vi'], 'check':'Compose the reviewed UI labels by source owner; original archive task/answer text bypasses active revision.'},
        {'consumer':'H1 source archive context/options', 'file':'hsk1-app/src/features/source-activities/index.ts', 'line':77, 'inputs':['row.context.title','row.context.prompt','row.context.fields[].options[].vi'], 'check':'Old id@version context remains unchanged after a current version bump; saved learner values are not book translations.'},
        {'consumer':'H2/3 confirmed listening receipt', 'file':'course-app/src/listening-view.ts', 'line':162, 'inputs':['attempt.questions[0]','current q'], 'check':'Prevent old no-snapshot fallback from presenting a newly revised current q as historical wording.'},
        {'consumer':'H2/3 lesson word composite', 'file':'course-app/src/lesson-view.ts', 'line':477, 'inputs':['w.pos','w.vi'], 'check':'Both source fields are inventoried; final DOM is assembled and must be checked together.'}
    ],
    'templates': [{k:r[k] for k in ['recordId','semanticKey','component','file','range','value','expressions','visibility'] if k in r} for r in templates],
    'noDirectBookCounterpart': 'App status/error/count/backup strings use editorial VI review, without fabricated textbook pages.'
})

pilot_rows = json.loads(gzip.decompress((OUT / 'pilot-audit-template.json.gz').read_bytes()))
pilots = load(str(OUT.relative_to(ROOT) / 'pilot-source-index.json'))
reports=[]
for p in pilots['pilots']:
    prefix = f'hsk{p["level"]}-'
    selected = [r for r in records if r.get('learningFieldOccurrence') and r.get('lesson')==p['lesson'] and (r['component'].startswith(prefix) if p['level']==1 else r['component']==f'hsk{p["level"]}-lesson')]
    owners = collections.defaultdict(list)
    for r in selected: owners[r.get('ownerKey',r['itemId'])].append(r)
    reports.append({
        'level':p['level'], 'lesson':p['lesson'], 'fieldOccurrences':len(selected),
        'sourceOwnerGroups':len(owners), 'sourceOwnerDefinition':'Stable source ownerKey scoped by component, not a claim each owner is one semantic concept',
        'byComponent':dict(collections.Counter(r['component'] for r in selected)),
        'distinctVietnameseValuesDiagnosticOnly':len({r['value'] for r in selected}),
        'repeatedVietnameseValuesDoNotMerge':True,
        'questionSemanticIdsInLegacySameOrdinal':sum(q['course']==f'legacy-hsk{p["level"]}' and q['lesson']==p['lesson'] for q in all_questions),
        'legacySameOrdinalMapping':'Unmapped. Same lesson ordinal does not establish same textbook unit, especially old HSK3 20 vs new 18.',
        'officialPDFSHA256':p['sourcePDFSHA256'], 'candidateBodyPDFPages':p['candidateBodyPdfPages'],
        'appendixSearch':p.get('translationAppendixSearch'),
        'currentValuesOnly':True, 'reviewStatus':'pending; no textbook wording collected',
        'owners':[{'ownerKey':k,'occurrences':len(v),'recordIds':[r['recordId'] for r in v],'pointers':[r.get('pointer') for r in v]} for k,v in sorted(owners.items())]
    })
assert sum(p['fieldOccurrences'] for p in reports) == len(pilot_rows)
dump('supplement-pilot-input-coverage.json', {
    'requestedHEAD':HEAD, 'status':'prepared-inputs-only', 'pilots':reports,
    'totalFieldOccurrences':len(pilot_rows),
    'semanticCounts':dict(collections.Counter(f'{b["course"]}:{b["kind"]}' for b in bindings)),
    'expandedInventoryFieldOccurrences':len(records), 'expandedConsumerBindings':len(bindings),
    'countRule':'1093 word senses and 1402 activity/version bindings are explicit new-engine semantic identities. Field occurrences, 498 templates, 438 asset identities, 1360 retained legacy questions and repeated sentences are separate dimensions; never add them into a semantic completion total.',
    'mustAttachBeforePilotApproval':['SVG embedded desc targets or editorial/out-of-scope disposition','Current/archive display policy and question original indexes','Legacy bank mapped counterpart or editorial classification','Concrete visual book page and exact Chinese/context matching','Independent review of proposed wording and affected consumers'],
    'excludedClaims':['No official Vietnamese match decisions','No source-page visual audit','No native browser visibility claim','No production revision active']
})
print(json.dumps({'status':'passed','requestedHEAD':HEAD,'exactInputFiles':len(head_inputs),'legacyQuestions':len(all_questions),'newLegacyVIOccurrences':len(vi_rows),'explicitLegacyVI':sum(r['classification']=='explicit-language-field' for r in vi_rows),'templates':len(templates),'pilotOccurrences':len(pilot_rows)},ensure_ascii=False))
