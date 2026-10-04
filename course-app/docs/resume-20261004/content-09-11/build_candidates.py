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
 a=act(d,page,section,n,'pair-work',C('对话活动','Hoạt động hội thoại'),instruction,C('记录你们的对话。','Ghi lại hội thoại của các bạn.'),[free(1,label=C('对话记录','Nội dung hội thoại'),input='textarea')])
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

# Lesson 9: printed pages 61–69.
d=new(9)
warm(d,61,[('小狗','xiǎo gǒu','chó con'),('电视','diànshì','ti vi'),('学习','xuéxí','học'),('玩','wán','chơi'),('椅子','yǐzi','ghế'),('书','shū','sách')],'DCABFE',6,
 [(138,682,339,820),(367,682,568,820),(596,682,795,820),(138,844,339,982),(367,844,568,982),(596,844,795,982)],
 [C('几个人在地毯上一起活动。','Một số người cùng hoạt động trên thảm.'),C('一个人在桌前看书并做笔记。','Một người đọc sách và ghi chép ở bàn.'),C('一只黑白相间的动物在草地上奔跑。','Một con vật đen trắng chạy trên cỏ.'),C('屏幕上显示山林风景。','Màn hình hiển thị phong cảnh rừng núi.'),C('成摞的书。','Những chồng sách.'),C('一件带靠背和四条腿的家具。','Một món đồ nội thất có lưng tựa và bốn chân.')])
scene_role(d,62,1)
pair(d,62,'pair-text1',1,C('两人一组，根据实际情况对话。','Làm việc theo cặp và hội thoại theo tình huống thực tế.'))
read(d,63,'grammar-existence',1,C('存现句（1）','Câu tồn hiện (1)'),C('（1）学校前边有一家电影院。\n（2）电影院前边是一家超市。\n（3）电影院前边不是超市。\n（4）桌子上没有小猫。','(1) Phía trước trường có một rạp chiếu phim.\n(2) Phía trước rạp chiếu phim là một siêu thị.\n(3) Phía trước rạp chiếu phim không phải là siêu thị.\n(4) Trên bàn không có mèo con.'))
read(d,63,'grammar-time-place',1,C('时间词语和处所词语同时作状语的顺序','Thứ tự trạng ngữ thời gian và nơi chốn'),C('（1）我们七点在电影院外边见。\n（2）安妮下午在家里学中文。\n（3）陈天中明天中午在学校吃午饭。','(1) Bảy giờ chúng ta gặp bên ngoài rạp chiếu phim.\n(2) Buổi chiều Annie học tiếng Trung ở nhà.\n(3) Trưa mai Trần Thiên Trung ăn trưa ở trường.'))
for i,(pr,rf) in enumerate([(C('A：你们今天下午两点（　）上课？\nB：在学校。','A: Hôm nay lúc hai giờ chiều các bạn học (　)?\nB: Ở trường.'),C('在哪儿','ở đâu')),(C('A：你们（　）在超市买什么呢？\nB：买菜呢。','A: (　) các bạn mua gì ở siêu thị?\nB: Mua rau.'),C('今天下午','chiều nay'))],1):
 act(d,63,'complete-dialogues',i,'open-dialogue-completion',C('完成对话','Hoàn thành hội thoại'),C('完成对话。','Hoàn thành hội thoại.'),pr,[free(1,rf)])
