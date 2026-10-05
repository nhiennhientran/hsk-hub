#!/usr/bin/env python3
"""Manual original-page transcription, HSK1 L12. No website content read."""
import collections
import hashlib
import json
import pathlib
import shutil
import fitz

WORK = pathlib.Path(__file__).resolve().parent
DEST = WORK if WORK.name == 'hsk1-l12' else pathlib.Path('/workspace/scratch/28b55072841a/hsk-hub-resume-recovered/course-app/docs/recovery-20261005/official-vi-source/hsk1-l12')
DEST.mkdir(parents=True, exist_ok=True)
PDF_SHA = '99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764'
rows = []
words = []


def add(page, tag, category, zh, lines, **metadata):
    if isinstance(lines, str):
        lines = [lines]
    row = {'occurrenceId': f'hsk1-official-vi-l12-pdf{page:03d}-{tag}', 'lesson': 12, 'pdfPage': page, 'printedPage': f'{page-16:03d}', 'category': category, 'zhContext': zh, 'viText': ' '.join(lines), 'fragments': [{'pdfPage': page, 'printedPage': f'{page-16:03d}', 'lineTexts': lines}], 'renderRef': f'renders/pdf-{page:03d}.png', **metadata}
    rows.append(row)
    return row['occurrenceId']


def header(page, title=False):
    if title:
        add(page, 'lesson-label', 'lesson-label', '昨天下雪了', 'Bài', adjacentNumeralPrinted='12')
    else:
        add(page, 'book-header', 'running-header', '新HSK教程1', 'Giáo trình New HSK 1')


def heading(page, tag, zh, vi, **meta):
    return add(page, tag, 'section-heading', zh, vi, **meta)


def instr(page, tag, zh, vi, **meta):
    return add(page, tag, 'instruction', zh, vi, **meta)


def word(page, number, zh, py, pos, lines):
    gloss = add(page, f'word-{number:02d}-gloss', 'word-gloss', zh, lines, printOrdinal=number)
    pos_id = add(page, f'word-{number:02d}-pos', 'word-pos', zh, pos, printOrdinal=number) if pos is not None else None
    words.append({'pdfPage': page, 'printedPage': f'{page-16:03d}', 'printOrdinal': number, 'kind': 'ordinary', 'zhPrinted': zh, 'pinyinPrinted': py, 'rawPosLabel': pos, 'glossOccurrenceId': gloss, 'posOccurrenceId': pos_id, 'starPrintedInBody': False})


def role(page, text, line, zh_name, vi_name, zh, vi_lines, zh_page=None):
    add(page, f'text-{text}-role-{line:02d}', 'dialogue-translation', zh, vi_lines, speakerZh=zh_name, speakerViPrinted=vi_name, textNumber=text, dialogueLine=line, zhAnchorPDFPage=zh_page or page, zhAnchorPrintedPage=f'{(zh_page or page)-16:03d}')


header(102, True)
add(102,'title','lesson-title','昨天下雪了','Hôm qua tuyết rơi rồi',titlePinyinPrinted='Zuótiān xià xuě le')
heading(102,'goals-heading','目标','Mục tiêu')
add(102,'goal-01','goal','能听懂并描述天气情况。','Có thể nghe hiểu và miêu tả được tình hình thời tiết.')
add(102,'goal-02','goal','能听懂并简单描述病情。','Có thể nghe hiểu và miêu tả ngắn gọn tình trạng bệnh tật.')
add(102,'goal-03','goal','掌握语气助词“了（1）”的用法。','Nắm vững cách sử dụng của trợ từ ngữ khí “了 (1)”.')
add(102,'goal-04','goal','掌握“太……了”格式的用法。','Nắm vững cách sử dụng của cấu trúc “太……了”.')
add(102,'goal-05','goal','了解生病时中国人建议“喝些热水”的好处。',['Hiểu được lợi ích của việc “uống một','chút nước ấm” mà người Trung Quốc thường khuyên khi bị ốm.'])
heading(102,'warmup-heading','热身','Khởi động')
instr(102,'warmup-instruction','给下面的词语选择对应的图片。','Lựa chọn hình ảnh tương ứng với các từ ngữ sau.')

