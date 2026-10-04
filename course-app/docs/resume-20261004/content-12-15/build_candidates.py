from pathlib import Path
import json,hashlib,fitz
BASE=Path(__file__).resolve().parent
SRC=Path('/workspace/scratch/67c4ddcee7f7/upload')
book=next(SRC.glob('新HSK教程1(*.pdf')); answers=next(SRC.glob('《*.pdf'))
BS=hashlib.sha256(book.read_bytes()).hexdigest(); AS=hashlib.sha256(answers.read_bytes()).hexdigest()
assert BS=='25d1aad102e4179307b5bc4f932927bbd244b3f4dd53edeb6cfd4dbbb8d4f2ba'
assert AS=='9e783c9deb889231a778d6776b65dbc04fc734eeca0fdfda1c9d99eb793104e5'
PDF=fitz.open(book); (BASE/'figures').mkdir(exist_ok=True)
ROOT=BASE.parents[3]; baseline=json.loads((ROOT/'hsk1-app/content/textbook.json').read_text())['lessons']
C=lambda z,v:{'zh':z,'vi':v}
REFERENCE_NOTE=C('参考表达由编辑补充，仅供参考，不是唯一答案，不自动判分。','Cách diễn đạt do biên tập bổ sung, chỉ để tham khảo; không phải đáp án duy nhất và không chấm tự động.')
D={}
for l in range(12,16):
 D[l]={'schema':1,'edition':'hsk1-print-2026-01','lesson':l,'version':'source-v1','scope':f'lesson-{l}-source-candidate','textbookSHA256':BS,'answerBookSHA256':AS,'editorialStatus':'candidate-awaiting-independent-review','activities':[],'figures':[],'coverage':{'sourcePages':list(range({12:86,13:95,14:103,15:112}[l],{12:95,13:103,14:112,15:122}[l])),'pdfPagesVisuallyInspected':list(range({12:101,13:110,14:118,15:127}[l],{12:110,13:118,14:127,15:137}[l])),'independentReview':'pending','audioHumanReview':'pending','runtimeVerification':'not-run'}}
def src(p,s,n=1):return {'sourceRevision':'hsk1-print-2026-01','textbookSHA256':BS,'printedPage':p,'pdfPage':p+15,'section':s,'ordinal':n}
def act(l,p,s,title,instruction,prompt,fields=None,n=1,kind='open-response',**extra):
 a={'id':f'hsk1-original-2026-l{l:02d}-p{p:03d}-{s}-{n:02d}','version':'source-v1','lesson':l,'kind':kind,'source':src(p,s,n),'title':title,'instruction':instruction,'prompt':prompt,'fields':fields or []};a.update(extra);D[l]['activities'].append(a);return a

def opts(words):
 return [dict(id=chr(65+i),zh=z,py=p,vi=v) for i,(z,p,v) in enumerate(words)]
def field(i,label,answer=None,options=None,ap=None,reference=None):
 f={'id':f'blank-{i}','label':label,'input':'select' if options else 'textarea','assessment':'answer-key' if answer else 'ungraded'}
 if options:f['options']=options
 if answer:f.update(answer=answer,answerSource={'sha256':AS,'pdfPage':ap})
 if reference:f.update(reference=reference,feedbackNote=REFERENCE_NOTE)
 return f

def crop(l,p,name,xy,alt):
 # xy measured on rendered 1.3x page; copy exact source pixels without redrawing.
 page=PDF[p+14];rect=fitz.Rect(*[round(v/1.3,5) for v in xy]);path=BASE/'figures'/f'l{l}-{name}.png';page.get_pixmap(matrix=fitz.Matrix(2,2),clip=rect).save(path)
 fid=f'l{l}-{name}';sha=hashlib.sha256(path.read_bytes()).hexdigest();D[l]['figures'].append({'id':fid,'file':f'figures/{path.name}','alt':alt,'source':{'textbookSHA256':BS,'printedPage':p,'pdfPage':p+15,'cell':name,'cropPdfPoints':list(rect)},'kind':'original-crop','sha256':sha,'note':C('原书局部原图裁切；未重画，未补写图中文字。','Ảnh được cắt trực tiếp từ một phần trang sách gốc; không vẽ lại hoặc sửa chữ trong hình.')});return fid,sha

