"""Join explicitly transcribed source revisions, preserving every current course value."""
import collections
import csv
import hashlib
import json
import re
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
APP = HERE.parents[2]
BOOK_SHA = '7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951'
ORIGINAL_SHA = '33a9c743f73f634f97a9864aa0423ac4e3568b3febbf57b63e983b5dcc0932f2'
INPUTS = ['official-vi-l01-06.json','official-vi-l07-12.json','official-vi-l13-18.json']
QA_FILE = HERE.parent/'qa-hsk3-official-source/review.json'

def sha(path):
 return hashlib.sha256(path.read_bytes()).hexdigest()

def norm_py(text):
 return re.sub(r"[\s'’\-]", '', unicodedata.normalize('NFC', text).lower())

def independent_review():
 if not QA_FILE.exists():return {'status':'pending','reviewedStableRows':0,'acceptedInputFiles':[]}
 qa=json.loads(QA_FILE.read_text())
 if qa.get('source',{}).get('sha256') != BOOK_SHA:
  raise ValueError('Independent reviewer source identity differs')
 checks=[('glossary','official-vi-glossary.tsv','finalSha256',0),
         ('l01_06',INPUTS[0],'inputSha256',171),
         ('l07_12',INPUTS[1],'inputSha256',184),
         ('l13_18',INPUTS[2],'inputSha256',168)]
 accepted=[];count=0
 for section,name,key,n in checks:
  verdict=qa.get(section,{})
  if verdict.get('status') in ['accepted-source-evidence','accepted-source-evidence-after-bounded-repair']:
   if verdict.get(key) != sha(HERE/name):
    raise ValueError('Independent acceptance hash differs: '+name)
   if n and (verdict.get('reviewedStableRows') != n or verdict.get('vocabularyBoxes') != 24
             or verdict.get('issues') != []):
    raise ValueError('Independent scope/count or open issues differ: '+name)
   if not n and (verdict.get('reviewedRows') != 487 or verdict.get('ordinaryRows') != 479
                 or verdict.get('properNameRows') != 8 or verdict.get('starredHeads') != 23
                 or any(i.get('status') != 'closed-final-diff-and-source-rechecked'
                        for i in verdict.get('issues',[]))):
    raise ValueError('Independent glossary count or open issues differ')
   accepted.append(name);count+=n
 if len(accepted)==4:
  overall=qa.get('overall',{})
  expected={'status':'accepted-new-official-source-evidence','stableSenseRows':523,
            'printedLessonOccurrences':491,'textVocabularyBoxes':72,'glossaryRows':487,
            'sourceToCanonicalIdChinesePageTextBindingMatches':523,
            'glossaryToLessonHeadBindingsMatch':True,'sequenceRangesChecked':18,
            'fullVietnameseAlignmentGranted':False,'oldChineseSourceRecovered':False}
  if any(overall.get(k)!=v for k,v in expected.items()):
   raise ValueError('Independent overall coverage/acceptance differs')
  accepted_ids=qa.get('acceptedStableIds',[])
  current_ids=[w['id'] for p in sorted((APP/'content/hsk3').glob('lesson-*.json'))
               for w in json.loads(p.read_text())['vocabulary']]
  if (len(accepted_ids)!=523 or len(set(accepted_ids))!=523
      or len(current_ids)!=523 or len(set(current_ids))!=523
      or set(accepted_ids)!=set(current_ids)):
   raise ValueError('Independent accepted stable-ID coverage differs')
  manifest=qa.get('acceptedInputFiles',[])
  expected_names=INPUTS+['official-vi-glossary.tsv']
  if (len(manifest)!=4 or len({m.get('filename') for m in manifest})!=4
      or {m.get('filename') for m in manifest}!=set(expected_names)):
   raise ValueError('Independent accepted-input manifest coverage differs')
  expected_counts={INPUTS[0]:(171,162),INPUTS[1]:(184,166),INPUTS[2]:(168,163)}
  for item in manifest:
   name=item['filename']
   if item.get('sha256')!=sha(HERE/name) or item.get('status')!='independently-accepted-source-evidence':
    raise ValueError('Independent manifest hash/status differs: '+name)
   if name=='official-vi-glossary.tsv':
    if item.get('glossaryRows')!=487:raise ValueError('Independent glossary manifest scope differs')
   else:
    stable,printed=expected_counts[name]
    actual_input=json.loads((HERE/name).read_text())
    batch_ids=[r['id'] for r in actual_input['rows']]
    if (item.get('stableRows')!=stable or item.get('printedOccurrences')!=printed
        or item.get('vocabularyBoxes')!=24 or len(batch_ids)!=stable
        or len(set(batch_ids))!=stable or not set(batch_ids)<=set(accepted_ids)):
     raise ValueError('Independent vocabulary manifest scope/ID set differs: '+name)
 return {'status':'accepted-source-evidence' if len(accepted)==4 else 'partially-accepted-source-evidence',
         'reviewer':qa['reviewer'],'evidenceFile':str(QA_FILE.relative_to(APP)),
         'evidenceSha256':sha(QA_FILE),'reviewedStableRows':count,
         'acceptedInputFiles':accepted,
         'acceptedStableIdCount':len(qa.get('acceptedStableIds',[])) if len(accepted)==4 else count,
         'acceptedInputManifest':qa.get('acceptedInputFiles',[]) if len(accepted)==4 else [],
         'scope':'Official additional-source Chinese/pinyin/number/POS/glossary anchors only; no original English or full VI audit'}

