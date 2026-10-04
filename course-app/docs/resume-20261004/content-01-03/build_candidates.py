"""Author candidates after visual source review; no production mutation."""
import json,hashlib
from pathlib import Path
import fitz

ROOT=Path(__file__).resolve().parent
TEXTBOOK=next(Path('/workspace/scratch/67c4ddcee7f7/upload').glob('新HSK*.pdf'))
ANSWERS=next(Path('/workspace/scratch/67c4ddcee7f7/upload').glob('《*.pdf'))
T=hashlib.sha256(TEXTBOOK.read_bytes()).hexdigest()
A=hashlib.sha256(ANSWERS.read_bytes()).hexdigest()
assert T=='25d1aad102e4179307b5bc4f932927bbd244b3f4dd53edeb6cfd4dbbb8d4f2ba'
assert A=='9e783c9deb889231a778d6776b65dbc04fc734eeca0fdfda1c9d99eb793104e5'
DOC=fitz.open(TEXTBOOK)
V='source-resume-20261004-candidate-1'
C=lambda z,v:{'zh':z,'vi':v}

def src(p,section,n=1):
 return {'sourceRevision':'hsk1-print-2026-01','textbookSHA256':T,'printedPage':p,'pdfPage':p+15,'section':section,'ordinal':n}

def lesson(n):
 return {'schema':1,'edition':'hsk1-print-2026-01','lesson':n,'version':V,'scope':f'lesson-{n}-candidate','textbookSHA256':T,'answerBookSHA256':A,'editorialStatus':'candidate-awaiting-independent-review','activities':[],'figures':[],'coverage':[],'textbookCorrections':[],'integrationNotes':['Candidate only; independent source and browser review remain pending.','Original textbook order, topology and exact source language retained.','Editorial references for open fields are nonunique and ungraded.','No claims of human listening review.']}

def activity(d,p,section,kind,title,instruction,prompt,fields=None,n=1,py=None,**extra):
 a={'id':f'hsk1-original-2026-l{d["lesson"]:02}-p{p:03}-{section}-{n:02}','version':V,'lesson':d['lesson'],'kind':kind,'source':src(p,section,n),'title':C(*title),'instruction':C(*instruction),'prompt':C(*prompt),'fields':fields or []}
 if py:a['pinyin']=py
 a.update(extra);d['activities'].append(a);return a

def openfield(z,v,ref=None,optional=False):
 f={'id':'blank-1','label':C(z,v),'input':'textarea','assessment':'ungraded'}
 if ref:f.update(reference=C(*ref),referenceProvenance='editorial-model-not-official-answer',feedbackNote=C('参考表达仅供比较，答案不唯一。','Câu tham khảo chỉ để đối chiếu; có thể có cách trả lời khác.'))
 if optional:f['required']=False
 return f

def objective(d,p,z,v):
 activity(d,p,'objectives','read-only',('本课目标','Mục tiêu bài học'),('阅读本课学习目标。','Đọc mục tiêu học tập của bài.'),(z,v))

def tip(d,p,n,z,v):
 activity(d,p,'xiaoyu-original-tip','read-only',('小语助力','Gợi ý của Tiểu Ngữ'),('阅读提示。','Đọc gợi ý.'),(z,v),n=n)

def vocab(d,p,n,rows,proper=None):
 # Every source entry keeps its printed ordinal and part of speech. Empty
 # source POS cells remain empty rather than receiving editorial word classes.
 a=activity(d,p,'vocabulary','source-table',('生词','Từ mới'),('按教材顺序学习生词。','Học từ mới theo thứ tự trong sách.'),('',''),n=n)
 a['table']={'caption':C('生词表','Bảng từ mới'),'columns':[C('序号','STT'),C('词语','Từ ngữ'),C('拼音','Phiên âm'),C('词性','Từ loại'),C('释义','Nghĩa')],'rows':[]}
 for ordinal,zh,py,pos,pv,meaning in rows:
  a['table']['rows'].append({'id':f'word-{ordinal}','source':src(p,'vocabulary',ordinal),'cells':[{'text':C(str(ordinal),str(ordinal))},{'text':C(zh,zh)},{'text':C(py,py)},({'text':C(pos,pv)} if pos else {}),{'text':C(meaning[0],meaning[1])}]})
 if proper:
  b=activity(d,p,'proper-nouns','source-table',('专有名词','Danh từ riêng'),('按教材顺序学习专有名词。','Học danh từ riêng theo thứ tự trong sách.'),('',''),n=n)
  b['table']={'columns':[C('序号','STT'),C('词语','Từ ngữ'),C('拼音','Phiên âm'),C('释义','Nghĩa')],'rows':[{'id':f'proper-{o}','source':src(p,'proper-nouns',o),'cells':[{'text':C(str(o),str(o))},{'text':C(z,z)},{'text':C(py,py)},{'text':C(m[0],m[1])}]} for o,z,py,m in proper]}

