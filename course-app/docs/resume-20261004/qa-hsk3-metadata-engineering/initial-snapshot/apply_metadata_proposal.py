"""Preview a bounded metadata plan. --apply additionally requires frozen QA acceptance."""
import argparse
import copy
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
APP = HERE.parents[2]
PROPOSAL = HERE / 'official-vi-metadata-proposal.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def serialized_sha(value):
    return hashlib.sha256((json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true', help='Write only the guarded lesson metadata additions')
    args = parser.parse_args()
    proposal = json.loads(PROPOSAL.read_text())
    if sha(APP / proposal['sourceEvidenceFile']) != proposal['sourceEvidenceSha256']:
        raise ValueError('Joined source evidence changed; regenerate proposal')
    for name, expected in proposal['sourceInputSha256'].items():
        if sha(HERE / name) != expected:
            raise ValueError(f'Frozen source input changed: {name}')
    if sha(APP / 'content/hsk3-lexicon.json') != proposal['preservationGuards']['canonicalLexiconSha256']:
        raise ValueError('Canonical lexicon changed; regenerate proposal')
    review = proposal['independentReview']
    if 'evidenceFile' in review and sha(APP / review['evidenceFile']) != review['evidenceSha256']:
        raise ValueError('Independent review evidence changed; regenerate proposal')
    if args.apply and review['status'] != 'accepted-source-evidence':
        raise ValueError('Full independent source acceptance is required before integration')
    candidates, count = [], 0
    for plan in proposal['lessons']:
        path = APP / plan['jsonFile']
        if path.parent != APP / 'content/hsk3' or not path.name.startswith('lesson-'):
            raise ValueError('Unexpected integration path')
        if sha(path) != plan['expectedFileSha256']:
            raise ValueError(f'Lesson bytes changed: {plan["jsonFile"]}; regenerate proposal')
        original = json.loads(path.read_text())
        candidate = copy.deepcopy(original)
        registry = plan['registryOperation']
        if registry['jsonPointer'] != '/additionalSourceRevisions' or registry['expected'] != {'exists': False}:
            raise ValueError('Unexpected registry operation')
        if 'additionalSourceRevisions' in original:
            raise ValueError('Existing registry would be overwritten')
        candidate['additionalSourceRevisions'] = copy.deepcopy(registry['value'])
        if len(plan['wordOperations']) != len(original['vocabulary']):
            raise ValueError('Incomplete word operation coverage')
        for index, operation in enumerate(plan['wordOperations']):
            word = original['vocabulary'][index]
            expected_pointer = f'/vocabulary/{index}/additionalSourceEvidence'
            if operation['jsonPointer'] != expected_pointer or operation['expected'] != {'exists': False}:
                raise ValueError('Unexpected word operation')
            if word != operation['expectedWord'] or word['id'] != operation['wordId']:
                raise ValueError(f'Word value or index changed: {operation["wordId"]}')
            if 'additionalSourceEvidence' in word:
                raise ValueError('Existing word evidence would be overwritten')
            evidence = operation['value']
            if len(evidence) != 1 or evidence[0]['sourceRevisionId'] != proposal['sourceRevisionId']:
                raise ValueError('Unexpected additional-source identity')
            candidate['vocabulary'][index]['additionalSourceEvidence'] = copy.deepcopy(evidence)
            count += 1
        stripped = copy.deepcopy(candidate)
        del stripped['additionalSourceRevisions']
        for word in stripped['vocabulary']:
            del word['additionalSourceEvidence']
        if stripped != original:
            raise ValueError('The candidate modified an original course value')
        candidates.append((path, candidate, plan))
    if count != 523 or len(candidates) != 18:
        raise ValueError('Unexpected total integration coverage')
    report = {
        'schemaVersion': 1, 'mode': 'applied' if args.apply else 'read-only-preview',
        'proposalSha256': sha(PROPOSAL), 'independentReview': review,
        'lessonFiles': 18, 'additionalWordEvidence': count,
        'originalObjectsUnchangedAfterStrippingNewMetadata': True,
        'canonicalLexiconSha256': sha(APP / 'content/hsk3-lexicon.json'),
        'originalMetadataCoverage': {'appendixSource': 217, 'numberPosMetadata': 174, 'numberPosSource': 0},
        'additionalOfficialSourceCoverage': {'glossaryAnchor': 523, 'numberPosMetadata': 523, 'numberPosSource': 523},
        'originalEnglishAppendixRevalidated': False,
        'vietnameseTranslationsChanged': False,
        'lessons': [{'file': p['jsonFile'], 'beforeSha256': p['expectedFileSha256'],
                     'candidateSha256': serialized_sha(candidate), 'wordEvidence': len(p['wordOperations'])}
                    for _, candidate, p in candidates],
    }
    if args.apply:
        for path, candidate, _ in candidates:
            path.write_text(json.dumps(candidate, ensure_ascii=False, indent=2) + '\n')
        if sha(APP / 'content/hsk3-lexicon.json') != report['canonicalLexiconSha256']:
            raise ValueError('Canonical lexicon changed during integration')
    target = HERE / ('metadata-integration-result.json' if args.apply else 'metadata-integration-preview.json')
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'mode': report['mode'], 'lessonFiles': 18, 'additionalWordEvidence': count,
                      'courseFilesChanged': args.apply, 'report': str(target.relative_to(APP))}, indent=2))


if __name__ == '__main__':
    main()