header(103, True)
heading(103,'text-1-heading','课文1','Bài khoá 1')
add(103,'text-1-scene','scene','王一雪给王一飞打电话，询问王一飞那边的情况。',['Vương Nhất Tuyết gọi điện cho Vương','Nhất Phi để hỏi thăm tình hình chỗ cô ấy.'])
instr(103,'text-1-listen','听两遍对话，选择正确答案。','Nghe hội thoại hai lượt và chọn đáp án đúng.',audioPrinted='12-1')
role(103,1,1,'王一雪','Vương Nhất Tuyết','今天天气怎么样？','Vương Nhất Tuyết: Hôm nay thời tiết thế nào?')
role(103,1,2,'王一飞','Vương Nhất Phi','这里的天不太好，下雨了。',['Vương Nhất Phi: Thời tiết ở đây không ổn','lắm, mưa rồi ạ.'])
role(103,1,3,'王一雪','Vương Nhất Tuyết','雨大吗？','Vương Nhất Tuyết: Mưa to không?')
role(103,1,4,'王一飞','Vương Nhất Phi','有点儿大，我觉得很冷。','Vương Nhất Phi: Hơi to ạ, em cảm thấy rất lạnh.')
instr(103,'text-1-role-read','分角色朗读对话。',['Phân vai đọc to','đoạn hội thoại.'])
instr(103,'text-1-pair-practice','两人一组，根据实际情况对话。',['Hai người một nhóm, tiến hành hội','thoại theo tình huống thực tế.'])

header(104)
heading(104,'words-1-heading','生词','Từ mới',audioPrinted='12-2')
for w in [(1,'天气','tiānqì','dt.','thời tiết'),(2,'这里','zhèlǐ','đt.','ở đây, chỗ này'),(3,'天','tiān','dt.','thời tiết, trời'),(4,'下雨','xià yǔ',None,'mưa, mưa rơi'),(5,'了','le','trợ.',['dùng cuối câu chỉ sự thay đổi tình hình','hoặc trạng thái']),(6,'雨','yǔ','dt.','mưa'),(7,'有点儿','yǒudiǎnr','phó.','hơi, hơi... một chút'),(8,'觉得','juéde','đgt.','cảm thấy'),(9,'冷','lěng','tt.','lạnh')]:
    word(104,*w)
heading(104,'grammar-heading','小语讲堂','Lớp học của Tiểu Ngữ')
add(104,'grammar-01-title','grammar-title','非主谓句','Câu phi chủ vị',printedGrammarNumber=1)
add(104,'grammar-01-explanation','grammar-explanation','非主谓句是由词或短语构成、不分主语和谓语的句子，口语中常用。',['Câu phi chủ vị là câu được cấu tạo bởi từ hoặc cụm từ, không phân biệt rõ chủ ngữ và','vị ngữ, thường dùng trong văn nói.'])
instr(104,'grammar-01-read','大声朗读。','Đọc to các câu sau.')
add(104,'grammar-02-title','grammar-title','语气助词“了（1）”','Trợ từ ngữ khí “了 (1)”',printedGrammarNumber=2)
add(104,'grammar-02-explanation','grammar-explanation','语气助词“了（1）”位于句子末尾或句中停顿的地方，表示有变化或出现新情况。否定回答时，用副词“没”，句子末尾不用“了”。',['Trợ từ ngữ khí “了 (1)” đặt ở cuối câu hoặc chỗ ngắt quãng trong câu để biểu thị sự thay đổi','hoặc xuất hiện tình huống mới. Khi trả lời phủ định, sử dụng phó từ “没” và lược bỏ “了”','ở cuối câu.'])
instr(104,'grammar-02-read','大声朗读。','Đọc to các câu sau.')

header(105,True)
heading(105,'text-2-heading','课文2','Bài khoá 2')
add(105,'text-2-scene','scene','在公司电梯里，王一雪和杨同乐在聊天儿。',['Vương Nhất Tuyết và Dương Đồng Lạc đang','trò chuyện trong thang máy công ty.'])
instr(105,'text-2-listen','听两遍对话，选择正确答案。','Nghe hội thoại hai lượt và chọn đáp án đúng.',audioPrinted='12-3')
heading(105,'words-2-heading','生词','Từ mới',audioPrinted='12-4')
for w in [(10,'下','xià','đgt.','(mưa, tuyết...) rơi'),(11,'雪','xuě','dt.','tuyết'),(12,'来','lái','đgt.','đến'),(13,'公司','gōngsī','dt.','công ty'),(14,'生病','shēngbìng','đgt.','ốm, bị ốm, bệnh, bị bệnh'),(15,'看病','kànbìng','đgt.','khám bệnh')]:
    word(105,*w)

