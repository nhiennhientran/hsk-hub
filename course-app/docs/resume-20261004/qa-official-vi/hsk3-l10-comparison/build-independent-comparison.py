"""Read-only comparison recipe. No runtime, source manuscript or inventory writes."""
from pathlib import Path
import collections
import gzip
import hashlib
import json
import re
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / 'hsk3-l10-source'
PREP = ROOT / 'course-app/docs/resume-20261004/official-vi-source-prep/hsk3-l10'
MAIN = 'course-app/content/hsk3/lesson-10.json'
LEX = 'course-app/content/hsk3-lexicon.json'
INDEX = 'course-app/content/course-index.json'
UI = 'course-app/src/lesson-view.ts'

def load(path):
    return json.loads((ROOT / path).read_text())

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def emit(name, obj):
    (HERE / name).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')

def norm_zh(text):
    return re.sub(r'[\s，。！？；：、,.!?;:“”"‘’\'（）()／/＋+]', '', text or '').replace('…', '')

def norm_vi(text):
    return re.sub(r'\s+', ' ', text).strip()

def pointer_value(value, pointer):
    for key in pointer.split('/')[1:]:
        key = key.replace('~1', '/').replace('~0', '~')
        value = value[int(key)] if isinstance(value, list) else value[key]
    return value

body = json.loads((PREP / 'body-vietnamese-transcription.json').read_text())['rows']
appendix = json.loads((PREP / 'appendix-lesson10-vietnamese-transcription.json').read_text())['rows']
source_rows = body + appendix
source_by_id = {r['recordId']: r for r in source_rows}
inventory_file = ROOT / 'course-app/docs/resume-20261004/vi-inventory/inventory.json.gz'
inventory = json.loads(gzip.decompress(inventory_file.read_bytes()))
lesson = load(MAIN)
lexicon = load(LEX)
index = load(INDEX)
source_checks = json.loads((SOURCE / 'input-verification.json').read_text())
assert source_checks['passed'] and source_checks['checksCount'] == 471
assert sha(SOURCE / 'freeze-manifest.json') == '50645728c3877979315bc0c50e105c2277e15913aad24a71d6ef602f97587731'
checks = []

def check(name, ok, **details):
    checks.append({'check': name, 'passed': bool(ok), **details})

files = {MAIN, LEX, INDEX, UI, 'course-app/src/content.ts', 'course-app/src/lexicon.ts', 'course-app/src/dom.ts'}
files.update('course-app/public/' + pic['file'] for pic in lesson['illustrationManifest'])
files.update(['course-app/content/official-vi-registry.json','course-app/src/official-vi-revisions.ts','course-app/docs/resume-20261004/vi-inventory/semantic-consumers.json', 'course-app/docs/resume-20261004/vi-inventory/inventory.json.gz'])
snapshot = [{'file': f, 'sha256': sha(ROOT / f), 'bytes': (ROOT / f).stat().st_size} for f in sorted(files)]
check('current HSK3 VI projection is explicitly inactive and raw consumer values remain current baseline',load('course-app/content/official-vi-registry.json')['courses']['hsk3'] is None)
check('source manuscript accepted independently and unchanged', sha(PREP / 'body-vietnamese-transcription.json') == 'e5404cc8e0acd70af21997e0599edacab6eb290b22dc55ba91b25ee8d25d1b4e' and sha(PREP / 'appendix-lesson10-vietnamese-transcription.json') == 'ff9d2f2ad097c4c46696dcf95f3e55e431c4f050c006ee3ff4073c6d4af00aa8')
check('unchanged historical lesson input', sha(ROOT / MAIN) == 'b7f106e2ece82f87921a16bf87b4dac345f9d5366c75fee0394da1b7597de828')

word_locus = {sid: r for r in body if r['role'] == 'vocabulary-gloss' for sid in r['sourceIDs']}
words = {w['id']: w for w in lesson['vocabulary']}
printed_pos = {'dt.':'danh từ','tt.':'tính từ','đgt.':'động từ','giới.':'giới từ','lượng.':'lượng từ','phó.':'phó từ'}
# These are editorial POS-specific renderings of one combined printed entry,
# never a claim that the publisher printed a separate line for each stable sense.
sense_gloss = {4:'rõ ràng',5:'hiểu rõ',13:'yêu cầu',14:'đòi hỏi',15:'kém',16:'thiếu',24:'hiểu',25:'rõ ràng',32:'chăm chỉ',33:'nỗ lực'}