def build_revision():
 sources = [json.loads((HERE/name).read_text()) for name in INPUTS]
 rows = [row for source in sources for row in source['rows']]
 ids = [row['id'] for row in rows]
 if len(ids) != len(set(ids)):
  raise ValueError('Duplicate official vocabulary binding')
 official = {row['id']:row for row in rows}
 glossary = list(csv.DictReader((HERE/'official-vi-glossary.tsv').open(),delimiter='\t'))
 heads = {row['headword'].lstrip('*'):row for row in glossary}
 if len(heads) != len(glossary):
  raise ValueError('Duplicate glossary headword')
 word_anchors = []
 issues, variants = [], []
 current = []
 lesson_hashes = {}
 for path in sorted((APP/'content/hsk3').glob('lesson-*.json')):
  lesson = json.loads(path.read_text());lesson_hashes[str(path.relative_to(APP))]=sha(path)
  for word in lesson['vocabulary']:
   current.append(word)
   row = official.get(word['id'])
   if row is None:
    issues.append({'id':word['id'],'kind':'missing-official-row'});continue
   for key in ['zh','sourceText']:
    if row[key] != word[key]:issues.append({'id':word['id'],'kind':'binding-mismatch','key':key})
   for key in ['pdfPage','printedPage']:
    if row[key] != word['source'][key]:issues.append({'id':word['id'],'kind':'body-page-mismatch','key':key})
   entry = heads.get(word['zh'])
   if entry is None:
    issues.append({'id':word['id'],'kind':'missing-glossary-head'});continue
   lesson_numbers = [int(v) for v in entry['lessonNumbers'].split(',')]
   if lesson['number'] not in lesson_numbers:
    issues.append({'id':word['id'],'kind':'glossary-lesson-mismatch'})
   metadata = word.get('appendixMetadata')
   if metadata and metadata['sourceNumber'] != row['printedNumber']:
    issues.append({'id':word['id'],'kind':'existing-printed-number-mismatch'})
   old_appendix = word.get('appendixSource')
   if old_appendix and old_appendix['pdfPage'] != int(entry['pdfPage']):
    issues.append({'id':word['id'],'kind':'existing-glossary-page-mismatch'})
   raw_gloss_py=entry['printedPinyin']
   body_diff = norm_py(row['normalizedPinyin']) != norm_py(word['py'])
   glossary_diff = norm_py(raw_gloss_py) != norm_py(word['py'])
   star = entry['headword'].startswith('*')
   if body_diff or glossary_diff:
    variants.append({'id':word['id'],'kind':'additional-source-pinyin-difference',
     'currentPinyin':word['py'],'officialBodyRaw':row['printedPinyin'],
     'officialGlossaryRaw':entry['printedPinyin'],'courseValueChanged':False})
   if star != word.get('supplementarySyllabus',False):
    variants.append({'id':word['id'],'kind':'additional-source-star-difference',
     'currentStarred':word.get('supplementarySyllabus',False),'officialRawStarred':star,
     'officialGlossaryPdfPage':int(entry['pdfPage']),'courseValueChanged':False})
   word_anchors.append({'wordId':word['id'],
     'officialVocabulary':row,
     'officialGlossary':{'headword':entry['headword'].lstrip('*'),
       'rawStarred':star,'printedPinyin':entry['printedPinyin'],
       'lessonNumbers':lesson_numbers,'pdfPage':int(entry['pdfPage']),
       'printedPage':int(entry['pdfPage'])-12},
     'preservedCourseSource':word['source'],
     'preservedAppendixSource':word.get('appendixSource')})
 if set(ids) != {w['id'] for w in current}:
  issues.append({'kind':'source-ID-coverage-set-mismatch'})
 if set(heads) != {w['zh'] for w in current}:
  issues.append({'kind':'glossary-Chinese-head-coverage-set-mismatch'})
 actual_lessons = collections.defaultdict(set)
 for word in current:actual_lessons[word['zh']].add(int(word['id'].split(':')[1][1:]))
 for head,entry in heads.items():
  if actual_lessons[head] != set(map(int,entry['lessonNumbers'].split(','))):
   issues.append({'head':head,'kind':'incomplete-or-extra-glossary-lesson-list'})
 independent=independent_review()
 evidence = {
  'schemaVersion':1,
  'sourceRevision':{'id':'hsk3-official-vi-20261004',
   'filename':'HSK3 (3.0).pdf','sha256':BOOK_SHA,'bytes':96266563,'pdfPages':212,
   'bodyPrintedPageOffset':12,'language':'zh+vi',
   'role':'additional-official-source; no replacement of original-source identity',
   'originalChinesePdfSha256':ORIGINAL_SHA,'sameBytesAsOriginalChineseSource':False,
   'officialPOSAbbreviationLanguage':'Vietnamese','doesNotRevalidateOriginalEnglishAppendix':True},
  'reviewStatus':{'authorVisual':'complete-for-word-scope','independent':independent['status'],
   'VietnameseGlossAlignment':'deferred-to-Phase-B','courseValuesChanged':False},
  'independentReview':independent,
  'counts':{'stableWordRows':len(rows),'glossaryEntries':len(glossary),
   'ordinaryGlossaryEntries':len(glossary)-8,'properNameGlossaryEntries':8,
   'printedVocabularyAppearances':len({(r['id'].split(':')[1],r['sourceList'],r['printedNumber']) for r in rows}),
   'vocabularyBoxes':len({(r['id'].split(':')[1],r['sourceText']) for r in rows}),
   'bodyPages':len({r['pdfPage'] for r in rows}),
   'officialStarredHeads':sum(r['headword'].startswith('*') for r in glossary),
   'officialStarredStableRows':sum(a['officialGlossary']['rawStarred'] for a in word_anchors)},
  'inputSha256':{name:sha(HERE/name) for name in INPUTS+['official-vi-glossary.tsv']},
  'courseLessonSha256':lesson_hashes,'structuralIssues':issues,'sourceVariants':variants,
  'wordAnchors':word_anchors,
  'preservationNote':'Original course source objects, translations, POS, pinyin, identity, audio and canonical catalogue are unchanged. New raw evidence lives only in this separately identified sidecar.'}
 if issues:raise ValueError(json.dumps(issues,ensure_ascii=False))
 return evidence

def main():
 evidence=build_revision()
 (HERE/'official-vi-source-revision.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'counts':evidence['counts'],'structuralIssues':evidence['structuralIssues'],
                   'sourceVariants':evidence['sourceVariants']},ensure_ascii=False,indent=2))

if __name__=='__main__':main()
