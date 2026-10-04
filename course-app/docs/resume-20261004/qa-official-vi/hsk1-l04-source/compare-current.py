#!/usr/bin/env python3
"""Materialize independently reviewed source/display decisions; never edit runtime."""
import json, hashlib
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).resolve().parent
author = ROOT / 'course-app/docs/resume-20261004/official-vi-source-prep/hsk1-l04/transcription.json'
scope_path = OUT / 'consumer-scope.json'
source_review = json.loads((OUT / 'source-review.json').read_text())
scope = json.loads(scope_path.read_text())
src = {e['sourceID']: e for e in json.loads(author.read_text())['entries']}
assert source_review['sourceAccepted'] and source_review['reviewedEntries'] == 105
assert hashlib.sha256(author.read_bytes()).hexdigest() == source_review['authorTranscriptionSHA256']
def sid(suffix):
    value = 'hsk1-vi-l04-pdf' + suffix
    assert value in src, value
    return value
def text(suffix): return src[sid(suffix)]['viText']
def body(value):
    s = src[value]
    return s['viText'].removeprefix(s['speakerVi'] + ': ') if s.get('speakerVi') else s['viText']
def candidate(row, ids, value, projection='verbatim', note=''):
    ids = [sid(s) if not s.startswith('hsk1-') else s for s in ids]
    assert ids and all(s in src for s in ids)
    row.update(sourceIDs=ids, sourceID=ids[0] if len(ids)==1 else None, newValue=value,
               decision=('accept-current-source-projection' if row['expected']==value else 'replace-display-from-accepted-source'),
               projection=projection, note=note,
               sourceEvidence=[{'sourceID':s,'pdfPage':src[s]['pdfPage'],'printedPage':src[s]['printedPage'],
                                'acceptedViText':src[s]['viText'],'acceptedPOS':src[s].get('posRawLabel')} for s in ids])