def body_row(page, ordinal):
    return source_by_id[f'hsk3-official-vi-20261004:l10:pdf{page}:vn{ordinal:02d}']

def ids_of(rows):
    return [r['recordId'] for r in rows]

def base(r):
    return {'targetRecordId':r['recordId'],'file':r['file'],'locationKind':'RFC6901 JSON pointer','field':r.get('pointer'),'itemId':r.get('itemId'),'oldValue':r['value'],'chineseContext':r.get('chineseContext'),'consumerBinding':{'inventorySemanticKey':r['semanticKey'],'consumers':r.get('consumers',[]),'ownerKey':r.get('ownerKey'),'visibility':r.get('visibility'),'sourceRelation':r.get('sourceRelation')},'sourceIDs':[],'expected':None,'newValue':r['value'],'decision':'no-source','rationale':'The scoped official pages do not print a Vietnamese counterpart for this Chinese-only question, example, option or derived field. Retain current editorial translation provisionally; this is not an official match or semantic certification.','acceptance':'independent comparison proposal; root integration/acceptance pending','productionEdit':False}

def attach(item, rows, expected=None, new=None, why=None):
    item['sourceIDs'] = ids_of(rows)
    item['sourceEvidence'] = [{'pdfPage':r['pdfPage'],'printedPage':r['printedPage'],'recordId':r['recordId'],'printedVietnamese':r['printedVietnamese'],'sourcePDFSHA256':'7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951'} for r in rows]
    item['expected'] = expected if expected is not None else rows[0]['printedVietnamese']
    item['newValue'] = new if new is not None else item['expected']
    item['decision'] = 'match' if norm_vi(item['oldValue']) == norm_vi(item['newValue']) else 'variant'
    item['rationale'] = why or 'The same Chinese/source anchor has a printed Vietnamese counterpart. Current wording is a translation or presentation variant; proposed display wording follows the official edition.'

manual = {
 '/grammar/0/explanation/vi':([body_row(100,5)], body_row(100,5)['printedVietnamese'].split(' Cấu trúc cơ bản:')[0]),
 '/grammar/1/explanation/vi':([body_row(102,i)for i in range(2,6)], '\n'.join(body_row(102,i)['printedVietnamese'] for i in range(2,6))),
 '/grammar/2/explanation/vi':([body_row(103,12)], body_row(103,12)['printedVietnamese'].split(' Cấu trúc cơ bản:')[0]),
 '/grammarSourceExplanations/0/explanation/vi':([body_row(100,5)],None),
 '/grammarSourceExplanations/1/explanation/vi':([body_row(102,2)],None),
 '/grammarSourceExplanations/2/explanation/vi':([body_row(103,12)],None),
 '/grammarPresentations/0/groups/0/explanation/vi':([body_row(102,3)],None),
 '/grammarPresentations/0/groups/1/explanation/vi':([body_row(102,4)],None),
 '/grammarPresentations/0/groups/2/explanation/vi':([body_row(102,5)],None),
 '/sections/0/title/vi':([body_row(105,4),body_row(105,5)],'Bài tập tổng hợp: Chọn từ thích hợp điền vào chỗ trống.'),
 '/sections/3/title/vi':([body_row(106,2),body_row(106,3)],'Hoạt động trên lớp: Hoạt động theo nhóm nhiều người'),
 '/activities/25/title/vi':([body_row(106,2),body_row(106,3)],'Hoạt động trên lớp: Hoạt động theo nhóm nhiều người'),
 '/sections/4/title/vi':([body_row(106,5),body_row(106,6)],'Món quà của Tiểu Ngữ: Giáo dục bắt buộc ở Trung Quốc'),
}