# Warmups: original six images, original A-F order, answer-book keys.
warm={
12:(86,9,[('下雨','xià yǔ','trời mưa'),('冷','lěng','lạnh'),('生病','shēngbìng','bị ốm'),('看病','kànbìng','khám bệnh'),('雪','xuě','tuyết'),('水','shuǐ','nước')],'FDBECA',(73,589,648,852)),
13:(95,10,[('面包','miànbāo','bánh mì'),('说','shuō','nói'),('给','gěi','cho; đưa'),('茶','chá','trà'),('一半','yíbàn','một nửa'),('请','qǐng','mời')],'CAFBDE',(111,562,688,825)),
14:(103,11,[('火车','huǒchē','tàu hỏa'),('看见','kànjiàn','nhìn thấy'),('汉字','Hànzì','chữ Hán'),('听','tīng','nghe'),('小学生','xiǎoxuéshēng','học sinh tiểu học'),('说话','shuōhuà','nói chuyện')],'BCDFEA',(113,575,691,839)),
15:(112,12,[('北京','Běijīng','Bắc Kinh'),('好玩儿','hǎowánr','vui; thú vị'),('飞机','fēijī','máy bay'),('早饭','zǎofàn','bữa sáng'),('早','zǎo','sớm'),('男朋友','nánpéngyou','bạn trai')],'BADECF',(68,596,643,860))}
for l,(p,ap,w,keys,xy) in warm.items():
 fid,sha=crop(l,p,'warmup-six-panels',xy,C('六幅热身图；从左到右、从上到下对应图片1至6。','Sáu hình khởi động; thứ tự 1 đến 6 từ trái sang phải, từ trên xuống dưới.'))
 fs=[field(i,C(f'图片{i}',f'Hình {i}'),k,opts(w),ap) for i,k in enumerate(keys,1)]
 act(l,p,'warmup',C('热身 · 图片配词','Khởi động · Ghép hình và từ'),C('给下面的词语选择对应的图片。','Ghép các từ dưới đây với hình tương ứng.'),C('按原书顺序填写六幅图。','Điền theo thứ tự sáu hình trong sách.'),fs,kind='image-match',figure=fid,figureSHA256=sha)

# Exact printed listening stems and choices. Two items stay within each original dialogue task.
listen={
12:[(87,1,9,[('王一飞那儿的天气（　）。','Thời tiết ở chỗ Vương Nhất Phi (　).',[('很好','hěn hǎo','rất đẹp'),('很不好','hěn bù hǎo','rất xấu'),('不太好','bú tài hǎo','không tốt lắm')],'C'),('王一飞觉得（　）。','Vương Nhất Phi cảm thấy (　).',[('不冷','bù lěng','không lạnh'),('很冷','hěn lěng','rất lạnh'),('有点儿冷','yǒudiǎnr lěng','hơi lạnh')],'B')]),(89,2,9,[('杨同乐昨天（　）了。','Hôm qua Dương Đồng Lạc đã (　).',[('生病','shēngbìng','bị ốm'),('上班','shàngbān','đi làm'),('去公司','qù gōngsī','đến công ty')],'A'),('杨同乐今天（　）了。','Hôm nay Dương Đồng Lạc đã (　).',[('在家里','zài jiā lǐ','ở nhà'),('去医院','qù yīyuàn','đến bệnh viện'),('来公司','lái gōngsī','đến công ty')],'C')]),(90,3,9,[('杨同乐觉得（　）。','Dương Đồng Lạc cảm thấy (　).',[('很热','hěn rè','rất nóng'),('很冷','hěn lěng','rất lạnh'),('有点儿冷','yǒudiǎnr lěng','hơi lạnh')],'B'),('医生对杨同乐说：“今天（　）吧。”','Bác sĩ nói với Dương Đồng Lạc: “Hôm nay hãy (　).”',[('上班','shàngbān','đi làm'),('下班','xiàbān','tan làm'),('休息半天','xiūxi bàn tiān','nghỉ nửa ngày')],'C')])],
13:[(96,1,10,[('白家月想再问王老师（　）。','Bạch Gia Nguyệt muốn hỏi cô Vương thêm (　).',[('一个问题','yí ge wèntí','một câu hỏi'),('两个问题','liǎng ge wèntí','hai câu hỏi'),('这个问题','zhège wèntí','câu hỏi này')],'A'),('王老师（　）那里卖不卖手机。','Cô Vương (　) ở đó có bán điện thoại hay không.',[('知道','zhīdào','biết'),('不知道','bù zhīdào','không biết'),('也想知道','yě xiǎng zhīdào','cũng muốn biết')],'B')]),(98,2,10,[('王一雪要喝（　）。','Vương Nhất Tuyết muốn uống (　).',[('水','shuǐ','nước'),('茶','chá','trà'),('牛奶','niúnǎi','sữa')],'C'),('王一雪还想吃（　）。','Vương Nhất Tuyết còn muốn ăn (　).',[('包子','bāozi','bánh bao'),('面条儿','miàntiáor','mì'),('面包和鸡蛋','miànbāo hé jīdàn','bánh mì và trứng')],'C')]),(99,3,[10,11],[('刘明想吃（　）。','Lưu Minh muốn ăn (　).',[('米饭','mǐfàn','cơm'),('饺子','jiǎozi','sủi cảo'),('米饭和饺子','mǐfàn hé jiǎozi','cơm và sủi cảo')],'B'),('刘明想喝（　）。','Lưu Minh muốn uống (　).',[('水','shuǐ','nước'),('茶','chá','trà'),('牛奶','niúnǎi','sữa')],'B')])],
14:[(104,1,11,[('陈天中（　）王老师。','Trần Thiên Trung (　) cô Vương.',[('正在看','zhèngzài kàn','đang nhìn'),('没看见','méi kànjiàn','không nhìn thấy'),('看见了','kànjiàn le','đã nhìn thấy')],'B'),('陈天中在火车上（　）。','Trần Thiên Trung (　) trên tàu hỏa.',[('读书','dúshū','đọc sách'),('找王老师','zhǎo Wáng lǎoshī','tìm cô Vương'),('看了一个电影','kànle yí ge diànyǐng','đã xem một bộ phim')],'C')]),(106,2,11,[('同学们（　）汉语了。','Các bạn học sinh đã (　) tiếng Trung.',[('想说','xiǎng shuō','muốn nói'),('不会说','bú huì shuō','không biết nói'),('都会说','dōu huì shuō','đều biết nói')],'C'),('陈天中（　）王老师在说什么。','Trần Thiên Trung (　) cô Vương đang nói gì.',[('听见了','tīngjiàn le','đã nghe thấy'),('没听见','méi tīngjiàn','không nghe thấy'),('不想听','bù xiǎng tīng','không muốn nghe')],'B')]),(108,3,12,[('明年刘明和王一雪的女儿（　）。','Năm sau con gái của Lưu Minh và Vương Nhất Tuyết (　).',[('上小学','shàng xiǎoxué','học tiểu học'),('上中学','shàng zhōngxué','học trung học'),('上大学','shàng dàxué','học đại học')],'B'),('（　）孩子们都忙了。','(　), các con đều bận.',[('上学','shàngxué','đi học'),('上学前','shàngxué qián','trước khi đi học'),('上学后','shàngxué hòu','sau khi đi học')],'C')])],
15:[(113,1,12,[('李文问大家（　）吃哪个菜。','Lý Văn hỏi mọi người (　) ăn món nào.',[('好','hǎo','ngon; tốt'),('爱','ài','thích'),('不爱','bú ài','không thích')],'B'),('李文说：“大家（　）。”','Lý Văn nói: “Mọi người (　).”',[('吃点儿','chī diǎnr','ăn một chút'),('少吃点儿','shǎo chī diǎnr','ăn ít đi một chút'),('多吃点儿','duō chī diǎnr','ăn thêm một chút')],'C')]),(114,2,13,[('安妮和她男朋友去年去了（　）。','Năm ngoái Annie và bạn trai đã đến (　).',[('西安',"Xī’ān",'Tây An'),('北京','Běijīng','Bắc Kinh'),('学校','xuéxiào','trường học')],'A'),('王老师和李文都是（　）。','Cô Vương và Lý Văn đều là (　).',[('西安人',"Xī’ān rén",'người Tây An'),('北京人','Běijīng rén','người Bắc Kinh'),('哪里人','nǎlǐ rén','người ở đâu')],'B')]),(116,3,13,[('白家月和安妮坐（　）去北京。','Bạch Gia Nguyệt và Annie đi (　) đến Bắc Kinh.',[('火车','huǒchē','tàu hỏa'),('飞机','fēijī','máy bay'),('出租车','chūzūchē','taxi')],'B'),('王老师的（　）都在北京。','(　) của cô Vương đều ở Bắc Kinh.',[('家人','jiārén','người nhà'),('朋友','péngyou','bạn bè'),('学生','xuésheng','học sinh')],'A')])]}
for l,tasks in listen.items():
 for p,t,ap,qs in tasks:
  fs=[]
  for i,(z,v,o,k) in enumerate(qs,1):
   f=field(i,C(f'（{i}）{z}',f'({i}) {v}'),k,opts(o),ap[i-1] if isinstance(ap,list) else ap);f['source']=src(p+(1 if l==13 and t==3 and i==2 else 0),f'text-{t}-listening',i);fs.append(f)
  a=act(l,p,f'text-{t}-listening',C(f'课文{t} · 听力选择',f'Bài đọc {t} · Nghe và chọn'),C('听两遍对话，选择正确答案。','Nghe hội thoại hai lần rồi chọn đáp án đúng.'),C('完成原书两道题。','Làm hai câu hỏi trong sách.'),fs,kind='listening-choice',audio={'sceneId':f'textbook-l{l:02d}-text-{t}','track':f'{l}-{2*t-1}','plays':2,'verifiedByListening':False})
  if l==13 and t==3:a['sourceNote']=C('第1题印刷页99，第2题印刷页100；答案册将本组统标为P100。','Câu 1 ở trang in 99, câu 2 ở trang in 100; sách đáp án ghi cả nhóm là P100.')