header(106)
role(106,2,1,'王一雪','Vương Nhất Tuyết','昨天下雪了。','Vương Nhất Tuyết: Hôm qua tuyết rơi rồi.',105)
role(106,2,2,'杨同乐','Dương Đồng Lạc','是的，太冷了。','Dương Đồng Lạc: Đúng vậy, trời lạnh quá.',105)
role(106,2,3,'王一雪','Vương Nhất Tuyết','你昨天没来公司，生病了？','Vương Nhất Tuyết: Hôm qua em không đến công ty, bị ốm à?',105)
role(106,2,4,'杨同乐','Dương Đồng Lạc','对，我昨天去医院看病了。','Dương Đồng Lạc: Vâng, hôm qua em đi bệnh viện khám bệnh.',105)
instr(106,'text-2-role-read','分角色朗读对话。','Phân vai đọc to đoạn hội thoại.')
instr(106,'text-2-questions','根据课文内容回答问题。','Trả lời câu hỏi dựa theo nội dung bài khoá.')
add(106,'text-2-question-01','reading-question','昨天天气怎么样？','Thời tiết hôm qua thế nào?')
add(106,'text-2-question-02','reading-question','杨同乐昨天做什么了？','Dương Đồng Lạc ngày hôm qua đã làm gì?')
heading(106,'grammar-heading','小语讲堂','Lớp học của Tiểu Ngữ')
add(106,'grammar-03-title','grammar-title','“太……了！”格式','Cấu trúc “太……了!”',printedGrammarNumber=3)
add(106,'grammar-03-explanation','grammar-explanation','“太……了！”用于感叹程度很高或很深。','Cấu trúc “太……了!” dùng để diễn đạt cảm thán về mức độ rất cao hoặc rất sâu sắc.')
instr(106,'grammar-03-read','大声朗读。','Đọc to các câu sau.')
heading(106,'text-3-heading','课文3','Bài khoá 3')
add(106,'text-3-scene','scene','昨天在医院，医生给杨同乐看病。',['Hôm qua, bác sĩ khám bệnh cho Dương Đồng Lạc tại','bệnh viện.'])
instr(106,'text-3-listen','听两遍对话，选择正确答案。','Nghe hội thoại hai lượt và chọn đáp án đúng.',audioPrinted='12-5')

header(107,True)
role(107,3,1,'杨同乐','Dương Đồng Lạc','医生，我病了。','Dương Đồng Lạc: Thưa bác sĩ, tôi bị ốm rồi.')
role(107,3,2,'胡医生','Bác sĩ Hồ','我看看。你觉得怎么样？',['Bác sĩ Hồ: Để tôi khám xem. Anh cảm','thấy thế nào?'])
role(107,3,3,'杨同乐','Dương Đồng Lạc','我很冷。','Dương Đồng Lạc: Tôi rất lạnh.')
role(107,3,4,'胡医生','Bác sĩ Hồ','好的，吃一点儿药，今天休息半天吧。',['Bác sĩ Hồ: Được rồi, uống một ít thuốc','nhé, hôm nay nghỉ ngơi nửa ngày nhé.'])
role(107,3,5,'杨同乐','Dương Đồng Lạc','好的。','Dương Đồng Lạc: Vâng.')
role(107,3,6,'胡医生','Bác sĩ Hồ','回家后再喝些热水。',['Bác sĩ Hồ: Sau khi về nhà nhớ uống thêm','ít nước ấm nhé.'])
add(107,'tip-01-label','tip-label','小语帮忙',['Tiểu Ngữ','giúp sức'])
add(107,'tip-01','tip','“看看”是“看”的重叠式，表示动作时间短。',['“看看” là hình thức lặp của','“看”, biểu thị hành động diễn ra trong','khoảng thời gian ngắn.'])
add(107,'tip-02-label','tip-label','小语帮忙',['Tiểu Ngữ','giúp sức'])
add(107,'tip-02','tip','中国人喜欢喝热水，认为喝热水更健康。',['Người Trung Quốc thích uống','nước ấm vì cho rằng uống nước ấm','tốt cho sức khoẻ hơn.'])
heading(107,'words-3-heading','生词','Từ mới',audioPrinted='12-6')
for w in [(16,'病','bìng','đgt.',['ốm, bị ốm,','bệnh, bị bệnh']),(17,'一点儿','yìdiǎnr','sl.',['một chút,','một ít']),(18,'药','yào','dt.','thuốc'),(19,'天','tiān','lượng.','ngày'),(20,'回','huí','đgt.','về, quay về'),(21,'再','zài','phó.',['sau đó, mới','(chỉ trình tự)']),(22,'喝','hē','đgt.','uống'),(23,'热','rè','tt.','nóng, ấm'),(24,'水','shuǐ','dt.','nước')]:
    word(107,*w)