def word_decision(item, sid, pos_field=False, raw_pos=False):
    src = word_locus[sid]
    w = words[sid]
    if raw_pos:
        attach(item,[src],src['printedPOSRaw'],why='Literal original POS metadata matches the independently read source. Immutable provenance is retained.')
    elif pos_field:
        attach(item,[src],w['pos'],why='Full printed POS set is linked to the unchanged separate sense ID. Runtime expands the abbreviation to its Vietnamese category name; no new POS is inferred.')
        item['decision'] = 'match-normalized-POS'
    elif sid.endswith('word30'):
        attach(item,[src,source_by_id['hsk3-official-vi-20261004:l10:appendix:text4:line2']],src['printedVietnamese'],'năm sau nữa')
        item.update({'decision':'official-book-erratum','resolution':'retain-correct-current','currentCorrect':'năm sau nữa','rationale':'The vocabulary box prints năm kia, năm sau, while this lesson’s official contextual appendix prints năm sau nữa. Modern 後年 is the year after next; do not activate the erroneous vocabulary-box wording. Root final acceptance remains pending.','externalPrimaryEvidence':{'url':'https://dict.revised.moe.edu.tw/dictView.jsp?ID=81393&la=0&powerMode=0','retrievedByIndependentReviewer':True,'webReference':'turn19view0','definitionSense':1,'shortDefinition':'明年的次年','historicalSecondSenseNotUsedForModernLesson':True}})
    else:
        n = int(sid[-2:]); expected = sense_gloss.get(n,src['printedVietnamese'])
        attach(item,[src],expected)
        if n in sense_gloss:
            item['printedWholeEntryGloss']=src['printedVietnamese']
            item['derivedSenseRendering']=True
            item['rationale']='Proposed POS-specific display is drawn from the existing POS category and the combined official entry. The whole printed gloss is preserved in evidence; the split is an explicit editorial proposal, not a new printed source locus. Stable sense ID/POS stay unchanged.'