# Role reading and original open follow-up questions; no answer-key claim.
follow={
12:[(87,1,[],C('两人一组，根据实际情况对话。','Làm việc theo cặp, hội thoại theo tình hình thực tế.')),(90,2,[('昨天天气怎么样？','Thời tiết hôm qua thế nào?'),('杨同乐昨天做什么了？','Hôm qua Dương Đồng Lạc đã làm gì?')],None),(91,3,[('杨同乐生病了吗？','Dương Đồng Lạc bị ốm phải không?'),('看病后，杨同乐回家要做什么？','Sau khi khám bệnh, Dương Đồng Lạc cần làm gì khi về nhà?')],None)],
13:[(96,1,[('白家月还有什么问题？','Bạch Gia Nguyệt còn có câu hỏi gì?'),('王老师对白家月说什么了？','Cô Vương đã nói gì với Bạch Gia Nguyệt?')],None),(98,2,[('服务员问王一雪什么问题了？','Nhân viên phục vụ đã hỏi Vương Nhất Tuyết câu gì?'),('王一雪吃早饭了吗？','Vương Nhất Tuyết đã ăn sáng chưa?')],None),(100,3,[('刘明想要多少饺子？','Lưu Minh muốn bao nhiêu sủi cảo?'),('刘明要米饭了吗？','Lưu Minh có gọi cơm không?')],None)],
14:[(104,1,[('车开后，大家在做什么？','Sau khi tàu khởi hành, mọi người đang làm gì?'),('陈天中为什么没看见王老师？','Vì sao Trần Thiên Trung không nhìn thấy cô Vương?')],None),(107,2,[('白家月会写汉字了吗？','Bạch Gia Nguyệt đã biết viết chữ Hán chưa?'),('陈天中会写汉字了吗？','Trần Thiên Trung đã biết viết chữ Hán chưa?')],None),(110,3,[('明年女儿和儿子都上小学吗？','Năm sau cả con gái và con trai đều học tiểu học phải không?'),('上学后，他们忙不忙？','Sau khi đi học, các con có bận không?')],None)],
15:[(113,1,[('白家月爱吃哪个菜？','Bạch Gia Nguyệt thích ăn món nào?'),('李文做饭好吃不好吃？','Lý Văn nấu ăn có ngon không?')],None),(115,2,[('安妮今年想去哪儿？','Năm nay Annie muốn đi đâu?'),('前几年白家月去了哪儿？','Mấy năm trước Bạch Gia Nguyệt đã đi đâu?')],None),(117,3,[('大兴机场在哪儿？','Sân bay Đại Hưng ở đâu?'),('王老师的姐姐可以去接白家月和安妮吗？','Chị của cô Vương có thể đi đón Bạch Gia Nguyệt và Annie không?')],None)]}
for l,tasks in follow.items():
 for p,t,qs,pair in tasks:
  scene=baseline[l-1]['scenes'][t-1]
  # Reading support carries existing Chinese/VI but original numeral spelling where it differs.
  zh='\n'.join(f"{x['s']}：{x['zh']}" for x in scene['lines']);vi='\n'.join(f"{x['s']}：{x['vn']}" for x in scene['lines'])
  if l==13 and t==3:zh=zh.replace('四十个太多了','40个太多了').replace('半斤二十个','半斤20个')
  if l==15 and t==3:zh=zh.replace('大兴机场。早不早？','大兴机场，早不早？')
  a=act(l,p,f'text-{t}-role-reading',C(f'课文{t} · 分角色朗读',f'Bài đọc {t} · Đọc phân vai'),C('分角色朗读对话。','Đọc hội thoại theo vai.'),C(zh,vi),[],kind='read-aloud',existingSceneId=scene['id'])
  # Printed dialogue can be on earlier page than its role-reading direction.
  a['dialoguePrintedPages']={12:[[87],[89],[91]],13:[[96],[98],[100]],14:[[104],[107],[109]],15:[[113],[115],[117]]}[l][t-1]
  if qs:act(l,p,f'text-{t}-questions',C(f'课文{t} · 回答问题',f'Bài đọc {t} · Trả lời câu hỏi'),C('根据课文内容回答问题。','Trả lời câu hỏi theo nội dung bài đọc.'),C('请用自己的话回答。','Hãy trả lời bằng lời của bạn.'),[field(i,C(z,v)) for i,(z,v) in enumerate(qs,1)])
  if pair:act(l,p,f'text-{t}-pair',C('根据实际情况对话','Hội thoại theo thực tế'),pair,C('记录你们的对话。','Ghi lại hội thoại của hai bạn.'),[field(1,C('对话记录','Ghi chép hội thoại'))])

