"""Exercise the real frozen author pipeline only in disposable complete app copies."""
import collections
import copy
import datetime
import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
APP = ROOT / 'course-app'
DOCS = APP / 'docs/resume-20261004'
AUTHOR = DOCS / 'hsk23-source-closure'
QA = DOCS / 'qa-hsk3-official-source/review.json'
OUT = Path(__file__).resolve().parent
AUTHOR_NAMES = ['build_source_revision.py', 'build_metadata_proposal.py',
                'apply_metadata_proposal.py', 'official-vi-source-revision.json',
                'official-vi-metadata-proposal.json', 'official-vi-l01-06.json',
                'official-vi-l07-12.json', 'official-vi-l13-18.json',
                'official-vi-glossary.tsv']
FILES = [AUTHOR / name for name in AUTHOR_NAMES] + [QA, APP / 'content/hsk3-lexicon.json']
FILES += sorted((APP / 'content/hsk3').glob('lesson-*.json'))
FROZEN = {str(path.relative_to(APP)): path.read_bytes() for path in FILES}


def digest(value):
    return hashlib.sha256(value).hexdigest()


def read(path):
    return json.loads(path.read_text())


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def coverage(lessons):
    counts = collections.Counter()
    for lesson in lessons:
        for word in lesson['vocabulary']:
            counts['stableWords'] += 1
            counts['oldAppendixSource'] += 'appendixSource' in word
            counts['oldNumberPosMetadata'] += 'appendixMetadata' in word
            counts['oldNumberPosSource'] += 'source' in word.get('appendixMetadata', {})
            evidence = word.get('additionalSourceEvidence', [])
            if evidence:
                counts['newWordEvidence'] += 1
                counts['newGlossaryAnchor'] += 'source' in evidence[0]['glossary']
                counts['newNumberPosSource'] += 'source' in evidence[0]['vocabulary']
                counts['newPrintedNumber'] += evidence[0]['vocabulary']['printedNumber'] is not None
                counts['newPrintedPOSPresent'] += evidence[0]['vocabulary']['posPrinted']
    return dict(counts)


def run_case(root, name, mutation=None, rebuild=False, mode='apply', expected_reject=True):
    app = root / name / 'course-app'
    for relative, value in FROZEN.items():
        target = app / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(value)
    author = app / AUTHOR.relative_to(APP)
    qa = app / QA.relative_to(APP)
    proposal_file = author / 'official-vi-metadata-proposal.json'
    context = {'app': app, 'author': author, 'qa': qa, 'proposal_file': proposal_file}
    if mutation:
        mutation(context)
    content_files = sorted((app / 'content').rglob('*.json'))
    before = {str(path.relative_to(app)): digest(path.read_bytes()) for path in content_files}
    originals = {path.name: read(path) for path in (app / 'content/hsk3').glob('lesson-*.json')}
    results = []
    commands = ['build_source_revision.py', 'build_metadata_proposal.py'] if rebuild else []
    commands.append('apply_metadata_proposal.py')
    for script in commands:
        command = ['python', str(author / script)]
        if script == 'apply_metadata_proposal.py' and mode == 'apply':
            command.append('--apply')
        result = subprocess.run(command, text=True, capture_output=True)
        results.append({'script': script, 'exit': result.returncode,
                        'stderrTail': result.stderr.splitlines()[-1:],
                        'stdout': result.stdout.strip()[:1000]})
        if result.returncode:
            break
    after = {str(path.relative_to(app)): digest(path.read_bytes()) for path in content_files}
    changes = [relative for relative in before if before[relative] != after[relative]]
    rejected = results[-1]['exit'] != 0
    report = {'case': name, 'mode': mode, 'rebuildFromFourInputsAndActualQA': rebuild,
              'expectedReject': expected_reject, 'rejected': rejected,
              'contentFilesWritten': len(changes), 'changedContentFiles': changes,
              'commands': results}
    assert rejected == expected_reject, report
    if expected_reject:
        assert not changes, report
    elif mode == 'preview':
        assert not changes, report
        assert digest((author / 'official-vi-source-revision.json').read_bytes()) == digest(FROZEN[str((AUTHOR / 'official-vi-source-revision.json').relative_to(APP))])
        assert digest(proposal_file.read_bytes()) == digest(FROZEN[str((AUTHOR / 'official-vi-metadata-proposal.json').relative_to(APP))])
    else:
        assert len(changes) == 18 and 'content/hsk3-lexicon.json' not in changes, report
        lessons = []
        hashes = []
        for path in sorted((app / 'content/hsk3').glob('lesson-*.json')):
            candidate = read(path)
            original = originals[path.name]
            parent = candidate['additionalSourceRevisions']
            assert len(parent) == 1
            registry = parent[0]
            assert registry['sha256'] == '7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951'
            assert registry['originalChinesePdfSha256'] == '33a9c743f73f634f97a9864aa0423ac4e3568b3febbf57b63e983b5dcc0932f2'
            assert registry['sha256'] != registry['originalChinesePdfSha256']
            assert registry['sameBytesAsOriginalChineseSource'] is False
            assert registry['doesNotRevalidateOriginalEnglishAppendix'] is True
            assert registry['sourceAudit']['vietnameseGlossAlignment'] == 'deferred-to-Phase-B'
            stripped = copy.deepcopy(candidate)
            del stripped['additionalSourceRevisions']
            for word in stripped['vocabulary']:
                values = word.pop('additionalSourceEvidence')
                assert len(values) == 1 and values[0]['sourceRevisionId'] == registry['id']
            assert stripped == original
            lessons.append(candidate)
            hashes.append({'file': str(path.relative_to(app)), 'beforeSha256': before[str(path.relative_to(app))],
                           'candidateSha256': digest(path.read_bytes()),
                           'restoredOriginalDeepObjectExact': True,
                           'stableWords': len(candidate['vocabulary'])})
        report.update({'originalObjectsRestoredExactly': 18, 'originalCoverageMeasured': coverage(list(originals.values())),
                       'integratedCoverageMeasured': coverage(lessons), 'lessonHashes': hashes,
                       'canonicalFileBytesUnchanged': True,
                       'all18RegistriesKeepDistinctOldAndNewPDFIdentity': True,
                       'all523ChildrenReferenceTheirParentNewRevisionId': True})
        replay = subprocess.run(['python', str(author / 'apply_metadata_proposal.py'), '--apply'],
                                text=True, capture_output=True)
        assert replay.returncode != 0
        assert all(digest((app / relative).read_bytes()) == value for relative, value in after.items())
        report['secondApplyRejectedWithoutFurtherWrites'] = True
        report['secondApplyError'] = replay.stderr.splitlines()[-1:]
    return report