main_inventory = [r for r in inventory if r['file'] == MAIN]
check('all 692 inventory candidates resolve to actual unchanged JSON', len(main_inventory)==692 and all(pointer_value(lesson,r['pointer'])==r['value'] for r in main_inventory))
explicit = [r for r in main_inventory if r['sourceKind']=='explicit-language-field']
check('all 537 explicit VI leaves enumerated', len(explicit)==537)
comparison=[]
for r in explicit:
    item=base(r);ptr=r['pointer'];zh=r.get('chineseContext') or ''
    if ptr.startswith('/vocabulary/'):
        word_decision(item,lesson['vocabulary'][int(ptr.split('/')[2])]['id'])
    elif ptr in manual:
        rows,expected=manual[ptr];attach(item,rows,expected)
        if len(rows)>1:item['composition']='explicit combination of separate printed loci; no claim of one literal printed sentence'
    elif ptr.startswith('/texts/') and '/lines/' in ptr:
        t,ln=int(ptr.split('/')[2]),int(ptr.split('/')[4]);line=lesson['texts'][t]['lines'][ln]
        rows=[s for s in appendix if line['id']in s['sourceIDs']];assert len(rows)==1
        attach(item,rows)
        if rows[0]['role']=='printed-ellipsis':item['decision']='punctuation-variant' if item['oldValue']!=item['newValue'] else 'match';item['languageText']=False
    elif ptr in ['/texts/1/questions/1/vi','/activities/5/fields/1/prompt/vi']:
        src=body_row(100,10);new=item['oldValue'].replace('“về”','“về, liên quan đến”');attach(item,[src],src['printedVietnamese'],new)
        item['sourceSpanOnly']='Inline 关于 gloss only. The surrounding question translation is editorial because the official page prints the question in Chinese only.'
    elif ptr=='/activities/10/note/vi':
        rows=[body_row(105,2),body_row(105,3)];tail=item['oldValue'].split(' Biên tập viên ',1)[1];attach(item,rows,' '.join(s['printedVietnamese']for s in rows),' '.join(s['printedVietnamese']for s in rows)+' Biên tập viên '+tail)
        item['sourceSpanOnly']='Two printed instructions replace only the existing instruction prefix. Editor-authored record/privacy/reference-answer tail remains byte-for-byte.'
    elif re.fullmatch(r'/activities/(4|6|8)/note/vi',ptr):
        i=int(ptr.split('/')[2]);src=body_row({4:100,6:101,8:103}[i],{4:2,6:12,8:9}[i]);tail=item['oldValue'].split(' Câu tham khảo ',1)[1];attach(item,[src],src['printedVietnamese'],src['printedVietnamese']+' Câu tham khảo '+tail);item['sourceSpanOnly']='Printed reading instruction prefix only; editor-authored reference-answer tail preserved.'
    elif ptr=='/activities/25/note/vi':
        src=body_row(106,4);tail=item['oldValue'].split(' Các ô ghi chép ',1)[1];attach(item,[src],src['printedVietnamese'],src['printedVietnamese']+' Các ô ghi chép '+tail);item['sourceSpanOnly']='Printed classroom task prefix only; editor-authored record/privacy/assessment tail preserved.'
    elif re.fullmatch(r'/activities/(22|23|24)/note/vi',ptr):
        src=body_row(105,6);old='Dùng từ và cấu trúc mới của bài để mô tả hình.';assert item['oldValue'].startswith(old);attach(item,[src],src['printedVietnamese'],src['printedVietnamese']+item['oldValue'][len(old):]);item['sourceSpanOnly']='Printed picture-task instruction prefix only; Chinese-only dialogue and editor-authored reference-answer tail are not labelled as publisher Vietnamese.'
    elif re.fullmatch(r'/activities/(11|12|13|14|15|16|17|18|19)/note/vi',ptr):
        i=int(ptr.split('/')[2]);src=body_row(100,6) if i<=13 else body_row(102,6)if i<=16 else body_row(104,2);attach(item,[src],src['printedVietnamese'],item['oldValue']);item['decision']='match-with-editorial-tail';item['sourceSpanOnly']='Only printed Hoàn thành câu. matches; editorial tail is retained and separately identified.'
    else:
        found=[s for s in body if s['role']!='vocabulary-gloss' and norm_zh(s['chineseAnchor'])==norm_zh(zh)]
        if found:
            same=[s for s in found if s['pdfPage']==(r.get('source')or{}).get('pdfPage')];found=same or found
            attach(item,found)
            if ptr=='/grammar/2/examples/0/vi':
                item['derivedSourceReuse']=True
                item['rationale']='This Chinese-only grammar example repeats the lesson-title Chinese sentence. Proposed Vietnamese reuses the printed title wording, where teacher Cô Lý addresses the student as em and refers to herself as cô. This is explicit contextual reuse, not a claim that the grammar example prints a Vietnamese translation.'
            if ptr=='/texts/2/context/vi':
                item.update({'decision':'official-source-context-ambiguity','newValue':item['oldValue'],'resolution':'retain current pending focused root review','rationale':'The printed VN says hỏi bài bạn học, which can suggest asking the classmate; Chinese context and the teacher-student dialogue show Tiểu Tuyết and the classmate asking teacher Lý. Current Vietnamese says the two ask questions in cô Lý’s office. Faithful source transcription is accepted, but do not silently treat this semantic tension as an ordinary variant.'})
        elif ptr.startswith('/activities/') and ptr.endswith('/title/vi') and ': bài tập sau khi 'in item['oldValue']:
            scene=int(re.search(r'Bài khóa (\d)',item['oldValue']).group(1));src=next(s for s in body if s['role']=='section-heading' and s['chineseAnchor']==f'课文{scene}');attach(item,[src],src['printedVietnamese'],item['oldValue'].replace(f'Bài khóa {scene}',src['printedVietnamese']));item['sourceSpanOnly']='Printed scene heading prefix; after-listening/reading activity label is editorial.'
        elif ptr.startswith('/activities/') and ptr.endswith('/title/vi') and item['oldValue'].startswith('Chọn từ điền chỗ trống '):
            src=body_row(105,5);span=item['oldValue'].split('(',1)[1];new=src['printedVietnamese'].rstrip('.')+' ('+span;attach(item,[src],src['printedVietnamese'],new);item['sourceSpanOnly']='Instruction wording aligned; the original ordinal range is an editor-provided navigation label and is preserved.'
        elif (r.get('source')or{}).get('provenance')=='supplemental' or ptr.startswith(('/homework/','/listening/','/illustrationManifest/')) or '/referenceAnswer/'in ptr or ptr.endswith('/note/vi'):
            item['decision']='editorial';item['rationale']='Explicit editor-authored explanation, assessment/reference/privacy/availability copy or illustration description. No literal Vietnamese counterpart in the 119 accepted loci; preserve role and current value pending root editorial acceptance, without inventing a printed source ID.'
    item['currentValueSHA256']=hashlib.sha256(item['oldValue'].encode()).hexdigest()
    comparison.append(item)

