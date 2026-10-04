from pathlib import Path
import json,hashlib
B=Path(__file__).resolve().parent
R=B.parents[3]
base=json.loads((R/'hsk1-app/content/textbook.json').read_text())['lessons']
C=lambda z,v:{'zh':z,'vi':v}
D={l:json.loads((B/f'lesson-{l:02d}.json').read_text()) for l in range(12,16)}
def add(l,p,s,z,v,pz,pv,kind='read-only'):
 d=D[l];a={'id':f'hsk1-original-2026-l{l:02d}-p{p:03d}-{s}-01','version':'source-v1','lesson':l,'kind':kind,'source':{'sourceRevision':d['edition'],'textbookSHA256':d['textbookSHA256'],'printedPage':p,'pdfPage':p+15,'section':s,'ordinal':1},'title':C(z,v),'instruction':C('阅读原书内容。','Đọc nội dung trong sách.'),'prompt':C(pz,pv),'fields':[]};d['activities'].append(a);return a
objectives={
12:(86,[('能听懂并描述天气情况。','Có thể nghe hiểu và miêu tả thời tiết.'),('能听懂并简单描述病情。','Có thể nghe hiểu và miêu tả ngắn tình trạng bệnh.'),('掌握语气助词“了（1）”的用法。','Nắm cách dùng trợ từ ngữ khí “了” (1).'),('掌握“太……了”格式的用法。','Nắm cách dùng mẫu “太……了”.'),('了解生病时中国人建议“喝些热水”的好处。','Tìm hiểu lợi ích của việc “uống chút nước ấm” mà người Trung Quốc thường khuyên khi bị ốm.')]),
13:(95,[('能听懂并使用双宾语句（1）表示向别人提问或给予别人东西等。','Có thể nghe hiểu và dùng câu hai tân ngữ (1) để hỏi người khác, đưa đồ cho người khác, v.v.'),('掌握能愿动词“可以”的用法。','Nắm cách dùng động từ năng nguyện “可以”.'),('掌握“动词+一下”结构的用法。','Nắm cách dùng cấu trúc “động từ + 一下”.'),('了解点餐常用语。','Biết các cách nói thường dùng khi gọi món.')]),
14:(103,[('能听懂并使用动态助词“了（2）”表示动作行为已经发生或完成。','Có thể nghe hiểu và dùng trợ từ động thái “了” (2) biểu thị hành động đã xảy ra hoặc hoàn thành.'),('掌握范围副词“都”的用法。','Nắm cách dùng phó từ phạm vi “都”.'),('掌握部分离合词的基本用法。','Nắm cách dùng cơ bản của một số từ ly hợp.'),('了解并能描述学习情况。','Hiểu và miêu tả được tình hình học tập.')]),
15:(112,[('能听懂并使用相关词语表达旅行意愿、计划。','Có thể nghe hiểu và dùng từ ngữ liên quan để nói về mong muốn, kế hoạch du lịch.'),('掌握并列复句“……，还/也……”。','Nắm câu phức đẳng lập “……，还/也……”.'),('了解中国餐桌文化、待客礼仪。','Hiểu văn hóa bàn ăn và nghi thức tiếp khách của Trung Quốc.'),('了解中国的首都——北京。','Tìm hiểu thủ đô của Trung Quốc: Bắc Kinh.')])}
for l,(p,rows) in objectives.items():add(l,p,'objectives','目标','Mục tiêu','\n'.join(z for z,v in rows),'\n'.join(v for z,v in rows))
defs={
(12,1):('非主谓句是由词或短语构成、不分主语和谓语的句子，口语中常用。','Câu phi chủ-vị được tạo bởi từ hoặc cụm từ, không phân chia thành chủ ngữ và vị ngữ; thường dùng trong khẩu ngữ.'),
(12,2):('语气助词“了（1）”位于句子末尾或句中停顿的地方，表示有变化或出现新情况。否定回答时，用副词“没”，句子末尾不用“了”。','Trợ từ ngữ khí “了” (1) đứng cuối câu hoặc tại chỗ ngắt trong câu, biểu thị sự thay đổi hoặc tình huống mới xuất hiện. Khi trả lời phủ định, dùng phó từ “没” và không dùng “了” ở cuối câu.'),
(12,3):('“太……了”用于感叹程度很高或很深。','“太……了” dùng để cảm thán về mức độ rất cao hoặc rất sâu.'),
(13,1):('能愿动词“可以”位于动词前，表示可能、能够或许可。','Động từ năng nguyện “可以” đứng trước động từ, biểu thị khả năng, năng lực hoặc sự cho phép.'),
(13,2):('本课“动词+一下”结构表示做一次或试着做，动作时间短。','Trong bài này, cấu trúc “động từ + 一下” biểu thị làm một lần hoặc thử làm, thời gian hành động ngắn.'),
(13,3):('双宾语句是一个动词带两个宾语的句子。本册学习“给、问”构成的双宾语句。','Câu hai tân ngữ là câu có một động từ đi với hai tân ngữ. Quyển này học câu hai tân ngữ tạo bởi “给” và “问”.'),
(14,1):('动态助词“了（2）”在动词后，表示动作行为已经发生或完成。否定时用“没”，不加“了”。','Trợ từ động thái “了” (2) đứng sau động từ, biểu thị hành động đã xảy ra hoặc hoàn thành. Khi phủ định, dùng “没”, không thêm “了”.'),
(14,3):('范围副词“都”表示全部、总括，总括的对象在“都”前。否定时，否定词在“都”后。','Phó từ phạm vi “都” biểu thị toàn bộ, tổng quát. Đối tượng được tổng quát đứng trước “都”. Khi phủ định, từ phủ định đứng sau “都”.'),
(15,1):('并列复句由两个或两个以上逻辑关联、结构对称的小句构成。本册学习并列复句“……，还/也……”。','Câu phức đẳng lập gồm hai hoặc nhiều mệnh đề có quan hệ logic và cấu trúc đối xứng. Quyển này học câu phức đẳng lập “……，还/也……”.')}
for (l,n),(z,v) in defs.items():
 a=next(a for a in D[l]['activities'] if a['source']['section']=='grammar-reading' and a['source']['ordinal']==n)
 a['prompt']=C(z+'\n\n'+a['prompt']['zh'],v+'\n\n'+a['prompt']['vi'])