listen(d,63,2,1,C('椅子上有（　）。','Trên ghế có (　).'),[('一本书','yì běn shū','một quyển sách'),('一只猫','yì zhī māo','một con mèo'),('一个手机','yí gè shǒujī','một chiếc điện thoại')],'A',6)
listen(d,64,2,2,C('这是陈天中的（　）中文书。','Đây là quyển sách tiếng Trung (　) của Trần Thiên Trung.'),[('第一本','dì-yī běn','thứ nhất'),('第二本','dì-èr běn','thứ hai'),('第三本','dì-sān běn','thứ ba')],'B',6)
scene_role(d,64,2)
comprehension(d,64,2,[(C('椅子上的书是谁的？','Quyển sách trên ghế là của ai?'),C('是陈天中的。','Là của Trần Thiên Trung.')),(C('陈天中明天上午在哪儿学习？','Sáng mai Trần Thiên Trung học ở đâu?'),C('他明天上午在学校学习。','Sáng mai anh ấy học ở trường.'))])
read(d,65,'grammar-ordinal',1,C('表示序数的“第”','“第” biểu thị số thứ tự'),C('（1）第一，第二，第三\n（2）第一个，第二个，第一本\n（3）第一个学生，第一本书','(1) Thứ nhất, thứ hai, thứ ba\n(2) Cái thứ nhất, cái thứ hai, quyển thứ nhất\n(3) Học sinh thứ nhất, quyển sách thứ nhất'))
listen(d,65,3,1,C('杨同乐唱歌（　）。','Dương Đồng Lạc hát (　).'),[('不太好','bú tài hǎo','không hay lắm'),('不好听','bù hǎotīng','không hay'),('很好听','hěn hǎotīng','rất hay')],'C',6)
listen(d,65,3,2,C('王一雪家有一只（　）。','Nhà Vương Nhất Tuyết có một con (　).'),[('小猫','xiǎo māo','mèo con'),('小狗','xiǎo gǒu','chó con'),('大狗','dà gǒu','chó lớn')],'B',6)
scene_role(d,66,3)
comprehension(d,66,3,[(C('杨同乐星期六做什么？','Thứ Bảy Dương Đồng Lạc làm gì?'),C('他白天在家里读书，晚上和朋友们去外边唱歌。','Ban ngày anh ấy đọc sách ở nhà, buổi tối ra ngoài hát cùng bạn bè.')),(C('王一雪星期六做什么？','Thứ Bảy Vương Nhất Tuyết làm gì?'),C('她在家里做饭、看电视，和孩子们、小狗玩。','Cô ấy nấu ăn, xem ti vi ở nhà, chơi với các con và chó con.'))])
cloze(d,67,[('是','shì','là'),('好听','hǎotīng','hay (âm thanh)'),('在学校','zài xuéxiào','ở trường'),('今天上午','jīntiān shàngwǔ','sáng nay'),('椅子','yǐzi','ghế')],[(C('＿＿上有一只小狗，房间外＿＿一只小狗。','Trên ＿＿ có một con chó con, ngoài phòng ＿＿ một con chó con.'),'EA'),(C('她＿＿在家里学习。','＿＿ cô ấy học ở nhà.'),'D'),(C('王一雪：你唱歌很＿＿。\n杨同乐：谢谢！','Vương Nhất Tuyết: Bạn hát rất ＿＿.\nDương Đồng Lạc: Cảm ơn!'),'B'),(C('陈天中：你下午去哪儿？\n安妮：我下午还＿＿上课。','Trần Thiên Trung: Chiều nay bạn đi đâu?\nAnnie: Chiều nay tôi vẫn học ＿＿.'),'C')],[6,7,7,7])
picture(d,67,1,(171,542,461,711),C('桌子上＿＿。','Trên bàn ＿＿.'),[C('有一本书','có một quyển sách')],C('桌上有书、杯子和瓶子。','Trên bàn có sách, cốc và chai.'))
picture(d,67,2,(494,542,784,711),C('孩子们＿＿在家里＿＿。','Bọn trẻ ＿＿ ở nhà ＿＿.'),[C('今天下午','chiều nay'),C('看电视','xem ti vi')],C('几个孩子在室内看屏幕。','Vài đứa trẻ đang xem màn hình trong nhà.'))
picture(d,67,3,(171,795,461,963),C('＿＿一只小狗是我的，＿＿二只小狗是她的。','Con chó con ＿＿ nhất là của tôi, con chó con ＿＿ hai là của cô ấy.'),[C('第','thứ'),C('第','thứ')],C('两只小狗并排。','Hai con chó con ở cạnh nhau.'))
picture(d,67,4,(494,795,784,963),C('学校外边是一家小店，＿＿。','Bên ngoài trường là một cửa hàng nhỏ, ＿＿.'),[C('我在那儿买东西','tôi mua đồ ở đó')],C('一个人在商店货架前挑选物品。','Một người lựa đồ trước kệ hàng.'))
pair(d,68,'classroom',1,C('两人一组，一个人扮演白家月，另一个人扮演陈天中，仿照本课三篇课文的内容对话。','Làm việc theo cặp: một người đóng vai Bạch Gia Nguyệt, người còn lại đóng vai Trần Thiên Trung; dựa vào ba bài đọc để tạo hội thoại.'),roles=2)
vocabtable=act(d,68,'learning-summary-vocabulary',1,'self-review-table',C('学习小结 · 词语学习','Tổng kết học tập · Từ vựng'),C('记录第7—9课的词语学习情况。','Ghi lại tình hình học từ vựng của bài 7–9.'),C('7～9课我的学习情况。','Tình hình học tập của tôi ở bài 7–9.'),[free(1,label=C('我已经记住并会使用的词语','Các từ tôi đã nhớ và biết dùng'),input='textarea',required=False),free(2,label=C('我还没记住的词语','Các từ tôi chưa nhớ'),input='textarea',required=False)])
vocabtable['table']=dict(columns=[C('词语学习','Học từ vựng'),C('记录','Ghi chép')],rows=[dict(id=f'row-{i}',cells=[dict(text=f['label']),dict(fieldId=f['id'])]) for i,f in enumerate(vocabtable['fields'],1)])
summary=[C('时间的表达（2），例如：上午十点','Cách biểu đạt thời gian (2), ví dụ: mười giờ sáng'),C('方位词，例如：在桌子上','Từ chỉ phương vị, ví dụ: trên bàn'),C('语气助词“吧”（1），例如：我们上课吧。','Trợ từ ngữ khí “吧” (1), ví dụ: chúng ta vào học nhé.'),C('副词、时间词语作状语的位置，例如：我下午不去学校。','Vị trí phó từ và cụm thời gian làm trạng ngữ, ví dụ: chiều nay tôi không đi học.'),C('语气助词“呢”（2），例如：我下午还有课呢。','Trợ từ ngữ khí “呢” (2), ví dụ: chiều nay tôi vẫn còn tiết học.'),C('介词“在”，例如：我在学校学习。','Giới từ “在”, ví dụ: tôi học ở trường.'),C('能愿动词“能”，例如：我能去。','Động từ năng nguyện “能”, ví dụ: tôi có thể đi.'),C('存现句（1），例如：桌子上有/是一本书。','Câu tồn hiện (1), ví dụ: trên bàn có/là một quyển sách.'),C('时间词语和处所词语同时作状语的顺序，例如：我们上午十点在书店见吧。','Thứ tự trạng ngữ thời gian và nơi chốn, ví dụ: mười giờ sáng chúng ta gặp ở hiệu sách nhé.'),C('表示序数的“第”，例如：第一，第一个，第一个学生','“第” biểu thị số thứ tự, ví dụ: thứ nhất, cái thứ nhất, học sinh thứ nhất')]
fields=[];rows=[]
for i,label in enumerate(summary,1):
 cells=[dict(text=label)]
 for j,col in enumerate([C('理解','Hiểu'),C('会用','Biết dùng')],1):
  f=free((i-1)*2+j,label=C(f'第{i}项 · {col["zh"]}',f'Mục {i} · {col["vi"]}'),input='select',required=False);f['options']=opts([('是','','Có'),('尚未','','Chưa')]);fields.append(f);cells.append(dict(fieldId=f['id']))
 rows.append(dict(id=f'row-{i}',cells=cells,source=src(68 if i==1 else 69,'learning-summary-can-use',i)))