# All POS leaves and all literal printed-POS metadata are inspected, including ASCII
# abbreviations that a generic Vietnamese accent detector does not identify.
for i,w in enumerate(lesson['vocabulary']):
    r=next(r for r in main_inventory if r['pointer']==f'/vocabulary/{i}/pos');item=base(r);word_decision(item,w['id'],pos_field=True);comparison.append(item)
    for j,e in enumerate(w.get('additionalSourceEvidence',[])):
        v=e.get('vocabulary')
        if not v:continue
        ptr=f'/vocabulary/{i}/additionalSourceEvidence/{j}/vocabulary/printedPOSRaw';value=pointer_value(lesson,ptr)
        item={'targetRecordId':'literal-pos:'+w['id'],'file':MAIN,'locationKind':'RFC6901 JSON pointer','field':ptr,'itemId':w['id'],'oldValue':value,'newValue':value,'consumerBinding':{'role':'additional official source raw POS evidence; immutable provenance metadata'},'acceptance':'retain original evidence; no production edit','productionEdit':False};word_decision(item,w['id'],raw_pos=True);comparison.append(item)

lexical=[]
for i,s in enumerate(lexicon['senses']):
    refs=[ref for ref in s['sources'] if ref['lessonId']==lesson['id']]
    if not refs:continue
    check('canonical sense has exactly one L10 word ref and agrees with unchanged local word', len(refs)==1 and s['zh']==words[refs[0]['wordId']]['zh'] and s['pos']==words[refs[0]['wordId']]['pos'] and s['vi']==words[refs[0]['wordId']]['vi'], senseID=s['id'])
    for key in ['vi','pos']:
        r=next(r for r in inventory if r['file']==LEX and r['pointer']==f'/senses/{i}/{key}');item=base(r);word_decision(item,refs[0]['wordId'],pos_field=key=='pos');item['consumerBinding'].update({'wordRefs':refs,'canonicalRole':'canonical duplicate identity/metadata; current canonicalWordPool returns the lesson-local Word value, not an independent translation'})
        lexical.append(item)
for i,s in enumerate(index):
    if s['id']==lesson['id']:
        r=next(r for r in inventory if r['file']==INDEX and r['pointer']==f'/{i}/title/vi');item=base(r);attach(item,[body_row(98,2)]);item['decision']='official-wording-variant';item['rationale']='The official title uses teacher-to-student em/cô: teacher Cô Lý addresses the student as em and refers to herself as cô. Current bạn/tôi is neutral role wording. Align the course list with the same official-context title proposal without reversing the speaking direction or calling neutrality a mistranslation.';comparison.append(item)
title=next(x for x in comparison if x['file']==MAIN and x['field']=='/title/vi');title['decision']='official-wording-variant';title['rationale']='Teacher Cô Lý speaks to the student: em is the student being addressed, cô is the teacher referring to herself. Current bạn/tôi is a neutral role variant; align with the official contextual em/cô wording, not a reversed speaker direction.'

ui=[]
ui_bytes=(ROOT/UI).read_text()
for r in inventory:
    if r['file']!=UI:continue
    item=base(r);item.update({'locationKind':'TypeScript AST literal/template; not a JSON data pointer','field':None,'astPointer':r['astPath'],'codeRange':r['range'],'decision':'editorial','rationale':'Shared renderer controls/status/navigation/accessibility text; no literal chapter source counterpart. This record enumerates the actual code branch, not a claim that every conditional branch is activated by this lesson.'})
    check('actual renderer literal location remains valid',len(ui_bytes)>r['range']['end'],targetRecordId=r['recordId'])
    if r['recordId']in ['e0082d6c279282ebaeff0314','f14105e023cc4c38f94691dc','6a081c714ccc254d87499350']:
        rows=[s for s in body if s['role']=='section-heading' and re.fullmatch(r'课文[1-4]',s['chineseAnchor'])];attach(item,rows,'Bài khoá'+(' ${expression}'if '${expression}'in item['oldValue']else ''));item['sourceSpanOnly']='Generic title label, instantiated for source scene ordinals1–4. Actual h2 code overrides text.title.vi when the Chinese heading is 课文N; data-only replacement would miss this display.';item['consumerBinding']['globalChangeRequiresOtherCourseReview']=True
    elif r['recordId']=='1ea8b7af59777839287bc3ff':
        rows=[s for s in body if s['printedVietnamese']=='Bài 10'];attach(item,rows,'Bài ${expression}',item['oldValue']);item['decision']='match-normalized-heading-style';item['rationale']='Hero instantiates BÀI 10 from the real lesson number. Printed Bài 10 differs only in intentional uppercase heading style; preserve that style and do not manufacture a missing Vietnamese lesson-number field.'
    ui.append(item)

