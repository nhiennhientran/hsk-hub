#!/usr/bin/env python3
"""Independent structural guards for the authored comparison; no runtime writes."""
import collections, copy, gzip, hashlib, json, pathlib, xml.etree.ElementTree as ET

HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parents[4]

def load(p):
    data=p.read_bytes()
    return json.loads(gzip.decompress(data) if str(p).endswith('.gz') else data)

def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def at(d,p):
    for key in p.split('/')[1:]:
        key=key.replace('~1','/').replace('~0','~')
        d=d[int(key)] if isinstance(d,list) else d[key]
    return d

def set_at(d,p,value):
    parts=p.split('/')[1:]; parent=d
    for key in parts[:-1]:parent=parent[int(key)] if isinstance(parent,list) else parent[key]
    key=parts[-1]
    if isinstance(parent,list):parent[int(key)]=value
    else:parent[key]=value

def sealed(x):
    if isinstance(x,dict):return {k:sealed(v) for k,v in x.items() if k!='vi'}
    if isinstance(x,list):return [sealed(v) for v in x]
    return x

data=load(HERE/'comparison.json'); rows=data['records']
proposals=load(HERE/'proposals.json')['proposals']
summary=load(HERE/'review-summary.json')
inputs=load(HERE/'input-ledger.json')['inputs']
inv=load(ROOT/'course-app/docs/resume-20261004/vi-inventory/inventory.json.gz')
inv_by={r['recordId']:r for r in inv}
sourcepath=ROOT/'course-app/docs/resume-20261004/official-vi-source-prep/hsk2-l02/source-transcription.json'
sources={r['sourceId']:r for r in load(sourcepath)['records']}
binding_ids={b['semanticId'] for b in load(HERE/'semantic-bindings-input.json')}
jsonfiles={r['file']:load(ROOT/r['file']) for r in rows if r['file'].endswith('.json')}
checks=[]

def check(name,fn):
    fn(); checks.append({'name':name,'passed':True})

def input_hashes():
    for r in inputs:assert digest(ROOT/r['path'])==r['sha256'],r['path']
check('all bound runtime/source/inventory/SVG/code input bytes still match',input_hashes)

def expected_rows():
    assert len(rows)==len({r['recordId'] for r in rows})==524
    for r in rows:
        original=inv_by[r['recordId']]
        assert r['semanticKey']==original['semanticKey']
        assert (r['file'],r['pointer'],r['oldExpected'])==(original['file'],original['pointer'],original['value'])
        if r['file'].endswith('.json'):assert at(jsonfiles[r['file']],r['pointer'])==r['oldExpected']
        else:
            root=ET.parse(ROOT/r['file']).getroot()
            desc=next(x for x in root.iter() if x.tag.rsplit('}',1)[-1]=='desc')
            assert (desc.text or '').strip()==r['oldExpected']
        assert all(i in binding_ids for i in r['relatedSemanticBindingIds'])
check('524 identities, exact current expected leaves and 39 consumer bindings',expected_rows)

def source_bindings():
    ledger=load(HERE/'source-to-consumer-ledger.json')['records']
    assert len(ledger)==104 and {r['sourceId'] for r in ledger}==set(sources)
    for r in rows:
        assert len(r['officialSourceIds'])==len(set(r['officialSourceIds']))
        for ref in r['officialReferences']:
            source=sources[ref['sourceId']]
            assert ref['viPrinted']==source['viPrinted']
            assert ref['zhAnchor']==source['zhAnchor']
            assert (ref['pdfPage'],ref['printedPage'])==(source['pdfPage'],source['printedPage'])
        if r['sourceRelation'] in ['direct-official-unit','same-Chinese-official-translation-reuse','same-printed-vocabulary-unit','canonical-single-source-vocabulary-reuse','same-headword-option-gloss-reuse']:
            assert len(r['officialSourceIds'])==1
            assert r['newVietnamese']==sources[r['officialSourceIds'][0]]['viPrinted']
    reverse=collections.defaultdict(set)
    for r in rows:
        for sid in r['officialSourceIds']:reverse[sid].add(r['recordId'])
    for r in ledger:assert set(r['websiteOccurrenceIds'])==reverse[r['sourceId']]
    assert sum(bool(r['websiteOccurrenceIds']) for r in ledger)==81
check('104 accepted source IDs, original pages/Chinese/VN and exact direct reuse',source_bindings)

def pos():
    categories={'dt.':'danh từ','liên.':'liên từ','tt.':'tính từ','đgt.':'động từ','phó.':'phó từ','trợ.':'trợ từ','số.':'số từ','lượng.':'lượng từ'}
    rs=[r for r in rows if r['decision']=='keep-compatible-pos-label-sealed']
    assert len(rs)==34
    for r in rs:
        if r['chineseContext']=='北京大学':assert r['oldExpected']=='danh từ riêng' and not r['officialPrintedPosLabels']
        else:assert set(r['oldExpected'].split('/'))=={categories[v] for v in r['officialPrintedPosLabels']}
        assert r['newVietnamese']==r['oldExpected']