# Grammar original read-aloud lists, preserving complete dialogues and printed item order.
grammars={
12:[(88,1,'非主谓句','Câu phi chủ-vị',[('下雨了。','Trời mưa rồi.'),('下雪了。','Tuyết rơi rồi.'),('上课了。','Vào học rồi.'),('真漂亮！','Đẹp thật!'),('对不起！','Xin lỗi!'),('没关系！','Không sao!')]),(88,2,'语气助词“了（1）”','Trợ từ ngữ khí “了” (1)',[('下雨了。','Trời mưa rồi.'),('十二点了，吃午饭吧。','Mười hai giờ rồi, ăn trưa nhé.'),('A：弟弟起床了吗？\nB：没起床呢。','A: Em trai đã dậy chưa?\nB: Vẫn chưa dậy.')]),(90,3,'“太……了”格式','Mẫu “太……了”',[('太冷了！','Lạnh quá!'),('这个杯子太小了。','Chiếc cốc này nhỏ quá.'),('我们今天太高兴了！','Hôm nay chúng tôi vui quá!')])],
13:[(97,1,'能愿动词“可以”','Động từ năng nguyện “可以”',[('我可以再问您一个问题吗？','Em có thể hỏi cô thêm một câu nữa không?'),('你们可以看这本书。','Các bạn có thể đọc cuốn sách này.'),('A：我可以坐吗？\nB：可以，请坐！','A: Tôi ngồi được không?\nB: Được, mời ngồi!')]),(97,2,'“动词+一下”结构','Kết cấu “động từ + 一下”',[('你可以打电话问一下。','Bạn có thể gọi điện hỏi thử.'),('请休息一下。','Xin hãy nghỉ một lát.'),('你看一下吧。','Bạn xem thử nhé.')]),(99,3,'双宾语句（1）','Câu hai tân ngữ (1)',[('请给我一杯牛奶。','Xin cho tôi một cốc sữa.'),('白家月给安妮一个苹果。','Bạch Gia Nguyệt đưa cho Annie một quả táo.'),('我问老师两个问题。','Tôi hỏi cô giáo hai câu hỏi.')])],
14:[(105,1,'动态助词“了（2）”','Trợ từ động thái “了” (2)',[('我看了一个电影。','Tôi đã xem một bộ phim.'),('我买了一个新电脑。','Tôi đã mua một máy tính mới.'),('我昨天没去商店买东西。','Hôm qua tôi không đến cửa hàng mua đồ.')]),(108,3,'范围副词“都”','Phó từ phạm vi “都”',[('我们都会写了。','Chúng tôi đều biết viết rồi.'),('我和我的朋友们都去。','Tôi và các bạn của tôi đều đi.'),('同学们都没听见。','Các bạn học sinh đều không nghe thấy.')])],
15:[(114,1,'并列复句“……，还/也……”','Câu phức đẳng lập “……，还/也……”',[('我喜欢这个，也喜欢那个。','Tôi thích cái này, cũng thích cái kia.'),('王老师是北京人，李文也是北京人。','Cô Vương là người Bắc Kinh, Lý Văn cũng là người Bắc Kinh.'),('我喜欢喝中国茶，还喜欢吃中国菜。','Tôi thích uống trà Trung Quốc, còn thích ăn món Trung Quốc.')])]}
for l,gs in grammars.items():
 for p,n,z,v,ex in gs:
  act(l,p,'grammar-reading',C(z,v),C('大声朗读。','Đọc to.'),C('\n'.join(f'（{i}）{z}' for i,(z,v) in enumerate(ex,1)),'\n'.join(f'({i}) {v}' for i,(z,v) in enumerate(ex,1))),[],n=n,kind='read-aloud')