a=act(d,68,'learning-summary-can-use',1,'self-review-table',C('我理解并会用','Tôi hiểu và biết dùng'),C('按自己的掌握情况分别标记“理解”和“会用”。','Tự đánh dấu riêng mức “Hiểu” và “Biết dùng”.'),C('第7—9课学习小结（续页至第69页）。','Tổng kết bài 7–9 (tiếp đến trang 69).'),fields)
a['table']=dict(columns=[C('内容','Nội dung'),C('理解','Hiểu'),C('会用','Biết dùng')],rows=rows)
act(d,69,'learning-summary-improve',1,'reflection',C('我需要努力的','Điểm tôi cần cố gắng'),C('记录需要继续练习的内容。','Ghi lại những nội dung cần tiếp tục luyện tập.'),C('我需要努力的：','Điểm tôi cần cố gắng:'),[free(1,label=C('学习反思','Suy ngẫm về việc học'),input='textarea',required=False)])
d['textbookCorrections']=[dict(target='textbook-l09-grammar-01',printedPage=63,issue='原版例句（3）电影院前边不是超市。缺失；完整四句已纳入候选。'),dict(target='textbook-l09-grammar-02',printedPage=63,issue='原版例句（2）安妮下午在家里学中文。和（3）陈天中明天中午在学校吃午饭。被替换/遗漏；候选恢复。'),dict(target='textbook-l09-grammar-03',printedPage=65,issue='原版序数三组练读没有完整保留；候选逐字保留含第二组重复的“第一个”。'),dict(target='textbook-l09-text-1-line-01',printedPage=62,field='py',suggested='Xuéxiào qiánbian yǒu yì jiā diànyǐngyuàn.',issue='前边中边为轻声；原书小语助力明确说明。'),dict(target='textbook-l09-text-1-line-03',printedPage=62,field='py',suggested='Hǎo! Wǒmen qī diǎn zài diànyǐngyuàn wàibian jiàn, hǎo ma?',issue='外边中边为轻声。'),dict(target='textbook-l09-text-2-line-01',printedPage=64,field='py',suggested='Yǐzi shang yǒu yì běn Zhōngwén shū, nà shì shéi de shū?',issue='上作后附方位词轻声，一本为yì běn；原书有小语助力。')]
d['coverage']=[dict(printedPage=p,pdfPage=p+15,visualReview='author-inspected',sourceSections=secs) for p,secs in [(61,['objectives','warmup-6-panels']),(62,['text1-existing','vocabulary-existing','tips-existing','role-read','pair-dialogue']),(63,['grammar-1-4-examples','grammar-2-3-examples','complete-dialogues-2','listen-text2-item1']),(64,['listen-text2-item2','text2-existing','vocabulary-existing','tip-existing','role-read','comprehension-2']),(65,['grammar-3-3-groups','listen-text3-2']),(66,['text3-existing','vocabulary-existing','tip-existing','role-read','comprehension-2']),(67,['cloze-4-items-5-fields','picture-4-items-6-fields']),(68,['classroom-role-play','vocabulary-self-review-2x2','can-use-table-row1']),(69,['can-use-table-rows2-10','reflection'])]]
(OUT/'lesson-09.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

# Lesson 10: printed pages 70–77.
d=new(10)
warm(d,70,[('衣服','yīfu','quần áo'),('便宜','piányi','rẻ'),('苹果','píngguǒ','táo'),('穿','chuān','mặc'),('杯子','bēizi','cốc'),('商店','shāngdiàn','cửa hàng')],'CAEDFB',7,
 [(88,669,289,805),(317,669,518,805),(546,669,747,805),(88,831,289,967),(317,831,518,967),(546,831,747,967)],
 [C('一些红色水果。','Một số quả màu đỏ.'),C('床上放着多件折好的衣物。','Nhiều bộ đồ được gấp trên giường.'),C('桌上有一个白色带把手的容器。','Trên bàn có một vật đựng màu trắng có quai.'),C('一人帮助另一人整理衬衣。','Một người giúp người kia chỉnh áo sơ mi.'),C('室内有陈列商品的货架。','Trong nhà có các kệ trưng bày hàng.'),C('商品旁有50%的标志。','Cạnh hàng hóa có biển 50%.')])
scene_role(d,71,1)
pair(d,71,'pair-text1',1,C('两人一组，选择一个物品，互相问答价格。','Làm việc theo cặp, chọn một món đồ rồi hỏi và trả lời về giá.'))
money=act(d,72,'money-table',1,'reference-table',C('钱数的表达','Cách biểu đạt số tiền'),C('大声朗读。','Đọc thành tiếng.'),C('人民币单位由大到小是“元、角、分”，口语中分别说“块、毛、分”；表达顺序为元/块→角/毛→分。','Đơn vị nhân dân tệ từ lớn đến nhỏ là “元、角、分”; trong khẩu ngữ là “块、毛、分”. Thứ tự biểu đạt: 元/块 → 角/毛 → 分.'))
money['table']=dict(columns=[C('写法1','Cách viết 1'),C('写法2','Cách viết 2'),C('读法','Cách đọc')],rows=[dict(id=f'row-{i}',cells=[dict(text=C(a,a)),dict(text=C(b,v)),dict(text=C(c,c))]) for i,(a,b,c,v) in enumerate([('0.02元','两分','liǎng fēn','hai phân'),('0.2元','两毛','liǎng máo','hai hào'),('3元','三块','sān kuài','ba tệ'),('3.2元','三块二','sān kuài èr','ba tệ hai hào'),('6.02元','六块零两分','liù kuài líng liǎng fēn','sáu tệ lẻ hai phân'),('202.2元','二百零二块两毛','èrbǎi líng èr kuài liǎng máo','hai trăm lẻ hai tệ hai hào')],1)])
listen(d,72,2,1,C('这儿的水果（　）。','Trái cây ở đây (　).'),[('很少','hěn shǎo','rất ít'),('真不少','zhēn bù shǎo','thật không ít'),('真不多','zhēn bù duō','thật không nhiều')],'B',7)
listen(d,72,2,2,C('苹果（　）一斤。','Táo giá (　) một cân Trung Quốc (500 g).'),[('三块','sān kuài','ba tệ'),('三块五','sān kuài wǔ','ba tệ năm hào'),('七块二','qī kuài èr','bảy tệ hai hào')],'B',7)
scene_role(d,73,2)
pair(d,73,'pair-text2',1,C('两人一组，一个人扮演顾客，一个人扮演售货员，进行购物问答。','Làm việc theo cặp: một người đóng vai khách hàng, một người đóng vai người bán; hỏi đáp khi mua hàng.'),roles=2)
read(d,74,'grammar-adjectival',1,C('形容词谓语句','Câu vị ngữ tính từ'),C('（1）这儿的水果真不少！\n（2）我的房间不大。\n（3）那个苹果好吃。','(1) Trái cây ở đây thật không ít!\n(2) Phòng của tôi không lớn.\n(3) Quả táo kia ngon.'))
listen(d,74,3,1,C('这件衣服（　）。','Chiếc áo này (　).'),[('二十元','èrshí yuán','hai mươi tệ'),('一百元','yìbǎi yuán','một trăm tệ'),('一百一十元','yìbǎi yīshí yuán','một trăm mười tệ')],'B',7)
listen(d,74,3,2,C('这件衣服（　）。','Chiếc áo này (　).'),[('太贵','tài guì','đắt quá'),('很贵','hěn guì','rất đắt'),('不贵','bú guì','không đắt')],'C',7)
scene_role(d,75,3)
comprehension(d,75,3,[(C('那件衣服王一雪想买几件？','Vương Nhất Tuyết muốn mua mấy chiếc áo đó?'),C('她想买一件。','Cô ấy muốn mua một chiếc.')),(C('男孩子的衣服在哪儿？','Quần áo của con trai ở đâu?'),C('男孩子的衣服在那儿。','Quần áo của con trai ở đằng kia.'))])
read(d,76,'grammar-how-dialogues',1,C('疑问代词“怎么样”','Đại từ nghi vấn “怎么样”'),C('（1）A：这个杯子怎么样？\nB：我很喜欢，也不贵。\n（2）A：这本书怎么样？\nB：很好看。\n（3）A：这个菜怎么样？\nB：这个菜不太好吃，我不喜欢。','(1) A: Cái cốc này thế nào?\nB: Tôi rất thích, cũng không đắt.\n(2) A: Quyển sách này thế nào?\nB: Rất hay.\n(3) A: Món này thế nào?\nB: Món này không ngon lắm, tôi không thích.'))
cloze(d,76,[('杯子','bēizi','cốc'),('怎么样','zěnmeyàng','thế nào'),('多少','duōshao','bao nhiêu'),('这些','zhèxiē','những cái này'),('块','kuài','tệ')],[(C('请问，这本书＿＿钱？','Xin hỏi, quyển sách này giá ＿＿ tiền?'),'C'),(C('这个＿＿不便宜，六十五＿＿钱一个。','Chiếc ＿＿ này không rẻ, sáu mươi lăm ＿＿ một chiếc.'),'AE'),(C('售货员：＿＿苹果很好吃，你买一些吧。\n王一雪：好的，我买五个。','Người bán: ＿＿ táo này rất ngon, chị mua một ít nhé.\nVương Nhất Tuyết: Được, tôi mua năm quả.'),'D'),(C('安妮：这件衣服＿＿？\n白家月：很好看。','Annie: Chiếc áo này ＿＿?\nBạch Gia Nguyệt: Rất đẹp.'),'B')],[7,7,8,8])
picture(d,77,1,(172,154,463,265),C('这儿的苹果＿＿。','Táo ở đây ＿＿.'),[C('真多','thật nhiều')],C('许多红苹果。','Nhiều quả táo đỏ.'))
picture(d,77,2,(497,154,787,265),C('这个电影＿＿？','Bộ phim này ＿＿?'),[C('怎么样','thế nào')],C('电影画面里的人穿着航天服。','Nhân vật trong cảnh phim mặc đồ phi hành gia.'))
picture(d,77,3,(172,339,463,449),C('那些杯子＿＿，非常＿＿。','Những chiếc cốc kia ＿＿, rất ＿＿.'),[C('很好看','rất đẹp'),C('便宜','rẻ')],C('四个不同颜色的杯子。','Bốn chiếc cốc khác màu.') )
picture(d,77,4,(497,339,787,449),C('这件衣服＿＿，一件＿＿块。','Chiếc áo này ＿＿, mỗi chiếc ＿＿ tệ.'),[C('不贵','không đắt'),C('五十','năm mươi')],C('一件粉色衣服带有未显示价格的吊牌。','Một chiếc áo màu hồng có nhãn không ghi giá rõ ràng.') )
pair(d,77,'classroom',1,C('三人一组，一个人扮演售货员，两个人扮演顾客，仿照本课三篇课文的内容对话。','Làm việc theo nhóm ba người: một người đóng vai người bán, hai người đóng vai khách hàng; dựa vào ba bài đọc để tạo hội thoại.'),roles=3)
d['bonus']=dict(id='hsk1-original-2026-l10-p077-bonus-reference-01',title=C('认识人民币','Tìm hiểu nhân dân tệ'),printedResourceId='10-1',printedPage=77,pdfPage=92,availability='unavailable',payload=None)
d['textbookCorrections']=[dict(target='textbook-l10-grammar-01',printedPage=72,issue='原版钱数表6行3列缺失；候选按原顺序恢复。'),dict(target='textbook-l10-grammar-03',printedPage=76,issue='原版三组完整对话，现版仅前两组问题；候选恢复。'),dict(target='textbook-l10-text-2-line-04',printedPage=73,field='py',suggested='Píngguǒ sān kuài wǔ yì jīn. Zhèxiē qī kuài èr, qī kuài qián ba.',issue='原书一斤为yì jīn。'),dict(target='textbook-l10-text-3-line-03',printedPage=75,field='py',suggested='Xiǎoxuě néng chuān, mǎi yí jiàn ba.',issue='原书一件为yí jiàn。'),dict(target='textbook-l10-text-3-line-05',printedPage=75,field='zh',suggested='不能。这些是女孩子穿的衣服，男孩子的衣服在那儿。',issue='现版用句号分句，原版是逗号；语义一致。')]
d['coverage']=[dict(printedPage=p,pdfPage=p+15,visualReview='author-inspected',sourceSections=secs) for p,secs in [(70,['objectives','warmup-6-panels']),(71,['text1-existing','vocabulary-existing','role-read','pair-price']),(72,['money-table-6x3','listen-text2-2']),(73,['text2-existing','vocabulary-existing','role-read','shopping-pair']),(74,['grammar-adjectival-3-examples','listen-text3-2','text3-scene-image']),(75,['text3-existing','vocabulary-existing','role-read','comprehension-2']),(76,['how-3-dialogues','cloze-4-items-5-fields']),(77,['picture-4-items-6-fields','classroom-3-participants','bonus-10-1-unavailable'])]]
(OUT/'lesson-10.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

# Lesson 11: printed pages 78–85.
d=new(11)
warm(d,78,[('开车','kāichē','lái xe'),('睡觉','shuìjiào','ngủ'),('问','wèn','hỏi'),('饭店','fàndiàn','nhà hàng'),('找','zhǎo','tìm'),('大学生','dàxuéshēng','sinh viên')],'DFAECB',8,
 [(85,656,287,792),(315,656,516,792),(545,656,744,792),(85,818,287,954),(315,818,516,954),(545,818,744,954)],
 [C('室内摆着餐桌和椅子。','Trong nhà có các bàn ăn và ghế.'),C('几名年轻人在教室里围桌讨论。','Vài người trẻ thảo luận quanh bàn trong lớp học.'),C('一个人坐在驾驶位，手握方向盘。','Một người ngồi ghế lái, tay cầm vô lăng.'),C('一个人在查看自己的包。','Một người đang xem trong túi của mình.'),C('一人在柜台前向工作人员询问。','Một người hỏi nhân viên tại quầy.'),C('一人闭着眼躺在床上。','Một người nhắm mắt nằm trên giường.')])
scene_role(d,79,1)
pair(d,79,'pair-text1',1,C('两人一组，根据实际情况对话。','Làm việc theo cặp và hội thoại theo tình huống thực tế.'))
read(d,80,'grammar-a-not-a',1,C('正反问','Câu hỏi chính-phản'),C('（1）它是不是在超市后边？\n（2）你去没去学校？\n（3）这件衣服好看不好看？','(1) Có phải nó ở phía sau siêu thị không?\n(2) Bạn đã đến trường chưa?\n(3) Chiếc áo này có đẹp không?'))
read(d,80,'grammar-a-not-a-dialogues',1,C('正反问 · 朗读对话','Câu hỏi chính-phản · Đọc hội thoại'),C('（1）A：他去哪儿了？你知道不知道？\nB：我不知道。\n（2）A：昨天你去没去书店？\nB：我没去。\n（3）A：这件衣服贵不贵？\nB：不贵。','(1) A: Anh ấy đi đâu rồi? Bạn có biết không?\nB: Tôi không biết.\n(2) A: Hôm qua bạn đã đi hiệu sách chưa?\nB: Tôi không đi.\n(3) A: Chiếc áo này có đắt không?\nB: Không đắt.'))
listen(d,80,2,1,C('李文（　）读大学。','Lý Văn (　) học đại học.'),[('不','bù','không'),('没','méi','không/chưa'),('在','zài','đang')],'C',8)
listen(d,80,2,2,C('李文很忙，有很多（　）。','Lý Văn rất bận, có rất nhiều (　).'),[('课','kè','tiết học'),('书','shū','sách'),('椅子','yǐzi','ghế')],'A',8)
scene_role(d,81,2)
pair(d,81,'pair-text2',1,C('两人一组，根据实际情况对话。','Làm việc theo cặp và hội thoại theo tình huống thực tế.'))
read(d,82,'grammar-progressive',1,C('时间副词“在/正在”','Phó từ thời gian “在/正在”'),C('（1）你还在读大学吗？\n（2）学生们在/正在上课呢。\n（3）我们读书呢。','(1) Bạn vẫn đang học đại học à?\n(2) Các học sinh đang học.\n(3) Chúng tôi đang đọc sách.'))
read(d,82,'grammar-progressive-dialogues',1,C('“在/正在” · 朗读对话','“在/正在” · Đọc hội thoại'),C('（1）A：你在做什么呢？\nB：我正在看电视。\n（2）A：我去看电影，你去不去？\nB：我在学习呢，不想去。\n（3）A：你在买菜吗？\nB：我没买菜，买水果呢。','(1) A: Bạn đang làm gì?\nB: Tôi đang xem ti vi.\n(2) A: Tôi đi xem phim, bạn có đi không?\nB: Tôi đang học, không muốn đi.\n(3) A: Bạn đang mua rau à?\nB: Tôi không mua rau, đang mua trái cây.'))
listen(d,82,3,1,C('弟弟正在（　）。','Em trai đang (　).'),[('玩','wán','chơi'),('起床','qǐchuáng','dậy'),('睡觉','shuìjiào','ngủ')],'C',8)
listen(d,82,3,2,C('爸爸问姐姐，弟弟（　）超市。','Bố hỏi chị gái, em trai (　) siêu thị.'),[('在','zài','ở'),('去','qù','đi'),('去不去','qù bu qù','có đi hay không')],'C',8)
scene_role(d,83,3)
comprehension(d,83,3,[(C('弟弟起床没起床？','Em trai đã dậy chưa?'),C('他还没起床。','Em ấy chưa dậy.')),(C('弟弟今天要做什么？','Hôm nay em trai định làm gì?'),C('他今天要和小朋友玩。','Hôm nay em ấy định chơi với các bạn nhỏ.'))])
read(d,84,'grammar-yao',1,C('能愿动词“要”','Động từ năng nguyện “要”'),C('（1）他今天要和小朋友玩。\n（2）妈妈要去超市。\n（3）白家月要在家里学中文。','(1) Hôm nay cậu ấy định chơi với các bạn nhỏ.\n(2) Mẹ định đi siêu thị.\n(3) Bạch Gia Nguyệt định học tiếng Trung ở nhà.'))
cloze(d,84,[('那里','nàli','chỗ đó'),('睡觉','shuìjiào','ngủ'),('去不去','qù bu qù','có đi không'),('要','yào','muốn/định'),('正在','zhèngzài','đang')],[(C('你＿＿超市？','Bạn ＿＿ siêu thị?'),'C'),(C('她没在看电视，＿＿学习呢。','Cô ấy không xem ti vi, ＿＿ học.'),'E'),(C('弟弟：姐姐，我们去＿＿玩吧，好不好？\n姐姐：我不去，我＿＿读书。','Em trai: Chị ơi, mình đến ＿＿ chơi nhé, được không?\nChị gái: Chị không đi, chị ＿＿ đọc sách.'),'AD'),(C('妈妈：爸爸在做什么？\n孩子：他在＿＿呢。','Mẹ: Bố đang làm gì?\nCon: Bố đang ＿＿.'),'B')],[8,8,8,9])
picture(d,85,1,(171,155,461,320),C('我们＿＿。','Chúng tôi ＿＿.'),[C('正在买东西','đang mua đồ')],C('两人在商店里挑选商品。','Hai người lựa hàng trong cửa hàng.'))
picture(d,85,2,(495,155,784,320),C('桌子上＿＿书？','Trên bàn ＿＿ sách?'),[C('有没有','có hay không có')],C('一张空桌子。','Một chiếc bàn trống.'))
picture(d,85,3,(171,394,461,558),C('弟弟＿＿睡觉，在学习呢，他明天＿＿。','Em trai ＿＿ ngủ, đang học; ngày mai em ấy ＿＿.'),[C('没','không'),C('要去学校','định đến trường')],C('一个男孩在桌前写字。','Một cậu bé đang viết ở bàn.'))
picture(d,85,4,(495,394,784,558),C('她＿＿看电视，＿＿。','Cô ấy ＿＿ xem ti vi, ＿＿.'),[C('没在','không đang'),C('在读书呢','đang đọc sách')],C('一个人打开书阅读，旁边有几本书。','Một người đọc cuốn sách đang mở, bên cạnh có vài quyển sách.'))
pair(d,85,'classroom',1,C('两人一组，互相问答做不做某事。','Làm việc theo cặp, lần lượt hỏi và trả lời có làm một việc gì đó hay không.'),C('A：你去不去吃午饭？\nB：我不去。\nA：你在做什么？\nB：我在学中文呢。你学不学？\n……','A: Bạn có đi ăn trưa không?\nB: Tôi không đi.\nA: Bạn đang làm gì?\nB: Tôi đang học tiếng Trung. Bạn có học không?\n…'),roles=2)
d['textbookCorrections']=[dict(target='textbook-l11-grammar-01',printedPage=80,issue='三组完整正反问对话在现版缺失；候选恢复。'),dict(target='textbook-l11-grammar-02',printedPage=82,issue='原版学生们在/正在上课呢、我们读书呢及三组完整对话未完整保留；候选恢复，并保留“动词+呢”独立形式。'),dict(target='textbook-l11-grammar-03',printedPage=84,issue='原版例句（3）白家月要在家里学中文。缺失；候选恢复。'),dict(target='textbook-l11-text-2-line-04',printedPage=81,field='zh',suggested='非常忙，我学医，我们的课很多。',issue='现版“非常忙。”，原版“非常忙，”；语义一致。')]
d['coverage']=[dict(printedPage=p,pdfPage=p+15,visualReview='author-inspected',sourceSections=secs) for p,secs in [(78,['objectives','warmup-6-panels']),(79,['text1-existing','vocabulary-existing','role-read','pair-dialogue']),(80,['a-not-a-3-examples','a-not-a-3-dialogues','listen-text2-2']),(81,['text2-existing','vocabulary-existing','role-read','pair-dialogue']),(82,['progressive-3-examples','progressive-3-dialogues','listen-text3-2']),(83,['text3-existing','vocabulary-existing','role-read','comprehension-2']),(84,['yao-3-examples','cloze-4-items-5-fields']),(85,['picture-4-items-6-fields','classroom-pair-with-example'])]]
(OUT/'lesson-11.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

# Source-support content is separate from scored activity fields. These original images
# are extracted, never redrawn; objectives, instructions and tips are author translated.
extras={
 9:dict(page=61,objectives=C('（1）能听懂并使用“有/是”表达存在。\n（2）掌握时间词语和处所词语同现时的顺序。\n（3）掌握“第”的用法。\n（4）了解当代中国人的休闲活动。','(1) Hiểu khi nghe và dùng “有/是” để biểu thị sự tồn tại.\n(2) Nắm thứ tự của cụm thời gian và nơi chốn khi cùng xuất hiện.\n(3) Nắm cách dùng “第”.\n(4) Tìm hiểu hoạt động giải trí của người Trung Quốc hiện nay.'),scenes=[(62,1,(440,365,782,592),C('胶片、爆米花和电影相关物品。','Cuộn phim, bỏng ngô và đồ vật liên quan đến điện ảnh.')),(64,2,(414,402,758,574),C('椅子上放着一本书。','Trên ghế có một quyển sách.')),(66,3,(477,93,778,261),C('一位成人和两个孩子一起玩。','Một người lớn chơi cùng hai trẻ em.'))]),
 10:dict(page=70,objectives=C('（1）能听懂、看懂并简单谈论商品价格。\n（2）掌握形容词谓语句的用法。\n（3）掌握疑问代词“怎么样”的用法。\n（4）认识人民币。','(1) Hiểu khi nghe, đọc và trò chuyện đơn giản về giá hàng hóa.\n(2) Nắm cách dùng câu vị ngữ tính từ.\n(3) Nắm cách dùng đại từ nghi vấn “怎么样”.\n(4) Nhận biết nhân dân tệ.'),scenes=[(71,1,(425,257,783,502),C('货架上悬挂着不同颜色的杯子。','Các cốc nhiều màu treo trên kệ.')),(73,2,(459,96,792,392),C('水果摊上摆着多种水果。','Quầy hoa quả bày nhiều loại trái cây.')),(74,3,(88,835,749,1115),C('商店内陈列着多种衣服。','Nhiều loại quần áo được trưng bày trong cửa hàng.'))]),
 11:dict(page=78,objectives=C('（1）能听懂并使用三种结构表达正在做的事情。\n（2）能听懂并使用正反问格式进行提问。\n（3）掌握能愿动词“要”表达想做、打算做的用法。','(1) Hiểu khi nghe và dùng ba cấu trúc để diễn tả việc đang làm.\n(2) Hiểu khi nghe và dùng câu hỏi chính-phản.\n(3) Nắm cách dùng động từ năng nguyện “要” để biểu thị mong muốn và dự định.'),scenes=[(79,1,(478,467,811,703),C('一个人在车里打电话。','Một người gọi điện trong xe.')),(81,2,(489,190,850,525),C('一位学习者在写字，上方小图为显微镜。','Một người học đang viết; hình nhỏ phía trên có kính hiển vi.')),(83,3,(416,90,772,388),C('一位成人和女孩交谈，上方小图为躺在床上的孩子。','Một người lớn nói chuyện với bé gái; hình nhỏ phía trên có trẻ đang nằm trên giường.'))])}
descriptions={
 (9,'grammar-existence'):C('存现句是表示某个地方或位置存在某人或某物的句子，一般以“有”或“是”为标记。否定时，宾语前不能使用数量词语。','Câu tồn hiện diễn tả một nơi hoặc vị trí có người hay vật, thường dùng “有” hoặc “是”. Khi phủ định, không dùng cụm số lượng trước tân ngữ.'),
 (9,'grammar-time-place'):C('时间词语和处所词语同时作状语时，时间词语要在处所词语前。','Khi cụm thời gian và cụm nơi chốn cùng làm trạng ngữ, cụm thời gian đứng trước cụm nơi chốn.'),
 (9,'grammar-ordinal'):C('“第”位于整数的数词前，表示序数。基本结构：（1）第+数词；（2）第+数词+量词+（名词）。','“第” đứng trước số nguyên để chỉ thứ tự. Cấu trúc cơ bản: (1) 第 + số từ; (2) 第 + số từ + lượng từ + (danh từ).'),
 (10,'grammar-adjectival'):C('形容词可以直接作谓语，前面可用程度副词或否定副词。','Tính từ có thể trực tiếp làm vị ngữ; trước nó có thể dùng phó từ chỉ mức độ hoặc phó từ phủ định.'),
 (10,'grammar-how-dialogues'):C('疑问代词“怎么样”用于征求意见、询问状况等。基本结构：……怎么样？','Đại từ nghi vấn “怎么样” dùng để hỏi ý kiến, tình hình, v.v. Cấu trúc cơ bản: …怎么样?'),
 (11,'grammar-a-not-a'):C('正反问格式是“x+不/没+x”，“x”是动词或形容词。动词正反问使用“不/没”，形容词正反问使用“不”。','Dạng câu hỏi chính-phản là “x + 不/没 + x”, trong đó x là động từ hoặc tính từ. Với động từ dùng “不/没”; với tính từ dùng “不”.'),
 (11,'grammar-progressive'):C('时间副词“在/正在”位于动词前，表示动作正在进行或情况在继续。本课有两种形式：（1）在/正在+动词；（2）在/正在+动词+呢。此外，表达正在做的事情还有第三种形式：（3）动词+呢。否定回答时，使用副词“没（有）”。','Phó từ thời gian “在/正在” đứng trước động từ, biểu thị hành động đang diễn ra hoặc tình trạng đang tiếp tục. Bài này có hai dạng: (1) 在/正在 + động từ; (2) 在/正在 + động từ + 呢. Ngoài ra còn dạng thứ ba: (3) động từ + 呢. Khi trả lời phủ định, dùng phó từ “没（有）”.'),
 (11,'grammar-yao'):C('能愿动词“要”在动词前，表示想做、打算做。','Động từ năng nguyện “要” đứng trước động từ, biểu thị muốn làm hoặc định làm.')}
for path in sorted(OUT.glob('lesson-*.json')):
 d=json.loads(path.read_text());l=d['lesson'];e=extras[l]
 for a in d['activities']:
  key=(l,a['source']['section'])
  if key in descriptions:
   a['explanation']=descriptions[key]
   a['instruction']=C(descriptions[key]['zh']+'\n大声朗读。',descriptions[key]['vi']+'\nĐọc thành tiếng.')
 for p,no,box,alt in e['scenes']:
  if l==9 and no==3:box=(477,94,778,254)
  if l==11 and no==2:box=(490,315,796,522);alt=C('一位学习者在桌前写字。','Một người học đang viết ở bàn.')
  if l==11 and no==3:box=(539,171,772,362);alt=C('一位成人和女孩交谈。','Một người lớn nói chuyện với bé gái.')
  a=next(a for a in d['activities'] if a['source']['section']==f'role-text{no}')
  a.update(fig(d,p,f'scene-{no:02}',box,alt,no))
 if l==11:
  for p,no,box,alt in [(81,2,(683,187,850,316),C('显微镜。','Kính hiển vi.')),(83,3,(416,92,599,203),C('一个孩子躺在床上。','Một đứa trẻ nằm trên giường.'))]:
   act(d,p,f'scene-inset-{no}',1,'reference',C(f'课文{no} · 配图','Hình minh họa của bài đọc '+str(no)),C('观察教材配图。','Quan sát hình minh họa trong sách.'),alt,**fig(d,p,f'scene-{no:02}-inset',box,alt,no))
 act(d,e['page'],'objectives',1,'reference',C('本课目标','Mục tiêu bài học'),C('阅读本课学习目标。','Đọc mục tiêu học tập của bài.'),e['objectives'])
 if l==9:
  tips=[(62,1,C('“前边”可儿化，说成“前边儿”。“边”是后缀，读轻声。“边”做名词时，读成“biān”。','“前边” có thể thêm âm cuốn lưỡi thành “前边儿”. “边” là hậu tố và đọc thanh nhẹ; khi làm danh từ thì đọc “biān”.')),(62,2,C('“那个”在口语中也读成“nèige”。','Trong khẩu ngữ, “那个” cũng được đọc là “nèige”.')),(64,1,C('作为方位词时，“上”在名词后，比如“椅子上”“书上”，读轻声；表示位置在高处、或次序、时间在前时，比如“上方”“上半年”，“上”读四声。','Khi là từ chỉ phương vị đứng sau danh từ như “椅子上”, “书上”, “上” đọc thanh nhẹ. Khi chỉ vị trí cao hơn hoặc thứ tự, thời gian trước đó như “上方”, “上半年”, “上” đọc thanh bốn.')),(66,1,C('在口语中常儿化，说“玩儿”。','Trong khẩu ngữ, từ này thường được đọc cuốn lưỡi thành “玩儿”.'))]
  for p,n,tip in tips:act(d,p,'xiaoyu-original-tip',n,'reference',C('小语助力','Gợi ý của Tiểu Ngữ'),C('阅读发音提示。','Đọc gợi ý phát âm.'),tip)
  for x in d['textbookCorrections']:
   if x['target']=='textbook-l09-grammar-03':x['issue']='原版序数三组练读没有完整保留；候选恢复。第（2）组为“第一个，第二个，第一本”，已放大核对。'
  d['textbookCorrections'].append(dict(target='textbook-l09-tip-01 / textbook-l09-tip-02',printedPages=[62,64,66],issue='现版小语提示是编辑补充，不能声称是原书小语助力；原书四条发音提示已单独恢复。'))
  for row in d['coverage']:row['sourceSections']=[s.replace('tips-existing','original-tips-2-added').replace('tip-existing','original-tip-added') for s in row['sourceSections']]
 for a in d['activities']:
  if l==10 and a['source']['section']=='role-text3':
   a['example']['zh']=a['example']['zh'].replace('女孩子穿的衣服。男孩子','女孩子穿的衣服，男孩子')
  if l==11 and a['source']['section']=='role-text2':
   a['example']['zh']=a['example']['zh'].replace('非常忙。我学医','非常忙，我学医')
  if a['source']['section']=='picture':
   n=a['source']['ordinal']
   if (l==9 and n==2) or (l==10 and n in (3,4)) or (l==11 and n==3):
    note=C('图中没有给定时间、价格或计划等信息。参考中的相关内容是编写示例，可以按合理语境另填；不是教材标准答案。','Hình không cho sẵn thông tin như thời gian, giá hoặc kế hoạch. Các chi tiết đó trong gợi ý là ví dụ do người biên soạn đặt, có thể thay bằng nội dung hợp lý; không phải đáp án chuẩn của sách.')
    for f in a['fields']:f['feedbackNote']=note
 # Preserve page sequence and put original objectives/tips next to their page,
 # while retaining the within-page activity order transcribed above.
 def order(a):
  s=a['source']['section'];rank=-100 if s=='objectives' else -20 if s=='xiaoyu-original-tip' or s.startswith('scene-inset') else 0
  return (a['source']['printedPage'],rank)
 d['activities'].sort(key=order)
 d['integrationNotes']=['Candidate only; independent source review and browser acceptance remain pending.','All original cropped figure files are local candidates; do not expose full-page PDF images.','Blank references are editorial models, not unique answers; no automatic grading for open fields.','Source tables preserve distinct cells; optional self-review fields must not block saving.','Existing source Chinese scene lines checked visually; listed corrections are not applied to shared textbook.json.','Audio track IDs are print-aligned; human listening review has not been performed.']
 path.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 print(path.name,len(d['activities']),'activities',sum(len(a['fields']) for a in d['activities']),'fields',len(d['figures']),'figures')