decisions=[]
for e in scope['currentConsumers']:
    r={k:e[k] for k in ['recordId','component','file','pointer','chineseContext','itemId','consumerChain']}
    r.update(expected=e['currentVietnamese'],newValue=e['currentVietnamese'],sourceID=None,sourceIDs=[],
             decision='retain-editorial-no-printed-VI-counterpart',projection=None,
             note='No exact printed Vietnamese counterpart in these nine pages; not certified as official text or as globally proofread Vietnamese.')
    p=e['pointer']; candidates=e['candidateSourceIDs']
    if e['component']=='hsk1-textbook-effective':
        if '/vocab/' in p and candidates:
            s=src[candidates[0]]
            if p.endswith('/posLabel'):
                prefix=r['expected'].split(' · ')[0]
                candidate(r,candidates,prefix+' · '+s['posRawLabel'],'printed-raw-VI-POS-with-existing-Chinese-prefix',
                          'Primary official abbreviation. Keep Chinese/PY/pos semantic identities; do not infer an expanded category, especially 多: đt. and phó từ chỉ mức độ both appear in print.')
            else: candidate(r,candidates,s['viText'])
        elif '/scenes/' in p and '/lines/' in p:
            candidate(r,candidates,body(candidates[0]),'dialogue-body-with-speaker-separate',
                      'Preserve Chinese speaker s. Accepted Vietnamese speaker is recorded separately in role decisions; current line display contains only the body.')
        elif p.endswith('/place_vn'):
            r['note']='Short location heading translates current Chinese place, not the full printed scene setting. Keep it as editorial location; add full official setting separately if required. Do not replace a place label with a different complete Chinese sentence.'
            r['relatedSourceIDs']=candidates
        elif p=='/lessons/3/grammar/0/examples/0/vn':
            candidate(r,['035-text-1-line-04'],body(sid('035-text-1-line-04')),'shared-identical-Chinese-dialogue-body')
        elif p=='/lessons/3/grammar/2/examples/0/vn':
            candidate(r,['038-text-2-line-01'],body(sid('038-text-2-line-01')),'shared-identical-Chinese-dialogue-body')
        elif p=='/lessons/3/grammar/3/examples/2/vn':
            candidate(r,['037-grammar-2-3-example-book'],text('037-grammar-2-3-example-book').strip('()'),'gloss-body-with-layout-parentheses-removed')
        elif p=='/lessons/3/grammar/1/desc':
            candidate(r,['036-grammar-2-body','037-grammar-2-3-body'],text('036-grammar-2-body')+'\n'+text('037-grammar-2-3-body'),
                      'two-accepted-official-paragraphs', 'Current explanation contains number notation and 二/两 usage. Preserve both topics by composing their actual printed paragraphs, rather than losing the second topic.')
        elif '/xiaoyuTips/' in p:
            r['relatedSourceIDs']=candidates
            r['note']='Chinese tip is editorial and includes claims (counting/telephone numbers or 几/多少 ranges) not supplied verbatim by the printed candidate paragraph. Keep separate; do not label this translation official. Cross-lesson/global language review remains necessary.'
        elif candidates:
            candidate(r,candidates,src[candidates[0]]['viText'])
    else:
        if p.startswith('/activities/'):
            a=int(p.split('/')[2]); field=p.split('/')[3]
            if field=='instruction':
                chosen={21:['035-text-1-read','035-text-1-role-read'],22:['036-grammar-1-read'],
                        23:['038-text-2-role-read'],25:['039-grammar-3-read'],26:['039-grammar-4-read'],
                        27:['041-text-3-role-read']}.get(a)
                if chosen:
                    value=' '.join(text(s) for s in chosen)
                    if a in [22,25,26]: value+=' Phiên âm là phần hỗ trợ bổ sung.'
                    candidate(r,chosen,value,'official-instruction-plus-labelled-editorial-support' if a in [22,25,26] else 'composed-official-instructions')
                elif len(candidates)==1: candidate(r,candidates,src[candidates[0]]['viText'])
            elif field=='prompt':
                if a in [21,23,27]: candidate(r,candidates,'\n'.join(src[s]['viText'] for s in candidates),'ordered-complete-role-lines')
                elif a==30: candidate(r,candidates,'\n'.join(src[s]['viText'] for s in candidates),'ordered-four-goals')
                elif a==34: candidate(r,['039-grammar-4-body'],text('039-grammar-4-body'))
                elif a==35:
                    candidate(r,['040-hint-under-ten','040-hint-over-ten'],
                              '“您儿子几岁？” — '+text('040-hint-under-ten')+'\n“您女儿多大？” — '+text('040-hint-over-ten'),
                              'printed-help-bodies-with-existing-Chinese-anchor-prefixes')
                elif candidates: candidate(r,candidates,src[candidates[0]]['viText'])
            elif field=='title':
                if a < 6:
                    candidate(r,['034-warmup-heading'],r['expected'],'printed-warmup-heading-with-editorial-action-suffix')
                title_map={20:(['042-class-activity-heading','042-pair-heading'],text('042-class-activity-heading')+' · '+text('042-pair-heading')),
                    21:(['035-text-1-heading','035-text-1-read'],text('035-text-1-heading')+' · '+text('035-text-1-read').rstrip('.')),
                    22:(['035-grammar-1-title'],text('035-grammar-1-title')+' · Ví dụ trong sách'),
                    23:(['037-text-2-heading','038-text-2-role-read'],text('037-text-2-heading')+' · '+text('038-text-2-role-read').rstrip('.')),
                    24:(['037-text-2-heading'],text('037-text-2-heading')+' · Hội thoại theo thực tế'),
                    25:(['039-grammar-3-title'],text('039-grammar-3-title')+' · Ví dụ trong sách'),
                    26:(['039-grammar-4-title'],text('039-grammar-4-title')+' · Ví dụ trong sách'),
                    27:(['040-text-3-heading','041-text-3-role-read'],text('040-text-3-heading')+' · '+text('041-text-3-role-read').rstrip('.')),
                    28:(['040-text-3-heading'],text('040-text-3-heading')+' · Trả lời câu hỏi 1'),
                    29:(['040-text-3-heading'],text('040-text-3-heading')+' · Trả lời câu hỏi 2'),
                    30:(['034-goals-heading'],text('034-goals-heading')),
                    35:(['040-hint-heading'],text('040-hint-heading')+' · Hỏi tuổi')}
                if a in title_map:
                    ids,value=title_map[a];candidate(r,ids,value,'official-heading-component-with-explicit-editorial-title-composition')
                elif candidates: candidate(r,candidates,src[candidates[0]]['viText'].rstrip('.'),'instruction-as-compact-title')
            elif candidates:
                candidate(r,candidates,src[candidates[0]]['viText'],'shared-vocabulary-gloss')
            if a in [28,29] and p.endswith('/feedbackNote/vi'):
                id0='040-text-3-line-'+('02' if a==28 else '04')
                candidate(r,[id0],r['expected'].replace('Bài đọc 3','Bài khoá 3').replace('PDF trang 39','PDF tiếng Trung trang 39; PDF tiếng Việt trang 40'),
                          'source-edition-reference-clarification',
                          'Editorial feedback cites printed page24/physical PDF39 of the older Chinese source edition. Vietnamese PDF is physical40. The entire note is not an official translation; only its edition-specific source locator is clarified.')
        elif p=='/numberTables/two/5/vi':
            candidate(r,['037-grammar-2-3-example-book'],text('037-grammar-2-3-example-book'),'printed-gloss-including-parentheses')
        elif candidates: candidate(r,candidates,src[candidates[0]]['viText'])
    if p.startswith('/activities/'):
        a=int(p.split('/')[2]); obj=json.loads((ROOT/e['file']).read_text())['activities'][a]
        r['currentActivityIdentity']=obj['id']+'@'+obj['version']
        r['versionPolicy']='Only changed current activities need a newly explicit version, derived from their own present version. Preserve archived context snapshots; top-level lesson v3 does not imply activity v3.'
    if e['component']=='hsk1-textbook-effective':
        value=json.loads((ROOT/e['file']).read_text())
        for part in p.split('/')[1:]:value=value[int(part)] if isinstance(value,list) else value[part]
        r['frozenProducerValue']=value
        r['expectedLayer']='verified effective book clone, following accepted Chinese/PY display revisions'
        r['implementationPolicy']='Apply presentation correction, preserve frozen bytes/fingerprints. Existing overlay entries for the same target/field must be amended or composed without duplicate touched identities; guard expected is frozen value, not assumed effective value.'
    r['classification']=('official-wording-variant' if r['decision']=='replace-display-from-accepted-source' else
                         'matches-official-source-projection' if r['decision']=='accept-current-source-projection' else
                         'editorial-no-direct-book-counterpart')
    r['classificationLimit']='A source mismatch is proven. This review does not count every expression difference as a mistranslation or infer an official-book erratum.'
    decisions.append(r)

