#!/usr/bin/env python3
"""Structural, glyph-inventory, exact source/raster checks; not independent VI acceptance."""
import collections
import hashlib
import json
import pathlib
import unicodedata
from PIL import Image

HERE=pathlib.Path(__file__).resolve().parent
source=json.loads((HERE/'source.json').read_text())
manifest=json.loads((HERE/'render-manifest.json').read_text())
checks=[]


def check(name,condition):
    checks.append({'id':name,'passed':bool(condition)})
    assert condition,name


def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()


check('original-official-PDF-hash',sha(pathlib.Path('/workspace/scratch/28b55072841a/upload/HSK1  (3.0).pdf'))==source['sourcePDF']['sha256']==manifest['sourcePDFSHA256'])
check('author-only-no-independent-approval',source['independentReview']=={'status':'pending','reviewer':None})
check('no-runtime-or-website-action',source['activation']==source['runtimeWrites']==source['websiteComparison']==0 and source['trustedProof'] is False)
body=source['occurrences'];appendix=source['appendixOccurrences'];rows=body+appendix
ids=[r['occurrenceId'] for r in rows]
check('unique-source-IDs-in-this-pack',len(ids)==len(set(ids)))
check('actual-body-scope',source['pdfPages']==list(range(111,119)) and source['printedPages']==[f'{n:03d}' for n in range(95,103)])
check('actual-appendix-scope',source['appendixPDFPages']==list(range(138,145)))
check('body-coverage-count',source['coverage']['bodyOccurrenceCount']==len(body))
check('body-category-counts',source['coverage']['byBodyCategory']==dict(collections.Counter(r['category'] for r in body)))
check('chapter-next-boundary',source['coverage']['chapterBoundary']['nextLessonStartActuallyObserved']=={'pdfPage':119,'printedPage':'103','lesson':14})
check('body-ordinary-word-count',len(source['wordTableRows'])==source['coverage']['ordinaryWordRows']==20)
check('body-word-numbers-contiguous',sorted(w['printOrdinal'] for w in source['wordTableRows'])==list(range(1,21)))
check('appendix-no-false-VI-glosses',all(w['viGlossPrinted'] is False for w in source['appendixRelevantIndexRows']))
check('appendix-shared-not-new-lesson-words',all(r['sharedPhysicalOccurrence'] is True for r in appendix))
check('dialogue-role-line-count',len([r for r in body if r['category']=='dialogue-translation'])==14)
map_rows={r['occurrenceId']:r for r in rows}
all_codepoints={}
word_codepoints=[]
for row in rows:
    check(row['occurrenceId']+':fragment-whole-join',row['viText']==' '.join(' '.join(f['lineTexts']) for f in row['fragments']))
    check(row['occurrenceId']+':physical-source-page-in-scope',row['pdfPage'] in source['pdfPages']+source['appendixPDFPages'])
    check(row['occurrenceId']+':render-ref-real',(HERE/row['renderRef']).is_file())
    check(row['occurrenceId']+':no-corrupt-or-invisible-controls',all(ch not in '\ufffd\x00\u200b\u200c\u200d\ufeff' and unicodedata.category(ch) not in ['Cc','Cs'] for ch in row['viText']))
    check(row['occurrenceId']+':author-encoded-NFC-no-auto-rewrite',unicodedata.normalize('NFC',row['viText'])==row['viText'])
    all_codepoints[row['occurrenceId']]={'text':row['viText'],'utf16Length':len(row['viText'].encode('utf-16-le'))//2,'codepoints':[f'U+{ord(ch):04X}' for ch in row['viText']]}
    if row['category']=='dialogue-translation':
        check(row['occurrenceId']+':whole-printed-role-prefix',row['viText'].startswith(row['speakerViPrinted']+': '))
        check(row['occurrenceId']+':Chinese-paired-page-real',row['zhAnchorPDFPage'] in source['pdfPages'] and row['zhAnchorPrintedPage']==f'{row["zhAnchorPDFPage"]-16:03d}')
for word in source['wordTableRows']:
    gloss=map_rows[word['glossOccurrenceId']]
    check('word'+str(word['printOrdinal'])+':gloss-link',gloss['zhContext']==word['zhPrinted'] and gloss['printOrdinal']==word['printOrdinal'])
    if word['rawPosLabel'] is None:
        check('word5:printed-POS-blank-not-invented',word['zhPrinted']=='打电话' and word['printOrdinal']==5 and word['posOccurrenceId'] is None)
    else:
        pos=map_rows[word['posOccurrenceId']]
        check('word'+str(word['printOrdinal'])+':printed-POS-link',pos['zhContext']==word['zhPrinted'] and pos['viText']==word['rawPosLabel'] and pos['printOrdinal']==word['printOrdinal'])
    for field in ['zhPrinted','pinyinPrinted','rawPosLabel']:
        value=word[field]
        if value is None:
            word_codepoints.append({'printOrdinal':word['printOrdinal'],'field':field,'text':None,'codepoints':[],'qualification':'printed-blank-not-a-VI-occurrence'})
            continue
        check('word'+str(word['printOrdinal'])+':'+field+':NFC-no-invisible-corruption',unicodedata.normalize('NFC',value)==value and all(ch not in '\ufffd\x00\u200b\ufeff' and unicodedata.category(ch) not in ['Cc','Cs'] for ch in value))
        word_codepoints.append({'printOrdinal':word['printOrdinal'],'field':field,'text':value,'codepoints':[f'U+{ord(ch):04X}' for ch in value]})
for image in manifest['pages']:
    p=HERE/image['file']
    check('png-'+str(image['pdfPage'])+':byte-hash',p.stat().st_size==image['bytes'] and sha(p)==image['sha256'])
    with Image.open(p) as im:im.verify()
    check('png-'+str(image['pdfPage'])+':valid-image',True)
check('whole-15-page-raster-scope',sorted(p['pdfPage'] for p in manifest['pages'])==source['pdfPages']+source['appendixPDFPages'])
check('pronoun-versus-noun-raw-POS',map_rows['hsk1-official-vi-l13-pdf115-word-15-pos']['viText']=='đt.' and map_rows['hsk1-official-vi-l13-pdf115-word-12-pos']['viText']=='dt.')
check('service-body-versus-appendix-star-preserved',next(w for w in source['wordTableRows'] if w['zhPrinted']=='服务员')['starPrintedInBody'] is False and next(w for w in source['appendixRelevantIndexRows'] if w['zhPrinted']=='服务员')['starPrinted'] is True)
check('all-nineteen-actual-POS-rows',len([r for r in body if r['category']=='word-pos'])==source['coverage']['printedBodyPosOccurrences']==19)
check('all-fourteen-source-role-lines-paired',len([r for r in body if r['category']=='dialogue-translation'])==14)
check('both-printed-customer-VI-labels-not-invented-dialogues',len([r for r in body if r['category']=='activity-example-role-label'])==2)
check('original-noun-POS-cup-preserved',next(w for w in source['wordTableRows'] if w['zhPrinted']=='杯')['rawPosLabel']=='dt.')
(HERE/'codepoints.json').write_text(json.dumps({'operation':'inventory-only-no-normalization','noReplacementOrControlCodepoints':True,'occurrences':all_codepoints,'wordMetadata':word_codepoints},ensure_ascii=False,indent=2)+'\n')
result={'qualification':'author-structural-self-check-only-not-independent-language-approval','sourceSHA256':sha(HERE/'source.json'),'bodyOccurrences':len(body),'sharedAppendixVIOccurrences':len(appendix),'wordRows':20,'rasterPages':15,'independentLanguageAccepted':0,'checksPassed':len(checks),'checksFailed':0,'checks':checks}
(HERE/'self-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='checks'},ensure_ascii=False))