# L14 original unkeyed grammar dialogues; multi-blank tasks stay grouped, no invented objective key.
for n,(z,v,count) in enumerate([
 ('A：你去哪儿（　）？\nB：我今天有课，去学校上（　）课，还在那儿吃（　）午饭。','A: Bạn đã đi đâu?\nB: Hôm nay tôi có giờ học, đến trường học, còn ăn trưa ở đó. (Điền các chỗ trống trong câu tiếng Trung.)',3),
 ('A：我昨天看（　）电影，（　）去超市。你呢？\nB：我昨天去（　）超市，（　）看电影。','A: Hôm qua tôi xem phim, … đi siêu thị. Còn bạn?\nB: Hôm qua tôi đi siêu thị, … xem phim. (Điền các chỗ trống trong câu tiếng Trung.)',4)],1):
 a=act(14,105,'grammar-completion',C('动态助词“了（2）” · 完成对话','Trợ từ “了” (2) · Hoàn thành hội thoại'),C('完成对话。','Hoàn thành hội thoại.'),C(z,v),[field(i,C(f'第{i}空',f'Chỗ trống {i}')) for i in range(1,count+1)],n=n)
 a['answerPolicy']=C('客观题答案册未提供本组答案，保留为不自动判分练习。','Sách đáp án không cung cấp đáp án cho nhóm này; bài này không chấm tự động.')
a=act(14,106,'separable-table',C('离合词（1） · 合与分','Từ ly hợp (1) · Dạng liền và dạng tách'),C('大声朗读。','Đọc to.'),C('按原书逐行对照。','Đối chiếu từng hàng theo sách.'),[],kind='source-table')
a['table']={'columns':[C('合','Dạng liền'),C('分','Dạng tách')],'rows':[{'id':f'row-{i}','cells':[{'text':C(x,xv)},{'text':C(y,yv)}]} for i,(x,xv,y,yv) in enumerate([('睡觉','ngủ','睡了觉；睡了一觉','đã ngủ; đã ngủ một giấc'),('上课','học; lên lớp','上了课；上中文课','đã học; học tiếng Trung'),('下班','tan làm','下了班','đã tan làm'),('生病','bị ốm','生了病；生了大病','đã bị ốm; đã bị bệnh nặng'),('说话','nói chuyện','说了话；说了很多话','đã nói; đã nói rất nhiều')],1)]}