check('85 original lesson-renderer literal candidates included',len(ui)==85)
supplement=json.loads((HERE/'renderer-object-coverage-supplement.json').read_text())
check('bounded same-source Property.value counterexamples supplement exactly four real candidates',supplement['missingCount']==4 and all(r['sameBytesAsOriginalSnapshot']for r in supplement['files']))
ui.extend(supplement['rows'])

svg=[]
for pic in lesson['illustrationManifest']:
    file='course-app/public/'+pic['file'];root=ET.fromstring((ROOT/file).read_bytes());desc=next(e for e in root.iter()if e.tag.split('}')[-1]=='desc');full=''.join(desc.itertext());r=next(r for r in inventory if r['file']==file);check('SVG full desc text equals actual XML',full==r['value'],file=file)
    item=base(r);item.update({'locationKind':'XML element path; not an RFC6901 JSON pointer','field':None,'xmlElementPath':r['pointer'],'decision':'editorial','rationale':'Custom vector asset description, including its English suffix, has no printed official VN counterpart. Its Vietnamese agrees with the corresponding JSON ALT/description; keep separate outer IMG ALT and SVG source accessibility consumers. No native accessibility exposure certification.'});item['consumerBinding'].update({'manifestID':pic['id'],'outerImageAltField':f"/illustrationManifest/{lesson['illustrationManifest'].index(pic)}/alt/vi",'svgFullDescription':full});svg.append(item)

bindings=load('course-app/docs/resume-20261004/vi-inventory/semantic-consumers.json')
activity_bindings=[x for x in bindings if x.get('kind')=='source-activity' and x.get('semanticId')in {a['id']for a in lesson['activities']}]
check('all 26 source activities have real consumer bindings',len(activity_bindings)==26)
for x in activity_bindings:
    a=next(a for a in lesson['activities']if a['id']==x['semanticId']);check('activity targetRef and field target refs preserved',x['targetRef']==a['targetRef'] and x['fieldIds']==[f['id']for f in a['fields']] and x['sourceColumnBinding']['fieldTargetRefs']==[{'fieldId':f['id'],'targetRef':f.get('targetRef')}for f in a['fields']],semanticID=a['id'])

annotated_ids={x['targetRecordId']for x in comparison+lexical+ui+svg}
annotated_json_fields={x['field']for x in comparison if x['file']==MAIN}
candidate_partition=[]
for r in main_inventory:
    if r['recordId']in annotated_ids or r['pointer']in annotated_json_fields:continue
    ptr=r['pointer'];category='pinyin / Chinese / source metadata; not a Vietnamese translation' if ptr.split('/')[-1]in ['printedPinyin','normalizedPinyin','printedPOSRaw','zh'] else 'editorial assessment focus / merge metadata; not a printed VN counterpart'
    candidate_partition.append({'targetRecordId':r['recordId'],'file':MAIN,'field':ptr,'currentValue':r['value'],'decision':'not-VI-translation'if category.startswith('pinyin')else 'editorial-metadata','rationale':category,'sourceIDs':[],'newValue':r['value'],'productionEdit':False})