instr(107,'text-3-role-read','分角色朗读对话。','Phân vai đọc to đoạn hội thoại.')
instr(107,'text-3-questions','根据课文内容回答问题。','Trả lời câu hỏi theo nội dung bài khoá.')
add(107,'text-3-question-01','reading-question','杨同乐生病了吗？','Dương Đồng Lạc ốm rồi phải không?')
add(107,'text-3-question-02','reading-question','看病后，杨同乐回家要做什么？',['Sau khi khám bệnh xong, Dương Đồng','Lạc về nhà làm gì?'])

header(108)
heading(108,'exercises-heading','综合练习','Bài tập tổng hợp')
instr(108,'exercises-01','选词填空。','Chọn từ thích hợp điền vào chỗ trống.')
instr(108,'picture-description','用本课新学的词语和语言点描述图片。',['Sử dụng từ ngữ và điểm ngôn ngữ đã học trong bài','để miêu tả các hình ảnh sau.'])

header(109,True)
heading(109,'activity-heading','课堂活动','Hoạt động trên lớp')
add(109,'activity-title','activity-title','角色扮演','Đóng vai')
add(109,'activity-instruction','activity-instruction','两人一组，一个人扮演医生，另一个人扮演病人，病人来看病。',['Hai người một nhóm, một người đóng vai bác sĩ, người còn lại đóng vai bệnh nhân đến','khám bệnh.'])
add(109,'activity-example-label','activity-example-label','小语的例子','Ví dụ của Tiểu Ngữ')
heading(109,'summary-heading','学习小结','Tổng kết học tập')
add(109,'summary-introduction','summary-instruction','10～12课我的学习情况：','Tình hình học tập từ bài 10 đến bài 12 của tôi:')
heading(109,'summary-vocabulary-heading','词语学习','Việc học từ ngữ')
add(109,'summary-vocabulary-remembered','summary-table-label','我已经记住并会使用的词语','Những từ ngữ tôi đã nhớ và biết sử dụng')
add(109,'summary-vocabulary-not-remembered','summary-table-label','我还没记住的词语','Những từ ngữ tôi chưa nhớ')
heading(109,'summary-grammar-heading','我理解并会用','Tôi đã hiểu và đã biết dùng')
add(109,'summary-understand-column','summary-table-column','理解','Đã hiểu')
add(109,'summary-use-column','summary-table-column','会用','Đã biết dùng')
summary_rows=[
    (109,'询问商品价格，例如：苹果多少钱？','Hỏi giá sản phẩm, ví dụ: 苹果多少钱？'),
    (109,'钱数的表达，例如：三块二，六块零两分','Cách diễn đạt số tiền, ví dụ: 三块二，六块零两分'),
    (109,'形容词谓语句，例如：这个苹果很好吃。','Câu vị ngữ tính từ, ví dụ: 这个苹果很好吃。'),
    (110,'疑问代词“怎么样”，例如：这件衣服怎么样？','Đại từ nghi vấn “怎么样”, ví dụ: 这件衣服怎么样？'),
    (110,'正反问，例如：好不好？','Câu hỏi chính phản, ví dụ: 好不好？'),
    (110,'时间副词“在/正在”，例如：他在休息呢。','Phó từ chỉ thời gian “在/正在”, ví dụ: 他在休息呢。'),
    (110,'能愿动词“要”，例如：我要睡觉。','Động từ năng nguyện “要”, ví dụ: 我要睡觉。'),
    (110,'非主谓句，例如：下雨了。','Câu phi chủ vị, ví dụ: 下雨了。'),
    (110,'语气助词“了（1）”，例如：我去上课了。','Trợ từ ngữ khí “了 (1)”, ví dụ: 我去上课了。'),
    (110,'“太……了”格式，例如：太冷了！','Cấu trúc “太……了”, ví dụ: 太冷了！'),
    (110,'描述天气情况，例如：今天下雨了。','Miêu tả tình hình thời tiết, ví dụ: 今天下雨了。'),
    (110,'简单描述病情，例如：我病了，觉得很冷。',['Miêu tả ngắn gọn tình trạng bệnh tật, ví dụ: 我病了，觉得','很冷。'])
]
for i,(p,zh,vi) in enumerate(summary_rows,1):
    add(p,f'summary-item-{i:02d}','summary-table-row',zh,vi,tableRow=i,mixedPrintedChineseExamplesRetained=True)
