#!/usr/bin/env python3
"""Strict byte-pinned audit graph with exact historical metadata classifications.

No raw reference is edited. Unavailable historical metadata is identified as
unavailable, never recovered. Real source/frame/native bytes remain required.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re

HASH = re.compile(r'^[0-9a-f]{64}$')
HISTORICAL = {
    '94018adc4094e7ae8ee74b7a2c80249d66545fc9cf5d235fffd4724d4a1d581b':
        ('course-app/docs/final-quality-20261006/audio-review/hsk2-context-boundary/10-1/hsk2-fltrp-2026_l10_text1_line8.png', 'unselected-historical-proposal-plot-metadata'),
    '318570ab1b8366220ec9eb36f19545b9d98d2babd202d3f964c0cdfab6124629':
        ('tools/final-quality-20261006/review-decisions.py', 'historical-compiler-producer-identity-metadata'),
    'e63e215413a852762317fab8f96d4740d0316f1ae5e940ef51b602c584d4c305':
        ('tools/final-quality-20261006/review-syllable-evidence.py', 'historical-feature-producer-identity-metadata'),
    '9907e209a60a510800419513a03d66583b5e8e88ee0f17992c6fb75d451a2045':
        ('tools/final-quality-20261006/review-syllable-evidence.py', 'historical-feature-producer-identity-metadata'),
    'f582d80211e964abb05ab7d0845a4a91e8f3ba10ef653f1034c991e508c3bfb9':
        ('course-app/docs/final-quality-20261006/audio-review/accepted-file-checkpoint-20261006.json', 'historical-diagnostic-accepted-population-snapshot'),
    '70283b6cb5e689cfbe51497cd6d46e2cf5bf7b47dadbd15d7eb3d61df78a9382':
        ('course-app/docs/final-quality-20261006/audio-review/actual-remaining-targets-checkpoint-01.json', 'historical-diagnostic-remaining-population-snapshot'),
    '1a87acac3cdb420b6eda2ecd05e7140ca37589cb7d543532f517b7dbd42fcfd1':
        ('course-app/docs/final-quality-20261006/audio-review/actual-remaining-targets-checkpoint-01.json', 'historical-diagnostic-remaining-triage-population-snapshot'),
}
META_ROLE = 'metadata-only; not current actual source/crop/native-ASR acceptance input'
POLICY_FIELDS = ('historicalMetadataClassificationEvidence',
                 'immutableReferenceVersionEvidence', 'freshSourceFrameReverificationEvidence')


def sha(body):
    return hashlib.sha256(body).hexdigest()


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for body in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(body)
    return h.hexdigest()


def child_pointer(pointer, key):
    return pointer + '/' + str(key).replace('~', '~0').replace('/', '~1')


def require_complete(report):
    gates = report.get('acceptedSourceFrameGates', [])
    if report.get('status') != 'accepted-complete-source-frame-review' or report.get('completeCoverage') is not True:
        raise ValueError('partial review cannot create final audit inventory')
    if len(gates) != 2539 or len({x['id'] for x in gates}) != 2539 or len(report.get('nonSpokenAnnotations', [])) != 1:
        raise ValueError('final precision coverage differs')
    for row in gates:
        if row.get('status') != 'accepted-independent-machine-source-frame-review' or row.get('independentDecision', {}).get('decision') != 'accept' or row.get('rawEvidenceUnchanged') is not True:
            raise ValueError('unaccepted geometry cannot be archived as final')


class AuditGraph:
    def __init__(self, root, report_path, *, policy_references=None, require_final=False):
        self.root = Path(root).resolve()
        self.report_path = self.resolve_initial(report_path)
        self.report_bytes = self.report_path.read_bytes()
        self.report = json.loads(self.report_bytes)
        recorded = self.report.get('recordedRepositoryRoot', str(self.root))
        if not isinstance(recorded, str) or not Path(recorded).is_absolute():
            raise ValueError('recorded repository root must be absolute')
        self.recorded_root = Path(recorded).resolve()
        if require_final:
            require_complete(self.report)
        self.require_final = require_final
        self.files = {}
        self.byte_digests = {}
        self.visited = set()
        self.classified = {}
        self.excluded_model_metadata = []
        self.version_resolutions = []
        self.metadata = {}
        self.versions = {}
        self.policy_refs = dict(policy_references or {})
        for key in POLICY_FIELDS:
            if key in self.report:
                if key in self.policy_refs and self.policy_refs[key] != self.report[key]:
                    raise ValueError('external policy differs from byte-pinned report policy')
                self.policy_refs[key] = self.report[key]
        if require_final and set(POLICY_FIELDS) - set(self.policy_refs):
            raise ValueError('complete final report must pin classification, immutable versions and final fresh recheck')
        self.required_geometries = set()
        gates = self.report.get('acceptedSourceFrameGates', [])
        if 'acceptedSourceFrameGateFileReferences' in self.report:
            for reference in self.report['acceptedSourceFrameGateFileReferences']:
                path = self.resolve(reference['file'])
                body = path.read_bytes()
                if sha(body) != reference['sha256']:
                    raise ValueError('accepted checkpoint gate bytes changed')
                gates += json.loads(body).get('acceptedSourceFrameGates', [])
        for row in gates:
            self.required_geometries.add((row['id'], tuple(row['sourceSampleRange16k']), row['cropPCM_SHA256']))
        self.gates = gates
        # Read policy bytes without traversing yet: they must bind the exact table.
        classification_ref = self.policy_refs.get(POLICY_FIELDS[0])
        if classification_ref:
            classification = self.read_policy(classification_ref)
            count = classification.get('exactHistoricalSHAClassificationCount')
            allowed_sets = (set(list(HISTORICAL)[:6]), set(HISTORICAL))
            if count not in (6, 7):
                raise ValueError('historical classification must pin one explicitly registered exact identity set')
            groups = classification.get('classifications', [])
            if len(groups) != count or {x.get('recordedSHA256') for x in groups} != allowed_sets[count - 6]:
                raise ValueError('historical metadata scope differs from the explicitly registered exact identities')
            for group in groups:
                expected = group['recordedSHA256']
                path, kind = HISTORICAL[expected]
                if group.get('recordedPath') != path or group.get('metadataKind') != kind or group.get('status') != 'historical-bytes-unavailable' or group.get('role') != META_ROLE:
                    raise ValueError('historical classification cannot change role/path/status')
                for entry in group.get('ownerReferences', []):
                    if entry.get('recordedSHA256') != expected or entry.get('metadataKind') != kind or entry.get('status') != 'historical-bytes-unavailable' or entry.get('role') != META_ROLE:
                        raise ValueError('owner tuple cannot broaden historical classification')
                    owner = self.resolve(entry['ownerJSON']).relative_to(self.root).as_posix()
                    if self.resolve(entry['recordedPath']).relative_to(self.root).as_posix() != path:
                        raise ValueError('owner tuple cannot classify a different required raw/source path')
                    key = (owner, entry['ownerJSONActualSHA256'], entry['jsonPointer'], entry['recordedPath'], expected)
                    if not HASH.fullmatch(entry['ownerJSONActualSHA256']) or not entry['jsonPointer'].startswith('/'):
                        raise ValueError('historical owner needs actual byte SHA and exact JSON pointer')
                    if key in self.metadata:
                        raise ValueError('duplicate historical owner tuple')
                    self.metadata[key] = entry
        version_ref = self.policy_refs.get(POLICY_FIELDS[1])
        if version_ref:
            versions = self.read_policy(version_ref)
            for entry in versions.get('mapping', []):
                expected = entry.get('expectedSHA256', entry.get('expectedSHA'))
                actual = entry.get('actualSHA256', entry.get('actualSHA'))
                if entry.get('status') != 'exact-original-bytes-preserved' or actual != expected or not HASH.fullmatch(expected or ''):
                    raise ValueError('immutable version mapping must describe real recovered bytes')
                original = self.resolve(entry['originalPath']).relative_to(self.root).as_posix()
                retained = self.resolve(entry['retainedFile'])
                if self.actual_digest(retained) != expected:
                    raise ValueError('immutable mapped version bytes changed')
                if (original, expected) in self.versions and self.versions[(original, expected)] != retained:
                    raise ValueError('ambiguous immutable version mapping')
                self.versions[(original, expected)] = retained

    def resolve_initial(self, name):
        path = Path(name)
        path = path.resolve() if path.is_absolute() else (self.root / path).resolve()
        path.relative_to(self.root)
        return path

    def resolve(self, name):
        if not isinstance(name, str) or not name:
            raise ValueError('empty audit path')
        path = Path(name)
        if path.is_absolute():
            # Existing repository paths and recorded old roots are both explicit.
            try:
                relative = path.resolve().relative_to(self.root)
            except ValueError:
                relative = path.resolve().relative_to(self.recorded_root)
        elif name.startswith('course-assets/'):
            relative = Path('course-app/public') / path
        elif name.startswith('audio/'):
            relative = Path('new-hsk1/hsk1') / path
        elif name.startswith('figures/'):
            relative = Path('hsk1-app/public/source-activities') / path
        else:
            relative = path
        if not relative.parts:
            raise ValueError('audit path leaves recorded repository')
        value = (self.root / relative).resolve()
        try:
            value.relative_to(self.root)
        except ValueError as error:
            raise ValueError('audit path leaves recorded repository: ' + name) from error
        return value

    def read_policy(self, reference):
        if not isinstance(reference, dict) or not HASH.fullmatch(reference.get('sha256', '')):
            raise ValueError('audit policy needs explicit file and actual SHA')
        path = self.resolve(reference['file'])
        body = path.read_bytes()
        if sha(body) != reference['sha256']:
            raise ValueError('byte-pinned audit policy changed')
        return json.loads(body)

    def actual_digest(self, path):
        stat = path.stat()
        identity = (str(path), stat.st_dev, stat.st_ino, stat.st_size,
                    stat.st_mtime_ns, stat.st_ctime_ns)
        if identity not in self.byte_digests:
            result = digest(path)
            after = path.stat()
            if (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns, after.st_ctime_ns) != identity[1:]:
                raise ValueError('required audit bytes changed while hashing')
            self.byte_digests[identity] = result
        return self.byte_digests[identity]

    def classify(self, owner, owner_sha, pointer, name, expected, node):
        entry = self.metadata.get((owner, owner_sha, pointer, name, expected))
        if not entry:
            return False
        if expected.startswith('94018'):
            geometry = (node.get('id'), tuple(node.get('sourceSampleRange16k', [])), node.get('cropPCM_SHA256'))
            if geometry in self.required_geometries:
                raise ValueError('selected current physical plot cannot be classified as unavailable metadata')
            if node.get('productionApproved') is not False or node.get('foregroundBoundaryClassified') is not False:
                raise ValueError('historical plot must remain the explicit unapproved proposal')
        key = (owner, owner_sha, pointer, name, expected)
        self.classified[key] = dict(entry, historicalBytesRestored=False,
                                    excludedFromCurrentPhysicalOrNativeInput=True)
        return True

    def retain(self, name, expected, *, owner, owner_sha, pointer, node):
        if not HASH.fullmatch(expected or ''):
            raise ValueError('referenced audit SHA is not exact')
        if self.classify(owner, owner_sha, pointer, name, expected, node):
            return
        original = self.resolve(name)
        logical = original.relative_to(self.root).as_posix()
        key = (logical, expected)
        if key in self.files:
            return
        path = original
        if not path.is_file() or self.actual_digest(path) != expected:
            path = self.versions.get(key)
            if path is None:
                raise ValueError('required audit bytes missing or changed: ' + logical + ' expected ' + expected + ' owner ' + owner + ' pointer ' + pointer)
        if self.actual_digest(path) != expected:
            raise ValueError('required immutable audit version bytes changed: ' + logical)
        relative = path.relative_to(self.root).as_posix()
        self.files[key] = {'recordedPath': name, 'originalRepositoryPath': logical,
                           'file': relative, 'sha256': expected, 'bytes': path.stat().st_size,
                           'ownerJSON': owner, 'ownerJSONActualSHA256': owner_sha,
                           'jsonPointer': pointer}
        if path != original:
            self.version_resolutions.append({'originalPath':logical, 'expectedSHA256':expected,
                                            'retainedFile':relative, 'actualSHA256':expected})
        if logical.endswith('.json') and key not in self.visited:
            self.visited.add(key)
            body = path.read_bytes()
            if sha(body) != expected:
                raise ValueError('audit JSON changed during traversal')
            self.visit(json.loads(body), logical, expected, '')

    def visit(self, value, owner, owner_sha, pointer):
        if isinstance(value, list):
            for i, item in enumerate(value):
                self.visit(item, owner, owner_sha, child_pointer(pointer, i))
        elif isinstance(value, dict):
            handled_hash_fields = set()
            if isinstance(value.get('file'), str) and isinstance(value.get('sha256'), str):
                self.retain(value['file'], value['sha256'], owner=owner, owner_sha=owner_sha,
                            pointer=child_pointer(pointer, 'sha256'), node=value)
                handled_hash_fields.add('sha256')
            for key, name in value.items():
                if isinstance(name, str) and key.endswith('File'):
                    prefix = key[:-4]
                    digest_key = prefix + 'SHA256' if prefix + 'SHA256' in value else key + 'SHA256'
                    expected = value.get(digest_key)
                    if isinstance(expected, str) and HASH.fullmatch(expected):
                        self.retain(name, expected, owner=owner, owner_sha=owner_sha,
                                    pointer=child_pointer(pointer, digest_key), node=value)
                        handled_hash_fields.add(digest_key)
            for path_key, hash_key in (('sourceTrack','sourceSHA256'),
                                       ('originalSourceTrack','originalSourceSHA256')):
                if isinstance(value.get(path_key), str) and HASH.fullmatch(value.get(hash_key,'')):
                    self.retain(value[path_key], value[hash_key], owner=owner, owner_sha=owner_sha,
                                pointer=child_pointer(pointer,hash_key), node=value)
                    handled_hash_fields.add(hash_key)
            if (isinstance(value.get('disk'), str) and HASH.fullmatch(value.get('sourceSHA256',''))
                    and HASH.fullmatch(value.get('sourcePCM_SHA256','')) and isinstance(value.get('sourceSampleCount16k'), int)):
                self.retain(value['disk'],value['sourceSHA256'],owner=owner,owner_sha=owner_sha,
                            pointer=child_pointer(pointer,'sourceSHA256'),node=value)
                handled_hash_fields.add('sourceSHA256')
            for key, item in value.items():
                if key == 'modelFiles':
                    # Only flat remote snapshot manifests have this role. A
                    # repository raw/source reference hidden under the same key
                    # is invalid, rather than becoming a broad path exemption.
                    native = (value.get('modelRepository'), value.get('modelRevision'))
                    pinned_native = {
                        ('Systran/faster-whisper-small','536b0662742c02347bc0e980a01041f333bce120'),
                        ('Systran/faster-whisper-medium','08e178d48790749d25932bbc082711ddcfdfbc4f'),
                    }
                    official_ctc = isinstance(value.get('modelAssetSHA256'), str) and HASH.fullmatch(value['modelAssetSHA256']) and isinstance(value.get('sourceRepository'), str)
                    if native not in pinned_native and not official_ctc:
                        raise ValueError('modelFiles must be typed pinned remote snapshot metadata')
                    if not isinstance(item, list) or not item:
                        raise ValueError('remote modelFiles must be a nonempty flat manifest')
                    allowed_names = ({'config.json','model.bin','tokenizer.json','vocabulary.txt'} if native in pinned_native else
                                     {'LICENSE','README.md','export-onnx.py','model.int8.onnx','test_wavs/zh.wav','tokens.txt'})
                    for model_file in item:
                        if not isinstance(model_file, dict) or set(model_file) - {'file','name','sha256','bytes'}:
                            raise ValueError('remote modelFiles cannot conceal repository evidence')
                        if model_file.get('file',model_file.get('name')) not in allowed_names or not HASH.fullmatch(model_file.get('sha256','')) or not isinstance(model_file.get('bytes'), int):
                            raise ValueError('remote modelFiles entry is not a pinned model asset')
                    self.excluded_model_metadata.append({'ownerJSON':owner,
                        'ownerJSONActualSHA256':owner_sha,'jsonPointer':child_pointer(pointer,key),
                        'role':'unchanged pinned remote model snapshot metadata; not repository evidence files'})
                    continue
                # Naked producer SHA fields retain their exact historical role.
                if key not in handled_hash_fields and isinstance(item, str) and item in HISTORICAL:
                    matched = False
                    for entry in self.metadata.values():
                        if (entry['ownerJSON'], entry['ownerJSONActualSHA256'], entry['jsonPointer'], entry['recordedSHA256']) == (owner, owner_sha, child_pointer(pointer,key), item):
                            self.classify(owner, owner_sha, child_pointer(pointer,key), entry['recordedPath'], item, value)
                            matched = True
                    if not matched and key in ('featureScriptSHA256','decisionCompilerSHA256','validatorSHA256'):
                        raise ValueError('unavailable historical producer metadata lacks exact authorized owner/pointer: '+owner+child_pointer(pointer,key))
                self.visit(item, owner, owner_sha, child_pointer(pointer, key))

    def check_final_fresh_recheck(self):
        if not self.require_final:
            return
        reference = self.policy_refs[POLICY_FIELDS[2]]
        fresh = self.read_policy(reference)
        if fresh.get('status') != 'fresh-current-accepted-invariants-verified' or fresh.get('errors') or fresh.get('actualVerifiedUniqueIds') != 2539 or fresh.get('actualAcceptedSnapshotUniqueIds') != 2539 or fresh.get('freshlyDecodedOriginalRegistrySources') != 357 or fresh.get('newApprovalDecisions') != 0 or fresh.get('newASRInferences') != 0:
            raise ValueError('final fresh source/frame/native recheck must verify actual complete 2539/357')
        children = [x for x in fresh.get('childReports', []) if Path(x['file']).name == 'fresh-accepted-native-source-frame-checks-v1.json']
        if len(children) != 1:
            raise ValueError('final fresh recheck lacks exact native/frame dataset')
        checks = self.read_policy(children[0])
        identities = {(x['id'], x['candidateId'], x['sourceTrack'], tuple(x['sourceSampleRange16k']), x['cropPCM_SHA256']) for x in checks.get('rows', []) if x.get('status') == 'fresh-actual-invariants-verified-not-new-approval'}
        for gate in self.gates:
            if (gate['id'], gate['candidateId'], gate['sourceTrack'], tuple(gate['sourceSampleRange16k']), gate['cropPCM_SHA256']) not in identities:
                raise ValueError('selected final geometry was not actually freshly rechecked')

    def run(self):
        owner = self.report_path.relative_to(self.root).as_posix()
        report_sha = sha(self.report_bytes)
        for reference in self.policy_refs.values():
            self.retain(reference['file'], reference['sha256'], owner=owner, owner_sha=report_sha,
                        pointer='/explicitPinnedAuditPolicy', node=reference)
        self.visit(self.report, owner, report_sha, '')
        self.check_final_fresh_recheck()
        return {'schemaVersion':1, 'status':'actual-typed-audit-references-verified',
                'reportEvidence':{'file':owner,'sha256':report_sha},
                'completeCoverage':self.require_final, 'actualPinnedFileVersions':len(self.files),
                'actualPinnedFiles':len(self.files), 'errors':[],
                'actualTraversedJSONVersions':len(self.visited),
                'historicalMetadataExclusions':list(self.classified.values()),
                'immutableVersionResolutions':self.version_resolutions,
                'remoteModelMetadataReferences':self.excluded_model_metadata,
                'freshSourceFrameReverificationEvidence':self.policy_refs.get(POLICY_FIELDS[2]),
                'noOriginalReferenceEdited':True,'noDecisionsCreated':True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo-root', type=Path, required=True)
    parser.add_argument('--report', required=True)
    parser.add_argument('--require-complete', action='store_true')
    parser.add_argument('--classifications', nargs=2, metavar=('FILE','SHA256'))
    parser.add_argument('--versions', nargs=2, metavar=('FILE','SHA256'))
    parser.add_argument('--fresh-report', nargs=2, metavar=('FILE','SHA256'))
    parser.add_argument('--summary-only', action='store_true', help='Compact successful JSON for a verifier subprocess')
    args = parser.parse_args()
    policies = {}
    for key, value in zip(POLICY_FIELDS, (args.classifications,args.versions,args.fresh_report)):
        if value:
            policies[key] = {'file':value[0],'sha256':value[1]}
    try:
        graph = AuditGraph(args.repo_root,args.report,policy_references=policies,require_final=args.require_complete)
        result = graph.run()
        if args.summary_only:
            result = {k:v for k,v in result.items() if k not in ('historicalMetadataExclusions','immutableVersionResolutions','remoteModelMetadataReferences')}
            result.update(historicalMetadataExclusionCount=len(graph.classified),
                          immutableVersionResolutionCount=len(graph.version_resolutions),
                          remoteModelMetadataCount=len(graph.excluded_model_metadata))
        print(json.dumps(result,ensure_ascii=False))
    except Exception as e:
        print(json.dumps({'status':'typed-audit-reference-check-failed','error':str(e),'noDecisionsCreated':True},ensure_ascii=False))
        raise SystemExit(1)


if __name__ == '__main__':
    main()
