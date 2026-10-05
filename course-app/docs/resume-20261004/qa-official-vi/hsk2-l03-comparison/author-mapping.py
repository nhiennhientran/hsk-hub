"""Explicit L3 source/context mapping. This module is consumed only by private builder."""
def author_mapping(lesson,documents,bindings,bmap,s,add,hold,lessonFile,lexFile,indexFile):
 import re
 add('/title/vi',['lesson-title'])
 idx=next(i for i,x in enumerate(documents[indexFile]) if x['id']==lesson['id']);add(f'/{idx}/title/vi',['lesson-title'],file=indexFile)
 for i in range(4):
  for p in [f'/objectives/{i}/vi',f'/activities/0/fields/{i}/prompt/vi']:add(p,[f'goal{i+1}'])
 for i in range(2):
  for p in [f'/warmup/{i}/title/vi',f'/activities/{i+1}/title/vi']:add(p,[f'warmup{i+1}-instruction'])
 words={s('word'+str(i).zfill(2))['zhAnchor']:s('word'+str(i).zfill(2)) for i in range(1,16)}
 for i,w in enumerate(lesson['vocabulary']):
  ref=words[w['zh']];add(f'/vocabulary/{i}/vi',[ref['section']],reason='Complete printed lexical unit, exact local sense/context; POS and all metadata sealed.')
  si=next(i for i,x in enumerate(documents[lexFile]['senses']) if any(z['wordId']==w['id'] for z in x['sources']));assert documents[lexFile]['senses'][si]['zh']==w['zh']
  add(f'/senses/{si}/vi',[ref['section']],file=lexFile,reason='Actual stable wordId→canonical sense relation, identical full official source and gloss; no sense merge.')
 for b in bindings:
  if b['baselineFile']==lessonFile and re.fullmatch(r'/activities/\d+/fields/\d+/options/\d+/vi',b['field']) and b['zhContext'] in words:
   add(b['field'],[words[b['zhContext']]['section']],reason='Complete accepted local printed lexical gloss reused for the matching Chinese lexical option; no sentence/directional-context translation or score change.')
 refs=[words[x] for x in ['洗','累','拿','不错']]
 add('/warmup/0/items/0/vi',[x['section'] for x in refs],'; '.join(f'{a} '+r['viPrinted'] for a,r in zip('ABCD',refs)),'Full printed dictionary units joined with explicitly editorial A–D labels. Chinese-only warmup choices have no printed full VI list.')
 # The worksheet's standalone verb is used as a gloss, without assuming an object or inventing a completed answer.
 for i,zh in [(0,'送'),(1,'拿'),(4,'洗')]:
  ref=words[zh]
  for p in [f'/warmup/1/items/{i}/vi',f'/activities/2/fields/{i}/prompt/vi']:
   old=bmap[lessonFile,p]['value'];label=old.split(' ',1)[0]+' ';add(p,[ref['section']],label+ref['viPrinted']+' ______','Printed standalone verb gloss plus existing ordinal and unanswered blank; no supplied object or completed answer is changed.')
 for i,t in enumerate(lesson['texts']):
  n=i+1;add(f'/texts/{i}/title/vi',[f'text{n}-header']);add(f'/texts/{i}/context/vi',[f'text{n}-context'])
  for k,l in enumerate(t['lines']):
   sect=f'text{n}-line{k+1:02d}' if n<4 else 'text4-whole-paragraph';assert l['zh']==s(sect)['zhAnchor']
   if n==4:
    hold(f'/texts/{i}/lines/{k}/vi',[sect],'Faithful printed source has 很累 → rất bận, contradicting tiredness and printed word15 累→mệt. Current website keeps mệt. Pending independent semantic erratum decision; do not overwrite correct tiredness with busy or silently edit the source.')
   else:
    assert l['speaker']==s(sect)['printedRoleZh'];add(f'/texts/{i}/lines/{k}/vi',[sect],reason='Full printed role turn; spouses anh/em checked against original speaker and complete Chinese context.')
  for ai in [3+2*i,4+2*i]:
   p=f'/activities/{ai}/title/vi';old=bmap[lessonFile,p]['value'];add(p,[f'text{n}-header'],s(f'text{n}-header')['viPrinted']+old[old.index(':'):],'Printed heading plus exact retained course listening/reading mode tail.')
  add(f'/activities/{3+2*i}/note/vi',[f'text{n}-listen-instruction'])
  add(f'/activities/{4+2*i}/note/vi',[f'text{n}-role-read-instruction' if n<4 else 'text4-read-instruction'])
 for i in range(3):add(f'/grammar/{i}/title/vi',[f'grammar{i+1}-title'])
 hold('/grammar/0/explanation/vi',['grammar1-rule1','grammar1-rule2','grammar1-rule3'],'Website explanation has extra examples 完/好/晚 and a completed-action restriction for 了. Preserve the full valid editorial explanation pending explicit separated/preserved composition; no destructive whole replacement.')
 hold('/grammar/1/explanation/vi',['grammar2-rule1','grammar2-rule2'],'Website also defines the separable form as động-tân. Keep the valid explanatory qualifier, alongside both complete printed rule candidates and all Chinese/VI spread pages; no full-source replacement that silently drops the definition.')
 hold('/grammar/2/explanation/vi',['grammar3-rule'],'Website adds short/trial-action explanation. Complete accepted rule spans printed24–25 / PDF38–39. Preserve the old extension and full source candidate, no residual source fragment labelled whole direct.')
 add('/sections/0/title/vi',['helper-header'],s('helper-header')['viPrinted']+': 对了','Official helper header plus unchanged existing Chinese topic label.')
 hold('/sections/0/blocks/0/vi',['helper-duile'],'Website adds À, đúng rồi/À này equivalence. Full-source replacement would erase this explicit editorial help; preserve and independently construct any future official prefix plus tail.')
 for si in [1,2]:
  p=f'/sections/{si}/title/vi';old=bmap[lessonFile,p]['value'];add(p,['integrated-header'],s('integrated-header')['viPrinted']+old[old.index(':'):],'Printed section header plus exact retained existing topic tail.')
 p='/activities/20/title/vi';old=bmap[lessonFile,p]['value'];add(p,['integrated-header'],s('integrated-header')['viPrinted']+old[old.index(':'):],'Same section-header source plus retained mapped activity topic.')
 refs=[words[x] for x in ['一起','送','回去','拿','累']]
 add('/sections/1/blocks/0/vi',['integrated1-instruction']+[x['section'] for x in refs],s('integrated1-instruction')['viPrinted']+' '+ '; '.join(f'{a} '+r['viPrinted'] for a,r in zip('ABCDE',refs))+'.','Full printed instruction and dictionary glosses; A–E sequence is editorial glue. No sentence answer is inserted.')
 add('/sections/2/blocks/0/vi',['integrated2-instruction'])
 new=s('classroom-header')['viPrinted']+': '+s('pair-header')['viPrinted']
 for p in ['/sections/3/title/vi','/activities/25/title/vi']:add(p,['classroom-header','pair-header'],new,'Two complete printed labels joined by editorial colon.')
 for p in ['/sections/3/blocks/0/vi','/activities/25/fields/0/prompt/vi']:add(p,['pair-instruction'])
 add('/sections/4/title/vi',['bonus-header','bonus-video-caption'],s('bonus-header')['viPrinted']+': '+s('bonus-video-caption')['viPrinted'],'Complete printed labels plus editorial colon.')
 add('/sections/4/blocks/0/vi',['bonus-video-caption'],s('bonus-video-caption')['viPrinted']+' (video 3-1).','Complete caption plus unchanged video-number suffix; no video availability inferred.')
 # Summary rows print Chinese examples but no Vietnamese example translations. Keep every existing VI example verbatim.
 def prefix(section):
  r=s(section);assert ', ví dụ:' in r['viPrinted'];return r['viPrinted'].split(', ví dụ:',1)[0]
 summaryNew=[]
 for i in range(9):
  section=f'learning-summary-grammar-row{i+1:02d}';p=f'/activities/27/matrix/rows/{i}/prompt/vi';old=bmap[lessonFile,p]['value'];tail=old[old.index(':'):];new=prefix(section)+tail;summaryNew.append(new)
  add(p,[section],new,'Explicit contiguous source heading prefix + exact retained editorial Vietnamese example translation. Printed Chinese-only example is not a printed VI translation.',selectedSpans={section:prefix(section)})
  for col in [0,1]:
   field=f'/activities/27/fields/{2*i+col}/prompt/vi';c='learning-summary-understand-column' if col==0 else 'learning-summary-use-column';oldfield=bmap[lessonFile,field]['value'];exampleTail=oldfield[oldfield.index(':'):oldfield.rindex(';')]
   add(field,[section,c],prefix(section)+exampleTail+'; '+s(c)['viPrinted'],'Selected printed grammar heading + exact preserved editorial translated example + printed self-assessment column label; no example is falsely labelled official.',selectedSpans={section:prefix(section)})
 add('/sections/5/blocks/3/vi',[f'learning-summary-grammar-row{i+1:02d}' for i in range(9)],'\n'.join(summaryNew),'Nine selected printed heading prefixes, preserving all nine existing whole VI example tails; the official source retains Chinese examples and supplies no example VI.',selectedSpans={f'learning-summary-grammar-row{i+1:02d}':prefix(f'learning-summary-grammar-row{i+1:02d}') for i in range(9)})
 add('/sections/5/title/vi',['learning-summary-header'],s('learning-summary-header')['viPrinted']+': bài 1–3','Printed summary header plus exact existing course-range tail.')
 add('/sections/5/blocks/0/vi',['learning-summary-scope','learning-summary-words-header'],s('learning-summary-scope')['viPrinted']+' '+s('learning-summary-words-header')['viPrinted']+'.','Full printed scope and vocabulary-learning label; editorial joining punctuation.')
 add('/sections/5/blocks/1/vi',['learning-summary-words-known','learning-summary-words-not-known'],s('learning-summary-words-known')['viPrinted']+': ______\n'+s('learning-summary-words-not-known')['viPrinted']+': ______','Full printed self-assessment row labels plus existing unanswered blank layout.')
 add('/sections/5/blocks/2/vi',['learning-summary-can-understand-use','learning-summary-understand-column','learning-summary-use-column'],s('learning-summary-can-understand-use')['viPrinted']+'. '+s('learning-summary-understand-column')['viPrinted']+' □\u3000'+s('learning-summary-use-column')['viPrinted']+' □','Full printed self-assessment labels; editorial existing checkbox layout.')
 add('/sections/5/blocks/4/vi',['learning-summary-needs-effort'],s('learning-summary-needs-effort')['viPrinted']+': ______','Full printed prompt plus unchanged unanswered blank.')
 for k,c in enumerate(['learning-summary-understand-column','learning-summary-use-column']):add(f'/activities/27/matrix/columns/{k}/vi',[c])
 for ai,family in [(26,'learning-summary-words-header'),(27,'learning-summary-can-understand-use')]:add(f'/activities/{ai}/title/vi',['learning-summary-scope',family],s('learning-summary-scope')['viPrinted']+' '+s(family)['viPrinted'],'Two printed labels composed for the existing summary subsection; scope text intentionally complete.')
 for i,c in enumerate(['learning-summary-words-known','learning-summary-words-not-known']):
  for p in [f'/activities/26/matrix/rows/{i}/prompt/vi',f'/activities/26/fields/{i}/prompt/vi']:add(p,[c])
 for p in ['/activities/28/title/vi','/activities/28/fields/0/prompt/vi']:add(p,['learning-summary-needs-effort'])
 return words
