"""Explicit L5 source/context mapping; separate senses stay separate."""
def author_mapping(lesson,documents,bindings,bmap,s,add,hold,lessonFile,lexFile,indexFile):
 import re
 add('/title/vi',['lesson-title']);idx=next(i for i,x in enumerate(documents[indexFile]) if x['id']==lesson['id']);add(f'/{idx}/title/vi',['lesson-title'],file=indexFile)
 for i in range(3):
  for p in [f'/objectives/{i}/vi',f'/activities/0/fields/{i}/prompt/vi']:add(p,[f'goal{i+1}'])
 for i in range(2):
  for p in [f'/warmup/{i}/title/vi',f'/activities/{i+1}/title/vi']:add(p,[f'warmup{i+1}-instruction'])
 words={s(f'word{i:02d}')['zhAnchor']:s(f'word{i:02d}') for i in range(1,18)};words['面']=s('word05-subword-mian')
 for i,w in enumerate(lesson['vocabulary']):
  ref=words[w['zh']];new=ref['viPrinted'];selected={};reason='Full printed single-POS gloss and same stable sense; metadata sealed.'
  if w['zh'] in ['快','跟']:
   selectedText={('快','phó từ'):'mau',('快','tính từ'):'nhanh',('跟','giới từ'):'với',('跟','liên từ'):'và'}[w['zh'],w['pos']]
   assert selectedText in ref['viPrinted'] and w['vi'].startswith(selectedText)
   new=w['vi'];selected={ref['section']:selectedText};reason='Joint printed POS/gloss row, but actual stable sense stays separate. Explicit selected source word plus exact unchanged old sense-specific editorial remainder. POS-to-span selection is an author interpretation requiring independent review, not a claim of separately labelled printed meanings.'
  elif w['zh'] in ['下来','上来','上去','下去']:
   tail=w['vi'].split(', ',1)[1];new+=' (giải thích biên tập: '+tail+')';reason='Whole printed directional gloss plus exact old direction relative to speaker, retained as explicitly editorial explanation; no loss of 来/去 distinction.'
  elif w['zh']=='下面':
   tail=w['vi'].split('; ',1)[1];new+=' (giải thích biên tập: '+tail+')';reason='Whole printed location gloss plus exact existing contextual floor explanation, explicitly editorial.'
  elif w['zh']=='一会儿':
   tail=w['vi'].split(', ',1)[1];new+=' (giải thích biên tập: '+tail+')';reason='Whole printed time gloss plus exact existing future-time synonym, explicitly editorial.'
  elif w['zh']=='面':
   tail=' (hậu tố tạo từ chỉ phương vị)';assert w['vi'].endswith(tail);new+=tail;reason='Unnumbered printed suffix subword under 下面, not a fabricated word number. Whole phía source gloss plus exact retained old suffix explanation; POS/source numbering sealed.'
  add(f'/vocabulary/{i}/vi',[ref['section']],new,reason,selectedSpans=selected)
  si=next(i for i,x in enumerate(documents[lexFile]['senses']) if any(z['wordId']==w['id'] for z in x['sources']));assert documents[lexFile]['senses'][si]['zh']==w['zh'] and documents[lexFile]['senses'][si]['vi']==w['vi']
  add(f'/senses/{si}/vi',[ref['section']],new,file=lexFile,reason=reason+' Identical local/canonical source and selected meaning; no merge.',selectedSpans=selected)
 for b in bindings:
  if b['baselineFile']==lessonFile and re.fullmatch(r'/activities/\d+/fields/\d+/options/\d+/vi',b['field']) and b['zhContext'] in words:
   ref=words[b['zhContext']]
   if b['zhContext']=='跟':
    add(b['field'],[ref['section']],'với (giải thích biên tập: '+b['value']+')','Existing exercise option is prepositional cùng/theo, not conjunction và. Explicit source prep word plus exact retained old lexical option gloss; source joint POS row is preserved and selection requires independent review.',selectedSpans={ref['section']:'với'})
   elif b['zhContext']=='快':hold(b['field'],[ref['section']],'Unspecified 快 lexical option cannot automatically select between the two stable senses; retain old value pending context-specific review.')
   else:add(b['field'],[ref['section']],reason='Full accepted single-POS printed lexical gloss reused for this matching Chinese option; its original Chinese/index/scoring remain unchanged.')
 refs=[words[x] for x in ['爷爷','奶奶','礼物','酒店']];add('/warmup/0/items/0/vi',[x['section'] for x in refs],'; '.join(f'{a} '+r['viPrinted'] for a,r in zip('ABCD',refs)),'Whole printed dictionary units plus editorial A–D labels; no full list VI is printed.')
 # Direction picture word list includes words without complete VI in this lesson. Do not borrow another context and call it printed here.
 hold('/warmup/1/items/0/vi',['word02','word08','word09'],'Complete six-word direction list lacks official VI for 过来/过去/进去 in this accepted lesson source. Preserve the full old list; partial glossary matches cannot certify the unquoted picture/deictic context.')
 for i,t in enumerate(lesson['texts']):
  n=i+1;add(f'/texts/{i}/title/vi',[f'text{n}-header']);add(f'/texts/{i}/context/vi',[f'text{n}-context'])
  for k,l in enumerate(t['lines']):
   sect=f'text{n}-line{k+1:02d}' if n<4 else 'text4-whole-paragraph';assert l['zh']==s(sect)['zhAnchor']
   if n<4:assert l['speaker']==s(sect)['printedRoleZh']
   add(f'/texts/{i}/lines/{k}/vi',[sect],reason='Whole role turn preserves chị/em, friends mình/bạn and guests cháu/bác as actually printed; source role labels and Chinese speaker checked.' if n<4 else 'Complete printed unlabelled message paragraph, without invented speaker. Guest Bác Lưu is preserved as printed, distinct from the printed role label Ông Lưu in other dialogue.')
  for ai in [3+2*i,4+2*i]:
   p=f'/activities/{ai}/title/vi';old=bmap[lessonFile,p]['value'];add(p,[f'text{n}-header'],s(f'text{n}-header')['viPrinted']+old[old.index(':'):],'Whole printed text heading plus exact retained exercise-mode tail.')
  add(f'/activities/{3+2*i}/note/vi',[f'text{n}-listen-instruction']);add(f'/activities/{4+2*i}/note/vi',[f'text{n}-role-read-instruction' if n<4 else 'text4-read-instruction'])
 for i in range(3):add(f'/grammar/{i}/title/vi',[f'grammar{i+1}-title'])
 def body(section):
  text=s(section)['viPrinted'];assert text.endswith(' Ví dụ:');return text[:-len(' Ví dụ:')]
 rule1=[f'grammar1-rule{i+1}' for i in range(3)]
 add('/grammar/0/explanation/vi',rule1,'\n'.join(body(c) for c in rule1),'Three complete rule-body sentences/paragraphs selected contiguously before the example-introducing labels. Printed examples interleave between rules; do not misleadingly attach Ví dụ: to the next rule. Existing Chinese-only examples remain editorial translations.',selectedSpans={c:body(c) for c in rule1})
 hold('/grammar/1/explanation/vi',['grammar2-rule1','grammar2-rule2'],'Official VI rule2 omits the Chinese final object-position clause. Website correctly keeps the object after 上/下/进/出/回/过. Faithful source and full old explanation are retained; do not use a printed omission to delete correct content. Independent semantic/source erratum construction required.')
 add('/grammar/2/explanation/vi',['grammar3-rule'],body('grammar3-rule'),'Complete rule-body sentence selected before Ví dụ: because this website field is the explanation, with examples separate. This is explicitly derived, not a residual fragment called whole direct.',selectedSpans={'grammar3-rule':body('grammar3-rule')})
 for si in [0,1]:
  p=f'/sections/{si}/title/vi';old=bmap[lessonFile,p]['value'];add(p,['integrated-header'],s('integrated-header')['viPrinted']+old[old.index(':'):],'Printed section heading plus exact retained existing topic tail.')
 p='/activities/20/title/vi';old=bmap[lessonFile,p]['value'];add(p,['integrated-header'],s('integrated-header')['viPrinted']+old[old.index(':'):],'Same printed section heading, unchanged mapped topic.')
 refs=[words[x] for x in ['奶茶','下面','等','走','跟']]
 # The preposition is selected; the currently useful cùng/theo option wording is preserved verbatim as editorial.
 vals=[r['viPrinted'] for r in refs[:-1]]+['với (giải thích biên tập: cùng/theo)']
 add('/sections/0/blocks/0/vi',['integrated1-instruction']+[r['section'] for r in refs],s('integrated1-instruction')['viPrinted']+' '+ '; '.join(f'{a} '+v for a,v in zip('ABCDE',vals)),'Complete printed instruction and lexical glosses; E跟 uses the selected prepositional word with the exact retained existing contextual cùng/theo tail. Labels are editorial and no completed answer changes.',selectedSpans={'word15':'với'})
 add('/sections/1/blocks/0/vi',['integrated2-instruction'])
 new=s('classroom-header')['viPrinted']+': '+s('roleplay-header')['viPrinted']
 for p in ['/sections/2/title/vi','/activities/25/title/vi']:add(p,['classroom-header','roleplay-header'],new,'Two whole printed labels with editorial colon.')
 for p in ['/sections/2/blocks/0/vi','/activities/25/fields/0/prompt/vi']:add(p,['roleplay-instruction'])
 add('/sections/3/title/vi',['bonus-header','bonus-video-caption'],s('bonus-header')['viPrinted']+': '+s('bonus-video-caption')['viPrinted'],'Two complete printed labels with editorial colon.')
 p='/sections/3/blocks/0/vi';old=bmap[lessonFile,p]['value'];tail=old[old.index(' (video'):];add(p,['bonus-video-caption'],s('bonus-video-caption')['viPrinted']+tail,'Complete source caption plus exact retained video-number suffix; no missing video is inferred to exist.')
 return words
