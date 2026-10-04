import json, hashlib
from pathlib import Path
import fitz

OUT=Path(__file__).parent
ROOT=OUT.parents[3]
PDF=Path('/workspace/scratch/67c4ddcee7f7/upload/新HSK教程1(HSK3.0) (郭风岚、汤旭编著) (z-library.sk, 1lib.sk, z-lib.sk) (1)(3).pdf')
ANS=Path('/workspace/scratch/67c4ddcee7f7/upload/《新HSK教程1》客观题答案(5).pdf')
TH=hashlib.sha256(PDF.read_bytes()).hexdigest(); AH=hashlib.sha256(ANS.read_bytes()).hexdigest()
doc=fitz.open(PDF)
book=json.loads((ROOT/'hsk1-app/content/textbook.json').read_text())
VERSION='source-resume-20261004-candidate-1'
def C(z,v):return {'zh':z,'vi':v}
def src(page,section,n=1):return dict(sourceRevision='hsk1-print-2026-01',textbookSHA256=TH,printedPage=page,pdfPage=page+15,section=section,ordinal=n)
def new(lesson):return dict(schema=1,edition='hsk1-print-2026-01',lesson=lesson,version=VERSION,scope=f'lesson-{lesson}-candidate',textbookSHA256=TH,answerBookSHA256=AH,editorialStatus='candidate-awaiting-independent-review',activities=[],figures=[],coverage=[],textbookCorrections=[])
def act(d,p,s,n,kind,title,instruction,prompt,fields=None,**kw):
 a=dict(id=f'hsk1-original-2026-l{d["lesson"]:02}-p{p:03}-{s}-{n:02}',version=VERSION,lesson=d['lesson'],kind=kind,source=src(p,s,n),title=title,instruction=instruction,prompt=prompt,fields=fields or [],**kw);d['activities'].append(a);return a
def opts(items):return [dict(id=chr(65+i),zh=z,py=p,vi=v) for i,(z,p,v) in enumerate(items)]
def answer(i,options,key,ap,section,ordinal):return dict(id=f'blank-{i}',label=C(f'第{i}空',f'Chỗ trống {i}'),input='select',options=options,assessment='answer-key',answer=key,answerSource=dict(sha256=AH,pdfPage=ap,section=section,ordinal=ordinal))
def free(i,ref=None,label=None,input='text',note=None,required=True):
 f=dict(id=f'blank-{i}',label=label or C(f'第{i}空',f'Chỗ trống {i}'),input=input,assessment='ungraded')
 if ref:f.update(reference=ref,referenceProvenance='editorial-model-not-unique',feedbackNote=note or C('这是一种参考表达，不是唯一答案；请结合上下文检查语义和句式。','Đây là một cách diễn đạt tham khảo, không phải đáp án duy nhất; hãy kiểm tra ý nghĩa và mẫu câu trong ngữ cảnh.'))
 if not required:f['required']=False
 return f
def fig(d,page,ident,box,alt,cell):
 # Coordinates refer to the visually inspected 1.5x rendered source (879 x 1197).
 pdfpage=doc[page+14];r=fitz.Rect(*[v/1.5 for v in box]);name=f'l{d["lesson"]:02}-{ident}';path=OUT/'figures'/f'{name}.png'
 pdfpage.get_pixmap(matrix=fitz.Matrix(2,2),clip=r).save(path);sha=hashlib.sha256(path.read_bytes()).hexdigest()
 d['figures'].append(dict(id=name,file=f'figures/{name}.png',alt=alt,source=dict(textbookSHA256=TH,printedPage=page,pdfPage=page+15,cell=cell,cropPdfPoints=list(r)),kind='original-crop',sha256=sha,note=C('教材原图裁切。','Hình được cắt trực tiếp từ sách.')))
 return dict(figure=name,figureSHA256=sha)
def warm(d,page,words,keys,ap,boxes,alts):
 op=opts(words)
 for i,(key,box,alt) in enumerate(zip(keys,boxes,alts),1):
  act(d,page,'warmup',i,'image-match',C('热身 · 图片配词','Khởi động · Ghép hình và từ'),C('给下面的词语选择对应的图片。','Ghép các từ hoặc cụm từ dưới đây với hình tương ứng.'),C(f'图片{i}',f'Hình {i}'),[answer(1,op,key,ap,f'P{page}，热身',i)],**fig(d,page,f'warmup-{i:02}',box,alt,i))
def listen(d,page,textno,n,prompt,words,key,ap):
 act(d,page,f'listen-text{textno}',n,'listening-choice',C('听两遍，选答案','Nghe hai lần và chọn đáp án'),C('听两遍对话，选择正确答案。','Nghe hội thoại hai lần rồi chọn đáp án đúng.'),prompt,[answer(1,opts(words),key,ap,f'课文{textno}，听两遍对话，选择正确答案',n)],audio=dict(sceneId=f'textbook-l{d["lesson"]:02}-text-{textno}',track=f'{d["lesson"]}-{textno*2-1}',plays=2,verifiedByListening=False))
def cloze(d,page,words,items,aps):
 op=opts(words)
 for i,(prompt,keys) in enumerate(items,1):
  act(d,page,'cloze',i,'word-bank-cloze',C('选词填空','Chọn từ điền vào chỗ trống'),C('选词填空。','Chọn từ thích hợp điền vào chỗ trống.'),prompt,[answer(j,op,k,aps[i-1],f'P{page}，选词填空',i) for j,k in enumerate(keys,1)])
def picture(d,page,n,box,prompt,refs,alt):
 act(d,page,'picture',n,'picture-description',C('看图表达','Diễn đạt theo hình'),C('用本课新学的词语和语言点描述图片。','Dùng từ ngữ và điểm ngữ pháp mới trong bài để miêu tả hình.'),prompt,[free(i,r) for i,r in enumerate(refs,1)],**fig(d,page,f'picture-{n:02}',box,alt,n))
def pair(d,page,section,n,instruction,example=None,roles=None):
 a=act(d,page,section,n,'pair-work',C('对话活动','Hoạt động hội thoại'),instruction,C('记录你们的对话。','Ghi lại hội thoại của các bạn.'),[free(1,label=C('对话记录','Nội dung hội thoại'),input='textarea',required=False)])
 if example:a['example']=example
 if roles:a['participants']=roles
 return a
def read(d,page,section,n,title,prompt):return act(d,page,section,n,'read-aloud',title,C('大声朗读。','Đọc thành tiếng.'),prompt)
def scene_role(d,page,no):
 l=next(l for l in book['lessons'] if l['id']==d['lesson']);scene=l['scenes'][no-1]
 role=pair(d,page,f'role-text{no}',1,C('分角色朗读对话。','Phân vai đọc hội thoại.'),C('\n'.join(f'{x["s"]}：{x["zh"]}' for x in scene['lines']),'\n'.join(x['vn'] for x in scene['lines'])))
 role['audio']=dict(sceneId=scene['id'],track=f'{d["lesson"]}-{no*2-1}',plays=1,verifiedByListening=False)
 role['sourceSceneId']=scene['id']
def comprehension(d,page,no,items):
 for i,(prompt,ref) in enumerate(items,1):
  act(d,page,f'comprehension-text{no}',i,'reading-response',C('根据课文内容回答问题','Trả lời câu hỏi theo bài đọc'),C('根据课文内容回答问题。','Trả lời theo nội dung bài đọc.'),prompt,[free(1,ref)],sourceSceneId=f'textbook-l{d["lesson"]:02}-text-{no}')

def support(d,p,s,n,title,prompt):return act(d,p,s,n,'reference',title,C('阅读教材内容。','Đọc nội dung trong sách.'),prompt)
def grammar(d,p,s,n,title,explanation,examples):
 a=read(d,p,s,n,title,examples);a['instruction']=C(explanation['zh']+'\n大声朗读。',explanation['vi']+'\nĐọc thành tiếng.');return a
def objective(d,p,cp):return support(d,p,'objectives',1,C('本课目标','Mục tiêu bài học'),cp)
def vocab(d,p,no,start,rows,proper=False):
 l=next(l for l in book['lessons'] if l['id']==d['lesson']); lookup={v['zh']:v for v in l['vocab']}
 a=support(d,p,'proper-nouns' if proper else 'vocabulary',no,C('专有名词' if proper else '生词','Danh từ riêng' if proper else 'Từ mới'),C('按原书顺序朗读词语。','Đọc các từ theo thứ tự trong sách.'))
 a['table']=dict(columns=[C('序号','STT'),C('词语','Từ'),C('拼音','Phiên âm'),C('词性（原书）','Từ loại (sách gốc)'),C('原书英文释义','Nghĩa tiếng Anh trong sách'),C('越南语释义','Nghĩa tiếng Việt')],rows=[])
 for idx,row in enumerate(rows,start):
  z,py,pos,en=row.split('|');v=lookup[z];vi=v['vn']; cells=[C(str(idx),str(idx)),C(z,vi),C(py,py),C(pos,pos),C(en,en),C(vi,vi)]
  a['table']['rows'].append(dict(id=f'word-{idx}',cells=[dict(text=x) if x['zh'] or x['vi'] else {} for x in cells]))
 a['audio']=dict(sceneId=f'textbook-l{d["lesson"]:02}-vocab-{no}',track=f'{d["lesson"]}-{no*2}',plays=1,verifiedByListening=False)
 # Current audio resolver accepts scenes only. Do not invent an available scene for vocabulary.
 a['printAudioTrack']=a.pop('audio')['track']
 return a