check('34 expanded POS leaves compatible and unchanged',pos)

def overlay_guard(proposal):
    r=inv_by[proposal['recordId']]
    assert (proposal['semanticKey'],proposal['file'],proposal['pointer'],proposal['oldExpected'])==(r['semanticKey'],r['file'],r['pointer'],r['value'])
    assert proposal['pointer'].endswith('/vi')
    assert at(jsonfiles[proposal['file']],proposal['pointer'])==proposal['oldExpected']
    assert proposal['officialSourceIds'] and all(sid in sources for sid in proposal['officialSourceIds'])
    assert proposal['newVietnamese']!=proposal['oldExpected']
    assert 'buýt buýt' not in proposal['newVietnamese']
    assert len(proposal['officialReferences'])==len(proposal['officialSourceIds'])
    for ref in proposal['officialReferences']:assert ref['viPrinted']==sources[ref['sourceId']]['viPrinted']
    if proposal['sourceRelation'] in ['direct-official-unit','same-Chinese-official-translation-reuse','same-printed-vocabulary-unit','canonical-single-source-vocabulary-reuse','same-headword-option-gloss-reuse']:
        assert proposal['newVietnamese']==sources[proposal['officialSourceIds'][0]]['viPrinted']

def overlay_seal():
    assert len(proposals)==150
    candidate=copy.deepcopy(jsonfiles)
    for p in proposals:overlay_guard(p);set_at(candidate[p['file']],p['pointer'],p['newVietnamese'])
    for f in candidate:assert sealed(candidate[f])==sealed(jsonfiles[f]),f
    l=candidate['course-app/content/hsk2/lesson-02.json']
    parts=['activities','homework','listening','texts','vocabulary','grammar']
    seal={k:sealed(l[k]) for k in parts}
    actual=hashlib.sha256(json.dumps(seal,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    assert actual==summary['assessmentSealSHA256']
    assert l['texts'][3]['lines'][0]['speaker']=='白家月'
    for w in l['vocabulary']:
        c=next(s for s in candidate['course-app/content/hsk2-lexicon.json']['senses'] if any(x['wordId']==w['id'] for x in s['sources']))
        assert w['vi']==c['vi'] and len(c['sources'])==1
    assert candidate['course-app/content/course-index.json'][1]['title']['vi']==l['title']['vi']
check('150 in-memory VI-only proposals preserve all non-VI/assessment/history identity and word-title duplicates',overlay_seal)

def rejected(mutator):
    p=copy.deepcopy(next(r for r in proposals if r['sourceRelation']=='direct-official-unit'))
    mutator(p)
    try:overlay_guard(p)
    except (AssertionError,KeyError,IndexError):return
    raise AssertionError('bad proposal was accepted')
for name,mut in [
 ('old expected drift rejected',lambda p:p.update(oldExpected=p['oldExpected']+'x')),
 ('non-VI pointer rejected',lambda p:p.update(pointer='/title/zh')),
 ('unaccepted source ID rejected',lambda p:p.update(officialSourceIds=['fake-source'])),
 ('direct official string changed rejected',lambda p:p.update(newVietnamese=p['newVietnamese']+' x')),
 ('source printed VN forged rejected',lambda p:p['officialReferences'][0].update(viPrinted='forged'))]:
    check(name,lambda mut=mut:rejected(mut))

def boundaries():
    assert len(load(HERE/'dynamic-ui-and-missing-presentations.json')['sharedDynamicUI'])==4
    assert len(load(HERE/'excluded-legacy-same-ordinal.json')['excludedOccurrences'])==187
    assert len([r for r in rows if r['decision']=='pending-official-source-outside-pilot'])==18
    assert len([r for r in rows if r.get('editorialPreservationRequired')])==5
    assert all(not r['decision'].startswith('propose-') for r in rows if r['file'].endswith('.svg'))
    assert not summary['activationAllowed'] and summary['runtimeMutations']==0
check('dynamic headings, unrelated legacy, 18 outside-source leaves and 5 editorial-preservation gates remain explicit',boundaries)

result={'schemaVersion':1,'reviewer':'qa_hsk1_05_08','kind':'structural guard validation of comparison proposals; not independent language acceptance or native UI test','status':'all-passed','passed':len(checks),'failed':0,'runtimeWrites':0,'checks':checks,'comparisonSHA256':digest(HERE/'comparison.json'),'proposalsSHA256':digest(HERE/'proposals.json'),'sourceLedgerSHA256':digest(HERE/'source-to-consumer-ledger.json'),'assessmentSealSHA256':summary['assessmentSealSHA256']}
(HERE/'validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))