def proposal_mutator(change):
    def mutate(context):
        value = read(context['proposal_file'])
        change(value)
        save(context['proposal_file'], value)
    return mutate


def qa_mutator(change):
    def mutate(context):
        value = read(context['qa'])
        change(value)
        save(context['qa'], value)
    return mutate


def partial_qa(context):
    value = read(context['qa'])
    value['l13_18']['status'] = 'pending'
    value['overall']['status'] = 'partially-accepted-source-evidence'
    value['overall']['stableSenseRows'] = 355
    save(context['qa'], value)


def input_mutator(name, change):
    def mutate(context):
        path = context['author'] / name
        value = read(path)
        change(value)
        save(path, value)
    return mutate


def stale_last_lesson(context):
    path = context['app'] / 'content/hsk3/lesson-18.json'
    path.write_text(path.read_text() + ' ')


def stale_canonical(context):
    path = context['app'] / 'content/hsk3-lexicon.json'
    path.write_text(path.read_text() + ' ')


cases = [
    ('full_pipeline_preview', None, True, 'preview', False),
    ('full_pipeline_apply_temporary_copy', None, True, 'apply', False),
    ('partial_355_source_QA_rebuild_pipeline', partial_qa, True, 'apply', True),
    ('missing_actual_source_QA', lambda c: c['qa'].unlink(), True, 'apply', True),
    ('forged_proposal_review_status', proposal_mutator(lambda d: d['independentReview'].update(status='partially-accepted-source-evidence')), False, 'apply', True),
    ('parent_registry_uses_old_chinese_SHA', proposal_mutator(lambda d: d['lessons'][0]['registryOperation']['value'][0].update(sha256=d['oldSourceSha256'])), False, 'apply', True),
    ('duplicate_parent_registry', proposal_mutator(lambda d: d['lessons'][0]['registryOperation']['value'].append(copy.deepcopy(d['lessons'][0]['registryOperation']['value'][0]))), False, 'apply', True),
    ('foreign_parent_revision', proposal_mutator(lambda d: d['lessons'][0]['registryOperation']['value'][0].update(id='foreign-source')), False, 'apply', True),
    ('child_parent_revision_mismatch', proposal_mutator(lambda d: d['lessons'][0]['wordOperations'][0]['value'][0].update(sourceRevisionId='foreign-source')), False, 'apply', True),
    ('duplicate_lesson_same_18_523_total', proposal_mutator(lambda d: d['lessons'].__setitem__(2, copy.deepcopy(d['lessons'][0]))), False, 'apply', True),
    ('foreign_lesson_id', proposal_mutator(lambda d: d['lessons'][0].update(lessonId='foreign-course:l01')), False, 'apply', True),
    ('foreign_lesson_scope', proposal_mutator(lambda d: d['lessons'][0].update(jsonFile='content/hsk2/lesson-01.json')), False, 'apply', True),
    ('foreign_word_id', proposal_mutator(lambda d: d['lessons'][0]['wordOperations'][0].update(wordId='foreign-word')), False, 'apply', True),
    ('foreign_evidence_headword', proposal_mutator(lambda d: d['lessons'][0]['wordOperations'][0]['value'][0]['vocabulary'].update(headword='不是这个词')), False, 'apply', True),
    ('wrong_source_page', proposal_mutator(lambda d: d['lessons'][0]['wordOperations'][0]['value'][0]['vocabulary']['source'].update(pdfPage=999)), False, 'apply', True),
    ('full_expected_word_changed', proposal_mutator(lambda d: d['lessons'][0]['wordOperations'][0]['expectedWord'].update(vi='changed')), False, 'apply', True),
    ('last_lesson_stale_bytes_no_early_writes', stale_last_lesson, False, 'apply', True),
    ('last_operation_invalid_no_early_writes', proposal_mutator(lambda d: d['lessons'][-1]['wordOperations'][-1]['value'][0]['vocabulary']['source'].update(pdfPage=999)), False, 'apply', True),
    ('canonical_stale_bytes', stale_canonical, False, 'apply', True),
    ('reserved_field_already_exists', lambda c: save(c['app'] / 'content/hsk3/lesson-18.json', dict(read(c['app'] / 'content/hsk3/lesson-18.json'), additionalSourceRevisions=[])), False, 'apply', True),
    ('operation_replace_instead_of_add', proposal_mutator(lambda d: d['lessons'][0]['registryOperation'].update(operation='replace')), False, 'apply', True),
    ('accepted_ID_list_duplicate', qa_mutator(lambda d: d['acceptedStableIds'].__setitem__(-1, d['acceptedStableIds'][0])), True, 'apply', True),
    ('accepted_ID_list_foreign', qa_mutator(lambda d: d['acceptedStableIds'].__setitem__(-1, 'foreign-word')), True, 'apply', True),
    ('QA_wrong_new_PDF_identity', qa_mutator(lambda d: d['source'].update(sha256='33a9c743f73f634f97a9864aa0423ac4e3568b3febbf57b63e983b5dcc0932f2')), True, 'apply', True),
    ('QA_full_Vietnamese_claim', qa_mutator(lambda d: d['overall'].update(fullVietnameseAlignmentGranted=True)), True, 'apply', True),
    ('QA_old_Chinese_recovered_claim', qa_mutator(lambda d: d['overall'].update(oldChineseSourceRecovered=True)), True, 'apply', True),
    ('QA_wrong_total_522', qa_mutator(lambda d: d['overall'].update(stableSenseRows=522)), True, 'apply', True),
    ('QA_wrong_batch_scope', qa_mutator(lambda d: d['l13_18'].update(reviewedStableRows=167)), True, 'apply', True),
    ('QA_open_source_issue', qa_mutator(lambda d: d['l13_18'].update(issues=[{'status': 'open'}])), True, 'apply', True),
    ('QA_missing_input_manifest', qa_mutator(lambda d: d['acceptedInputFiles'].pop()), True, 'apply', True),
    ('QA_duplicate_input_manifest', qa_mutator(lambda d: d['acceptedInputFiles'].__setitem__(-1, copy.deepcopy(d['acceptedInputFiles'][0]))), True, 'apply', True),
    ('QA_wrong_input_manifest_SHA', qa_mutator(lambda d: d['acceptedInputFiles'][0].update(sha256='0' * 64)), True, 'apply', True),
    ('QA_input_manifest_pending', qa_mutator(lambda d: d['acceptedInputFiles'][0].update(status='pending')), True, 'apply', True),
    ('duplicate_source_input_word_ID', input_mutator('official-vi-l13-18.json', lambda d: d['rows'].__setitem__(-1, copy.deepcopy(d['rows'][0]))), True, 'apply', True),
    ('foreign_source_input_word_ID', input_mutator('official-vi-l13-18.json', lambda d: d['rows'][0].update(id='foreign-word')), True, 'apply', True),
    ('source_input_changed_after_QA', input_mutator('official-vi-l13-18.json', lambda d: d['rows'][0].update(printedPinyin='wrong')), True, 'apply', True),
]

with tempfile.TemporaryDirectory(prefix='hsk3-final-pipeline-', dir='/workspace/scratch/28b55072841a') as directory:
    reports = [run_case(Path(directory), *case) for case in cases]
assert all((APP / relative).read_bytes() == value for relative, value in FROZEN.items()), 'Real inputs changed during probes'
report = {'reviewer': 'qa_hsk1_01_03', 'reviewedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'status': 'accepted-real-pipeline-in-disposable-copies', 'realCourseFilesWritten': 0,
          'frozenFiles': [{'file': relative, 'sha256': digest(value)} for relative, value in FROZEN.items()],
          'caseCount': len(reports), 'positiveCases': sum(not r['expectedReject'] for r in reports),
          'negativeCases': sum(r['expectedReject'] for r in reports),
          'allNegativeCasesRejectedBeforeCourseWrites': True, 'cases': reports}
save(OUT / 'final-pipeline-probes.json', report)
print(json.dumps({'status': report['status'], 'cases': report['caseCount'], 'positive': report['positiveCases'],
                  'negative': report['negativeCases'], 'realCourseFilesWritten': 0}, indent=2))