def attach(d,page,no,box,alt):
 a=next(a for a in d['activities'] if a['source']['section']==f'role-text{no}');a.update(fig(d,page,f'scene-{no:02}',box,alt,no));return a
# These Vietnamese descriptions explain each original Chinese cloze without
# inserting a Chinese option into a Vietnamese sentence or revealing its key.
CLOZE_SEMANTICS={
 '今天＿＿。':'Nói ngày tháng hôm nay bằng câu tiếng Trung.',
 '杨同乐有一个＿＿电脑。':'Dương Đồng Lạc có một máy tính; chọn từ miêu tả máy tính đó.',
 '王一雪：你会做这两个＿＿吗？\n杨同乐：我会做。':'Vương Nhất Tuyết hỏi Dương Đồng Lạc có biết làm hai thứ này không; anh ấy trả lời là biết.',
 '王一雪：你的电脑＿＿好看！\n杨同乐：我也很＿＿。':'Vương Nhất Tuyết khen máy tính đẹp; Dương Đồng Lạc nói cảm nhận của mình về nó.',
 '我想＿＿超市＿＿牛奶。':'Nói ý định liên quan đến siêu thị và sữa; chọn hai động từ thích hợp.',
 '我们＿＿出租车去西安饭店吃晚饭。':'Nói phương tiện chúng tôi dùng để đến nhà hàng Tây An ăn tối.',
 '妈妈：你想吃什么？孩子：我想吃＿＿。':'Mẹ hỏi con muốn ăn gì; hoàn thành câu trả lời của người con.',
 '老师：你的手机号是＿＿？\n学生：我的手机号是13126975002。':'Giáo viên hỏi số điện thoại di động; học sinh trả lời bằng số 13126975002.',
 '她星期天没有＿＿。':'Nói việc cô ấy không có vào Chủ nhật.',
 '我们中午＿＿下课，下午两点＿＿吧。':'Nói giờ tan học vào buổi trưa rồi đề nghị gặp nhau lúc hai giờ chiều.',
 '白家月：对不起，我＿＿有事呢，你去吧。\n李文：好的，你忙吧。':'Bạch Gia Nguyệt xin lỗi vì có việc vào thời điểm đang nói và bảo Lý Văn đi; Lý Văn đồng ý.',
 '王一雪：你今天晚上几点去＿＿上班？\n刘明：晚上八点。':'Vương Nhất Tuyết hỏi tối nay Lưu Minh đến nơi làm việc lúc mấy giờ; anh ấy trả lời tám giờ tối.',
 '胡医生的爸爸＿＿医院工作。':'Nói nơi làm việc của bố bác sĩ Hồ; chọn từ nối nơi chốn với hành động làm việc.',
 '我下午两点＿＿到学校。':'Nói khả năng đến trường lúc hai giờ chiều.',
 '陈天中：小猫在＿＿呢？\n白家月：小猫在＿＿下。':'Trần Thiên Trung hỏi vị trí của mèo con; Bạch Gia Nguyệt trả lời nó ở dưới một đồ vật.',
 '白家月：我们去＿＿，你去吗？\n李文：我现在有事，不能去。':'Bạch Gia Nguyệt hỏi Lý Văn có cùng đi đến địa điểm đó không; anh ấy từ chối vì đang có việc.',
}
def qvi(text):return C(text,CLOZE_SEMANTICS[text])
def ref_table(d,p,s,n,title,columns,rows,instruction=None):
 a=support(d,p,s,n,title,C('保留原表的行列顺序。','Giữ nguyên thứ tự hàng và cột của bảng gốc.'));a['kind']='reference-table'
 if instruction:a['instruction']=instruction
 headerless=all(not c['zh'] and not c['vi'] for c in columns)
 # Preserve genuinely blank source headers; do not invent a source heading.
 a['table']=dict(columns=columns,rows=[dict(id=f'row-{i}',cells=[dict(text=x) if x['zh'] or x['vi'] else {} for x in r]) for i,r in enumerate(rows,1)])
 if headerless:a['table']['headerless']=True
 return a