a=add(14,105,'separable-definition','离合词（1）','Từ ly hợp (1)','本册中的“上课、下课、上班、下班、说话、读书、睡觉、看病、生病”等是一类特殊的动词结构，可分可合，合在一起时是词，中间加其他成分则变成短语，所以被称为离合词。离合词分离时，可插入的成分有限。','Trong quyển này, “上课、下课、上班、下班、说话、读书、睡觉、看病、生病” v.v. là loại cấu trúc động từ đặc biệt, có thể tách hoặc ghép. Khi ghép, chúng là từ; khi thêm thành phần vào giữa, chúng trở thành cụm từ, nên được gọi là từ ly hợp. Thành phần có thể chèn vào bị giới hạn.')
a['source']['pdfPages']=[120,121];a['source']['printedPages']=[105,106]

contexts={
12:[(87,'王一雪给王一飞打电话，询问王一飞那边的情况。','Vương Nhất Tuyết gọi cho Vương Nhất Phi, hỏi tình hình ở chỗ cô ấy.'),(89,'在公司电梯里，王一雪和杨同乐在聊天儿。','Trong thang máy công ty, Vương Nhất Tuyết và Dương Đồng Lạc trò chuyện.'),(90,'昨天在医院，医生给杨同乐看病。','Hôm qua ở bệnh viện, bác sĩ khám cho Dương Đồng Lạc.')],
13:[(96,'在教室里，下课后，白家月问王老师问题。','Trong lớp, sau giờ học, Bạch Gia Nguyệt hỏi cô Vương một câu.'),(98,'在咖啡馆里，王一雪想吃早餐。','Trong quán cà phê, Vương Nhất Tuyết muốn ăn sáng.'),(99,'在餐馆里，刘明在点餐。','Trong nhà hàng, Lưu Minh đang gọi món.')],
14:[(104,'在教室里，下课后，白家月和陈天中在谈论上一次课外旅行。','Trong lớp sau giờ học, Bạch Gia Nguyệt và Trần Thiên Trung nói về chuyến đi ngoại khóa lần trước.'),(106,'在课堂上，王一飞询问学生们的学习情况。','Trong giờ học, Vương Nhất Phi hỏi tình hình học tập của học sinh.'),(108,'在家里，刘明和王一雪在谈论孩子的升学情况。','Ở nhà, Lưu Minh và Vương Nhất Tuyết nói về việc lên cấp học của các con.')],
15:[(113,'在李文家，李文邀请陈天中、白家月等朋友品尝中餐。','Tại nhà Lý Văn, Lý Văn mời Trần Thiên Trung, Bạch Gia Nguyệt và các bạn thưởng thức món Trung Quốc.'),(114,'在李文家，大家边吃饭边谈论假期计划。','Tại nhà Lý Văn, mọi người vừa ăn vừa nói về kế hoạch kỳ nghỉ.'),(116,'在教室外，白家月、安妮和王老师在谈论去北京旅游的事。','Ngoài lớp, Bạch Gia Nguyệt, Annie và cô Vương nói chuyện đi du lịch Bắc Kinh.')]}
for l,rows in contexts.items():
 for t,(p,z,v) in enumerate(rows,1):
  a=next(a for a in D[l]['activities'] if a['source']['section']==f'text-{t}-listening')
  a['prompt']=C(z,v);a['contextSource']={'printedPage':p,'pdfPage':p+15}

