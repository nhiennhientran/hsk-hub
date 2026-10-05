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
check('actual-body-scope',source['pdfPages']==list(range(128,138)) and source['printedPages']==[f'{n:03d}' for n in range(112,122)])
check('actual-appendix-scope',source['appendixPDFPages']==list(range(138,145)))
check('body-coverage-count',source['coverage']['bodyOccurrenceCount']==len(body))
check('body-category-counts',source['coverage']['byBodyCategory']==dict(collections.Counter(r['category'] for r in body)))
check('chapter-next-boundary',source['coverage']['chapterBoundary']['nextSectionStartActuallyObserved']=={'pdfPage':138,'printedPage':'122','section':'printed-POS-crosswalk-and-vocabulary-appendix'})
check('body-ordinary-word-count',len(source['wordTableRows'])==source['coverage']['totalWordTableRows']==20 and len([w for w in source['wordTableRows'] if w['kind']=='ordinary'])==source['coverage']['ordinaryWordRows']==17 and len([w for w in source['wordTableRows'] if w['kind']=='proper'])==source['coverage']['properNameRows']==3)
check('body-word-numbers-contiguous',sorted(w['printOrdinal'] for w in source['wordTableRows'] if w['kind']=='ordinary')==list(range(1,18)) and sorted(w['printOrdinal'] for w in source['wordTableRows'] if w['kind']=='proper')==[1,2,3])
check('appendix-no-false-VI-glosses',all(w['viGlossPrinted'] is False for w in source['appendixRelevantIndexRows']))
check('appendix-shared-not-new-lesson-words',all(r['sharedPhysicalOccurrence'] is True for r in appendix))
check('dialogue-role-line-count',len([r for r in body if r['category']=='dialogue-translation'])==14)
map_rows={r['occurrenceId']:r for r in rows}
all_codepoints={}
word_codepoints=[]
def join_fragment(f):
    lines=f['lineTexts']
    joiners=f.get('lineJoiners',[f.get('lineJoiner',' ')]*(len(lines)-1))
    assert len(joiners)==len(lines)-1 and all(j in [' ',''] for j in joiners)
    return lines[0]+''.join(j+t for j,t in zip(joiners,lines[1:]))