header(110)
heading(110,'summary-effort-heading','我需要努力的','Những điểm tôi cần cố gắng')

appendix = []


def ap(page, tag, category, zh, lines, **meta):
    if isinstance(lines,str):
        lines=[lines]
    appendix.append({'occurrenceId':f'hsk1-official-vi-shared-appendix-pdf{page:03d}-{tag}','pdfPage':page,'printedPage':f'{page-16:03d}','category':category,'zhContext':zh,'viText':' '.join(lines),'fragments':[{'pdfPage':page,'printedPage':f'{page-16:03d}','lineTexts':lines}],'renderRef':f'renders/pdf-{page:03d}.png','sharedPhysicalOccurrence':True,**meta})


for p in [138,140,142,144]:
    ap(p,'book-header','appendix-running-header','新HSK教程1','Giáo trình New HSK 1')
ap(138,'pos-heading','appendix-heading','词性对照表','Bảng đối chiếu từ loại')
for side in ['left','right']:
    for key,zh,vi in [('pos','词性','Từ loại'),('vi','越南文','Tiếng Việt'),('abbreviation','越南文简写','Viết tắt')]:
        ap(138,f'pos-{side}-header-{key}','appendix-table-header',zh,vi,physicalColumnGroup=side)
pos_rows=[('名词','danh từ','dt.'),('动词','động từ','đgt.'),('形容词','tính từ','tt.'),('代词','đại từ','đt.'),('副词','phó từ','phó.'),('介词','giới từ','giới.'),('连词','liên từ','liên.'),('助词','trợ từ','trợ.'),('数词','từ chỉ số đếm','số.'),('量词','lượng từ','lượng.'),('数量词','từ chỉ số lượng','sl.'),('叹词','từ cảm thán','ct.'),('拟声词','từ tượng thanh','tượng.'),('能愿动词',['động từ','năng nguyện'],'đtnn.'),('前缀','tiền tố','ttố.'),('后缀','hậu tố','htố.')]
for i,(zh,vi,abbr) in enumerate(pos_rows,1):
    ap(138,f'pos-{i:02d}-term','appendix-pos-term',zh,vi,tableRow=i)
    ap(138,f'pos-{i:02d}-abbreviation','appendix-pos-abbreviation',zh,abbr,tableRow=i)
ap(138,'vocabulary-heading','appendix-heading','词语表','Bảng từ vựng')
for p in range(138,145):
    for side in ['left','right']:
        for key,zh,vi in [('word','词语','Từ/Cụm'),('pinyin','拼音','Phiên âm'),('lesson','课号','Bài')]:
            ap(p,f'index-{side}-header-{key}','appendix-table-header',zh,vi,physicalColumnGroup=side)
ap(138,'star-explanation','appendix-footnote','前面加“*”的是本级超纲词。',['Những từ có đánh dấu “*” ở phía trước là từ vựng vượt khung','của cấp độ này.'])
ap(144,'proper-heading','appendix-heading','专有名词','Danh từ riêng')