def crop(d,p,id,pixelrect,alt,cell=1):
 rect=[x/1.5 for x in pixelrect]
 dest=ROOT/'figures'/f'{id}.png';dest.parent.mkdir(exist_ok=True)
 DOC[p+14].get_pixmap(matrix=fitz.Matrix(1.5,1.5),clip=fitz.Rect(rect)).save(dest)
 sha=hashlib.sha256(dest.read_bytes()).hexdigest()
 d['figures'].append({'id':id,'file':f'figures/{id}.png','alt':C(*alt),'source':{'textbookSHA256':T,'printedPage':p,'pdfPage':p+15,'cell':cell,'cropPdfPoints':rect},'kind':'original-crop','sha256':sha,'note':C('教材原图裁切。','Hình được cắt trực tiếp từ sách.')})
 return id,sha

def reading(d,p,n,context,lines,photo=None):
 # Dialogues already exist in textbook.json, but the exact original text and
 # source context here make this sidecar independently reviewable.
 zh=context[0]+'\n\n'+'\n'.join(s+'：'+z for s,z,py,v in lines)
 vi=context[1]+'\n\n'+'\n'.join(s+'：'+v for s,z,py,v in lines)
 a=activity(d,p,f'text-{n}-reading','read-aloud',(f'课文{n} · 朗读对话',f'Bài đọc {n} · Đọc hội thoại'),('朗读对话。','Đọc to hội thoại.'),(zh,vi),py='\n'.join(py for s,z,py,v in lines),audio={'sceneId':f'textbook-l{d["lesson"]:02}-text-{n}','track':f'{d["lesson"]}-{2*n-1}','plays':1,'verifiedByListening':False})
 if photo:a['figure'],a['figureSHA256']=crop(d,*photo)
 return a

def role(d,p,n):
 activity(d,p,f'text-{n}-role-reading','read-aloud',(f'课文{n} · 分角色朗读',f'Bài đọc {n} · Đọc theo vai'),('分角色朗读对话。','Phân vai đọc hội thoại.'),('分角色朗读对话。','Phân vai đọc hội thoại.'))

def pair(d,p,n,instruction,ref=None,photo=None):
 a=activity(d,p,f'text-{n}-pair','pair-work',(f'课文{n} · 两人或多人练习',f'Bài đọc {n} · Luyện cùng bạn'),instruction,instruction,[openfield('对话记录（可选）','Ghi lại hội thoại (không bắt buộc)',ref,True)])
 if photo:a['figure'],a['figureSHA256']=crop(d,*photo)

def grammar(d,p,n,title,z,v,py):
 activity(d,p,'grammar-reading','read-aloud',title,('大声朗读。','Đọc to.'),(z,v),n=n,py=py)

def tongue(d,p,z,py,v,track):
 a=activity(d,p,'tongue-twister','read-aloud',('跟读绕口令','Đọc theo câu luyện âm'),('跟读绕口令。','Đọc theo câu luyện âm.'),(z,v),py=py)
 a['printedAudioTrack']=track
 a['audioAvailability']='pending-track-link-not-scene-id'

def cover(d,pages,sections):
 d['coverage']=[{'printedPage':p,'pdfPage':p+15,'visualReview':'author-inspected','sourceSections':sections[p]} for p in pages]