by_pointer={r['pointer']:r for r in decisions if r['component']=='hsk1-textbook-effective'}
roles=[]
for r in scope['dialogueRoleBindings']:
    s=src[r['candidateSourceIDs'][0]]
    roles.append(dict(r,sourceIDs=r['candidateSourceIDs'],expected=None,newValue=s['speakerVi'],
                      decision='bind-accepted-Vietnamese-speaker-separately',
                      note='Current Chinese speaker must remain Chinese. Add a Vietnamese display speaker or compose full accepted role line once; no replacement of s with Vietnamese. This requires explicit renderer support, not an unreviewed global name replacement.'))
derived=[]
for e in scope['derivedVisibleTextbookWordExamples']:
    r=by_pointer[e['parentPointer']]
    derived.append(dict(e,expected=e['currentVietnamese'],newValue=r['newValue'],sourceIDs=r['sourceIDs'],decision='inherit-accepted-parent-display' if r['sourceIDs'] else 'retain-editorial-parent-no-printed-counterpart'))
generated=[]
for e in scope['generatedPracticeConsumers']:
    parents=[by_pointer[p] for p in e['exactParentPointers']]
    values={p['newValue'] for p in parents}; assert len(values)<=1,(e,values)
    generated.append(dict(e,expected=e['currentVietnameseOrMixedText'],newValue=next(iter(values)) if values else e['currentVietnameseOrMixedText'],
                          sourceIDs=list(dict.fromkeys(s for p in parents for s in p['sourceIDs'])),
                          decision='inherit-current-display-parent-do-not-edit-frozen-bank' if parents else 'retain-generated-editorial-or-Chinese-PY-field',
                          note='These are actual ephemeral generated-question leaf occurrences, not120 unique Vietnamese phrases. Regenerate after applying current presentation corrections; five historical assessment banks remain unchanged.'))
ui=[]
for e in scope['uiAndTemplateSites']:
    r=dict(e,expected=e['currentVietnamese'],newValue=e['currentVietnamese'],sourceID=None,sourceIDs=[],decision='retain-shared-editorial-await-B14-global-copy-review')
    if e['file'].endswith('/source-activities/numbers.ts'):
        chosen={12:'036-grammar-2-1-title',13:'037-grammar-2-2-title',15:'037-grammar-2-3-title'}.get(e['line'])
        if chosen: candidate(r,[chosen],text(chosen))
        elif e['line']==14 and 'Thông thường' in e['currentVietnamese']:
            value='Thông thường,'+text('037-grammar-2-3-body').split('Thông thường,',1)[1]
            candidate(r,['037-grammar-2-3-body'],value,'second-official-sentence-matching-current-Chinese-paragraph')
    elif e['file'].endswith('/i18n/textbook.ts') and e['line']==56:
        candidate(r,['040-hint-heading'],text('040-hint-heading'),'shared-heading-await-all-lesson-binding-verification')
    elif e['file'].endswith('/i18n/vocabulary.ts') and e['line']==5:
        candidate(r,['035-vocab-heading','038-vocab-heading','041-vocab-heading'],text('035-vocab-heading'),'shared-heading-await-all-lesson-binding-verification')
    ui.append(r)