# Printed vocabulary topology: repeated headwords remain separate rows/senses.
vocab={
12:[(88,1,['天气','这里','天','下雨','了','雨','有点儿','觉得','冷']),(89,10,['下','雪','来','公司','生病','看病']),(91,16,['病','一点儿','药','天','回','再','喝','热','水'])],
13:[(97,1,['可以','再','问题','卖','打电话','一下']),(99,7,['服务员','女士','请','坐','给','杯','要','早饭','这个','面包','鸡蛋']),(100,18,['先生','一半','茶'])],
14:[(105,1,['上','火车','中午','开','有些','有的','了']),(107,8,['写','都','听见','不要','说话','听','哪些','字']),(109,16,['明年','上','中学','小学','中学生','小学生','上学','他们','她们','它们','晚'])],
15:[(113,1,['爱','哪个']),(115,3,['去年','男朋友','几','年','好玩儿']),(117,8,['飞机','要','小时','家人','时间','机场','接','住','早','那'])]}
proper={14:[(107,['汉语','汉字'])],15:[(115,['西安','北京']),(117,['大兴机场'])]}
for l,groups in vocab.items():
 lookup={x['zh']:x for x in base[l-1]['vocab']};mapping=[]
 for p,start,words in groups:
  a=add(l,p,'vocabulary','生词','Từ mới','按原书顺序阅读生词。','Đọc từ mới theo thứ tự trong sách.',kind='source-table');rows=[]
  for i,z in enumerate(words,start):
   x=lookup[z];v=x['vn']
   if l==12 and z=='天':v='trời; thời tiết' if p==88 else 'ngày (đơn vị thời gian)'
   if l==14 and z=='上':v='lên (tàu, xe)' if p==105 else 'vào học; học (một bậc học)'
   rows.append({'id':f'vocab-{i:02d}','cells':[{'text':C(str(i),str(i))},{'text':C(z,v)},{'text':C(x['py'],x['py'])}]})
   mapping.append({'ordinal':i,'printedPage':p,'pdfPage':p+15,'zh':z,'existingId':x['id'],'existingHeadwordMergedSenses':(l==12 and z=='天')or(l==14 and z=='上'),'candidateActivityId':a['id']})
  a['table']={'columns':[C('序号','Số'),C('生词与释义','Từ và nghĩa'),C('拼音','Phiên âm')],'rows':rows};a['source']['ordinal']=start;a['source']['endOrdinal']=start+len(words)-1
 for p,words in proper.get(l,[]):
  a=add(l,p,'proper-nouns','专有名词','Danh từ riêng','按原书顺序阅读。','Đọc theo thứ tự trong sách.',kind='source-table');a['table']={'columns':[C('专有名词','Danh từ riêng'),C('拼音','Phiên âm')],'rows':[{'id':f'proper-{i}','cells':[{'text':C(z,lookup[z]['vn'])},{'text':C(lookup[z]['py'],lookup[z]['py'])}]} for i,z in enumerate(words,1)]}
  for z in words:mapping.append({'printedPage':p,'pdfPage':p+15,'zh':z,'existingId':lookup[z]['id'],'category':'proper-noun','candidateActivityId':a['id']})
 D[l]['vocabularySourceMap']=mapping