# Comprehensive choice bank. Each original item retains all blanks as a single activity.
cloze={
12:(92,10,[('怎么样','zěnmeyàng','thế nào'),('雪','xuě','tuyết'),('了','le','trợ từ 了'),('看','kàn','xem; khám'),('太','tài','quá')],[('外边正在下______，______冷了！','Bên ngoài đang có ______ rơi, lạnh ______!',['B','E']),('他去公司工作______。','Anh ấy đi làm ở công ty ______.',['C']),('医生：你觉得______？\n杨同乐：我很冷。','Bác sĩ: Anh cảm thấy ______?\nDương Đồng Lạc: Tôi rất lạnh.',['A']),('王一雪：你昨天去医院______病了吗？\n杨同乐：没有，我今天去。','Vương Nhất Tuyết: Hôm qua anh đã đến bệnh viện ______ bệnh chưa?\nDương Đồng Lạc: Chưa, hôm nay tôi đi.',['D'])]),
13:(101,11,[('一下','yíxià','một chút; thử'),('可以','kěyǐ','có thể'),('给','gěi','cho'),('问题','wèntí','vấn đề'),('要','yào','muốn gọi')],[('请______我一杯热水。','Xin ______ tôi một cốc nước ấm.',['C']),('我们______一斤饺子。','Chúng tôi ______ một cân sủi cảo.',['E']),('A：我______坐这儿吗？\nB：没______，请坐。','A: Tôi ______ ngồi đây không?\nB: Không ______, mời ngồi.',['B','D']),('A：这个商店卖不卖手机？\nB：你可以去问______。','A: Cửa hàng này có bán điện thoại không?\nB: Bạn có thể đi hỏi ______.',['A'])]),
14:(110,12,[('上学','shàngxué','đi học'),('了','le','trợ từ 了'),('都','dōu','đều'),('听见','tīngjiàn','nghe thấy'),('有的','yǒude','có người; một số')],[('我写______很多汉字。','Tôi viết ______ rất nhiều chữ Hán.',['B']),('他没______老师说什么。','Anh ấy không ______ thầy giáo nói gì.',['D']),('白家月：你们昨天在车上做什么了？\n陈天中：我看了一本书，______人在睡觉。','Bạch Gia Nguyệt: Hôm qua các bạn làm gì trên xe?\nTrần Thiên Trung: Tôi đọc một cuốn sách, ______ người đang ngủ.',['E']),('刘明：明年______后，他们______忙了。\n王一雪：是的。','Lưu Minh: Năm sau, sau khi ______, các con ______ bận.\nVương Nhất Tuyết: Đúng vậy.',['A','C'])]),
15:(118,13,[('爱','ài','thích'),('时间','shíjiān','thời gian'),('早不早','zǎo bu zǎo','có sớm không'),('都','dōu','đều'),('飞机','fēijī','máy bay')],[('这本书有15课，我们______学了。','Cuốn sách này có 15 bài, chúng tôi ______ học rồi.',['D']),('我的家人都______喝茶。','Mọi người trong gia đình tôi đều ______ uống trà.',['A']),('陈天中：我们明天晚上六点到，你觉得______？\n李文：不早。','Trần Thiên Trung: Tối mai chúng tôi đến lúc sáu giờ, bạn thấy ______?\nLý Văn: Không sớm.',['C']),('王一飞：她们想坐______去北京，你们呢？\n陈天中：我们没有______，不能出去玩。','Vương Nhất Phi: Họ muốn đi ______ đến Bắc Kinh, còn các bạn?\nTrần Thiên Trung: Chúng tôi không có ______, không thể đi chơi.',['E','B'])])}
for l,(p,ap,words,items) in cloze.items():
 for n,(z,v,keys) in enumerate(items,1):
  act(l,p,'comprehensive-cloze',C(f'选词填空（{n}）',f'Chọn từ điền vào chỗ trống ({n})'),C('选词填空。','Chọn từ thích hợp điền vào chỗ trống.'),C(z,v),[field(i,C(f'第{i}空',f'Chỗ trống {i}'),k,opts(words),ap) for i,k in enumerate(keys,1)],n=n,kind='word-choice')

# Picture descriptions. Exact source crops include each original panel and printed frame.
pictures={
12:[(92,(95,466,365,667),'昨天______。','Hôm qua ______.',1),(92,(374,466,647,667),'今天______。','Hôm nay ______.',1),(92,(95,674,365,896),'杨同乐______了，他昨天去______，今天来______。','Dương Đồng Lạc ______ rồi, hôm qua anh ấy đến ______, hôm nay đến ______.',3),(92,(374,674,647,896),'医生对杨同乐说：“今天______，回家______。”','Bác sĩ nói với Dương Đồng Lạc: “Hôm nay ______, về nhà ______.”',2)],
13:[(101,(137,464,406,663),'我______？','Tôi ______?',1),(101,(416,464,686,663),'你好！我______坐这儿吗？','Chào bạn! Tôi ______ ngồi đây không?',1),(101,(137,671,406,894),'我______热水，请______我______。','Tôi ______ nước ấm, xin ______ tôi ______.',3),(101,(416,671,686,894),'服务员：请问，______？\n刘明：我要______。','Nhân viên: Xin hỏi, ______?\nLưu Minh: Tôi muốn ______.',2)],
14:[(110,(94,650,363,851),'姐姐和弟弟______。','Chị gái và em trai ______.',1),(110,(372,650,642,851),'我们昨天______，没去看电影。','Hôm qua chúng tôi ______, không đi xem phim.',1),(111,(145,110,416,278),'鸡蛋、面包我______。','Trứng và bánh mì, tôi ______.',1),(111,(425,110,695,278),'老师说：“______！”','Giáo viên nói: “______!”',1)],
15:[(118,(94,467,363,667),'我爱吃面包，______。','Tôi thích ăn bánh mì, ______.',1),(118,(373,467,643,667),'去年我去______。','Năm ngoái tôi đến ______.',1),(118,(94,674,363,872),'王一飞的姐姐______。','Chị của Vương Nhất Phi ______.',1),(118,(373,674,643,872),'王老师是______人，她______。','Cô Vương là người ______, cô ấy ______.',2)]}
for l,items in pictures.items():
 for n,(p,xy,z,v,count) in enumerate(items,1):
  fid,sha=crop(l,p,f'picture-{n:02d}',xy,C(f'原书看图表达第{n}图',f'Hình {n} của bài miêu tả tranh trong sách'))
  act(l,p,'picture-description',C(f'看图表达（{n}）',f'Miêu tả hình ({n})'),C('用本课新学的词语和语言点描述图片。','Dùng từ mới và điểm ngữ pháp của bài này để miêu tả hình.'),C(z,v),[field(i,C(f'第{i}空',f'Chỗ trống {i}')) for i in range(1,count+1)],n=n,kind='picture-description',figure=fid,figureSHA256=sha)