appendix_rows=[]
index_data=[(139,'病','bìng','12',False),(139,'公司','gōngsī','12',False),(140,'觉得','juéde','12',False),(140,'喝','hē','12',False),(140,'回','huí','12',False),(140,'看病','kànbìng','12',False),(140,'来','lái','12',False),(140,'了','le','12, 14',False),(140,'冷','lěng','12',False),(141,'热','rè','12',False),(141,'生病','shēngbìng','12',False),(142,'水','shuǐ','12',False),(142,'天','tiān','12',False),(142,'天气','tiānqì','12',False),(142,'下','xià','8, 12',False),(142,'下雨','xiàyǔ','12',False),(143,'雪','xuě','12',False),(143,'药','yào','12',True),(143,'一点儿','yìdiǎnr','12',False),(143,'有点儿','yǒudiǎnr','12',False),(143,'雨','yǔ','12',False),(143,'再','zài','12, 13',False),(143,'这里','zhèlǐ','12',False)]
for p,zh,py,labels,star in index_data:
    appendix_rows.append({'pdfPage':p,'printedPage':f'{p-16:03d}','zhPrinted':zh,'pinyinPrinted':py,'lessonNumbersPrinted':labels,'starPrinted':star,'viGlossPrinted':False,'renderRef':f'renders/pdf-{p:03d}.png','scope':'bounded-L12-relevant-index-row-not-a-Vietnamese-definition'})

