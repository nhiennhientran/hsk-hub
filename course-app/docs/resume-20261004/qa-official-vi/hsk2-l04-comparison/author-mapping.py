"""Explicit L4 source/context mapping for private author comparison."""
def author_mapping(lesson,documents,bindings,bmap,s,add,hold,lessonFile,lexFile,indexFile):
 import re
 add('/title/vi',['lesson-title']);idx=next(i for i,x in enumerate(documents[indexFile]) if x['id']==lesson['id']);add(f'/{idx}/title/vi',['lesson-title'],file=indexFile)
 for i in range(3):
  for p in [f'/objectives/{i}/vi',f'/activities/0/fields/{i}/prompt/vi']:add(p,[f'goal{i+1}'])
 for i in range(2):
  for p in [f'/warmup/{i}/title/vi',f'/activities/{i+1}/title/vi']:add(p,[f'warmup{i+1}-instruction'])
 words={s(f'word{i:02d}')['zhAnchor']:s(f'word{i:02d}') for i in range(1,17)}
 for i,w in enumerate(lesson['vocabulary']):
  ref=words[w['zh']];new=ref['viPrinted']
  if w['zh']=='过':assert w['vi'].endswith(' (trợ từ chỉ trải nghiệm)');new+=' (trợ từ chỉ trải nghiệm)'
  if w['zh']=='条':new+=' (giải thích biên tập: '+w['vi']+')'
  add(f'/vocabulary/{i}/vi',[ref['section']],new,'Whole printed gloss plus any explicitly retained old explanation; the unchanged old 条 definition remains editorial rather than being silently deleted. No POS/pinyin/source metadata changes.')
  si=next(i for i,x in enumerate(documents[lexFile]['senses']) if any(z['wordId']==w['id'] for z in x['sources']));assert documents[lexFile]['senses'][si]['zh']==w['zh'];assert documents[lexFile]['senses'][si]['vi']==w['vi']
  add(f'/senses/{si}/vi',[ref['section']],new,file=lexFile,reason='Same stable local/canonical sense; same source and new full VI, including identical retained old editorial explanation.')
 for b in bindings:
  if b['baselineFile']==lessonFile and re.fullmatch(r'/activities/\d+/fields/\d+/options/\d+/vi',b['field']) and b['zhContext'] in words:add(b['field'],[words[b['zhContext']]['section']],reason='Complete official lesson lexical gloss for the existing Chinese lexical option. Options retain Chinese, IDs, positions and scoring.')
 refs=[words[x] for x in ['裤子','书包','过去','颜色']];add('/warmup/0/items/0/vi',[x['section'] for x in refs],'; '.join(f'{a} '+r['viPrinted'] for a,r in zip('ABCD',refs)),'Full printed dictionary units plus editorial A–D joining labels; no full Vietnamese list is printed.')
 add('/activities/2/matrix/rowHeading/vi',['warmup2-table-column0'])
 for i in range(3):add(f'/activities/2/matrix/columns/{i}/vi',[f'warmup2-table-column{i+1}'])
 for i in range(3):
  section=f'warmup2-tea-cell{i+1}';add(f'/activities/2/matrix/rows/1/cellLabels/{i}/vi',[section])
  p=f'/activities/2/fields/{3+i}/prompt/vi';old=bmap[lessonFile,p]['value'];add(p,[section],old[:old.index(':')+2]+s(section)['viPrinted'],'Whole printed tea annotation plus exact retained Uống: action prefix from the Chinese-only table; not a full printed prompt.')
 add('/warmup/1/items/1/vi',[f'warmup2-tea-cell{i+1}' for i in range(3)],'Uống: '+' / '.join(s(f'warmup2-tea-cell{i+1}')['viPrinted'] for i in range(3)),'All three complete printed tea annotations; existing Uống: action prefix remains editorial and no completed experience is supplied.')
 for i,t in enumerate(lesson['texts']):
  n=i+1;add(f'/texts/{i}/title/vi',[f'text{n}-header']);add(f'/texts/{i}/context/vi',[f'text{n}-context'])
  for k,l in enumerate(t['lines']):
   sect=f'text{n}-line{k+1:02d}' if n<4 else 'text4-whole-paragraph';assert l['zh']==s(sect)['zhAnchor']
   if n<4:assert l['speaker']==s(sect)['printedRoleZh']
   add(f'/texts/{i}/lines/{k}/vi',[sect],reason='Complete printed mẹ/con role turn, with actual Chinese speaker checked.' if n<4 else 'Complete unlabelled diary paragraph; no printed speaker is invented. Chinese/VI text remains whole.')
  for ai in [3+2*i,4+2*i]:
   p=f'/activities/{ai}/title/vi';old=bmap[lessonFile,p]['value'];add(p,[f'text{n}-header'],s(f'text{n}-header')['viPrinted']+old[old.index(':'):],'Whole printed text heading plus exact retained exercise-mode tail.')
  add(f'/activities/{3+2*i}/note/vi',[f'text{n}-listen-instruction']);add(f'/activities/{4+2*i}/note/vi',[f'text{n}-role-read-instruction' if n<4 else 'text4-read-instruction'])
 for i in range(3):add(f'/grammar/{i}/title/vi',[f'grammar{i+1}-title'])
 hold('/grammar/0/explanation/vi',['grammar1-rule1','grammar1-rule2'],'Website explicitly preserves 过 in the negative construction. This useful extra wording must survive; keep complete old and printed rule candidates pending explicit safe composition.')
 add('/grammar/1/explanation/vi',['grammar2-rule'],reason='Complete printed cause-effect grammar rule. Existing causal roles and optional paired/single connector meaning are present in the full source; no extra restriction is silently removed. Chinese/VI page split retained.')
 hold('/grammar/2/explanation/vi',['grammar3-rule'],'Website adds listener-known noun omission and 红色的 example. Preserve this useful editorial extension, do not whole-replace it with only the source rule.')
 for si in [0,1]:
  p=f'/sections/{si}/title/vi';old=bmap[lessonFile,p]['value'];add(p,['integrated-header'],s('integrated-header')['viPrinted']+old[old.index(':'):],'Official section heading plus retained existing topic tail.')
 p='/activities/20/title/vi';old=bmap[lessonFile,p]['value'];add(p,['integrated-header'],s('integrated-header')['viPrinted']+old[old.index(':'):],'Same printed section heading, retained mapped exercise topic tail.')
 refs=[words[x] for x in ['进去','书包','颜色','条','商场']];add('/sections/0/blocks/0/vi',[x['section'] for x in refs],'; '.join(f'{a} '+r['viPrinted'] for a,r in zip('ABCDE',refs))+'.','Chinese-only A–E word-list translated from full printed lexical glosses. Do not add the separate instruction to a Chinese field that contains only choices.')
 add('/sections/1/blocks/0/vi',['integrated2-instruction'])
 new=s('classroom-header')['viPrinted']+': '+s('roleplay-header')['viPrinted']
 for p in ['/sections/2/title/vi','/activities/25/title/vi']:add(p,['classroom-header','roleplay-header'],new,'Two whole printed labels joined with an editorial colon.')
 for p in ['/sections/2/blocks/0/vi','/activities/25/fields/0/prompt/vi']:add(p,['roleplay-instruction'])
 return words