tips={
12:[(91,1,'“看看”是“看”的重叠式，表示动作时间短。','“看看” là dạng lặp của “看”, chỉ hành động diễn ra trong thời gian ngắn.'),(91,2,'中国人喜欢喝热水，认为喝热水更健康。','Người Trung Quốc thích uống nước ấm, cho rằng uống nước ấm có lợi hơn cho sức khỏe.')],
14:[(104,1,'本课“有些”也可以说“有的”。','Trong bài này, “有些” cũng có thể nói là “有的”.'),(109,1,'还有两个近似的代词，一个是“她们”，指称自己和对方以外的若干女性；另一个是“它们”，指称不止一个的事物等。三个词读音一样，但所指意义不同。','Còn hai đại từ gần giống: “她们” chỉ một nhóm phụ nữ ngoài người nói và người nghe; “它们” chỉ nhiều sự vật. Ba từ “他们、她们、它们” phát âm giống nhau nhưng chỉ đối tượng khác nhau.')],
15:[(113,1,'劝饭是一种中式餐桌文化，体现了中国人的热情好客。','Mời khách ăn thêm là một nét văn hóa bàn ăn Trung Quốc, thể hiện lòng hiếu khách.')]}
for l,rows in tips.items():
 for p,n,z,v in rows:
  a=add(l,p,f'xiaoyu-tip-{n}','小语助力','Mẹo của Tiểu Ngữ',z,v);a['source']['ordinal']=n
  if l==12 and n==2:a['editorialNote']=C('此处忠实呈现教材中的文化描述。','Đây là mô tả văn hóa được giữ theo nội dung sách.')

# Exact page/source order (source list remains grouped within a printed task).
order=['objectives','warmup','text-1-listening','text-1-role-reading','text-1-questions','text-1-pair','vocabulary','proper-nouns','grammar-reading','grammar-completion','separable-definition','separable-table','text-2-listening','text-2-role-reading','text-2-questions','text-3-listening','text-3-role-reading','text-3-questions','xiaoyu-tip-1','xiaoyu-tip-2','comprehensive-cloze','picture-description','classroom','summary-vocabulary','summary-skills','summary-improvement']
for l,d in D.items():
 d['activities'].sort(key=lambda a:(a['source']['printedPage'],order.index(a['source']['section']) if a['source']['section'] in order else 99,a['source']['ordinal']))
 ids=[a['id'] for a in d['activities']];assert len(ids)==len(set(ids)),l
 (B/f'lesson-{l:02d}.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 print(l,len(d['activities']))