# Original classroom tasks and printed examples (examples are not unique answers).
classroom={
12:(93,'角色扮演','Đóng vai','两人一组，一个人扮演医生，另一个人扮演病人，病人来看病。','Làm theo cặp: một người đóng vai bác sĩ, người kia là bệnh nhân đến khám.','病人：医生，我病了。\n医生：我看看。你觉得冷不冷？\n病人：有点儿冷。\n医生：好的，吃一点儿药吧。','Bệnh nhân: Bác sĩ, tôi bị ốm.\nBác sĩ: Để tôi xem. Anh có thấy lạnh không?\nBệnh nhân: Hơi lạnh.\nBác sĩ: Được, uống một ít thuốc nhé.'),
13:(102,'角色扮演','Đóng vai','三人一组，一个人扮演服务员，两个人扮演顾客，表演在咖啡馆点餐。','Làm theo nhóm ba người: một người là nhân viên phục vụ, hai người là khách; diễn cảnh gọi món trong quán cà phê.','服务员：请坐！你们要喝什么？\n顾客1：我要一杯茶。\n顾客2：我要一杯牛奶。\n服务员：你们要吃什么？\n……','Nhân viên: Mời ngồi! Các bạn muốn uống gì?\nKhách 1: Tôi muốn một tách trà.\nKhách 2: Tôi muốn một cốc sữa.\nNhân viên: Các bạn muốn ăn gì?\n…'),
14:(111,'双人活动','Hoạt động theo cặp','两人一组，说一说上星期六或星期日你都做了什么。','Làm theo cặp, kể những việc bạn đã làm thứ Bảy hoặc Chủ nhật tuần trước.','我星期六上午上了中文课，中午吃了饭后休息了一下，下午去商店买了一些东西，晚上和朋友吃了晚饭。……','Sáng thứ Bảy tôi học tiếng Trung, buổi trưa ăn xong nghỉ một lát, buổi chiều đến cửa hàng mua ít đồ, buổi tối ăn tối cùng bạn. …'),
15:(119,'角色扮演','Đóng vai','三个人分别扮演李文、陈天中和白家月，李文邀请陈天中和白家月做客，一起做中国菜。','Ba người lần lượt đóng vai Lý Văn, Trần Thiên Trung và Bạch Gia Nguyệt. Lý Văn mời hai bạn đến nhà, cùng nấu món Trung Quốc.','李文：天中、家月，你们星期六有时间吗？\n陈天中：我有时间。\n白家月：我也有时间。\n李文：太好了！你们都来我家吧，我们做中国菜吃，怎么样？\n……','Lý Văn: Thiên Trung, Gia Nguyệt, thứ Bảy các bạn có rảnh không?\nTrần Thiên Trung: Tôi rảnh.\nBạch Gia Nguyệt: Tôi cũng rảnh.\nLý Văn: Tốt quá! Các bạn đến nhà tôi nhé, chúng mình nấu món Trung Quốc ăn, được không?\n…')}
for l,(p,z,v,iz,iv,ez,ev) in classroom.items():
 a=act(l,p,'classroom',C(z,v),C(iz,iv),C('记录你们的对话或表达。','Ghi lại hội thoại hoặc phần trình bày của nhóm.'),[field(1,C('活动记录','Ghi chép hoạt động'))],example=C(ez,ev));a['exampleProvenance']={'kind':'printed-example','printedPage':p,'pdfPage':p+15,'notUniqueAnswer':True}
for l,p,title,v in [(13,102,'中国茶','Trà Trung Quốc'),(15,119,'北京欢迎你','Bắc Kinh chào đón bạn')]:
 D[l]['bonus']={'id':f'hsk1-original-l{l}-bonus','title':C(title,v),'printedResourceId':f'{l}-1','printedPage':p,'pdfPage':p+15,'availability':'unavailable','payload':None}