for row in rows:
    check(row['occurrenceId']+':fragment-whole-join',row['viText']==' '.join(join_fragment(f) for f in row['fragments']))
    check(row['occurrenceId']+':physical-source-page-in-scope',row['pdfPage'] in source['pdfPages']+source['appendixPDFPages'])
    check(row['occurrenceId']+':render-ref-real',(HERE/row['renderRef']).is_file())
    check(row['occurrenceId']+':no-corrupt-or-invisible-controls',all(ch not in '\ufffd\x00\u200b\u200c\u200d\ufeff' and unicodedata.category(ch) not in ['Cc','Cs'] for ch in row['viText']))
    check(row['occurrenceId']+':author-encoded-NFC-no-auto-rewrite',unicodedata.normalize('NFC',row['viText'])==row['viText'])
    all_codepoints[row['occurrenceId']]={'text':row['viText'],'utf16Length':len(row['viText'].encode('utf-16-le'))//2,'codepoints':[f'U+{ord(ch):04X}' for ch in row['viText']]}
    if row['category']=='dialogue-translation':
        check(row['occurrenceId']+':whole-printed-role-prefix',row['viText'].startswith(row['speakerViPrinted']+': '))
        check(row['occurrenceId']+':Chinese-paired-page-real',row['zhAnchorPDFPage'] in source['pdfPages'] and row['zhAnchorPrintedPage']==f'{row["zhAnchorPDFPage"]-16:03d}')
for word in source['wordTableRows']:
    word_key=word['kind']+str(word['printOrdinal'])
    gloss=map_rows[word['glossOccurrenceId']]
    check(word_key+':gloss-link',gloss['zhContext']==word['zhPrinted'] and gloss['printOrdinal']==word['printOrdinal'])
    if word['rawPosLabel'] is None:
        check('proper'+str(word['printOrdinal'])+':no-POS-field-not-invented',word['kind']=='proper' and word['printedPOSFieldPresent'] is False and word['posOccurrenceId'] is None)
    else:
        pos=map_rows[word['posOccurrenceId']]
        check(word_key+':printed-POS-link',pos['zhContext']==word['zhPrinted'] and pos['viText']==word['rawPosLabel'] and pos['printOrdinal']==word['printOrdinal'])
    for field in ['zhPrinted','pinyinPrinted','rawPosLabel']:
        value=word[field]
        if value is None:
            word_codepoints.append({'kind':word['kind'],'printOrdinal':word['printOrdinal'],'field':field,'text':None,'codepoints':[],'qualification':'printed-blank-not-a-VI-occurrence'})
            continue
        check(word_key+':'+field+':NFC-no-invisible-corruption',unicodedata.normalize('NFC',value)==value and all(ch not in '\ufffd\x00\u200b\ufeff' and unicodedata.category(ch) not in ['Cc','Cs'] for ch in value))
        word_codepoints.append({'kind':word['kind'],'printOrdinal':word['printOrdinal'],'field':field,'text':value,'codepoints':[f'U+{ord(ch):04X}' for ch in value]})
for image in manifest['pages']:
    p=HERE/image['file']
    check('png-'+str(image['pdfPage'])+':byte-hash',p.stat().st_size==image['bytes'] and sha(p)==image['sha256'])
    with Image.open(p) as im:im.verify()
    check('png-'+str(image['pdfPage'])+':valid-image',True)
check('whole-17-page-raster-scope',sorted(p['pdfPage'] for p in manifest['pages'])==source['pdfPages']+source['appendixPDFPages'])
check('pronoun-versus-noun-raw-POS',map_rows['hsk1-official-vi-l15-pdf129-word-02-pos']['viText']=='đt.' and map_rows['hsk1-official-vi-l15-pdf133-word-08-pos']['viText']=='dt.')
check('all-seventeen-actual-POS-rows',len([r for r in body if r['category']=='word-pos'])==source['coverage']['printedBodyPosOccurrences']==17)
check('all-fourteen-source-role-lines-paired',len([r for r in body if r['category']=='dialogue-translation'])==14)
check('three-proper-name-glosses-not-invented-POS',len([r for r in body if r['category']=='proper-word-gloss'])==3)
check('all-eight-summary-rows',len([r for r in body if r['category']=='summary-table-row'])==source['coverage']['learningSummaryRows']==8)
check('grammar-mixed-CJK-specific-joiners',map_rows['hsk1-official-vi-l15-pdf130-grammar-01-explanation']['fragments'][0]['lineJoiners']==[' ',''] and '“……，还/也……”' in map_rows['hsk1-official-vi-l15-pdf130-grammar-01-explanation']['viText'])
check('summary-continuous-CJK-no-invented-space',map_rows['hsk1-official-vi-l15-pdf137-summary-item-07']['fragments'][0]['lineJoiner']=='' and '我喜欢看书，也喜欢看电影。' in map_rows['hsk1-official-vi-l15-pdf137-summary-item-07']['viText'])
check('original-airport-tense-retained-not-website-overwrite','chúng em đã đến' in map_rows['hsk1-official-vi-l15-pdf133-text-3-role-04']['viText'])
check('original-conjunction-POS-na-retained',map_rows['hsk1-official-vi-l15-pdf133-word-17-pos']['viText']=='liên.')
check('two-body-versus-index-star-differences-preserved',all(next(w for w in source['wordTableRows'] if w['zhPrinted']==zh)['starPrintedInBody'] is False and next(w for w in source['appendixRelevantIndexRows'] if w['zhPrinted']==zh)['starPrinted'] is True for zh in ['机场','接']))
(HERE/'codepoints.json').write_text(json.dumps({'operation':'inventory-only-no-normalization','noReplacementOrControlCodepoints':True,'occurrences':all_codepoints,'wordMetadata':word_codepoints},ensure_ascii=False,indent=2)+'\n')
result={'qualification':'author-structural-self-check-only-not-independent-language-approval','sourceSHA256':sha(HERE/'source.json'),'bodyOccurrences':len(body),'sharedAppendixVIOccurrences':len(appendix),'wordRows':20,'rasterPages':17,'independentLanguageAccepted':0,'checksPassed':len(checks),'checksFailed':0,'checks':checks}
(HERE/'self-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='checks'},ensure_ascii=False))