catalog=[]
for e in scope['wordReuseBindings']:
    r=by_pointer[e['bookPointer']]
    for c in e['catalogueRecords']:
        catalog.append({'bookWordId':e['bookWordId'],'catalogId':c['id'],'senseId':c['senseId'],'pointer':c['pointer'],
                        'expected':c['currentVietnamese'],'newValue':r['newValue'],'sourceIDs':r['sourceIDs'],
                        'decision':'share-presentation-overlay-by-stable-sense-identity' if r['sourceIDs'] else 'retain-editorial-await-cross-lesson-source',
                        'boundary':'Do not modify frozen full/sense fingerprints or historical grading banks. Current vocabulary/review/mixed-card presentation needs its own validated clone; book overlay alone does not reach catalog cards.'})
legacy=[]
for e in scope['retainedLegacyEffectiveConsumers']:
    p=e['virtualPointer'].replace('/window.HSK1_LESSONS/3','/lessons/3'); r=by_pointer[p]
    legacy.append(dict(e,expected=e['currentVietnamese'],newValue=r['newValue'],sourceIDs=r['sourceIDs'],
                       decision='same-canonical-display-binding-when-served-original-route' if r['sourceIDs'] else 'retain-editorial-original-route',
                       note='Inventory original route remains a potential display consumer. Unified packaging replaces lesson entry with common engine; do not mutate seven frozen correction layers or assume an unserved development route is live.'))
additional_ui=[{'file':'hsk1-app/src/app/i18n/exercises.ts','line':11,
           'expected':'Luyện tập tổng hợp','newValue':text('041-exercises-heading'),
           'sourceIDs':[sid('041-exercises-heading')],'decision':'B14-shared-heading-proposal-separate-from-326-site-scope',
           'note':'Actual source read separately. Five historical grading banks remain immutable; this is a UI heading, not an assessment-item rewrite.'}]
used={s for row in decisions+ui+additional_ui for s in row.get('sourceIDs',[])}
source_disposition=[]
for s,e in src.items():
    source_disposition.append({'sourceID':s,'pdfPage':e['pdfPage'],'printedPage':e['printedPage'],'kind':e['kind'],
        'decision':'bound-to-current-display-proposal' if s in used else 'not-current-direct-display-target',
        'note':('Running headers/lesson marker are book furniture; no requirement to copy onto website.' if e['kind'] in ['running-header','lesson-marker'] else
                'Full printed setting is not the current short location heading. Add a separately named setting consumer if full printed text must be shown.' if e['kind']=='setting' else
                'Accepted printed item exists; inspect coverage separately from translation correctness before adding/remapping a UI field.') if s not in used else ''})
result={'schemaVersion':1,'status':'independent-source-linked-display-comparison-complete-proposals-only',
        'sourceAccepted':True,'sourcePDFSHA256':source_review['sourcePDFSHA256'],
        'authorTranscriptionSHA256':source_review['authorTranscriptionSHA256'],
        'consumerScopeSHA256':hashlib.sha256(scope_path.read_bytes()).hexdigest(),
        'runtimeEdited':False,'websiteConformanceAccepted':False,'historicalBanksEdited':False,
        'counts':{'currentFields':len(decisions),'currentFieldDecisions':dict(Counter(r['decision'] for r in decisions)),
                  'separateVietnameseSpeakers':len(roles),'derivedWordExampleOccurrences':len(derived),
                  'generatedPracticeLeafOccurrences':len(generated),'generatedPracticeWithParents':sum(bool(r['exactParentPointers']) for r in generated),
                  'sharedUITemplateSites':len(ui),'sharedUIReplacementProposals':sum(r['decision']=='replace-display-from-accepted-source' for r in ui),
                  'cataloguePresentationBindings':len(catalog),'retainedLegacyFields':len(legacy),'acceptedSourceItems':len(src),'sourceItemsWithDirectProposal':len(used)},
        'currentDisplayDecisions':decisions,'speakerDecisions':roles,'derivedExamples':derived,'generatedPracticeDecisions':generated,
        'sharedUISiteDecisions':ui,'cataloguePresentationBindings':catalog,'retainedOriginalRouteDecisions':legacy,
        'sourceCoverageDecisions':source_disposition,
        'additionalSharedUIRecommendations':additional_ui,
        'limits':['Only official-VI correspondence and source locators in Lesson4 pages34–42 are independently decided here. Nonprinted editorial Vietnamese remains for B14/global language review.',
                  'Current display expected differs from frozen producer values for existing display revisions. This report is not a directly applicable runtime patch.',
                  'New Vietnamese changes require new content/native certification; old A9 certificates attest their own exact bytes only.']}
(OUT/'website-comparison.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result['counts'],ensure_ascii=False,indent=2))