# Self-assessment: exact two vocabulary rows, then original two-column checks, then improvement text.
summary={
12:(93,94,'10～12',[
('询问商品价格，例如：苹果多少钱？','Hỏi giá hàng hóa, ví dụ: Táo bao nhiêu tiền?',93),('钱数的表达，例如：三块二，六块零两分','Diễn đạt số tiền, ví dụ: ba tệ hai hào; sáu tệ hai xu',93),('形容词谓语句，例如：这个苹果很好吃。','Câu vị ngữ tính từ, ví dụ: Quả táo này rất ngon.',94),('疑问代词“怎么样”，例如：这件衣服怎么样？','Đại từ nghi vấn “怎么样”, ví dụ: Bộ quần áo này thế nào?',94),('正反问，例如：好不好？','Câu hỏi chính phản, ví dụ: Có tốt không?',94),('时间副词“在/正在”，例如：他在休息呢。','Phó từ thời gian “在/正在”, ví dụ: Anh ấy đang nghỉ.',94),('能愿动词“要”，例如：我要睡觉。','Động từ năng nguyện “要”, ví dụ: Tôi muốn đi ngủ.',94),('非主谓句，例如：下雨了。','Câu phi chủ-vị, ví dụ: Trời mưa rồi.',94),('语气助词“了（1）”，例如：我去上课了。','Trợ từ ngữ khí “了” (1), ví dụ: Tôi đi học đây.',94),('“太……了”格式，例如：太冷了！','Mẫu “太……了”, ví dụ: Lạnh quá!',94),('描述天气情况，例如：今天下雨了。','Miêu tả thời tiết, ví dụ: Hôm nay trời mưa.',94),('简单描述病情，例如：我病了，觉得很冷。','Miêu tả ngắn tình trạng bệnh, ví dụ: Tôi bị ốm, thấy rất lạnh.',94)]),
15:(120,121,'13～15',[
('能愿动词“可以”，例如：我可以吃吗？','Động từ năng nguyện “可以”, ví dụ: Tôi có thể ăn không?',120),('“动词+一下”结构，例如：看一下','Kết cấu “động từ + 一下”, ví dụ: xem một chút',120),('双宾语句（1），例如：给我一杯水。','Câu hai tân ngữ (1), ví dụ: Cho tôi một cốc nước.',120),('动态助词“了（2）”，例如：读了一本书','Trợ từ động thái “了” (2), ví dụ: đã đọc một cuốn sách',120),('离合词（1），例如：吃了饭，睡一觉','Từ ly hợp (1), ví dụ: đã ăn cơm, ngủ một giấc',121),('范围副词“都”，例如：我们都来了。','Phó từ phạm vi “都”, ví dụ: Chúng tôi đều đến rồi.',121),('并列复句“……，还/也……”，例如：我喜欢看书，也喜欢看电影。','Câu phức đẳng lập “……，还/也……”, ví dụ: Tôi thích đọc sách, cũng thích xem phim.',121),('了解中国餐桌文化、待客礼仪。','Hiểu văn hóa bàn ăn và nghi thức tiếp khách của Trung Quốc.',121)])}
for l,(p,end,span,rows) in summary.items():
 fs=[field(1,C('我已经记住并会使用的词语','Những từ tôi đã nhớ và biết dùng')),field(2,C('我还没记住的词语','Những từ tôi chưa nhớ'))]
 a=act(l,p,'summary-vocabulary',C('学习小结 · 词语学习','Tổng kết học tập · Từ vựng'),C(f'{span}课我的学习情况。',f'Tình hình học tập các bài {span}.'),C('填写词语。','Điền các từ.'),fs,kind='source-table')
 a['table']={'columns':[C('词语学习','Học từ vựng'),C('记录','Ghi chép')],'rows':[{'id':f'row-{i}','cells':[{'text':f['label']},{'fieldId':f['id']}]} for i,f in enumerate(fs,1)]}
 fs=[];trs=[]
 for i,(z,v,rp) in enumerate(rows,1):
  ids=[]
  for col in ['understand','use']:
   f=field(f'{i}-{col}',C(f'{z} · '+('理解' if col=='understand' else '会用'),f'{v} · '+('Hiểu' if col=='understand' else 'Biết dùng')),options=[{'id':'yes','zh':'已做到','vi':'Đã làm được','py':''},{'id':'not-yet','zh':'还需要练习','vi':'Cần luyện tập thêm','py':''}]);f['source']=src(rp,'summary-skills',i);ids.append(f['id']);fs.append(f)
  trs.append({'id':f'row-{i}','cells':[{'text':C(z,v)},{'fieldId':ids[0]},{'fieldId':ids[1]}]})
 a=act(l,p,'summary-skills',C('学习小结 · 我理解并会用','Tổng kết · Tôi hiểu và biết dùng'),C('分别记录“理解”和“会用”。','Tự đánh giá riêng hai mục “Hiểu” và “Biết dùng”.'),C('按原书的两个维度自评。','Tự đánh giá theo hai cột của sách.'),fs,kind='source-table')
 a['table']={'columns':[C('内容','Nội dung'),C('理解','Hiểu'),C('会用','Biết dùng')],'rows':trs};a['source']['printedPages']=[p,end];a['source']['pdfPages']=[p+15,end+15]
 act(l,end,'summary-improvement',C('我需要努力的','Những điểm tôi cần cải thiện'),C('写下接下来需要练习的内容。','Ghi lại nội dung cần luyện tập tiếp.'),C('我需要努力的','Những điểm tôi cần cải thiện'),[field(1,C('记录','Ghi chép'))])

# Keep source ordering; kinds sharing a page follow original semantic order via source section rank.
rank={'warmup':0,'text-1-listening':1,'text-1-role-reading':2,'text-1-questions':3,'text-1-pair':4,'grammar-reading':5,'grammar-completion':6,'separable-table':7,'text-2-listening':8,'text-2-role-reading':9,'text-2-questions':10,'text-3-listening':11,'text-3-role-reading':12,'text-3-questions':13,'comprehensive-cloze':14,'picture-description':15,'classroom':16,'summary-vocabulary':17,'summary-skills':18,'summary-improvement':19}
for l,d in D.items():
 d['activities'].sort(key=lambda a:(a['source']['printedPage'],rank[a['source']['section']],a['source']['ordinal']))
 (BASE/f'lesson-{l:02d}.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 print(l,len(d['activities']),sum(len(a['fields']) for a in d['activities']),len(d['figures']))