# Existing source metadata stays immutable; literal-POS supplemental rows cover any
# source raw labels omitted by the language candidate scan.
check('537VI +33runtimePOS +33sourceRawPOS own full RFC pointers unique',len([x for x in comparison if x['file']==MAIN])==603 and len({x['field']for x in comparison if x['file']==MAIN})==603)
check('canonical 33 senses /66 VI+POS fields complete',len(lexical)==66)
check('89 actual renderer/helper literal candidates included without duplicate identity',len(ui)==89 and len({x['targetRecordId']for x in ui})==89)
check('14 SVG descriptions included separately from JSON alt',len(svg)==14)
source_coverage=[]
for s in source_rows:
    consumers=[{'file':x['file'],'field':x.get('field'),'astPointer':x.get('astPointer'),'targetRecordId':x['targetRecordId'],'decision':x['decision'],'sourceSpanOnly':x.get('sourceSpanOnly')}for x in comparison+lexical+ui+svg if s['recordId']in x.get('sourceIDs',[])]
    source_coverage.append({'sourceID':s['recordId'],'role':s['role'],'sourceVietnamese':s['printedVietnamese'],'consumerCount':len(consumers),'consumers':consumers,'unconsumedReason':None if consumers else 'Printed running/section heading, repeated label or instruction has no exact active data field. It is source-only; not a missing target translation or a website match.'})
emit('field-comparisons.json',comparison+lexical)
emit('renderer-comparisons.json',ui)
emit('svg-comparisons.json',svg)
emit('non-translation-candidate-partition.json',candidate_partition)
emit('source-locus-consumer-coverage.json',source_coverage)
emit('source-activity-consumer-bindings.json',activity_bindings)
emit('runtime-input-snapshot.json',{'gitHEADAtComparison':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'inventorySHA256':sha(inventory_file),'sourceFreezeSHA256':sha(SOURCE/'freeze-manifest.json'),'inputs':snapshot})
all_items=comparison+lexical+ui+svg
for item in all_items:
    item['oldValueRole']='actual unchanged runtime baseline; use this string for a guarded replacement precondition'
    item['expectedSourceWording']=item['expected']
    item['expectedEffectiveValue']=item['newValue']
    item['expectedRole']='source-based wording for the matched locus/span, not the old baseline; full effective target is expectedEffectiveValue/newValue'
# Re-emit after these explicit guard/value roles are set. Prefix-only source text
# and the erroneous printed glossary must never overwrite the whole consumer.
emit('field-comparisons.json',comparison+lexical)
emit('renderer-comparisons.json',ui)
emit('svg-comparisons.json',svg)
emit('verification.json',{'passed':all(c['passed']for c in checks),'checksCount':len(checks),'checks':checks})
emit('summary.json',{'status':'independent comparison proposals; root schema integration/acceptance pending','sourceRows':119,'sourceLociWithMappedConsumer':sum(bool(s['consumerCount'])for s in source_coverage),'sourceOnlyLoci':sum(not s['consumerCount']for s in source_coverage),'jsonFieldComparisonRows':len(comparison+lexical),'localVILeaves':537,'localRuntimePOS':33,'localPrintedPOSMetadata':33,'canonicalSenses':33,'canonicalVIAndPOSRows':66,'courseIndexTitleRows':1,'rendererLiteralRows':len(ui),'originalRendererLiteralRows':85,'sameSourceASTSupplementRows':4,'svgFullDescriptionRows':14,'nonTranslationCandidateRows':len(candidate_partition),'sourceActivities':26,'decisionCounts':dict(collections.Counter(x['decision']for x in all_items)),'proposedChangedFieldRows':sum(x['oldValue']!=x['newValue']for x in all_items),'runtimeEdits':0,'deployment':False,'limits':['All scoped lesson data VI/POS fields and actual renderer/helper candidates are classified; this is not general global shell/editorial translation certification. Four same-source code-object AST omissions are independently supplemented. Main shell source changed after the frozen835 inventory and is outside this chapter comparison.','No-source/editorial rows do not certify publisher wording or general translation correctness.','Source-only printed headers do not manufacture runtime fields.','Vocabulary sense-specific renderings are explicit derived proposals; no sense identity, answer key or historical record changes.','One confirmed publisher vocabulary erratum and one scene-context ambiguity retain correct current text pending root final acceptance.','Generic renderer title changes need course-wide review; this chapter comparison does not authorize a global production edit.']})
print(json.dumps({'verificationPassed':all(c['passed']for c in checks),'checks':len(checks),'failed':[c for c in checks if not c['passed']],'decisions':collections.Counter(x['decision']for x in all_items)},ensure_ascii=False))
assert all(c['passed']for c in checks)