pdf_path=pathlib.Path('/workspace/scratch/28b55072841a/upload/HSK1  (3.0).pdf')
assert hashlib.sha256(pdf_path.read_bytes()).hexdigest()==PDF_SHA
pdf=fitz.open(pdf_path)
pages=list(range(102,111))+list(range(138,145))
(DEST/'renders').mkdir(exist_ok=True)
renders=[]
for p in pages:
    page=pdf[p-1];target=DEST/'renders'/f'pdf-{p:03d}.png'
    target.write_bytes(page.get_pixmap(matrix=fitz.Matrix(1.6,1.6),alpha=False).tobytes('png'))
    renders.append({'pdfPage':p,'printedPageObserved':f'{p-16:03d}','file':f'renders/{target.name}','bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'actualCropBox':list(page.cropbox),'actualRotation':page.rotation,'matrix':[1.6,1.6],'fullPageAuthorVisualRead':True})
source={
    'schemaVersion':2,'documentSourceId':'hsk1-official-vietnamese-20261004','sourceRevision':'recovered-official-vietnamese-upload-99ca3e63',
    'sourcePDF':{'fileName':'HSK1  (3.0).pdf','sha256':PDF_SHA,'bytes':63200770,'pdfPageCount':148},'lesson':12,
    'pdfPages':list(range(102,111)),'printedPages':[f'{p-16:03d}' for p in range(102,111)],'appendixPDFPages':list(range(138,145)),
    'authorReview':{'reviewer':'/root/qa_hsk1_05_08','status':'author-transcribed-source-only-not-independent-acceptance','method':'All nine body pages and seven appendix pages actually visually read in original-PDF CropBox rasters; original PDF detail checked for appendix POS labels. No website VI or OCR used as transcription authority.'},
    'independentReview':{'status':'pending','reviewer':None},
    'textPolicy':{'viText':'Physical visual line wraps joined with one space; printed words, accents, casing and punctuation retained. No inferred translations of Chinese-only examples. Unicode character inventory is recorded without automatic content correction.','fragments':'Actual Vietnamese printed lines; separate Chinese-anchor PDF pages preserve cross-page role mapping.','roles':'Whole printed role prefixes retained, speakerZh/speakerViPrinted separately recorded.','rawPos':'Actual printed body labels retained separately from shared printed appendix crosswalk.','sharedAppendix':'The same appendix physical occurrences reuse the same shared source IDs across lesson packs; deduplicate them rather than count as lesson-specific new vocabulary.'},
    'occurrences':rows,'wordTableRows':words,'appendixOccurrences':appendix,'appendixRelevantIndexRows':appendix_rows,
    'layoutContinuations':[
        {'module':'text2','pdfPages':[105,106],'printedPages':['089','090'],'note':'Chinese role dialogue105; complete printed Vietnamese roles106, each with actual Chinese anchor105.'},
        {'module':'text3','pdfPages':[106,107],'printedPages':['090','091'],'note':'Heading, scene and listening106; Chinese/VI dialogue, words and tips107.'},
        {'module':'learning-summary','pdfPages':[109,110],'printedPages':['093','094'],'note':'Rows1–3 and headers109; rows4–12 and effort heading110. Complete source rows retain printed Chinese examples within VI rows.'}
    ],
    'coverage':{
        'bodyOccurrenceCount':len(rows),'byBodyCategory':dict(collections.Counter(r['category'] for r in rows)),
        'ordinaryWordRows':len(words),'properNameRows':0,'printedBodyPosOccurrences':23,'dialogueTranslatedLines':14,
        'sharedAppendixVIOccurrences':len(appendix),'appendixRelevantIndexRows':len(appendix_rows),'learningSummaryRows':12,
        'chapterBoundary':{'firstPDFPage':102,'firstPrintedPage':'086','lastPDFPage':110,'lastPrintedPage':'094','nextLessonStartActuallyObserved':{'pdfPage':111,'printedPage':'095','lesson':13}},
        'noPrintedVietnameseAreas':[
            {'pdfPages':[102],'area':'Warmup six word/image choices are Chinese/pinyin only.'},
            {'pdfPages':[103,105,106],'area':'Listening stems/options are Chinese/pinyin only; instructions transcribed separately.'},
            {'pdfPages':[104,106],'area':'Grammar example sentences have no printed Vietnamese translations.'},
            {'pdfPages':[108,109],'area':'Blank-exercise stems/options, four picture stems and roleplay example dialogue are Chinese-only; actual VI instructions/labels retained.'},
            {'pdfPages':list(range(138,145)),'area':'Index headword/pinyin/lesson-number body has no Vietnamese definitions. All printed VI headers, full POS terms/abbreviations and star footnote are transcribed as88shared physical occurrences.'}
        ],'candidateErrata':[],
        'semanticObservations':[
            {'word':'下雨','observation':'Body row4 POS cell is blank. rawPosLabel and posOccurrenceId are null; no inferred verb label or fabricated VI occurrence.'},
            {'word':'药','observation':'Body row18 has no printed star, appendix marks *药. Actual two source markings retained separately.'},
            {'sourceOccurrenceId':'hsk1-official-vi-l12-pdf107-tip-02','observation':'Printed Chinese cultural health belief is faithfully transcribed as source content, no blanket health or website semantic certification.'},
            {'sourceOccurrenceId':'hsk1-official-vi-l12-pdf110-summary-item-12','observation':'Physical two-line mixed Chinese/VI row is retained whole; Chinese-only example is not translated by the author.'}
        ],
        'oldChineseSourceNotes':{'status':'not-recovered-or-read-for-this-source-pack','claim':'Only official Vietnamese PDF SHA99ca3e63; no old Chinese edition/source appendix equivalence or lost QA accepted status asserted.'}
    },
    'activation':0,'runtimeWrites':0,'websiteComparison':0,'trustedProof':False}
(DEST/'source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n')
(DEST/'render-manifest.json').write_text(json.dumps({'sourcePDFSHA256':PDF_SHA,'renderer':f'PyMuPDF {fitz.VersionBind}','matrix':[1.6,1.6],'respectsCropBox':True,'pages':renders,'originalRasterRetryObservation':'Initial private bulk .save produced zero-byte files101/129; both were regenerated through pixmap.tobytes PNG and PIL-verified before any source authoring. This standalone builder directly uses pixmap.tobytes. Only valid final raster bytes enter this pack.'},ensure_ascii=False,indent=2)+'\n')
if pathlib.Path(__file__).resolve()!=(DEST/'build-source.py').resolve():
    shutil.copyfile(__file__,DEST/'build-source.py')
print(json.dumps({'lesson':12,'bodyOccurrences':len(rows),'appendixVIOccurrences':len(appendix),'wordRows':len(words),'renders':len(renders),'sourceSHA256':hashlib.sha256((DEST/'source.json').read_bytes()).hexdigest()},ensure_ascii=False))