TITLE_PINYIN={
 5:(27,'Jīntiān wǒ xiūxi'),
 6:(35,'Nǐ de shǒujīhào shì duōshao?'),
 7:(45,'Wǒ wǎnshang liù diǎn bàn xiàbān'),
 8:(54,'Wǒ bàba yě zài yīyuàn gōngzuò'),
}
LINE_PINYIN_CORRECTIONS={
 6:[('text-1-line-01',36,'Jiāyuè, nǐ de shǒujīhào shì duōshao?'),('text-2-line-01',37,'Jiāyuè, míngtiān nǐ qù nǎr?'),('text-3-line-01',39,'Xīngqītiān wǒmen qù nǎr chī wǎnfàn?')],
 7:[('text-1-line-02',46,'Zǎoshang bā diǎn sìshí.'),('text-3-line-01',51,'Wéi, nǐ zài nǎr ne?'),('text-3-line-03',51,'Wǒ wǎnshang liù diǎn bàn xiàbān.')],
 8:[('text-1-line-02',55,'Wǒ méi kànjiàn, tā zài nǎr ne?'),('text-2-line-01',57,'Wǒmen zài nǎr jiàn ne?')],
}
def finish(d,first,last):
 for tail,page,py in LINE_PINYIN_CORRECTIONS.get(d['lesson'],[]):
  d['textbookCorrections'].append(dict(target=f'textbook-l{d["lesson"]:02}-{tail}',field='py',printedPage=page,suggested=py,issue='按源页课文拼音纠正轻声、儿化或喂的第二声；仅展示修订，不改冻结历史题库。'))
 if d['lesson']==6:
  d['textbookCorrections'].append(dict(target='textbook-l06-v014',field='py',printedPage=40,suggested='nàbiān',issue='主教材nàbian与原书不同；来源词表拼音为nàbiān，仅展示修订，不改冻结历史题库。'))
 title_page,title_py=TITLE_PINYIN[d['lesson']]
 d['textbookCorrections'].append(dict(target=f'textbook-l{d["lesson"]:02}-title',field='title_py',printedPage=title_page,suggested=title_py,issue='按原书标题拼音恢复轻声音节；仅展示修订，不改冻结历史题库。'))
 d['coverage']=[dict(printedPage=p,pdfPage=p+15,visualReview='author-inspected',activityIds=[a['id'] for a in d['activities'] if a['source']['printedPage']==p]) for p in range(first,last+1)]
 d['activities'].sort(key=lambda a:(a['source']['printedPage'],-100 if a['source']['section']=='objectives' else 0))
 d['integrationNotes']=['Candidate pending independent source review and browser acceptance.','All images are exact source crops with recorded PDF coordinates.','Open references are editorial, non-unique and ungraded.','Original vocabulary keeps sequence, pronunciation, POS and English gloss alongside Vietnamese.','printAudioTrack records only the printed vocabulary audio number; no invented scene resolver ID.','All listening/audio flags remain false pending human listening.']
 (OUT/f'lesson-{d["lesson"]:02}.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

d=new(5)
objective(d,27,C('（1）能听懂、看懂并按照中文习惯描述事件、行为发生的日期。\n（2）能听懂并使用能愿动词“会”表达懂得或有能力做事情。\n（3）掌握名词谓语句的用法。','(1) Hiểu khi nghe, đọc và mô tả ngày xảy ra sự việc, hành động theo cách nói tiếng Trung.\n(2) Hiểu khi nghe và dùng “会” để nói biết hoặc có khả năng làm việc gì.\n(3) Nắm cách dùng câu vị ngữ danh từ.'))
warm(d,27,[('2025年5月','èr líng èr wǔ nián wǔ yuè','tháng 5 năm 2025'),('星期一','Xīngqīyī','thứ Hai'),('电脑','diànnǎo','máy tính'),('做饭','zuò fàn','nấu ăn'),('休息','xiūxi','nghỉ ngơi'),('饺子','jiǎozi','sủi cảo')],'AEFCDB',2,
 [(138,627,337,763),(367,627,567,763),(595,627,795,763),(138,790,337,926),(367,790,567,926),(595,790,795,926)],
 [C('2025年5月的月历。','Lịch tháng 5 năm 2025.'),C('一人靠在椅背上放松。','Một người tựa lưng vào ghế thư giãn.'),C('一盘食物，旁边有蘸料。','Một đĩa thức ăn, bên cạnh có nước chấm.'),C('桌上有屏幕和键盘。','Trên bàn có màn hình và bàn phím.'),C('两人在厨房准备食物。','Hai người chuẩn bị đồ ăn trong bếp.'),C('木块上写着星期一。','Các khối gỗ ghi 星期一.')])
support(d,28,'original-tip',1,C('小语助力','Gợi ý của Tiểu Ngữ'),C('“9月8号”也说“9月8日”。','“9月8号” cũng có thể nói là “9月8日”.'))
support(d,28,'original-tip',2,C('小语助力','Gợi ý của Tiểu Ngữ'),C('“星期日”也说“星期天”。','“星期日” cũng có thể nói là “星期天”.'))
vocab(d,28,1,1,['今天|jīntiān|n.|today','号|hào|m.|date','月|yuè|n.|month','日|rì|m.|day','星期|xīngqī|n.|week','星期日|Xīngqīrì|n.|Sunday','星期天|Xīngqītiān|n.|Sunday','休息|xiūxi|v.|have a rest'])
scene_role(d,28,1);attach(d,28,1,(433,260,743,537),C('翻开的日历标记九月08。','Lịch mở ghi tháng 9, ngày 08.'))
pair(d,28,'pair-text1',1,C('两人一组，根据实际情况对话。','Làm việc theo cặp, hội thoại theo tình huống thực tế.'))
support(d,29,'date-explanation',1,C('时间的表达（1）','Cách biểu đạt thời gian (1)'),C('本课学习日期、星期的表达。汉语日期、星期的表达顺序是：年→月→日/号→星期。','Bài này học cách nói ngày tháng và thứ. Thứ tự trong tiếng Trung: năm → tháng → ngày (日/号) → thứ.'))
ref_table(d,29,'date-examples',1,C('日期 · 大声朗读','Ngày tháng · Đọc thành tiếng'),[C('拼音','Phiên âm'),C('日期','Ngày tháng'),C('原书英文','Tiếng Anh trong sách')],[[C('yī jiǔ jiǔ èr nián wǔ yuè shíliù rì / hào, Xīngqīliù','yī jiǔ jiǔ èr nián wǔ yuè shíliù rì / hào, Xīngqīliù'),C('1992年5月16日/号，星期六','Thứ Bảy, ngày 16 tháng 5 năm 1992'),C('Saturday, May 16, 1992','Saturday, May 16, 1992')],[C('èr líng èr sì nián shí yuè èrshí’èr rì / hào, Xīngqī’èr','èr líng èr sì nián shí yuè èrshí’èr rì / hào, Xīngqī’èr'),C('2024年10月22日/号，星期二','Thứ Ba, ngày 22 tháng 10 năm 2024'),C('Tuesday, October 22, 2024','Tuesday, October 22, 2024')]])
months=[('一月','Yīyuè','January','tháng Một'),('二月','Èryuè','February','tháng Hai'),('三月','Sānyuè','March','tháng Ba'),('四月','Sìyuè','April','tháng Tư'),('五月','Wǔyuè','May','tháng Năm'),('六月','Liùyuè','June','tháng Sáu'),('七月','Qīyuè','July','tháng Bảy'),('八月','Bāyuè','August','tháng Tám'),('九月','Jiǔyuè','September','tháng Chín'),('十月','Shíyuè','October','tháng Mười'),('十一月','Shíyīyuè','November','tháng Mười Một'),('十二月','Shí’èryuè','December','tháng Mười Hai')]
ref_table(d,29,'months-table',1,C('十二个月','Mười hai tháng'),[C('','')]*6,[[C(f'{py}\n{zh}\n{en}',vi) for zh,py,en,vi in months[:6]],[C(f'{py}\n{zh}\n{en}',vi) for zh,py,en,vi in months[6:]]])
days=[('星期一','Xīngqīyī','Monday','thứ Hai'),('星期二','Xīngqī’èr','Tuesday','thứ Ba'),('星期三','Xīngqīsān','Wednesday','thứ Tư'),('星期四','Xīngqīsì','Thursday','thứ Năm'),('星期五','Xīngqīwǔ','Friday','thứ Sáu'),('星期六','Xīngqīliù','Saturday','thứ Bảy'),('星期日/星期天','Xīngqīrì / Xīngqītiān','Sunday','Chủ nhật')]
for i,subset in enumerate([days[:4],days[4:]],1):
 a=ref_table(d,29,'weekdays-table-row',i,C('星期表 · '+('上行' if i==1 else '下行'),'Bảng các thứ · '+('hàng trên' if i==1 else 'hàng dưới')),[C('','')]*len(subset),[[C(f'{py}\n{zh}\n{en}',vi) for zh,py,en,vi in subset]]);a['sourceTableGroup']='p029-weekdays';a['sourceRow']=i
read(d,29,'date-read',1,C('时间的表达（1）· 例句','Cách biểu đạt thời gian (1) · Ví dụ'),C('今天9月8号。\n今天是2025年5月22号。\n明天是2024年8月18号，星期天。','Hôm nay ngày 8 tháng 9.\nHôm nay là ngày 22 tháng 5 năm 2025.\nNgày mai là Chủ nhật, ngày 18 tháng 8 năm 2024.'))
grammar(d,30,'grammar-nominal',1,C('名词谓语句','Câu vị ngữ danh từ'),C('名词谓语句谓语部分只有名词或名词性成分，这部分词语一般是表达时间、日期、年龄等的词语。（说明在第29页，例句在第30页。）','Vị ngữ của câu vị ngữ danh từ chỉ gồm danh từ hoặc thành phần danh từ, thường biểu thị thời gian, ngày tháng, tuổi, v.v. (Giải thích ở trang 29, ví dụ ở trang 30.)'),C('（1）A：今天几号？\nB：今天5月1号。\n（2）我妹妹12岁。','(1) A: Hôm nay ngày mấy?\nB: Hôm nay ngày 1 tháng 5.\n(2) Em gái tôi 12 tuổi.'))
d['activities'][-1]['source'].update(printedPages=[29,30],pdfPages=[44,45])
listen(d,30,2,1,C('杨同乐（　）做饭。','Chọn từ chỉ khả năng nấu ăn của Dương Đồng Lạc.'),[('会','huì','biết'),('不','bù','không'),('不会','bú huì','không biết')],'A',2)
listen(d,30,2,2,C('杨同乐（　）也做饭。','Chọn ngày mà Dương Đồng Lạc cũng nấu ăn.'),[('星期三','Xīngqīsān','thứ Tư'),('星期六','Xīngqīliù','thứ Bảy'),('星期日','Xīngqīrì','Chủ nhật')],'C',2)
vocab(d,31,2,9,['会|huì|mod.|can; be able to','做饭|zuò fàn||cook','做|zuò|v.|make; produce','面条儿|miàntiáor|n.|noodles','饺子|jiǎozi|n.|jiaozi','一些|yìxiē|num.-m.|some','菜|cài|n.|dish; course'])
scene_role(d,31,2);d['activities'][-1]['source'].update(printedPages=[30,31],pdfPages=[45,46]);attach(d,30,2,(362,613,743,934),C('杨同乐在厨房切菜。','Dương Đồng Lạc thái rau trong bếp.'))
pair(d,31,'pair-text2',1,C('两人一组，根据实际情况对话。','Làm việc theo cặp, hội thoại theo tình huống thực tế.'))
grammar(d,31,'grammar-hui',1,C('能愿动词“会”','Động từ năng nguyện “会”'),C('“会”用在动词前，表示通过学习后，懂得怎样做或有能力做。','“会” dùng trước động từ, biểu thị nhờ học mà biết cách làm hoặc có khả năng làm.'),C('（1）你会做饭吗？\n（2）我会做面条儿。\n（3）我不会做菜。','(1) Bạn biết nấu ăn không?\n(2) Tôi biết làm mì.\n(3) Tôi không biết nấu món ăn.'))
listen(d,31,3,1,C('杨同乐也（　）。','Chọn hành động mà Dương Đồng Lạc cũng làm.'),[('上班','shàngbān','đi làm'),('下班','xiàbān','tan làm'),('休息','xiūxi','nghỉ ngơi')],'B',2)
listen(d,31,3,2,C('杨同乐有一个新（　）。','Chọn đồ mới mà Dương Đồng Lạc có.'),[('名字','míngzi','tên'),('工作','gōngzuò','công việc'),('电脑','diànnǎo','máy tính')],'C',2)
vocab(d,32,3,16,['下班|xiàbān|v.|get off work','新|xīn|adj.|new','电脑|diànnǎo|n.|computer','真|zhēn|adv.|really; truly','好看|hǎokàn|adj.|good-looking; nice','喜欢|xǐhuan|v.|like','它|tā|pron.|it'])
scene_role(d,32,3);attach(d,32,3,(427,97,763,461),C('两位同事在电脑旁交谈。','Hai đồng nghiệp nói chuyện bên máy tính.'))
comprehension(d,32,3,[(C('杨同乐的新电脑怎么样？','Máy tính mới của Dương Đồng Lạc thế nào?'),C('很好看。','Rất đẹp.')),(C('杨同乐喜欢他的新电脑吗？','Dương Đồng Lạc có thích máy tính mới của mình không?'),C('他很喜欢。','Anh ấy rất thích.'))])
cloze(d,33,[('菜','cài','món ăn'),('喜欢','xǐhuan','thích'),('6月22号','liù yuè èrshí’èr hào','ngày 22 tháng 6'),('新','xīn','mới'),('真','zhēn','thật')],[(qvi('今天＿＿。'),'C'),(qvi('杨同乐有一个＿＿电脑。'),'D'),(qvi('王一雪：你会做这两个＿＿吗？\n杨同乐：我会做。'),'A'),(qvi('王一雪：你的电脑＿＿好看！\n杨同乐：我也很＿＿。'),'EB')],[3,3,3,3])
picture(d,33,1,(176,544,466,755),C('今天＿＿。','Nói ngày được khoanh trên lịch theo câu tiếng Trung.'),[C('9月7号','ngày 7 tháng 9')],C('2025年9月日历，7日被圈出。','Lịch tháng 9 năm 2025, ngày 7 được khoanh.'))
picture(d,33,2,(498,544,789,755),C('杨同乐会＿＿。','Hoàn thành câu nói Dương Đồng Lạc biết làm gì.'),[C('做饭','nấu ăn')],C('杨同乐在厨房切菜。','Dương Đồng Lạc thái rau trong bếp.'))
picture(d,33,3,(176,828,466,1009),C('我＿＿两个菜。','Hoàn thành câu nói về hai món ăn.'),[C('会做这','biết nấu hai món này')],C('两盘不同的菜。','Hai đĩa thức ăn khác nhau.'))
picture(d,33,4,(498,828,789,1009),C('今天是＿＿年＿＿月1号，＿＿。','Điền năm, tháng và thứ theo ngày được khoanh trên lịch.'),[C('2025','2025'),C('5','5'),C('星期四','thứ Năm')],C('2025年5月日历，1日被圈出。','Lịch tháng 5 năm 2025, ngày 1 được khoanh.'))
pair(d,34,'classroom',1,C('一个人拿着词语卡片，询问其他人会不会做这件事，其他人抢答。抢答最少者成为下一轮的提问者。','Một người cầm thẻ từ, hỏi những người khác có biết làm việc trên thẻ không. Các bạn tranh trả lời; người trả lời ít nhất sẽ hỏi ở vòng tiếp theo.'),C('A：你们会做饭吗？\nB：我会。\nA：你们会做这个菜吗？\nC：我不会做。\n……','A: Các bạn biết nấu ăn không?\nB: Tôi biết.\nA: Các bạn biết nấu món này không?\nC: Tôi không biết.\n…'))
d['bonus']=dict(id='hsk1-original-2026-l05-p034-bonus-reference-01',title=C('中国美食——饺子','Ẩm thực Trung Quốc — Sủi cảo'),printedResourceId='5-1',printedPage=34,pdfPage=49,availability='unavailable',payload=None)
d['textbookCorrections']=[dict(target='textbook-l05-text-1-line-04',field='py',printedPage=28,suggested='Xīngqīrì. Jīntiān wǒ xiūxi.',issue='休息后音节读轻声，原书xiūxi。'),dict(target='textbook-l05-text-2-line-04',field='py',printedPage=30,suggested='Wǒ huì zuò miàntiáor, jiǎozi, yě huì zuò yìxiē cài. Xīngqītiān wǒ yě zuò fàn.',issue='原书面条儿儿化、饺子轻声、一些一变调；保持原书拼音词组。'),dict(target='textbook-l05-text-3-line-06',field='py',printedPage=32,suggested='Wǒ yě hěn xǐhuan tā.',issue='喜欢后音节轻声。')]
finish(d,27,34)

d=new(6)
objective(d,35,C('（1）能听懂手机号码并使用号码拨打手机。\n（2）能听懂并使用两个或多个动词性短语表达动作的目的或方式。\n（3）掌握能愿动词“想”的用法。\n（4）掌握疑问代词“怎么”询问方式的用法。','(1) Nghe hiểu số điện thoại di động và dùng số để gọi.\n(2) Hiểu khi nghe và dùng hai hay nhiều cụm động từ để biểu thị mục đích hoặc cách thức hành động.\n(3) Nắm cách dùng “想”.\n(4) Nắm cách dùng “怎么” để hỏi cách thức.'))
warm(d,35,[('手机','shǒujī','điện thoại di động'),('晚饭','wǎnfàn','bữa tối'),('超市','chāoshì','siêu thị'),('牛奶','niúnǎi','sữa bò'),('出租车','chūzūchē','taxi'),('米饭','mǐfàn','cơm')],'CADFEB',3,
 [(133,687,334,825),(362,687,563,825),(590,687,790,825),(133,850,334,986),(362,850,563,986),(590,850,790,986)],
 [C('商店内两排货架之间的通道。','Lối đi giữa hai dãy kệ hàng.'),C('一只手拿着手机。','Một bàn tay cầm điện thoại.'),C('白色饮品被倒入杯中。','Đồ uống màu trắng được rót vào cốc.'),C('一碗白米饭。','Một bát cơm trắng.'),C('一辆汽车行驶在城市道路上。','Một ô tô đi trên đường thành phố.'),C('一家人围桌吃饭。','Một gia đình ăn cơm quanh bàn.')])
support(d,36,'original-tip',1,C('小语助力','Gợi ý của Tiểu Ngữ'),C('现在人们有时也用“电话”指代“手机”。','Ngày nay đôi khi người ta dùng “电话” để chỉ “手机”.'))
support(d,36,'original-tip',2,C('小语助力','Gợi ý của Tiểu Ngữ'),C('手机号要一位一位地读，而且数字“1”要读成“yāo”。','Số điện thoại được đọc từng chữ số; chữ số “1” đọc là “yāo”.'))
vocab(d,36,1,1,['手机|shǒujī|n.|cell phone','电话|diànhuà|n.|telephone (set); (telephone/phone) call','号|hào|n.|number'])
scene_role(d,36,1);attach(d,36,1,(440,289,753,523),C('两人看着各自的手机。','Hai người nhìn điện thoại của mình.'))
pair(d,36,'pair-text1',1,C('两人一组，根据实际情况对话。','Làm việc theo cặp, hội thoại theo tình huống thực tế.'))
listen(d,37,2,1,C('白家月（　）想去超市。','Chọn thời gian Bạch Gia Nguyệt muốn đến siêu thị.'),[('现在','xiànzài','bây giờ'),('今天','jīntiān','hôm nay'),('明天','míngtiān','ngày mai')],'C',3)
listen(d,37,2,2,C('白家月想买（　）。','Chọn món Bạch Gia Nguyệt muốn mua.'),[('菜','cài','rau'),('牛奶','niúnǎi','sữa bò'),('面条儿和牛奶','miàntiáor hé niúnǎi','mì và sữa bò')],'B',3)
scene_role(d,37,2);attach(d,37,2,(494,465,817,866),C('超市货架和购物车，上方小图为奶瓶。','Kệ siêu thị và xe đẩy; hình nhỏ phía trên là chai sữa.'))
pair(d,37,'pair-text2',1,C('两人一组，根据实际情况对话。','Làm việc theo cặp, hội thoại theo tình huống thực tế.'))
vocab(d,38,2,4,['明天|míngtiān|n.|tomorrow','去|qù|v.|go','哪儿|nǎr|pron.|where','想|xiǎng|mod.|want; would like','超市|chāoshì|n.|supermarket','买|mǎi|v.|buy','东西|dōngxi|n.|thing','些|xiē|m.|some; a few','牛奶|niúnǎi|n.|(cow’s) milk'])
grammar(d,38,'grammar-xiang',1,C('能愿动词“想”','Động từ năng nguyện “想”'),C('能愿动词“想”用在动词前，表示希望、打算。','“想” dùng trước động từ, biểu thị mong muốn hoặc dự định.'),C('（1）我想去超市。\n（2）我哥哥不想休息。','(1) Tôi muốn đi siêu thị.\n(2) Anh trai tôi không muốn nghỉ ngơi.'))
listen(d,38,3,1,C('王一雪一家人想去西安饭店（　）。','Chọn mục đích gia đình Vương Nhất Tuyết muốn đến nhà hàng Tây An.'),[('吃早饭','chī zǎofàn','ăn sáng'),('吃午饭','chī wǔfàn','ăn trưa'),('吃晚饭','chī wǎnfàn','ăn tối')],'C',3)
listen(d,38,3,2,C('刘小明不想吃（　）。','Chọn món Lưu Tiểu Minh không muốn ăn.'),[('米饭','mǐfàn','cơm'),('包子','bāozi','bánh bao'),('面条儿','miàntiáor','mì')],'B',3)
scene_role(d,39,3);attach(d,39,3,(491,94,799,714),C('教材中的餐馆页面手机示意图。','Hình điện thoại hiển thị trang nhà hàng trong sách.'))
comprehension(d,39,3,[(C('西安饭店的包子好吃吗？','Bánh bao ở nhà hàng Tây An có ngon không?'),C('非常好吃。','Rất ngon.')),(C('他们怎么去西安饭店？','Họ đến nhà hàng Tây An bằng cách nào?'),C('他们坐出租车去。','Họ đi taxi.'))])
vocab(d,40,3,13,['吃|chī|v.|eat; have','晚饭|wǎnfàn|n.|dinner; supper','那边|nàbiān|pron.|there','包子|bāozi|n.|steamed stuffed bun','非常|fēicháng|adv.|very; extremely','好吃|hǎochī|adj.|tasty; delicious','米饭|mǐfàn|n.|(cooked) rice','怎么|zěnme|pron.|(indicating nature, condition or manner, etc.) how','坐|zuò|v.|take; travel by or on','出租车|chūzūchē|n.|taxi'])
vocab(d,40,3,1,['西安饭店|Xī’ān Fàndiàn||Xi’an Restaurant'],proper=True)
grammar(d,40,'grammar-serial-purpose',1,C('连动句（1）· 动作目的','Câu liên động (1) · Mục đích hành động'),C('连动句的谓语部分由两个或两个以上动词性短语构成。连动句有两种意义：（1）表示动作的目的。','Vị ngữ của câu liên động gồm hai hay nhiều cụm động từ. Câu liên động có hai ý nghĩa: (1) biểu thị mục đích hành động.'),C('（1）我想去超市买东西。\n（2）我们去西安饭店吃晚饭。','(1) Tôi muốn đến siêu thị mua đồ.\n(2) Chúng tôi đến nhà hàng Tây An ăn tối.'))
grammar(d,40,'grammar-serial-manner',1,C('连动句（1）· 动作方式','Câu liên động (1) · Cách thức hành động'),C('（2）表示动作的方式。','(2) Biểu thị cách thức hành động.'),C('（1）我们坐出租车去西安饭店。\n（2）她坐出租车去超市。','(1) Chúng tôi đi taxi đến nhà hàng Tây An.\n(2) Cô ấy đi taxi đến siêu thị.'))
grammar(d,41,'grammar-zenme',1,C('疑问代词“怎么”','Đại từ nghi vấn “怎么”'),C('疑问代词“怎么”用在动词前，询问方式。','“怎么” dùng trước động từ để hỏi cách thức.'),C('（1）我们怎么去？\n（2）她怎么去超市？','(1) Chúng ta đi bằng cách nào?\n(2) Cô ấy đi siêu thị bằng cách nào?'))
cloze(d,41,[('多少','duōshao','bao nhiêu'),('买','mǎi','mua'),('米饭','mǐfàn','cơm'),('坐','zuò','đi (bằng phương tiện)'),('去','qù','đi')],[(qvi('我想＿＿超市＿＿牛奶。'),'EB'),(qvi('我们＿＿出租车去西安饭店吃晚饭。'),'D'),(qvi('妈妈：你想吃什么？孩子：我想吃＿＿。'),'C'),(qvi('老师：你的手机号是＿＿？\n学生：我的手机号是13126975002。'),'A')],[4,4,4,4])
picture(d,41,1,(176,754,466,938),C('她的＿＿是多少？','Hoàn thành câu hỏi số điện thoại của cô ấy.'),[C('手机号','số điện thoại di động')],C('一人手持手机。','Một người cầm điện thoại.'))
picture(d,41,2,(499,754,789,938),C('我想＿＿超市＿＿牛奶。','Điền các động từ để nói muốn đến siêu thị mua sữa.'),[C('去','đi'),C('买','mua')],C('超市货架旁有购物车。','Xe đẩy bên kệ hàng trong siêu thị.'))
picture(d,42,3,(124,103,414,290),C('王一雪想＿＿去超市。','Hoàn thành cách Vương Nhất Tuyết muốn đi siêu thị.'),[C('坐出租车','đi taxi')],C('一辆出租车。','Một chiếc taxi.'))
picture(d,42,4,(446,104,737,291),C('这些包子非常＿＿。','Miêu tả các bánh bao trong câu gốc.'),[C('好吃','ngon')],C('一盘包子。','Một đĩa bánh bao.'))
breakfast=act(d,42,'classroom-table',1,'pair-work-table',C('课堂活动 · 填写表格','Hoạt động trên lớp · Điền bảng'),C('两人一组，填写星期一、星期二和星期六早饭吃什么，填好后分享。\nA 包子　B 面条儿　C 饺子　D 米饭','Làm việc theo cặp, điền món ăn sáng vào thứ Hai, thứ Ba và thứ Bảy rồi chia sẻ.\nA bánh bao; B mì; C sủi cảo; D cơm.'),C('按两位同学分别填写。','Điền riêng cho từng người trong cặp.'),[])
breakfast['table']=dict(columns=[C('',''),C('星期一','Thứ Hai'),C('星期二','Thứ Ba'),C('星期六','Thứ Bảy')],rows=[])
food=opts([('包子','bāozi','bánh bao'),('面条儿','miàntiáor','mì'),('饺子','jiǎozi','sủi cảo'),('米饭','mǐfàn','cơm')])
for i in (1,2):
 cells=[]
 for j,label in enumerate([C(f'第{i}人姓名',f'Tên người {i}'),C('星期一早饭','Bữa sáng thứ Hai'),C('星期二早饭','Bữa sáng thứ Ba'),C('星期六早饭','Bữa sáng thứ Bảy')]):
  f=free((i-1)*4+j+1,label=label,input='text' if j==0 else 'select');
  if j:f['options']=food
  breakfast['fields'].append(f);cells.append(dict(fieldId=f['id']))
 breakfast['table']['rows'].append(dict(id=f'person-{i}',cells=cells))
ref_table(d,42,'classroom-table-example',1,C('小语的例子','Ví dụ của Tiểu Ngữ'),[C('',''),C('星期一','Thứ Hai'),C('星期二','Thứ Ba'),C('星期六','Thứ Bảy')],[[C('小语','Tiểu Ngữ'),C('C','C · sủi cảo'),C('A','A · bánh bao'),C('B','B · mì')]])
vt=act(d,43,'summary-vocabulary',1,'self-review-table',C('学习小结 · 词语学习','Tổng kết học tập · Từ vựng'),C('记录第4～6课的词语学习情况。','Ghi lại tình hình học từ vựng của bài 4–6.'),C('4～6课我的学习情况。','Tình hình học tập của tôi ở bài 4–6.'),[free(1,label=C('我已经记住并会使用的词语','Các từ đã nhớ và biết dùng'),input='textarea',required=False),free(2,label=C('我还没记住的词语','Các từ chưa nhớ'),input='textarea',required=False)])
vt['table']=dict(columns=[C('词语学习','Học từ vựng'),C('记录','Ghi chép')],rows=[dict(id=f'row-{i}',cells=[dict(text=f['label']),dict(fieldId=f['id'])]) for i,f in enumerate(vt['fields'],1)])
summary=[C('“有”字句（1），例如：她有十个学生。','Câu chữ “有” (1), ví dụ: cô ấy có mười học sinh.'),C('数字的表达，例如：二十二，九百九十九','Cách biểu đạt số, ví dụ: hai mươi hai, chín trăm chín mươi chín'),C('语气助词“呢”（1），例如：我是学生，你呢？','Trợ từ ngữ khí “呢” (1), ví dụ: tôi là học sinh, còn bạn?'),C('名量词和名量结构，例如：一个，五口人','Lượng từ danh từ và kết cấu số-lượng, ví dụ: một cái, năm người trong gia đình'),C('问年龄时，对不同年龄的人使用不同的询问方式。','Dùng cách hỏi tuổi khác nhau với người ở các độ tuổi khác nhau.'),C('时间的表达（1），例如：2025年1月1日，星期三','Cách biểu đạt thời gian (1), ví dụ: thứ Tư, ngày 1 tháng 1 năm 2025'),C('名词谓语句，例如：今天星期四。','Câu vị ngữ danh từ, ví dụ: hôm nay thứ Năm.'),C('能愿动词“会”，例如：我会做饭。','Động từ năng nguyện “会”, ví dụ: tôi biết nấu ăn.'),C('能愿动词“想”，例如：我想去超市。','Động từ năng nguyện “想”, ví dụ: tôi muốn đi siêu thị.'),C('连动句（1），例如：我去超市买东西。','Câu liên động (1), ví dụ: tôi đến siêu thị mua đồ.'),C('疑问代词“怎么”，例如：你怎么去超市？','Đại từ nghi vấn “怎么”, ví dụ: bạn đến siêu thị bằng cách nào?')]
ss=act(d,43,'summary-can-use',1,'self-review-table',C('我理解并会用','Tôi hiểu và biết dùng'),C('分别记录“理解”和“会用”，续表在第44页。','Ghi riêng “Hiểu” và “Biết dùng”; bảng tiếp tục ở trang 44.'),C('第4～6课学习小结。','Tổng kết bài 4–6.'),[]);ss['table']=dict(columns=[C('内容','Nội dung'),C('理解','Hiểu'),C('会用','Biết dùng')],rows=[]);ss['source'].update(printedPages=[43,44],pdfPages=[58,59])
for i,label in enumerate(summary,1):
 cells=[dict(text=label)]
 for j,c in enumerate([C('理解','Hiểu'),C('会用','Biết dùng')],1):
  f=free((i-1)*2+j,label=C(f'第{i}项 · {c["zh"]}',f'Mục {i} · {c["vi"]}'),input='select',required=False);f['options']=opts([('是','','Có'),('尚未','','Chưa')]);ss['fields'].append(f);cells.append(dict(fieldId=f['id']))
 ss['table']['rows'].append(dict(id=f'row-{i}',cells=cells,source=src(43 if i<=4 else 44,'summary-can-use',i)))
act(d,44,'summary-reflection',1,'reflection',C('我需要努力的','Điểm tôi cần cố gắng'),C('记录需要继续练习的内容。','Ghi những nội dung cần tiếp tục luyện tập.'),C('我需要努力的：','Điểm tôi cần cố gắng:'),[free(1,label=C('学习反思','Suy ngẫm về việc học'),input='textarea',required=False)])
d['textbookCorrections']=[dict(target='textbook-l06-grammar-01',field='examples',printedPage=38,issue='原版第二例句是我哥哥不想休息；现版删除哥哥。'),dict(target='textbook-l06-grammar-02',field='examples',printedPage=40,issue='原版分动作目的/方式两组共四句；现版仅两句。'),dict(target='textbook-l06-text-1-line-02',field='py',printedPage=36,suggested='Wǒ de shǒujīhào shì sān sān liù líng yāo sì jiǔ sān yāo jiǔ líng.',issue='现版用数字代替电话号读音；原书明确逐位读且1读yāo。'),dict(target='textbook-l06-text-1-line-03',field='py',printedPage=36,suggested='Wǒ de shǒujīhào shì bā liù yāo sān wǔ wǔ èr qī èr yāo yāo liù líng.',issue='逐位读电话号码；1读yāo。')]
finish(d,35,44)

d=new(7)
objective(d,45,C('（1）能听懂并描述事情发生的时间。\n（2）掌握语气助词“吧”（1）表达建议、商量等的用法。\n（3）掌握语气助词“呢”（2）表达确认的事实的用法。\n（4）掌握副词、时间词语作状语的位置。','(1) Hiểu khi nghe và mô tả thời gian xảy ra sự việc.\n(2) Nắm cách dùng “吧” (1) để đề nghị, bàn bạc, v.v.\n(3) Nắm cách dùng “呢” (2) để nói sự thật đã xác nhận.\n(4) Nắm vị trí phó từ và cụm thời gian làm trạng ngữ.'))
warm(d,45,[('8:15','','8 giờ 15'),('15:20','','15 giờ 20'),('10:10','','10 giờ 10'),('13:45','','13 giờ 45'),('12:30','','12 giờ 30'),('18:00','','18 giờ')],'CEDBFA',4,
 [(185,684,331,828),(393,684,540,828),(600,684,747,828),(185,886,331,1030),(393,886,540,1030),(600,886,747,1030)],
 [C('钟面1，请观察长针和短针。','Mặt đồng hồ 1; hãy quan sát kim dài và kim ngắn.'),C('钟面2，请观察长针和短针。','Mặt đồng hồ 2; hãy quan sát kim dài và kim ngắn.'),C('钟面3，请观察长针和短针。','Mặt đồng hồ 3; hãy quan sát kim dài và kim ngắn.'),C('钟面4，请观察长针和短针。','Mặt đồng hồ 4; hãy quan sát kim dài và kim ngắn.'),C('钟面5，请观察长针和短针。','Mặt đồng hồ 5; hãy quan sát kim dài và kim ngắn.'),C('钟面6，请观察长针和短针。','Mặt đồng hồ 6; hãy quan sát kim dài và kim ngắn.')])
for a in d['activities']:
 if a['source']['section']=='warmup':a['instruction']=C('给下面的时间选择对应的图片。','Ghép các thời điểm dưới đây với hình đồng hồ tương ứng.')
vocab(d,46,1,1,['现在|xiànzài|n.|now','点|diǎn|m.|o’clock','早上|zǎoshang|n.|(early) morning','上午|shàngwǔ|n.|morning','分|fēn|m.|minute','课|kè|n.|class; lesson','下午|xiàwǔ|n.|afternoon','见|jiàn|v.|meet','吧|ba|part.|used at the end of a sentence to express suggestions, consultations, advice, or requests'])
scene_role(d,46,1);attach(d,46,1,(112,242,768,466),C('两人分别拿着手机通话。','Hai người cầm điện thoại nói chuyện.'))
pair(d,46,'pair-text1',1,C('两人一组，根据实际情况对话。','Làm việc theo cặp, hội thoại theo tình huống thực tế.'))
tt=ref_table(d,47,'time-table',1,C('时间的表达（2）· 点、分','Cách biểu đạt thời gian (2) · Giờ, phút'),[C('点','Giờ'),C('分','Phút'),C('数字写法','Cách viết bằng số')],[[C('九点','chín giờ'),C('',''),C('9:00','9:00')],[C('二十点','hai mươi giờ'),C('',''),C('20:00','20:00')],[C('十五点','mười lăm giờ'),C('四十','bốn mươi'),C('15:40','15:40')],[C('二十一点','hai mươi mốt giờ'),C('十分','mười phút'),C('21:10','21:10')],[C('二十二点','hai mươi hai giờ'),C('零五','lẻ năm'),C('22:05','22:05')]],C('“点、分”表示具体时间点，整点使用“点”，不是整点使用“分”，“分”可以省略。但是，当时间为“十分”时，不能省略“分”；当时间为十分以下时，要读出“零”。大声朗读。','“点、分” biểu thị thời điểm cụ thể. Giờ tròn dùng “点”, giờ có phút dùng “分”; có thể lược “分”. Tuy nhiên, với mười phút phải giữ “分”; khi dưới mười phút phải đọc “零”. Đọc thành tiếng.'))
grammar(d,47,'time-period',1,C('时间段','Khoảng thời gian trong ngày'),C('“上午、中午、下午、晚上”等时间名词可以表达时间段。这些时间名词后还可以直接加时间点。','Các danh từ thời gian như “上午、中午、下午、晚上” chỉ các khoảng trong ngày; có thể thêm thời điểm cụ thể ngay sau đó.'),C('（1）上午\n（2）中午十二点\n（3）下午两点半\n（4）晚上九点十分','(1) Buổi sáng\n(2) Mười hai giờ trưa\n(3) Hai giờ rưỡi chiều\n(4) Chín giờ mười phút tối'))
support(d,47,'grammar-ba-explanation',1,C('语气助词“吧”（1）','Trợ từ ngữ khí “吧” (1)'),C('本课语气助词“吧”读轻声（ba），在句子末尾，表示建议、商量、劝告、请求。','Trong bài này, “吧” đọc thanh nhẹ (ba), đứng cuối câu để đề nghị, bàn bạc, khuyên nhủ hoặc yêu cầu.'))
read(d,48,'grammar-ba-dialogues',1,C('“吧” · 朗读对话','“吧” · Đọc hội thoại'),C('（1）A：我们下午三点见吧。\nB：好的。\n（2）A：你去超市买吧。\nB：超市没有。\n（3）A：我们去西安饭店吃晚饭吧。\nB：好的。','(1) A: Chiều nay ba giờ chúng ta gặp nhé.\nB: Được.\n(2) A: Bạn đến siêu thị mua nhé.\nB: Siêu thị không có.\n(3) A: Chúng ta đến nhà hàng Tây An ăn tối nhé.\nB: Được.'))
listen(d,48,2,1,C('李文下午想去（　）。','Chọn việc Lý Văn muốn đi làm vào buổi chiều.'),[('超市','chāoshì','siêu thị'),('看电影','kàn diànyǐng','xem phim'),('西安饭店','Xī’ān Fàndiàn','nhà hàng Tây An')],'B',4)
listen(d,48,2,2,C('白家月明天下午还（　）。','Chọn việc Bạch Gia Nguyệt vẫn làm chiều mai.'),[('上课','shàngkè','đi học'),('有事','yǒu shì','có việc'),('去超市','qù chāoshì','đi siêu thị')],'A',4)
vocab(d,49,2,10,['电影院|diànyǐngyuàn|n.|cinema','看|kàn|v.|watch; see; read; look at','电影|diànyǐng|n.|movie; film','事|shì|n.|thing; affair','上课|shàngkè|v.|attend a class','呢|ne|part.|marker of a declarative sentence','半|bàn|num.|half','下课|xiàkè|v.|dismiss a class'])
scene_role(d,49,2);d['activities'][-1]['source'].update(printedPages=[48,49],pdfPages=[63,64]);attach(d,48,2,(83,743,744,1113),C('李文与白家月在校园中交谈。','Lý Văn và Bạch Gia Nguyệt nói chuyện trong khuôn viên trường.'))
pair(d,49,'pair-text2',1,C('两人一组，根据实际情况对话。','Làm việc theo cặp, hội thoại theo tình huống thực tế.'))
support(d,49,'grammar-adverb-explanation',1,C('副词、时间词语作状语的位置','Vị trí phó từ và cụm thời gian làm trạng ngữ'),C('在汉语中，副词、时间词语作状语时，一般都要在动词或形容词前。','Trong tiếng Trung, khi phó từ và cụm thời gian làm trạng ngữ, chúng thường đứng trước động từ hoặc tính từ.'))
read(d,50,'grammar-adverb-examples',1,C('状语位置 · 大声朗读','Vị trí trạng ngữ · Đọc thành tiếng'),C('（1）我不想去。\n（2）妹妹很高兴。\n（3）她上午十点半上课。','(1) Tôi không muốn đi.\n(2) Em gái rất vui.\n(3) Cô ấy học lúc mười giờ rưỡi sáng.'))
for i,(pr,refs) in enumerate([(C('A：我们（　）点见？\nB：我们下午（　）见吧。','Hỏi giờ gặp nhau rồi đề xuất một thời điểm vào buổi chiều.'),[C('几','mấy'),C('三点','ba giờ')]),(C('A：你上午去上课，是吗？\nB：对，我（　）有课。','A hỏi bạn có đi học buổi sáng không; B xác nhận lịch học.'),[C('上午','buổi sáng')]),(C('A：我们（　）去超市吧。\nB：对不起，我（　）有课。','A đề xuất thời gian đi siêu thị; B từ chối vì có tiết học.'),[C('下午','buổi chiều'),C('下午','buổi chiều')])],1):
 act(d,50,'complete-dialogues',i,'open-dialogue-completion',C('完成对话','Hoàn thành hội thoại'),C('完成对话。','Hoàn thành hội thoại.'),pr,[free(j,r) for j,r in enumerate(refs,1)])
grammar(d,50,'grammar-ne',1,C('语气助词“呢”（2）','Trợ từ ngữ khí “呢” (2)'),C('本课语气助词“呢”位于句子末尾，表示确认的事实。基本结构：……呢。','Trong bài này, “呢” đứng cuối câu để biểu thị sự thật đã xác nhận. Cấu trúc: …呢.'),C('（1）我明天下午两点还上课呢。\n（2）妹妹会做两个菜呢。\n（3）李文晚上还有事呢。','(1) Chiều mai lúc hai giờ tôi vẫn còn tiết học.\n(2) Em gái biết nấu hai món đấy.\n(3) Buổi tối Lý Văn vẫn còn có việc.'))
listen(d,50,3,1,C('刘明（　）呢。','Chọn tình trạng/địa điểm của Lưu Minh.'),[('上班','shàngbān','đi làm'),('买菜','mǎi cài','mua rau'),('在家里','zài jiā li','ở nhà')],'C',4)
listen(d,50,3,2,C('王一雪（　）下班。','Chọn giờ Vương Nhất Tuyết tan làm.'),[('五点','wǔ diǎn','năm giờ'),('六点','liù diǎn','sáu giờ'),('六点半','liù diǎn bàn','sáu giờ rưỡi')],'C',4)
support(d,51,'original-tip',1,C('小语助力','Gợi ý của Tiểu Ngữ'),C('“里”作方位词时，在“家、超市”等名词性词语后，一般读轻声“li”；在“里边”等词语中，需读第三声“lǐ”。','Khi “里” là từ chỉ phương vị, đứng sau danh từ như “家、超市”, thường đọc thanh nhẹ “li”; trong từ như “里边” đọc thanh ba “lǐ”.'))
vocab(d,51,3,18,['在|zài|v.|be at/in/on','家|jiā|n.|home','里|li/lǐ|n.|inner; inside','晚上|wǎnshang|n.|evening','医院|yīyuàn|n.|hospital','上班|shàngbān|v.|go to work','店|diàn|n.|shop; store','菜|cài|n.|vegetable; greens','分钟|fēnzhōng|m.|minute','后|hòu|n.|after; later'])
scene_role(d,51,3);attach(d,51,3,(460,316,810,565),C('刘明在家打电话，旁边小图是通话中的王一雪。','Lưu Minh gọi điện ở nhà; hình nhỏ bên cạnh là Vương Nhất Tuyết đang nói điện thoại.'))
comprehension(d,51,3,[(C('刘明晚上还去做什么？','Buổi tối Lưu Minh còn đi làm gì?'),C('他八点去医院上班。','Anh ấy đi làm ở bệnh viện lúc tám giờ.')),(C('刘明十分钟后去做什么？','Mười phút nữa Lưu Minh đi làm gì?'),C('他去店里买些菜。','Anh ấy đến cửa hàng mua ít rau.'))])
cloze(d,52,[('医院','yīyuàn','bệnh viện'),('十二点半','shí’èr diǎn bàn','mười hai giờ rưỡi'),('课','kè','tiết học'),('现在','xiànzài','bây giờ'),('见','jiàn','gặp')],[(qvi('她星期天没有＿＿。'),'C'),(qvi('我们中午＿＿下课，下午两点＿＿吧。'),'BE'),(qvi('白家月：对不起，我＿＿有事呢，你去吧。\n李文：好的，你忙吧。'),'D'),(qvi('王一雪：你今天晚上几点去＿＿上班？\n刘明：晚上八点。'),'A')],[5,5,5,5])
picture(d,52,1,(127,550,416,713),C('现在是＿＿点＿＿分。','Điền giờ và phút theo đồng hồ.'),[C('七','bảy'),C('二十','hai mươi')],C('一只手拿着闹钟，请观察时针和分针。','Một bàn tay cầm đồng hồ báo thức; hãy xem kim giờ và kim phút.'))
picture(d,52,2,(449,550,738,713),C('我们上午＿＿吧。','Hoàn thành lời đề nghị theo thời gian trên đồng hồ.'),[C('十点十分见','gặp lúc mười giờ mười phút')],C('墙上钟面有三根针，需区分时针、分针和秒针。','Đồng hồ có ba kim; cần phân biệt kim giờ, phút và giây.'))
picture(d,52,3,(127,789,416,952),C('我今天晚上＿＿还＿＿呢。','Nói thời gian và việc vẫn làm vào buổi tối theo gợi ý đồng hồ.'),[C('九点','chín giờ'),C('有课','có tiết học')],C('暗色背景上的闹钟。','Đồng hồ báo thức trên nền tối.'))
picture(d,52,4,(449,789,738,952),C('妹妹＿＿有课。','Hoàn thành thời gian em gái có tiết học theo đồng hồ.'),[C('下午两点','hai giờ chiều')],C('浅色背景上的挂钟。','Đồng hồ treo tường trên nền sáng.'))
schedule=act(d,53,'classroom-table',1,'group-work-table',C('课堂活动 · 填写表格','Hoạt động trên lớp · Điền bảng'),C('三人一组，每人根据自己的情况填写时间，填好后分享。','Làm việc theo nhóm ba người; mỗi người điền thời gian theo lịch của mình rồi chia sẻ.'),C('原表每人各填一行，下面分别保留三人的记录。','Mỗi người điền một hàng của bảng gốc; dưới đây giữ riêng bản ghi của ba người.'),[])
schedule['table']=dict(columns=[C('',''),C('午饭','Ăn trưa'),C('休息','Nghỉ ngơi'),C('下课','Tan học')],rows=[])
for i in (1,2,3):
 cells=[dict(text=C(f'第{i}人',f'Người {i}'))]
 for j,label in enumerate([C('午饭','Ăn trưa'),C('休息','Nghỉ ngơi'),C('下课','Tan học')],1):
  f=free((i-1)*3+j,label=C(f'第{i}人 · {label["zh"]}',f'Người {i} · {label["vi"]}'));schedule['fields'].append(f);cells.append(dict(fieldId=f['id']))
 schedule['table']['rows'].append(dict(id=f'person-{i}',cells=cells))
schedule['adaptation']=C('原书表格为一人的时间行，按原指令扩展为三人的独立记录；三个事项列不变。','Bảng gốc có một hàng thời gian cho một người; mở rộng thành ba bản ghi riêng theo yêu cầu trong sách, giữ nguyên ba cột hoạt động.')
ref_table(d,53,'classroom-example',1,C('小语的例子','Ví dụ của Tiểu Ngữ'),[C('',''),C('午饭（wǔfàn）','Ăn trưa'),C('休息','Nghỉ ngơi'),C('下课','Tan học')],[[C('时间（shíjiān）','Thời gian'),C('12:00～13:00','12:00–13:00'),C('13:00～14:00','13:00–14:00'),C('16:00','16:00')]])
support(d,53,'original-tip',1,C('小语助力','Gợi ý của Tiểu Ngữ'),C('你会写数字了，是不是还想写汉字呢？那就去敲敲“小语的彩蛋”吧！','Bạn đã biết viết số rồi, có muốn viết chữ Hán nữa không? Hãy thử mở “Nội dung bổ sung của Tiểu Ngữ”!'))
d['bonus']=dict(id='hsk1-original-2026-l07-p053-bonus-reference-01',title=C('学汉字','Học chữ Hán'),printedResourceId='7-1',printedPage=53,pdfPage=68,availability='unavailable',payload=None)
d['textbookCorrections']=[dict(target='textbook-l07-grammar-01',field='examples',printedPage=47,issue='原版5行点/分/数字表、四个时段例句和十分不可省分、个位分钟读零的说明缺失。'),dict(target='textbook-l07-grammar-02',field='examples',printedPage=48,issue='原版三组完整对话未完整保留。'),dict(target='textbook-l07-grammar-03',field='examples',printedPage=50,issue='原版三例句和三组填空对话未完整保留。'),dict(target='textbook-l07-grammar-04',field='examples',printedPage=50,issue='原版妹妹会做两个菜呢缺失。'),dict(target='textbook-l07-text-3-line-02',field='py',printedPage=51,suggested='Wǒ zài jiā li ne.',issue='后置方位词里按原书轻声。'),dict(target='textbook-l07-text-3-line-05',field='py',printedPage=51,suggested='Hǎo de, nǐ qù diàn li mǎi xiē cài ba.',issue='店里中里按原书轻声。')]
finish(d,45,53)

d=new(8)
objective(d,54,C('（1）能听懂并描述处所、位置等信息。\n（2）掌握介词“在”表示方位的用法。\n（3）掌握能愿动词“能”的用法。','(1) Hiểu khi nghe và mô tả nơi chốn, vị trí, v.v.\n(2) Nắm cách dùng giới từ “在” chỉ vị trí.\n(3) Nắm cách dùng động từ năng nguyện “能”.'))
warm(d,54,[('小猫','xiǎo māo','mèo con'),('学校','xuéxiào','trường học'),('书店','shūdiàn','hiệu sách'),('医生','yīshēng','bác sĩ'),('桌子','zhuōzi','bàn'),('房间','fángjiān','phòng')],'CFBADE',5,
 [(86,634,286,770),(315,634,516,770),(544,634,744,770),(86,797,286,933),(315,797,516,933),(544,797,744,933)],
 [C('室内有多排摆满书的书架。','Trong nhà có nhiều kệ đầy sách.'),C('一间带婴儿床的房间。','Một phòng có cũi trẻ em.'),C('操场后面有教学楼。','Sau sân trường có tòa nhà học.'),C('一只小猫躺着。','Một con mèo con đang nằm.'),C('两人穿白大褂、戴听诊器。','Hai người mặc áo blouse trắng, đeo ống nghe.'),C('一件有圆形台面和支腿的家具。','Một món đồ nội thất có mặt tròn và các chân.')])
vocab(d,55,1,1,['房间|fángjiān|n.|room','外|wài|n.|outside','只|zhī|m.|for certain animals','小|xiǎo|adj.|small; little','猫|māo|n.|cat','没|méi|adv.|not; not yet','看见|kànjiàn|v.|see; catch sight of','桌子|zhuōzi|n.|table; desk','下|xià|n.|low position or rank','漂亮|piàoliang|adj.|pretty; beautiful'])
support(d,55,'original-tip',1,C('小语助力','Gợi ý của Tiểu Ngữ'),C('量词可以和指示代词直接组合。','Lượng từ có thể kết hợp trực tiếp với đại từ chỉ định.'))
scene_role(d,55,1);attach(d,55,1,(470,287,795,507),C('一只猫在桌子下休息。','Một con mèo nghỉ dưới bàn.'))
pair(d,55,'pair-text1',1,C('两人一组，选择一个物品，问答物品的方位。','Làm việc theo cặp, chọn một đồ vật rồi hỏi đáp về vị trí của nó.'))
grammar(d,56,'grammar-position',1,C('方位词','Từ chỉ phương vị'),C('本册学习的表达方向、位置的方位词有：上、下、里、外、前、后、外边。','Các từ chỉ phương hướng, vị trí trong tập này gồm: 上、下、里、外、前、后、外边.'),C('（1）房间里有一只小猫。\n（2）我们去书店外吧。\n（3）小雪的手机在桌子上呢。','(1) Trong phòng có một con mèo con.\n(2) Chúng ta ra ngoài hiệu sách nhé.\n(3) Điện thoại của Tiểu Tuyết ở trên bàn.'))
listen(d,56,2,1,C('白家月和李文在（　）见。','Chọn nơi Bạch Gia Nguyệt và Lý Văn gặp nhau.'),[('家里','jiā li','ở nhà'),('书店里','shūdiàn li','trong hiệu sách'),('书店前','shūdiàn qián','trước hiệu sách')],'C',5)
listen(d,56,2,2,C('李文下午（　）能到。','Chọn giờ Lý Văn có thể đến vào buổi chiều.'),[('两点','liǎng diǎn','hai giờ'),('两点半','liǎng diǎn bàn','hai giờ rưỡi'),('三点后','sān diǎn hòu','sau ba giờ')],'A',5)
vocab(d,57,2,11,['在|zài|prep.|at/in','学校|xuéxiào|n.|school','书店|shūdiàn|n.|bookstore','前|qián|n.|front','能|néng|mod.|can; be able to','到|dào|v.|arrive; reach','午饭|wǔfàn|n.|lunch'])
scene_role(d,57,2);d['activities'][-1]['source'].update(printedPages=[56,57],pdfPages=[71,72]);attach(d,56,2,(191,864,647,1123),C('白家月在教室打电话，旁边小图是通话中的李文。','Bạch Gia Nguyệt gọi điện trong lớp; hình nhỏ là Lý Văn đang nói điện thoại.'))
pair(d,57,'pair-text2',1,C('两人一组，根据实际情况对话。','Làm việc theo cặp, hội thoại theo tình huống thực tế.'))
grammar(d,57,'grammar-zai',1,C('介词“在”','Giới từ “在”'),C('介词“在”和表示位置、处所的词语组合，在动词前，表示在什么位置、处所做什么。','Giới từ “在” kết hợp với từ chỉ vị trí, nơi chốn, đứng trước động từ để nói làm gì ở đâu.'),C('（1）我在学校吃午饭。\n（2）他爸爸在医院工作。\n（3）你在哪儿买菜？','(1) Tôi ăn trưa ở trường.\n(2) Bố anh ấy làm việc ở bệnh viện.\n(3) Bạn mua rau ở đâu?'))
grammar(d,58,'grammar-neng',1,C('能愿动词“能”','Động từ năng nguyện “能”'),C('能愿动词“能”位于动词前，表示有能力、有条件或可能做某事。','“能” đứng trước động từ, biểu thị có khả năng, điều kiện hoặc có thể làm một việc.'),C('（1）下午两点你能到吗？\n（2）爸爸能去。\n（3）我不能去学校吃午饭。','(1) Hai giờ chiều bạn có thể đến không?\n(2) Bố có thể đi.\n(3) Tôi không thể đến trường ăn trưa.'))
listen(d,58,3,1,C('大医院里（　）。','Chọn tình trạng được nói đến trong bệnh viện lớn.'),[('人很少','rén hěn shǎo','rất ít người'),('病人多','bìngrén duō','nhiều bệnh nhân'),('医生不忙','yīshēng bù máng','bác sĩ không bận')],'B',5)
listen(d,58,3,2,C('胡医生家有（　）医生。','Chọn số bác sĩ trong gia đình bác sĩ Hồ.'),[('一个','yí gè','một người'),('两个','liǎng gè','hai người'),('三个','sān gè','ba người')],'B',5)
support(d,59,'original-tip',1,C('小语助力','Gợi ý của Tiểu Ngữ'),C('“小+姓氏”是对年纪比自己小的人的亲切称呼。','“小 + họ” là cách gọi thân mật người ít tuổi hơn mình.'))
vocab(d,59,3,18,['饭|fàn|n.|meal','大|dà|adj.|big; large','病人|bìngrén|n.|patient','多|duō|adj.|many; much','医生|yīshēng|n.|doctor','工作|gōngzuò|v.|work'])
vocab(d,59,3,1,['胡医生|Hú yīshēng||Dr. Hu'],proper=True)
scene_role(d,59,3);d['activities'][-1]['source'].update(printedPages=[58,59],pdfPages=[73,74]);attach(d,58,3,(158,774,667,1114),C('两名医生在医疗设备旁交谈。','Hai bác sĩ nói chuyện bên thiết bị y tế.'))
comprehension(d,59,3,[(C('胡医生的爸爸在哪儿工作？','Bố của bác sĩ Hồ làm việc ở đâu?'),C('他在医院工作。','Ông ấy làm việc ở bệnh viện.')),(C('胡医生的爸爸工作忙吗？','Công việc của bố bác sĩ Hồ có bận không?'),C('他非常忙。','Ông ấy rất bận.'))])
cloze(d,59,[('哪儿','nǎr','đâu'),('在','zài','ở'),('桌子','zhuōzi','bàn'),('书店','shūdiàn','hiệu sách'),('能','néng','có thể')],[(qvi('胡医生的爸爸＿＿医院工作。'),'B'),(qvi('我下午两点＿＿到学校。'),'E'),(qvi('陈天中：小猫在＿＿呢？\n白家月：小猫在＿＿下。'),'AC'),(qvi('白家月：我们去＿＿，你去吗？\n李文：我现在有事，不能去。'),'D')],[6,6,6,6])
for a in d['activities']:
 if a['source']['section']=='cloze' and a['source']['ordinal']>1:
  a['source']['printedPage']=60;a['source']['pdfPage']=75;a['id']=a['id'].replace('-p059-','-p060-')
picture(d,60,1,(122,357,412,478),C('医生＿＿。','Dùng câu tiếng Trung miêu tả bác sĩ.'),[C('在医院工作','làm việc ở bệnh viện')],C('两名穿白大褂的人。','Hai người mặc áo blouse trắng.'))
picture(d,60,2,(445,357,735,478),C('我们在＿＿见吧。','Hoàn thành lời hẹn gặp dựa trên hình.'),[C('书店里','trong hiệu sách')],C('书店内有多排书架。','Trong hiệu sách có nhiều dãy kệ.'))
picture(d,60,3,(122,552,412,674),C('你＿＿去＿＿吗？','Hỏi đối phương có thể đi đâu để mua đồ.'),[C('能','có thể'),C('超市','siêu thị')],C('一个人在超市里选购水果。','Một người lựa trái cây trong siêu thị.'))
picture(d,60,4,(445,552,735,674),C('桌子上＿＿。','Miêu tả thứ có trên bàn.'),[C('有一只小猫','có một con mèo con')],C('猫坐在桌子上，旁边有花瓶。','Mèo ngồi trên bàn, bên cạnh có bình hoa.'))
pair(d,60,'classroom',1,C('两人一组，使用以下词语对话。\n哪儿　东西　呢　下　小猫　吃　在','Làm việc theo cặp, dùng các từ sau để hội thoại.\n哪儿 (đâu); 东西 (đồ vật); 呢 (trợ từ); 下 (dưới); 小猫 (mèo con); 吃 (ăn); 在 (ở).'),C('A：你的手机在哪儿？\nB：我的手机在桌子上。你的手机呢？\nA：我的手机在家里。\n……','A: Điện thoại của bạn ở đâu?\nB: Điện thoại của tôi ở trên bàn. Còn điện thoại của bạn?\nA: Điện thoại của tôi ở nhà.\n…'),roles=2)
d['textbookCorrections']=[dict(target='textbook-l08-grammar-01',field='examples',printedPage=56,issue='原版我们去书店外吧缺失，末例句小雪的手机在桌子上呢被删去呢。'),dict(target='textbook-l08-grammar-02',field='examples',printedPage=57,issue='原版第三例句你在哪儿买菜缺失。'),dict(target='textbook-l08-grammar-03',field='examples',printedPage=58,issue='原版第二例句爸爸能去缺失。')]
finish(d,54,60)

for path in sorted(OUT.glob('lesson-*.json')):
 d=json.loads(path.read_text());print(path.name,len(d['activities']),'activities',sum(len(a['fields']) for a in d['activities']),'fields',len(d['figures']),'figures')
