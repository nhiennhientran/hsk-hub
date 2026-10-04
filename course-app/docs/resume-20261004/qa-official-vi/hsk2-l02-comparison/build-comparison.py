#!/usr/bin/env python3
"""Read-only authoring of H2 L2 B10 comparison proposals; never applies them."""
import collections, datetime, gzip, hashlib, json, pathlib, re, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[5]
DOC = ROOT / 'course-app/docs/resume-20261004'
OUT = pathlib.Path(__file__).resolve().parent
INV = DOC / 'vi-inventory'
SOURCE = DOC / 'official-vi-source-prep/hsk2-l02/source-transcription.json'
ACCEPTANCE = DOC / 'official-vi-source-prep/hsk2-l02-independent/final-source-acceptance.json'
LESSON = 'course-app/content/hsk2/lesson-02.json'
LEXICON = 'course-app/content/hsk2-lexicon.json'
SUMMARY = 'course-app/content/course-index.json'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def read(path):
    data = path.read_bytes()
    return json.loads(gzip.decompress(data) if str(path).endswith('.gz') else data)

def write(name, data):
    (OUT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

def at(data, pointer):
    for part in pointer.split('/')[1:]:
        part = part.replace('~1', '/').replace('~0', '~')
        data = data[int(part)] if isinstance(data, list) else data[part]
    return data

assert sha(SOURCE) == '6c911ccfa8bc58ba8e4d16f03f285a9c1c29ec34572450a1fccf70f9ad3c1d8d'
accepted = read(ACCEPTANCE)
assert accepted['status'] == 'independent-full-official-source-transcription-accepted'
source = read(SOURCE)
sr = source['records']
by_section = {r['section']: r for r in sr if not r['section'].startswith('running-')}
by_id = {r['sourceId']: r for r in sr}
assert len(by_id) == 104
inv = read(INV / 'inventory.json.gz')
files = {r['file']: r for r in read(INV / 'runtime-files.json')}
loaded = {f: read(ROOT / f) for f in [LESSON, LEXICON, SUMMARY]}
for f in loaded:
    assert sha(ROOT / f) == files[f]['sha256'], ('runtime drift', f)
lesson = loaded[LESSON]
words = {w['id']: w for w in lesson['vocabulary']}
local = [r for r in inv if r['file'] == LESSON]
assert len(local) == 476
assert sum(r['learningFieldOccurrence'] for r in local) == 458
canon_senses = [(i,s) for i,s in enumerate(loaded[LEXICON]['senses'])
                if any(x['wordId'] in words for x in s['sources'])]
assert len(canon_senses) == 17
assert all(len(s['sources']) == 1 for _,s in canon_senses)
canon_ids = {s['id'] for _,s in canon_senses}
canonical = [r for r in inv if r['file'] == LEXICON and r['itemId'] in canon_ids]
assert len(canonical) == 34
summary = [r for r in inv if r['component'] == 'shared-summary' and r['itemId'] == lesson['id']]
assert len(summary) == 1
svg_bindings = [r for r in read(INV / 'svg-consumers.json')
                if r.get('course') == 'hsk2' and ':l02:' in r.get('assetId','')]
assert len(svg_bindings) == 13
svg_files = {r['assetFile'] for r in svg_bindings}
svg_rows = [r for r in inv if r['component'] == 'hsk2-illustration-svg' and r['file'] in svg_files]
semantic_bindings = [r for r in read(INV / 'semantic-consumers.json')
                     if r.get('course')=='hsk2' and ':l02:' in r.get('semanticId','')]
assert len(semantic_bindings)==39
assert len(svg_rows) == 13
for b in svg_bindings:
    assert sha(ROOT / b['assetFile']) == b['assetSHA256'], ('SVG drift', b['assetId'])
all_rows = local + canonical + summary + svg_rows
assert len(all_rows) == 524 and len({r['recordId'] for r in all_rows}) == 524
for r in local + canonical + summary:
    assert at(loaded[r['file']], r['pointer']) == r['value'], ('expected drift', r['recordId'])

# Mapping decisions below are explicit source/consumer decisions made after original-page
# source review and reading the current consumers; no fuzzy match or global replacement.
mapping = {}
def s(section):
    return by_section[section]

def direct(pointer, section, reason='Same printed Chinese unit; use the exact accepted Vietnamese unit.', field='viPrinted', relation='direct-official-unit'):
    mapping[(LESSON,pointer)] = ([s(section)], s(section)[field], relation, reason)

def composed(pointer, sections, new, reason):
    mapping[(LESSON,pointer)] = ([s(x) for x in sections], new, 'explicit-editorial-composition-of-official-units', reason)

direct('/title/vi','title')
mapping[(SUMMARY,summary[0]['pointer'])] = ([s('title')],s('title')['viPrinted'],'same-lesson-title-reuse','Course-index summary ID and Chinese title are identical to the lesson title; apply together if activated.')
for i in range(4):
    direct(f'/objectives/{i}/vi',f'goal{i+1}')
    direct(f'/activities/0/fields/{i}/prompt/vi',f'goal{i+1}','Self-assessment repeats exactly the same Chinese goal; same source, separate stored leaf.')
for i in range(2):
    sec=f'warmup{i+1}-instruction'
    direct(f'/warmup/{i}/title/vi',sec)
    direct(f'/activities/{i+1}/title/vi',sec,'Activity title repeats the printed instruction; keep both stored copies aligned.')
for i in range(4):
    n=i+1
    direct(f'/texts/{i}/title/vi',f'text{n}-heading')
    direct(f'/texts/{i}/context/vi',f'text{n}-setup')
    for j,line in enumerate(lesson['texts'][i]['lines']):
        sec=f'text{n}-line{j+1}' if n<4 else 'text4-paragraph'
        assert line['zh']==s(sec)['zhAnchor'], ('dialogue anchor mismatch',line['id'])
        direct(f'/texts/{i}/lines/{j}/vi',sec,
               'Complete identical Chinese paragraph; use the full printed Vietnamese paragraph with no sentence split and no invented speaker.' if n==4 else 'Identical Chinese line; Vietnamese body excludes the separately printed speaker label.')
    direct(f'/activities/{3+2*i}/note/vi',f'text{n}-listen-instruction')
    direct(f'/activities/{4+2*i}/note/vi',f'text{n}-role-instruction' if n<4 else 'text4-read-instruction')
    for ai in [3+2*i,4+2*i]:
        old_title=lesson['activities'][ai]['title']['vi']
        assert old_title.startswith(f'Bài khóa {n}: ')
        suffix=old_title.split(': ',1)[1]
        composed(f'/activities/{ai}/title/vi',[f'text{n}-heading'],s(f'text{n}-heading')['viPrinted']+': '+suffix,
                 'Complete official text heading reused as the title prefix; existing nghe/đọc activity descriptor is editorial and remains intact.')
for i in range(3):
    direct(f'/grammar/{i}/title/vi',f'grammar{i+1}-title')
    direct(f'/grammar/{i}/explanation/vi',f'grammar{i+1}-body',
           'Official body includes its printed Ví dụ: marker. Existing editorial elaboration must be retained separately and labelled editorial if activation adds a source body; do not call editorial elaboration a source quote.')
direct('/sections/0/blocks/0/vi','support-好','Use the exact support note; the old added 好打车 gloss is editorial and may remain separately labelled.')
direct('/sections/1/blocks/0/vi','support-天啊-到','Use the exact support note; the old added 不到二十块钱 explanation is editorial and may remain separately labelled.')
direct('/sections/1/blocks/1/vi','text3-photo-caption')
direct('/sections/3/blocks/0/vi','integrated2-instruction')
direct('/sections/4/blocks/0/vi','roleplay-instruction')
direct('/activities/25/fields/0/prompt/vi','roleplay-instruction','Identical Chinese roleplay instruction reused in editable-notes prompt; assessment remains open.')
direct('/activities/2/matrix/rowHeading/vi','warmup2-column1')
for i in range(2):direct(f'/activities/2/matrix/contextHeaders/{i}/vi',f'warmup2-column{i+2}')
# A translation exists elsewhere in this edition for exactly the same Chinese example.
assert lesson['grammar'][2]['examples'][0]['zh']==s('text3-line3')['zhAnchor']
direct('/grammar/2/examples/0/vi','text3-line3','Same complete Chinese sentence already has a printed translation in text 3; its source is printed 15, not a claim that Vietnamese was printed beside the grammar example.',relation='same-Chinese-official-translation-reuse')

word_source = {r['zhAnchor']:r for r in sr if re.fullmatch('word[0-9]+',r['section']) or r['section']=='proper-noun1'}
assert len(word_source)==17
for i,w in enumerate(lesson['vocabulary']):
    r=word_source[w['zh']]
    mapping[(LESSON,f'/vocabulary/{i}/vi')]=([r],r['viPrinted'],'same-printed-vocabulary-unit','Mapped by Chinese headword plus printed ordinal and source text, not local list index; 北京大学 is the inserted proper-noun row.')
for i,sense in canon_senses:
    r=word_source[sense['zh']]
    mapping[(LEXICON,f'/senses/{i}/vi')]=([r],r['viPrinted'],'canonical-single-source-vocabulary-reuse','Exactly one source word ID in this canonical sense, and it belongs to L2. Canonical VI is loaded reference metadata; current mixed cards display lesson-local word.vi.')
# Whole option leaf = the same Chinese word; option identity/order/answer unchanged.
for r in local:
    if re.fullmatch(r'/activities/\d+/fields/\d+/options/\d+/vi',r['pointer']) and r['chineseContext'] in word_source:
        wsrc=word_source[r['chineseContext']]
        mapping[(LESSON,r['pointer'])]=([wsrc],wsrc['viPrinted'],'same-headword-option-gloss-reuse','Only the Vietnamese glossary leaf changes. Chinese option, option order, saved values and correct answer remain sealed.')

composed('/warmup/0/items/0/vi',['word14','word13','word05','word01'],
         'A '+s('word14')['viPrinted']+'; B '+s('word13')['viPrinted']+'; C '+s('word05')['viPrinted']+'; D '+s('word01')['viPrinted'],
         'Each labelled Chinese item reuses its complete official glossary unit; A/B/C/D and separators are editorial composition, not printed Vietnamese on the warmup page.')
mapping[(LESSON,'/sections/0/title/vi')]=([by_id['hsk2-official-vi:l02:p011:support-heading']], 'Tiểu Ngữ giúp sức: 好打车','explicit-editorial-composition-of-official-units','Official printed section heading plus retained editorial topic label; heading chosen from printed 11 support block.')
mapping[(LESSON,'/sections/1/title/vi')]=([by_id['hsk2-official-vi:l02:p015:support-heading']], 'Tiểu Ngữ giúp sức: 天啊 và 到','explicit-editorial-composition-of-official-units','Official printed section heading plus retained editorial topic label; heading chosen from printed 15 support block.')
for ptr in ['/sections/2/title/vi','/activities/20/title/vi']:
    composed(ptr,['integrated-heading','integrated1-instruction'],s('integrated-heading')['viPrinted']+': '+s('integrated1-instruction')['viPrinted'],'Two printed Vietnamese units joined with an editorial colon; not one printed sentence.')
for ptr in ['/sections/4/title/vi','/activities/25/title/vi']:
    composed(ptr,['classroom-heading','roleplay-label'],s('classroom-heading')['viPrinted']+': '+s('roleplay-label')['viPrinted'],'Classroom heading and roleplay label share this site title; two official units, one editorial separator.')
composed('/sections/5/title/vi',['bonus-heading','bonus-video-caption'],s('bonus-heading')['viPrinted']+': '+s('bonus-video-caption')['viPrinted'],'Official column heading plus video caption; editorial colon.')
composed('/sections/5/blocks/0/vi',['bonus-video-caption'],s('bonus-video-caption')['viPrinted']+' (video 2-1).','Official caption with existing video identifier retained as editorial resource metadata; no video availability claim.')
composed('/sections/2/blocks/0/vi',['integrated1-instruction','word02','word12','word03','word05','word16'],
         s('integrated1-instruction')['viPrinted']+' A '+s('word02')['viPrinted']+'; B '+s('word12')['viPrinted']+'; C '+s('word03')['viPrinted']+'; D '+s('word05')['viPrinted']+'; E '+s('word16')['viPrinted']+'.',
         'Printed instruction plus glossary translations from this lesson, preserving labels and word identities. The Chinese exercise word list has no printed Vietnamese gloss at this location.')

def runtime_use(r):
    p=r['pointer']; f=r['file']
    if f==LEXICON:return {'kind':'loaded-canonical-reference','observed':'senseMap/canonicalWordPool use stable IDs for duplicate selection. main.ts mixed-card renders returned lesson-local word.vi/pos, not sense.vi.'}
    if f==SUMMARY:return {'kind':'current-visible-and-searchable','observed':'lessonSummaries feeds course home cards, selectors and progress summaries.'}
    if f in svg_files:return {'kind':'current-svg-accessibility-metadata','observed':'Immutable approved raw SVG desc node; distinct from outer HTML img.alt and zoom paragraph. Native assistive-technology reading was not tested here.'}
    if p.startswith('/warmup/'):
        return {'kind':'loaded-fallback-copy','observed':'Both warmup IDs have mapped activities. Current overview renders mapped activity title/fields/matrix; raw warmup title/items are retained fallback data.'}
    if re.fullmatch(r'/texts/\d+/title/vi',p):
        return {'kind':'loaded-with-current-renderer-override','observed':'For Chinese title 课文N, lesson-view.ts uses scoped dynamic copy Bài khóa N for h2 and scene tabs; replacing this leaf alone does not update those current labels.'}
    if '/questions/' in p and p.startswith('/texts/'):
        return {'kind':'loaded-fallback-question-copy','observed':'All four text IDs have mapped listening/reading activities. Current question renderer uses activity fields instead; raw question copies retained for fallback/history context.'}
    if '/practice/' in p and p.startswith('/grammar/'):
        return {'kind':'loaded-fallback-practice-copy','observed':'Every grammar practice is represented by a mapped activity; current practice cards render activity titles/fields, not raw grammar.practice.'}
    if '/appendixMetadata/' in p or p.startswith('/coverageReview/'):
        return {'kind':'loaded-source-metadata','observed':'No claim this metadata is currently shown verbatim. Original appendix provenance is sealed; pilot body source does not accept appendix language.'}
    if p.startswith('/illustrationManifest/'):
        role=p.split('/')[-2]
        return {'kind':'current-accessibility-or-caption' if role in ['alt','description','label'] else 'loaded-image-title-metadata','observed':{'alt':'outer HTML image and zoom image ALT','description':'zoom description paragraph','label':'figure caption','title':'loaded title metadata'}[role]}
    return {'kind':'current-primary-or-reference-display','observed':'Lesson renderer or homework/listening renderer consumes this leaf in its relevant view; source relation is classified separately.'}

def related_bindings(r):
    ids=[];p=r['pointer']
    if r['file'] in svg_files:
        ids=[b['semanticId'] for b in svg_bindings if b['assetFile']==r['file']]
    elif r['file']==LESSON:
        parts=p.split('/')[1:]
        if parts[0]=='activities':ids=[lesson['activities'][int(parts[1])]['id']]
        elif parts[0]=='illustrationManifest':ids=[lesson['illustrationManifest'][int(parts[1])]['id']]
        else:
            ref='objectives' if parts[0]=='objectives' else (lesson[parts[0]][int(parts[1])]['id'] if parts[0] in ['warmup','texts','grammar','sections'] else None)
            if ref:
                ids=[b['semanticId'] for b in semantic_bindings if b['kind']=='source-activity'
                     and (b['targetRef']==ref or b['targetRef'].startswith(ref+'/') or b['targetRef'].startswith(ref+':'))]
    assert all(i in {b['semanticId'] for b in semantic_bindings} for i in ids)
    return ids

def editor_type(r):
    p=r['pointer']
    if r['file'] in svg_files or p.startswith('/illustrationManifest/'):
        return 'editorial-auxiliary-image-accessibility', 'Custom auxiliary image has no identical printed Vietnamese description. Current Vietnamese describes the Chinese auxiliary-image anchor; keep the explicit custom/non-original-image label. Do not substitute a textbook setup sentence or photo caption for this ALT.'
    if p.startswith('/homework/') or p.startswith('/listening/'):
        return 'editorial-assessment-language', 'Course-authored question, feedback or translation exercise; no complete printed Vietnamese counterpart in accepted 104-unit pilot source. Retain answers/options/order/grading. Term consistency proposals below remain editorial.'
    if '/referenceAnswer/' in p:
        return 'editorial-reference-answer', 'Reference answer is course-authored, not a printed Vietnamese answer key; do not label it official or force a single open-response string.'
    if '/examples/' in p or '/practice/' in p or p.endswith('/structure'):
        return 'editorial-translation-of-printed-Chinese', 'The grammar source prints Chinese example/practice/structure, but no complete Vietnamese translation of this unit. Current Vietnamese is editorial unless exact Chinese has a separately identified official translation.'
    if p.startswith('/texts/') and '/questions/' in p or re.search('/activities/(3|4|5|6|7|8|9|10)/fields/',p):
        return 'editorial-translation-of-printed-Chinese-question', 'Chinese exercise question is textbook based; this complete Vietnamese question/answer option is not printed in the accepted pilot. Official source count cannot certify it.'
    if p.startswith('/activities/'):
        return 'editorial-activity-interface-or-translation', 'Current worksheet label, reference note or Chinese-only exercise translation has no complete printed Vietnamese counterpart; keep its instructional/reference purpose and assessment boundary.'
    if p.startswith('/warmup/') or p.startswith('/sections/'):
        return 'editorial-extension-or-Chinese-only-translation', 'Current supplementary hint, composite caption or translated Chinese-only task has no complete printed Vietnamese counterpart. Retain its editorial/resource status.'
    return 'unmapped-current-language', 'No complete accepted official unit identified; no automatic replacement is proposed.'

rows=[]
for r in all_rows:
    base={k:r.get(k) for k in ['recordId','semanticKey','component','itemId','ownerKey','file','pointer','value','chineseContext','visibility','learningFieldOccurrence','source']}
    base['oldExpected']=base.pop('value')
    base['rawFileSHA256']=sha(ROOT/r['file'])
    base['runtimeConsumer']=runtime_use(r)
    base['relatedSemanticBindingIds']=related_bindings(r)
    base['officialSourceIds']=[]
    base['newVietnamese']=None
    base['activation']='not-applied-awaiting-unified-schema-and-independent-comparison-review'
    p=r['pointer']; match=mapping.get((r['file'],p))
    if match:
        refs,new,relation,reason=match
        base.update(officialSourceIds=[x['sourceId'] for x in refs],newVietnamese=new,sourceRelation=relation,reason=reason,
                    decision='match-exact' if r['value']==new else 'propose-align-to-official',
                    differenceClass='none' if r['value']==new else 'wording-or-scope-difference-not-automatically-translation-error')
        if r['chineseContext']=='车站' and r['value']=='trạm xe, nhà ga':
            base['differenceClass']='broader-gloss-than-official-bus-context';base['reason']+=' Official gloss is bus-stop specific; old nhà ga adds an unprinted train-station meaning.'
        if ('/grammar/' in p and '/explanation/' in p) or p in ['/sections/0/blocks/0/vi','/sections/1/blocks/0/vi']:
            base['editorialPreservationRequired']={'oldEditorialVI':r['value'],'labelRequired':True,'policy':'Source body can be presented separately from the existing editorial explanation; do not silently erase useful editorial limits. Schema choice by root.'}
        if base['runtimeConsumer']['kind']=='loaded-with-current-renderer-override':
            base['activationBlocker']='Need course/lesson-scoped dynamic heading/tab copy projection; raw JSON update alone leaves current visible Bài khóa N unchanged.'
    elif p.endswith('/pos'):
        zh=r['chineseContext'];ref=word_source.get(zh)
        assert ref
        base.update(decision='keep-compatible-pos-label-sealed',sourceRelation='expanded-category-compatible-with-source',reason='Vietnamese expanded POS category is compatible with printed raw abbreviation/category. POS is sealed in this VI-only revision and is not replaced by a dictionary gloss.',officialSourceIds=[ref['sourceId']],newVietnamese=r['value'],officialPrintedPosLabels=ref.get('printedPosLabels',[]))
        if ref['section']=='proper-noun1':base['reason']='Printed proper-noun heading supports category danh từ riêng; no individual POS abbreviation is printed. Keep sealed current category, do not invent a printed row label.'
    elif '/appendixMetadata/starMeaning/' in p or p.startswith('/coverageReview/'):
        base.update(decision='pending-official-source-outside-pilot',sourceRelation='appendix-not-in-accepted-body-source',reason='The accepted source is printed 10–18 body only. This appendix/star legend requires its own official-edition appendix page review; existing old-source provenance remains intact.')
    else:
        category,reason=editor_type(r);base.update(decision='keep-editorial-no-complete-printed-counterpart',sourceRelation=category,reason=reason,newVietnamese=r['value'])
        # Explicit per-consumer terminology proposal after full Chinese-context review.
        # All selected old/new leaves are emitted; this is not a runtime regex transform.
        vi=r['value']; new=vi; refs=[]; rationale=[]
        if r['file']==LESSON and not p.startswith('/illustrationManifest/'):
            ctx=str(r['chineseContext'])
            if p.startswith('/homework/'):
                q=lesson['homework'][int(p.split('/')[2])]
                if q['part']=='ordering':
                    target=''.join(q['tokens'][i] for i in q['answer'])
                    base['websiteAssessmentChineseTarget']={'value':target,'basis':'existing tokens arranged by existing answer indices','questionId':q['id']}
                    ctx+=' '+target
                elif q['part']=='translationChoice':
                    target=q['options'][q['answer']]
                    base['websiteAssessmentChineseTarget']={'value':target,'basis':'existing correct Chinese option at existing answer index','questionId':q['id']}
                    ctx+=' '+target
                elif q['part']=='writing':
                    base['websiteAssessmentChineseTarget']={'value':None,'basis':'VI-only editorial writing prompt; no canonical Chinese target is stored','questionId':q['id']}
            if '车站' in ctx:
                if 'trạm xe buýt' in new:new=new.replace('trạm xe buýt','bến xe buýt');refs.append(s('word03'));rationale.append('compound 公交车站 bus-stop term, one buýt only')
                if 'Trạm xe' in new:new=new.replace('Trạm xe','Bến xe buýt');refs.append(s('word03'));rationale.append('车站 bus-stop terminology')
                if 'trạm xe' in new:new=new.replace('trạm xe','bến xe buýt');refs.append(s('word03'));rationale.append('车站 bus-stop terminology')
                # Only these three complete Chinese-anchored reference consumers use shortened trạm.
                if p in ['/sections/4/blocks/1/vi','/homework/20/prompt/vi','/homework/20/explanation/vi'] and 'trạm' in new:
                    new=new.replace('trạm','bến xe buýt');refs.append(s('word03'));rationale.append('short bus-stop reference in complete Chinese-anchored phrase')
            if p=='/homework/26/prompt/vi':
                assert q['part']=='writing' and vi=='Trạm xe hơi xa, hay là chúng ta đi taxi nhé.'
                new='Bến xe buýt hơi xa, hay là chúng ta đi taxi nhé.'
                refs.append(s('word03'));rationale.append('bus-stop term in VI-only L2 editorial writing prompt; no fabricated canonical Chinese target')
            if '白家月' in ctx and 'Gia Nguyệt' in new and 'Bạch Gia Nguyệt' not in new:
                new=new.replace('Gia Nguyệt','Bạch Gia Nguyệt');refs.append(s('text1-setup'));rationale.append('full Chinese name uses official Bạch Gia Nguyệt')
            if '陈天中' in ctx and 'Thiên Trung' in new and 'Trần Thiên Trung' not in new:
                new=new.replace('Thiên Trung','Trần Thiên Trung');refs.append(s('text4-setup'));rationale.append('full Chinese name uses official Trần Thiên Trung')
        if new!=vi:
            base.update(decision='propose-editorial-terminology-consistency',newVietnamese=new,officialSourceIds=list(dict.fromkeys(x['sourceId'] for x in refs)),
                        reason=reason+' Explicit limited terminology consistency: '+', '.join(dict.fromkeys(rationale))+'. Complete new sentence remains editorial, not a printed source quote.',differenceClass='editorial-terminology-variant')
    base['officialReferences']=[{k:by_id[i].get(k) for k in ['sourceId','pdfPage','printedPage','section','zhAnchor','zhAnchorPrintedPage','viPrinted','speakerZh','speakerVi','printedPosLabels']} for i in base['officialSourceIds']]
    base['revisionBoundary']={'VIOnly':True,'ChinesePinyinIdentityAnswersOptionsOrderSourceAndGradingSealed':True,'oldRawFilesUnchanged':True}
    rows.append(base)

used=collections.defaultdict(list)
for r in rows:
    for source_id in r['officialSourceIds']:used[source_id].append(r['recordId'])
source_ledger=[]
for r in sr:
    ids=used.get(r['sourceId'],[])
    entry={**r,'websiteOccurrenceIds':ids,'relationStatus':'mapped-to-explicit-consumers' if ids else 'source-without-current-direct-VI-leaf-mapping','websiteConsumersCount':len(ids)}
    if not ids:
        sec=r['section']
        if sec.startswith('running-') or sec in ['lesson-label','goals-heading','warmup-heading','grammar-heading','proper-nouns-heading'] or sec.endswith('vocabulary-heading'):
            entry['unmappedReason']='Printed page/header/column label has no corresponding lesson-local VI leaf. Current site uses shared editorial navigation/section labels; no global UI change is authorized by this one pilot.'
        elif sec.endswith('completion-instruction'):
            entry['unmappedReason']='Chinese practice is split into activity cards; no standalone 完成对话 VI consumer exists. Current card notes describe editorial reference answers. Do not overwrite those notes with this unrelated instruction.'
        elif sec=='roleplay-example-label':
            entry['unmappedReason']='The example body is retained, but there is no separate current label leaf for 小语的例子; no source-backed label should be invented as an existing consumer.'
        else:entry['unmappedReason']='No precise consumer leaf was found; pending scoped presentation decision, not counted as a website match.'
    source_ledger.append(entry)

# Shared code labels are separate current consumers, and need scoped dynamic handling.
ui_ids={'e0082d6c279282ebaeff0314','f14105e023cc4c38f94691dc','6a081c714ccc254d87499350','abc1c678d05ade95a9aa6094'}
ui=[r for r in inv if r['recordId'] in ui_ids]
assert len(ui)==4
for r in ui:
    r['comparisonDecision']='scoped-label-projection-required-before-full-visible-heading-alignment'
    r['officialSourceIds']=[s(f'text{i}-heading')['sourceId'] for i in range(1,5)]
    r['currentTemplateScope']='shared HSK2/3 UI; cannot replace globally based solely on H2L2 pilot'
    r['proposedScopedH2L2Labels']=[s(f'text{i}-heading')['viPrinted'] for i in range(1,5)]

legacy=[r for r in inv if r['component'] in ['legacy-hsk2-effective','legacy-hsk2-reviewed-practice'] and r.get('lesson')==2]
exclusions={'sameOrdinalLegacyLessonIsNotSameCourseUnit':True,'legacyLessonChineseTitle':'我每天六点起床。','excludedOccurrenceCount':len(legacy),'excludedOccurrences':[{'recordId':r['recordId'],'semanticKey':r['semanticKey'],'file':r['file'],'pointer':r['pointer'],'chineseContext':r['chineseContext'],'oldExpected':r['value'],'decision':'outside-pilot-unrelated-Chinese-lesson-no-mapping'} for r in legacy]}
assert len(legacy)==187

# An immutable assessment projection deliberately excludes VI copy, but preserves all
# Chinese, blank shapes, answer strings/indexes, field IDs and required/optional decisions.
def sealed(x):
    if isinstance(x,dict):return {k:sealed(v) for k,v in x.items() if k!='vi'}
    if isinstance(x,list):return [sealed(v) for v in x]
    return x
seal={'activities':sealed(lesson['activities']),'homework':sealed(lesson['homework']),'listening':sealed(lesson['listening']),'texts':sealed(lesson['texts']),'vocabulary':sealed(lesson['vocabulary']),'grammar':sealed(lesson['grammar'])}
seal_bytes=json.dumps(seal,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
input_paths=[SOURCE,ACCEPTANCE,INV/'inventory.json.gz',INV/'runtime-files.json',INV/'svg-consumers.json',INV/'semantic-consumers.json']+[ROOT/f for f in loaded]+[ROOT/f for f in sorted(svg_files)]+[ROOT/f for f in ['course-app/src/content.ts','course-app/src/lexicon.ts','course-app/src/lesson-view.ts','course-app/src/main.ts']]
inputs=[{'path':str(p.relative_to(ROOT)),'sha256':sha(p),'bytes':p.stat().st_size} for p in input_paths]
proposals=[r for r in rows if r['decision'].startswith('propose-')]
counts=collections.Counter(r['decision'] for r in rows)
report={'schemaVersion':1,'author':'qa_hsk1_05_08','createdAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'B10-H2L2-authored-comparison-proposals-awaiting-independent-review-not-activated','inventoryBaseline':{'sourceHEAD':'835e5bd41045655cc2724ba2ba59235064ff92cf','runtimeFiles':837,'occurrences':46463,'semanticBindings':4293,'currentHeadObserved':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'runtimeInputHashesEqualAcceptedInventory':True},'officialSource':{'transcriptionSHA256':sha(SOURCE),'acceptanceSHA256':sha(ACCEPTANCE),'pdfSHA256':source['officialPDFSHA256'],'sourceOccurrenceCount':104,'pdfPages':list(range(24,33)),'printedPages':list(range(10,19))},'counts':{'lessonOccurrences':476,'lessonLearningCandidates':458,'lessonOtherMetadata':18,'canonicalVIAndPOSOccurrences':34,'canonicalSenses':17,'canonicalCrossLessonSources':0,'courseIndexTitleOccurrences':1,'rawSVGNodes':13,'auxiliaryAssetBindings':13,'classifiedWebsiteOccurrences':524,'proposalOccurrences':len(proposals),'sourceUnitsWithConsumers':sum(bool(used.get(r['sourceId'])) for r in sr),'sourceUnitsWithoutDirectConsumer':sum(not bool(used.get(r['sourceId'])) for r in sr),'sharedDynamicUILabelOccurrences':4,'excludedUnrelatedLegacySameOrdinalOccurrences':187,'decisions':dict(counts)},'assessmentSealSHA256':hashlib.sha256(seal_bytes).hexdigest(),'activationAllowed':False,'runtimeMutations':0,'historicalVersionPolicy':'New display revision must retain raw lesson and old saved question/attempt snapshots; no guessed edition for unsnapshotted old attempts. These proposals are expected-value bound and do not mutate IDs or results.','unresolvedGates':['Independent website comparison review still required; source acceptance is separate.','Root must unify overlay schema and implement course/lesson-scoped display projection, including the four dynamic UI labels.','18 appendix/star metadata leaves require separate official appendix source review; not accepted by nine body pages.','Official grammar body and existing editorial explanation need separate labels/preservation decision.','Vietnamese speaker label display does not exist as a current VI leaf; do not change sealed Chinese speaker labels or invent a printed speaker for text4.'],'boundaries':['104 is a source occurrence count, not a website completion rate.','524 classified leaves include exact matches, proposals, editorial text, sealed compatible POS and pending outside-source metadata. This is not 524 official printed translations.','Editor-authored VN questions/answers/ALT are not certified as printed textbook Vietnamese.','Original source SHA/PDF offset remains unchanged; official source references have their own new edition hash and page identities.','This review does not run browser/native assistive technology or human/native language certification.','No runtime, raw lesson, lexicon, SVG, scoring, ASR evidence or deployment was changed.']}
write('comparison.json',{'schemaVersion':1,'status':report['status'],'inputBinding':inputs,'records':rows})
write('proposals.json',{'schemaVersion':1,'status':'author-proposals-not-applied','scope':{'courseId':lesson['courseId'],'lessonId':lesson['id']},'officialTranscriptionSHA256':sha(SOURCE),'inventorySourceHEAD':report['inventoryBaseline']['sourceHEAD'],'proposals':proposals})
write('source-to-consumer-ledger.json',{'schemaVersion':1,'sourceTranscriptionSHA256':sha(SOURCE),'records':source_ledger})
write('dynamic-ui-and-missing-presentations.json',{'schemaVersion':1,'sharedDynamicUI':ui,'speakerLabelBoundary':{'currentChineseSpeakerLabelsSealed':True,'text4PrintedSpeaker':False,'text4CurrentChineseSpeaker':'白家月','proposedVietnameseSpeakerLeaf':None,'decision':'do-not-invent-current-printed-VI-speaker-consumer'},'separateGrammarPracticeInstructions':[s(f'grammar{i}-completion-instruction') for i in range(1,4)]})
write('excluded-legacy-same-ordinal.json',exclusions)
write('svg-bindings-input.json',svg_bindings)
write('semantic-bindings-input.json',semantic_bindings)
write('assessment-seal.json',{'policy':'Comparison guard only; no assessment changes. Vietnamese display copy excluded; Chinese/options/order/answer/IDs/provenance/grading remain included.','sha256':hashlib.sha256(seal_bytes).hexdigest(),'projection':seal})
write('review-summary.json',report)
write('input-ledger.json',{'schemaVersion':1,'inputs':inputs})
print(json.dumps(report['counts'],ensure_ascii=False,indent=2))