def save(d):
 (ROOT/f'lesson-{d["lesson"]:02}.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

# LESSON 1: no warmup or objective exercise answers in the source.
d=lesson(1)
objective(d,1,'（1）能听懂并使用礼貌用语打招呼、致谢、告别。\n（2）了解中文交际礼仪，能听懂并使用第二人称代词敬称“您”。','(1) Hiểu khi nghe và dùng lời nói lịch sự để chào hỏi, cảm ơn và tạm biệt.\n(2) Tìm hiểu phép lịch sự trong giao tiếp tiếng Trung; hiểu và dùng đại từ ngôi thứ hai kính trọng “您”.')
reading(d,1,1,('开学第一天，在办公室里，王一飞和AI助教小语打招呼。','Ngày đầu năm học, tại văn phòng, Vương Nhất Phi chào trợ giảng AI Tiểu Ngữ.'),[('王一飞','AI小语，你好！','AI Xiǎoyǔ, nǐ hǎo!','AI Tiểu Ngữ, xin chào!'),('小语','王老师，你好！','Wáng lǎoshī, nǐ hǎo!','Cô Vương, xin chào!')],(1,'l01-text-1-photo',(496,687,796,894),('办公室里的王一飞和AI助教小语。','Vương Nhất Phi và trợ giảng AI Tiểu Ngữ trong văn phòng.')))
vocab(d,1,1,[(1,'你好','nǐ hǎo','','',('你好（招呼用语）','xin chào'))],[(1,'王老师','Wáng lǎoshī',('王姓老师','cô Vương'))])
reading(d,2,2,('开学第一天，课堂上，学生们学习打招呼用语。','Ngày đầu năm học, trong lớp, các học sinh học cách chào hỏi.'),[('王一飞','大家好！','Dàjiā hǎo!','Chào mọi người!'),('学生们','老师，您好！','Lǎoshī, nín hǎo!','Chúng em chào cô ạ!'),('小语','你们好！','Nǐmen hǎo!','Chào các bạn!'),('学生们','你好，小语！','Nǐ hǎo, Xiǎoyǔ!','Chào Tiểu Ngữ!')],(2,'l01-text-2-photo',(343,403,751,625),('课堂上的学生们。','Các học sinh trong lớp học.')))
tip(d,2,1,'“您”，敬称，对年长者或尊敬的人使用。','“您” là cách xưng hô kính trọng, dùng với người lớn tuổi hoặc người mình kính trọng.')
vocab(d,2,2,[(2,'大家','dàjiā','pron.','đại từ',('所有的人','mọi người')),(3,'好','hǎo','adj.','tính từ',('好；健康','tốt; khỏe')),(4,'学生','xuéshēng','n.','danh từ',('学生','học sinh; sinh viên')),(5,'们','men','suf.','hậu tố',('用于人称代词或名词后，表示复数','dùng sau đại từ nhân xưng hoặc danh từ chỉ người để biểu thị số nhiều')),(6,'老师','lǎoshī','n.','danh từ',('老师','giáo viên; thầy; cô')),(7,'您','nín','pron.','đại từ',('第二人称敬称','đại từ ngôi thứ hai kính trọng')),(8,'你们','nǐmen','pron.','đại từ',('你（复数）','các bạn'))])
role(d,2,2);pair(d,2,2,('两人一组或多人一组，用真实姓名对话。','Làm việc theo cặp hoặc nhóm; dùng tên thật để hội thoại.'))
reading(d,3,3,('开学第一天，课堂上，学生们学习致谢语、告别语。','Ngày đầu năm học, trong lớp, các học sinh học cách cảm ơn và tạm biệt.'),[('学生们','谢谢！','Xièxie!','Cảm ơn!'),('小语','不客气！','Bú kèqi!','Không có gì!'),('王一飞','同学们，再见！','Tóngxuémen, zàijiàn!','Các em, tạm biệt!'),('学生们','老师，再见！','Lǎoshī, zàijiàn!','Tạm biệt cô ạ!')],(3,'l01-text-3-photo',(136,286,798,583),('学生与老师在课堂上告别。','Học sinh và giáo viên chào tạm biệt trong lớp.')))
vocab(d,3,3,[(9,'谢谢','xièxie','v.','động từ',('谢谢','cảm ơn')),(10,'不客气','bú kèqi','','',('不用客气','không có gì')),(11,'同学','tóngxué','n.','danh từ',('同学','bạn học')),(12,'再见','zàijiàn','v.','động từ',('再见','tạm biệt'))])
role(d,3,3);pair(d,3,3,('两人一组，用对方的名字对话。','Làm việc theo cặp; dùng tên của người đối thoại.'))
tongue(d,4,'妈种麻，我放马。\n马吃麻，妈骂马。','Mā zhòng má, wǒ fàng mǎ.\nMǎ chī má, mā mà mǎ.','Mẹ trồng cây gai, tôi chăn ngựa.\nNgựa ăn cây gai, mẹ mắng ngựa.','1-7')
tip(d,4,1,'你还想学习更多的汉语拼音知识吗？那就去敲敲“小语的彩蛋”吧，惊喜等着你。','Bạn có muốn học thêm về phiên âm tiếng Trung không? Hãy mở “Điều bất ngờ của Tiểu Ngữ”; có điều thú vị đang chờ bạn.')
d['bonus']={'id':'hsk1-l01-bonus','title':C('汉语拼音','Phiên âm tiếng Trung'),'printedResourceId':'1-1','printedPage':4,'pdfPage':19,'availability':'unavailable','payload':None}
cover(d,range(1,5),{1:['objectives-2','text1-context-dialogue-photo','vocabulary-1','proper-noun-1'],2:['text2-context-dialogue-photo','original-tip','vocabulary-7','role-read','pair-group'],3:['text3-context-dialogue-photo','vocabulary-4','role-read','pair-dialogue'],4:['tongue-twister-2-lines','original-tip','bonus-title-resource-1-1']})
save(d)

# LESSON 2: no warmup, listening-choice or summary introduced by the source.
d=lesson(2)
objective(d,5,'（1）能听懂并使用中文姓名自我介绍。\n（2）能听懂并使用致歉语，用“对不起”和“没关系”表达歉意和回应。\n（3）掌握汉语的基本语序。\n（4）了解中文姓名的构成。','(1) Hiểu khi nghe và tự giới thiệu bằng tên tiếng Trung.\n(2) Hiểu và dùng lời xin lỗi; dùng “对不起” để xin lỗi và “没关系” để đáp lại.\n(3) Nắm trật tự từ cơ bản trong tiếng Trung.\n(4) Tìm hiểu cấu tạo của tên tiếng Trung.')
# First scene photograph spans the previous page; keep its own exact provenance.
reading(d,6,1,('在教室里，王一飞在认识学生。','Trong lớp học, Vương Nhất Phi làm quen với học sinh.'),[('王一飞','请问，你叫什么名字？','Qǐngwèn, nǐ jiào shénme míngzi?','Xin hỏi, bạn tên là gì?'),('陈天中','我叫陈天中。','Wǒ jiào Chén Tiānzhōng.','Tôi tên là Trần Thiên Trung.')],(5,'l02-text-1-photo',(136,759,799,1112),('王一飞在教室里认识学生。','Vương Nhất Phi làm quen với học sinh trong lớp.')))
portrait=crop(d,6,'l02-text-1-portrait',(400,151,730,369),('陈天中的人物照片。','Ảnh nhân vật Trần Thiên Trung.'))
d['activities'][-1]['figures']=[portrait[0]];d['activities'][-1]['figureSHA256s']={portrait[0]:portrait[1]}
tip(d,6,1,'敬辞，请求对方回答问题。','“请问” là cách nói lịch sự khi muốn hỏi người khác một câu hỏi.')
vocab(d,6,1,[(1,'请问','qǐngwèn','v.','động từ',('请问（敬辞）','xin hỏi')),(2,'你','nǐ','pron.','đại từ',('你（单数）','bạn (số ít)')),(3,'叫','jiào','v.','động từ',('叫；名为','tên là; được gọi là')),(4,'什么','shénme','pron.','đại từ',('什么','gì')),(5,'名字','míngzi','n.','danh từ',('名字','tên')),(6,'我','wǒ','pron.','đại từ',('我','tôi'))])
role(d,6,1);pair(d,6,1,('两人一组，用自己的名字互相问答。','Làm việc theo cặp; dùng tên của mình để hỏi và đáp.'))
reading(d,7,2,('在校园里，陈天中和白家月打招呼时认错了人。','Trong khuôn viên trường, Trần Thiên Trung nhận nhầm người khi chào Bạch Gia Nguyệt.'),[('陈天中','你好，安妮！','Nǐ hǎo, Ānní!','Chào Annie!'),('白家月','你好，陈天中！我不是安妮，我是白家月。','Nǐ hǎo, Chén Tiānzhōng! Wǒ bú shì Ānní, wǒ shì Bái Jiāyuè.','Chào Trần Thiên Trung! Tôi không phải Annie, tôi là Bạch Gia Nguyệt.'),('陈天中','对不起！','Duìbuqǐ!','Xin lỗi!'),('白家月','没关系！','Méi guānxi!','Không sao!')],(7,'l02-text-2-photo',(476,285,879,569),('陈天中和白家月在校园里交谈。','Trần Thiên Trung và Bạch Gia Nguyệt trò chuyện trong khuôn viên trường.')))
tip(d,7,1,'在口语中也说“没事”或“没事没事”。','Trong khẩu ngữ cũng nói “没事” hoặc “没事没事” (không sao).')
vocab(d,7,2,[(7,'不','bù','adv.','phó từ',('不；否定','không')),(8,'是','shì','v.','động từ',('是','là')),(9,'对不起','duìbuqǐ','v.','động từ',('对不起','xin lỗi')),(10,'没关系','méi guānxi','','',('没有关系；不要紧','không sao')),(11,'没事','méishì','v.','động từ',('没有关系；不要紧','không sao'))])
role(d,7,2);pair(d,7,2,('两人一组，用真实姓名对话。','Làm việc theo cặp; dùng tên thật để hội thoại.'))
grammar(d,8,1,('汉语的基本语序','Trật tự từ cơ bản trong tiếng Trung'),'汉语的基本语序是：主语+谓语+宾语。例如：我（主语）叫（谓语）陈天中（宾语）。\n\n（1）你叫什么名字？\n（2）我叫白家月。\n（3）我是学生。','Trật tự từ cơ bản trong tiếng Trung là: chủ ngữ + vị ngữ + tân ngữ. Ví dụ: 我 (chủ ngữ) 叫 (vị ngữ) 陈天中 (tân ngữ).\n\n(1) Bạn tên là gì?\n(2) Tôi tên là Bạch Gia Nguyệt.\n(3) Tôi là học sinh.','Nǐ jiào shénme míngzi?\nWǒ jiào Bái Jiāyuè.\nWǒ shì xuéshēng.')
reading(d,8,3,('在校园里，李文和白家月第一次相遇。','Trong khuôn viên trường, Lý Văn và Bạch Gia Nguyệt gặp nhau lần đầu.'),[('李文','你好！我叫李文。','Nǐ hǎo! Wǒ jiào Lǐ Wén.','Xin chào! Tôi tên là Lý Văn.'),('白家月','你好！我叫白家月。','Nǐ hǎo! Wǒ jiào Bái Jiāyuè.','Xin chào! Tôi tên là Bạch Gia Nguyệt.'),('李文','很高兴认识你。','Hěn gāoxìng rènshi nǐ.','Rất vui được làm quen với bạn.'),('白家月','认识你我也很高兴。','Rènshi nǐ wǒ yě hěn gāoxìng.','Tôi cũng rất vui được làm quen với bạn.')],(8,'l02-text-3-photo',(404,688,743,924),('李文和白家月第一次相遇。','Lý Văn và Bạch Gia Nguyệt gặp nhau lần đầu.')))
tip(d,8,1,'中国人的姓名：姓+名','Tên của người Trung Quốc: họ + tên.')
vocab(d,9,3,[(12,'很','hěn','adv.','phó từ',('很；非常','rất')),(13,'高兴','gāoxìng','adj.','tính từ',('高兴；愉快','vui; vui vẻ')),(14,'认识','rènshi','v.','động từ',('认识；相识','biết; làm quen')),(15,'也','yě','adv.','phó từ',('也','cũng'))])
role(d,9,3);pair(d,9,3,('两人一组，用自己的名字自我介绍。','Làm việc theo cặp; dùng tên của mình để tự giới thiệu.'))
tongue(d,9,'七加一，再减一，加完减完等于几？加完减完还是七。','Qī jiā yī, zài jiǎn yī, jiāwán jiǎnwán děngyú jǐ? Jiāwán jiǎnwán hái shì qī.','Bảy cộng một, lại trừ một; cộng xong trừ xong bằng mấy? Cộng xong trừ xong vẫn là bảy.','2-7')
d['bonus']={'id':'hsk1-l02-bonus','title':C('世界各国的中文名称','Tên tiếng Trung của các nước trên thế giới'),'printedResourceId':'','printedPage':9,'pdfPage':24,'availability':'unavailable','payload':None}
cover(d,range(5,10),{5:['objectives-4','text1-context','text1-original-photo'],6:['text1-dialogue-2','portrait','original-tip','vocabulary-6','role-read','pair'],7:['text2-context-dialogue-photo','original-tip','vocabulary-5','role-read','pair'],8:['basic-word-order-3-examples','text3-context-dialogue-photo','name-structure-tip'],9:['vocabulary-4','role-read','pair','tongue-twister','bonus-title-no-payload']})
save(d)

# LESSON 3: group complete-dialogues and cloze blanks exactly as printed.
d=lesson(3)
objective(d,10,'（1）能听懂并使用“是”字句表达等同或类属。\n（2）掌握结构助词“的”的用法。\n（3）掌握用“吗”的是非问句的用法。','(1) Hiểu khi nghe và dùng câu có “是” để biểu thị sự đồng nhất hoặc phân loại.\n(2) Nắm cách dùng trợ từ kết cấu “的”.\n(3) Nắm cách dùng câu hỏi có “吗”.')
reading(d,10,1,('在校园里，李文和白家月第一次相遇，两人继续聊天儿。','Trong khuôn viên trường, Lý Văn và Bạch Gia Nguyệt gặp nhau lần đầu và tiếp tục trò chuyện.'),[('李文','我是中国人。','Wǒ shì Zhōngguó rén.','Tôi là người Trung Quốc.'),('白家月','我是法国人。我的中文老师也是中国人。','Wǒ shì Fǎguó rén. Wǒ de Zhōngwén lǎoshī yě shì Zhōngguó rén.','Tôi là người Pháp. Giáo viên tiếng Trung của tôi cũng là người Trung Quốc.')],(10,'l03-text-1-photo',(403,680,738,1065),('李文和白家月在校园里继续聊天。','Lý Văn và Bạch Gia Nguyệt tiếp tục trò chuyện trong trường.')))
vocab(d,11,1,[(1,'人','rén','n.','danh từ',('人','người')),(2,'的','de','part.','trợ từ',('用于定语之后','dùng sau định ngữ'))],[(1,'中国','Zhōngguó',('中国','Trung Quốc')),(2,'法国','Fǎguó',('法国','Pháp')),(3,'中文','Zhōngwén',('中文','tiếng Trung'))])
role(d,11,1);pair(d,11,1,('两人一组，根据实际情况对话。','Làm việc theo cặp; hội thoại theo tình hình thực tế.'))
grammar(d,11,1,('“是”字句','Câu có “是”'),'表示人或事物等同什么或类属什么，否定形式是“不是”。\n\n（1）我是法国人。\n（2）她是中文老师。\n（3）我老师不是法国人。','Biểu thị một người hoặc sự vật là gì hoặc thuộc loại nào; dạng phủ định là “不是”.\n\n(1) Tôi là người Pháp.\n(2) Cô ấy là giáo viên tiếng Trung.\n(3) Giáo viên của tôi không phải người Pháp.','Wǒ shì Fǎguó rén.\nTā shì Zhōngwén lǎoshī.\nWǒ lǎoshī bú shì Fǎguó rén.')
grammar(d,11,2,('结构助词“的”','Trợ từ kết cấu “的”'),'结构助词“的”在定语和中心语之间，表达领属关系。\n\n（1）白家月的中文老师\n（2）你的名字\n\n如果“的”前边是人称代词，后边是亲属称谓或指人的名词，“的”可省略。','Trợ từ kết cấu “的” đứng giữa định ngữ và từ trung tâm, biểu thị quan hệ sở hữu.\n\n(1) Giáo viên tiếng Trung của Bạch Gia Nguyệt\n(2) Tên của bạn\n\nNếu phía trước “的” là đại từ nhân xưng và phía sau là từ xưng hô họ hàng hoặc danh từ chỉ người, có thể lược bỏ “的”.','Bái Jiāyuè de Zhōngwén lǎoshī\nNǐ de míngzi')
grammar(d,12,3,('省略“的” · 大声朗读','Lược bỏ “的” · Đọc to'),'（1）我老师\n（2）我学生\n（3）你同学\n（4）我妈妈（māma, mother）','(1) Giáo viên của tôi\n(2) Học sinh của tôi\n(3) Bạn học của bạn\n(4) Mẹ của tôi','Wǒ lǎoshī\nWǒ xuéshēng\nNǐ tóngxué\nWǒ māma')
f=openfield('第1空','Chỗ trống 1',('老师','giáo viên'));f['id']='blank-1'
activity(d,12,'complete-dialogues','open-dialogue-completion',('完成对话','Hoàn thành hội thoại'),('完成对话。','Hoàn thành hội thoại.'),('（1）A：这是我（　）。\n　　 B：老师，您好！','(1) A: Đây là (　) của tôi.\n　　B: Chào thầy/cô ạ!'),[f],n=1)
fs=[openfield('第1空','Chỗ trống 1',('中文老师','giáo viên tiếng Trung')),openfield('第2空','Chỗ trống 2',('中文老师','giáo viên tiếng Trung'))]
for i,f in enumerate(fs,1):f['id']=f'blank-{i}'
activity(d,12,'complete-dialogues','open-dialogue-completion',('完成对话','Hoàn thành hội thoại'),('完成对话。','Hoàn thành hội thoại.'),('（2）李文：请问，你（　）叫什么名字？\n　　白家月：我（　）叫王一飞。','(2) Lý Văn: Xin hỏi, (　) của bạn tên là gì?\n　　Bạch Gia Nguyệt: (　) của tôi tên là Vương Nhất Phi.'),fs,n=2)
reading(d,12,2,('在教室里，下课后，安妮在看陈天中手机里的照片。','Sau giờ học, trong lớp, Annie xem ảnh trong điện thoại của Trần Thiên Trung.'),[('安妮','这是谁？','Zhè shì shéi?','Đây là ai?'),('陈天中','这是我女朋友。','Zhè shì wǒ nǚpéngyou.','Đây là bạn gái tôi.'),('安妮','你女朋友是哪国人？','Nǐ nǚpéngyou shì nǎ guó rén?','Bạn gái của bạn là người nước nào?'),('陈天中','她也是泰国人。','Tā yě shì Tàiguó rén.','Cô ấy cũng là người Thái Lan.')],(12,'l03-text-2-photo',(398,678,741,846),('安妮和陈天中在看手机照片。','Annie và Trần Thiên Trung xem ảnh trên điện thoại.')))
tip(d,12,1,'“谁”也可以读成“shuí”。','“谁” cũng có thể đọc là “shuí”.')
vocab(d,13,2,[(3,'这','zhè','pron.','đại từ',('这','đây; này')),(4,'谁','shéi/shuí','pron.','đại từ',('谁','ai')),(5,'女朋友','nǚpéngyou','n.','danh từ',('女朋友','bạn gái')),(6,'哪','nǎ','pron.','đại từ',('哪','nào')),(7,'国','guó','n.','danh từ',('国；国家','nước; quốc gia')),(8,'她','tā','pron.','đại từ',('她','cô ấy'))],[(4,'泰国','Tàiguó',('泰国','Thái Lan'))])
role(d,13,2);pair(d,13,2,('两人一组，根据老师给出的图片模仿课文互相问答。','Làm việc theo cặp; dựa vào hình do giáo viên đưa ra để hỏi đáp theo bài đọc.'))
reading(d,14,3,('在家里，王一雪给王一飞打视频电话。','Ở nhà, Vương Nhất Tuyết gọi video cho Vương Nhất Phi.'),[('王一雪','喂，一飞！','Wèi, Yīfēi!','A lô, Nhất Phi!'),('王一飞','姐姐！','Jiějie!','Chị!'),('王一雪','你工作还忙吗？','Nǐ gōngzuò hái máng ma?','Công việc của em vẫn bận à?'),('王一飞','对，还很忙。你也很忙吗？','Duì, hái hěn máng. Nǐ yě hěn máng ma?','Vâng, vẫn rất bận. Chị cũng rất bận à?'),('王一雪','我不太忙。我们很想你。','Wǒ bú tài máng. Wǒmen hěn xiǎng nǐ.','Chị không bận lắm. Mọi người rất nhớ em.'),('王一飞','我也想你们。','Wǒ yě xiǎng nǐmen.','Em cũng nhớ mọi người.')],(13,'l03-text-3-photo',(138,752,799,1106),('王一雪和王一飞打视频电话。','Vương Nhất Tuyết và Vương Nhất Phi gọi video.')))
vocab(d,14,3,[(9,'喂','wèi','int.','thán từ',('喂（电话用语）','a lô')),(10,'姐姐','jiějie','n.','danh từ',('姐姐','chị gái')),(11,'工作','gōngzuò','n.','danh từ',('工作','công việc')),(12,'还','hái','adv.','phó từ',('还；仍然','vẫn')),(13,'忙','máng','adj.','tính từ',('忙','bận')),(14,'吗','ma','part.','trợ từ',('用于问句末尾','dùng ở cuối câu hỏi')),(15,'对','duì','adj.','tính từ',('正确','đúng')),(16,'太','tài','adv.','phó từ',('太；过于','quá')),(17,'我们','wǒmen','pron.','đại từ',('我们','chúng tôi; chúng ta')),(18,'想','xiǎng','v.','động từ',('想念','nhớ'))])
role(d,14,3)
grammar(d,14,4,('用“吗”的是非问句','Câu hỏi có “吗”'),'“吗”是语气助词，通常在句子末尾，表示疑问。基本结构：……吗？\n\n（1）你也很忙吗？\n（2）你是他的中文老师吗？\n（3）你有（yǒu, have）姐姐吗？','“吗” là trợ từ ngữ khí, thường đứng ở cuối câu để biểu thị câu hỏi. Cấu trúc cơ bản: ……吗？\n\n(1) Bạn cũng rất bận à?\n(2) Bạn là giáo viên tiếng Trung của anh ấy phải không?\n(3) Bạn có chị gái không?','Nǐ yě hěn máng ma?\nNǐ shì tā de Zhōngwén lǎoshī ma?\nNǐ yǒu jiějie ma?')
opts=[{'id':i,'zh':z,'py':py,'vi':v} for i,z,py,v in [('A','哪','nǎ','nào'),('B','吗','ma','trợ từ câu hỏi'),('C','谁','shéi','ai'),('D','中国人','Zhōngguó rén','người Trung Quốc'),('E','想','xiǎng','nhớ')]]
clozes=[('（1）你工作忙______？','(1) Công việc của bạn bận ______?',['B']),('（2）我很______你们。','(2) Tôi rất ______ mọi người.',['E']),('（3）白家月：你是______国人？\n　　李文：我是______。','(3) Bạch Gia Nguyệt: Bạn là người nước ______?\n　　Lý Văn: Tôi là ______.',['A','D']),('（4）白家月：她是______？\n　　安妮：她是陈天中的女朋友。','(4) Bạch Gia Nguyệt: Cô ấy là ______?\n　　Annie: Cô ấy là bạn gái của Trần Thiên Trung.',['C'])]
for n,(z,v,answers) in enumerate(clozes,1):
 fs=[{'id':f'blank-{i}','label':C(f'第{i}空',f'Chỗ trống {i}'),'input':'select','assessment':'answer-key','options':opts,'answer':ans,'answerSource':{'sha256':A,'pdfPage':1,'section':'第3课，P15，选词填空','ordinal':n},'source':src(15,'comprehensive-cloze',n)} for i,ans in enumerate(answers,1)]
 activity(d,15,'comprehensive-cloze','word-bank-cloze',('选词填空','Chọn từ điền vào chỗ trống'),('选词填空。','Chọn từ hoặc cụm từ thích hợp để điền vào chỗ trống.'),(z,v),fs,n=n)
for n,(z,v,refs,photo) in enumerate([
 ('他______陈天中，是泰国人，\n他______也______泰国人。','Anh ấy ______ Trần Thiên Trung, là người Thái Lan;\n______ của anh ấy cũng ______ người Thái Lan.', [('叫','tên là'),('女朋友','bạn gái'),('是','là')],(15,'l03-picture-01',(175,730,467,895),('陈天中在树林里。','Trần Thiên Trung giữa những hàng cây.'))),
 ('王一飞是______中文老师，\n她______很______。','Vương Nhất Phi là giáo viên tiếng Trung ______;\ncô ấy ______ rất ______.', [('我','của tôi'),('工作','công việc'),('忙','bận')],(15,'l03-picture-02',(496,730,794,895),('王一飞在办公室里工作。','Vương Nhất Phi làm việc trong văn phòng.')))
 ],1):
 fs=[openfield(f'第{i}空',f'Chỗ trống {i}',r) for i,r in enumerate(refs,1)]
 for i,f in enumerate(fs,1):f['id']=f'blank-{i}';f['input']='text'
 a=activity(d,15,'picture-description','picture-description',('看图描述','Miêu tả tranh'),('用本课新学的词语和语言点描述图片。','Dùng từ ngữ và điểm ngữ pháp mới học trong bài để miêu tả hình.'),(z,v),fs,n=n)
 a['figure'],a['figureSHA256']=crop(d,*photo)
activity(d,16,'classroom','group-work',('课堂活动 · 多人活动','Hoạt động trên lớp · Làm việc theo nhóm'),('3～4人一组，互相介绍，然后请一组同学展示。','Làm việc theo nhóm 3–4 người, giới thiệu lẫn nhau; sau đó một nhóm trình bày.'),('3～4人一组，互相介绍，然后请一组同学展示。','Làm việc theo nhóm 3–4 người, giới thiệu lẫn nhau; sau đó một nhóm trình bày.'),[openfield('活动记录（可选）','Ghi lại hoạt động (không bắt buộc)',optional=True)],example=C('我叫白家月，我是法国人。陈天中是我同学，他是……。……','Tôi tên là Bạch Gia Nguyệt, tôi là người Pháp. Trần Thiên Trung là bạn học của tôi, anh ấy là…… ……'))
tongue(d,16,'四是四，十是十。\n十四是十四，四十是四十。','Sì shì sì, shí shì shí.\nShísì shì shísì, sìshí shì sìshí.','Bốn là bốn, mười là mười.\nMười bốn là mười bốn, bốn mươi là bốn mươi.','3-7')
fs=[openfield('我已经记住并会使用的词语','Những từ tôi đã nhớ và biết dùng',optional=True),openfield('我还没记住的词语','Những từ tôi chưa nhớ',optional=True)]
for i,f in enumerate(fs,1):f['id']=f'blank-{i}'
a=activity(d,16,'summary-vocabulary','self-review-table',('学习小结 · 词语学习','Tổng kết việc học · Từ vựng'),('填写第1～3课的学习情况。','Điền tình hình học tập từ bài 1 đến bài 3.'),('1～3课我的学习情况。','Tình hình học tập của tôi từ bài 1 đến bài 3.'),fs)
a['table']={'columns':[C('词语学习','Học từ vựng'),C('记录','Ghi lại')],'rows':[{'id':'remembered','cells':[{'text':fs[0]['label']},{'fieldId':'blank-1'}]},{'id':'not-remembered','cells':[{'text':fs[1]['label']},{'fieldId':'blank-2'}]}]}
rows=[('汉语的基本语序，例如：我叫白家月。','Trật tự từ cơ bản trong tiếng Trung, ví dụ: Tôi tên là Bạch Gia Nguyệt.'),('招呼语，例如：你好！','Lời chào, ví dụ: Xin chào!'),('致谢语，例如：谢谢！','Lời cảm ơn, ví dụ: Cảm ơn!'),('告别语，例如：再见！','Lời tạm biệt, ví dụ: Tạm biệt!'),('致歉语，例如：对不起。','Lời xin lỗi, ví dụ: Xin lỗi.'),('自我介绍、互相介绍，例如：我叫李文。','Tự giới thiệu và giới thiệu lẫn nhau, ví dụ: Tôi tên là Lý Văn.'),('“是”字句，例如：我是学生。','Câu có “是”, ví dụ: Tôi là học sinh.'),('结构助词“的”，例如：我的中文老师','Trợ từ kết cấu “的”, ví dụ: Giáo viên tiếng Trung của tôi'),('用“吗”的是非问句，例如：你是学生吗？','Câu hỏi có “吗”, ví dụ: Bạn là học sinh phải không?')]
a=activity(d,17,'summary-skills','self-review-table',('我理解并会用','Tôi hiểu và biết dùng'),('分别记录“理解”和“会用”。','Đánh giá riêng mức độ “hiểu” và “biết dùng”.'),('',''))
a['table']={'columns':[C('语言内容','Nội dung ngôn ngữ'),C('理解','Hiểu'),C('会用','Biết dùng')],'rows':[]}
for i,(z,v) in enumerate(rows,1):
 row={'id':f'skill-{i}','source':src(17,'summary-skills',i),'cells':[{'text':C(z,v)}]}
 for name,label in [('understand',('理解','Hiểu')),('use',('会用','Biết dùng'))]:
  fid=f'skill-{i}-{name}';a['fields'].append({'id':fid,'label':C(f'{i} · {label[0]}',f'{i} · {label[1]}'),'input':'select','assessment':'ungraded','required':False,'options':[{'id':'yes','zh':'已做到','py':'yǐ zuòdào','vi':'Đã làm được'},{'id':'practice','zh':'还需练习','py':'hái xū liànxí','vi':'Cần luyện thêm'}]});row['cells'].append({'fieldId':fid})
 a['table']['rows'].append(row)
activity(d,17,'summary-improvement','reflection',('我需要努力的','Điều tôi cần cố gắng'),('写下需要努力的地方。','Ghi điều cần cố gắng thêm.'),('我需要努力的','Điều tôi cần cố gắng'),[openfield('学习反思','Suy ngẫm về việc học',optional=True)])
cover(d,range(10,18),{10:['objectives-3','text1-context-dialogue-photo'],11:['vocabulary-2','proper-nouns-3','role-read','pair','shi-3-examples','de-2-examples-omission-rule'],12:['de-omission-4-groups','complete-dialogue-1-field','complete-dialogue-2-fields','text2-context-dialogue-photo','original-shui-tip'],13:['vocabulary-6','proper-noun-1','role-read','picture-based-pair','text3-context-photo'],14:['text3-dialogue-6-lines','vocabulary-10','role-read','ma-rule'],15:['ma-3-examples','official-cloze-4-items-5-fields','picture-description-2-items-6-fields'],16:['group-activity-source-example','tongue-twister-2-lines','vocabulary-self-review-2x2'],17:['self-review-9x3','learning-reflection']})
d['textbookCorrections']=[{'target':'textbook-l03-text-3-line-05','field':'py','suggested':'Wǒ bú tài máng. Wǒmen hěn xiǎng nǐ.','printedPage':14,'issue':'不太中“不”在第四声前读bú；候选保持原书标注。'}]
save(d)
print(json.dumps({'status':'candidate-written-independent-review-pending','lessons':[{'lesson':n,'activities':len(json.loads((ROOT/f'lesson-{n:02}.json').read_text())['activities'])} for n in (1,2,3)],'textbookSHA256':T,'answerBookSHA256':A},ensure_ascii=False))
