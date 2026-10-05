#!/usr/bin/env python3
"""Manual original-page transcription, HSK1 L15. No website content read."""
import collections
import hashlib
import json
import pathlib
import shutil
import fitz

WORK = pathlib.Path(__file__).resolve().parent
DEST = WORK if WORK.name == 'hsk1-l15' else pathlib.Path('/workspace/scratch/28b55072841a/hsk-hub-resume-recovered/course-app/docs/recovery-20261005/official-vi-source/hsk1-l15')
DEST.mkdir(parents=True, exist_ok=True)
PDF_SHA = '99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764'
rows = []
words = []


def add(page, tag, category, zh, lines, **metadata):
    if isinstance(lines,str): lines=[lines]
    joiners=metadata.pop('fragmentLineJoiners',None)
    if joiners is None: joiners=[' ']*(len(lines)-1)
    assert len(joiners)==len(lines)-1 and all(j in [' ',''] for j in joiners)
    whole=lines[0]+''.join(j+t for j,t in zip(joiners,lines[1:]))
    fragment={'pdfPage':page,'printedPage':f'{page-16:03d}','lineTexts':lines}
    if joiners and any(j!=' ' for j in joiners):
        if len(set(joiners))==1: fragment['lineJoiner']=joiners[0]
        else: fragment['lineJoiners']=joiners
    row={'occurrenceId':f'hsk1-official-vi-l15-pdf{page:03d}-{tag}','lesson':15,'pdfPage':page,'printedPage':f'{page-16:03d}','category':category,'zhContext':zh,'viText':whole,'fragments':[fragment],'renderRef':f'renders/pdf-{page:03d}.png',**metadata}
    rows.append(row)
    return row['occurrenceId']


def header(page, title=False):
    if title:
        add(page, 'lesson-label', 'lesson-label', '大兴机场见！', 'Bài', adjacentNumeralPrinted='15')
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


def proper(page, number, zh, py, lines):
    gloss=add(page,f'proper-word-{number:02d}-gloss','proper-word-gloss',zh,lines,printOrdinal=number,wordKind='proper')
    words.append({'pdfPage':page,'printedPage':f'{page-16:03d}','printOrdinal':number,'kind':'proper','zhPrinted':zh,'pinyinPrinted':py,'rawPosLabel':None,'glossOccurrenceId':gloss,'posOccurrenceId':None,'printedPOSFieldPresent':False,'starPrintedInBody':False})

header(128,True)
add(128,'title','lesson-title','大兴机场见！','Hẹn gặp ở sân bay Đại Hưng!',titlePinyinPrinted='Dàxīng Jīchǎng jiàn!')
heading(128,'goals-heading','目标','Mục tiêu')
add(128,'goal-01','goal','能听懂并使用相关词语表达旅行意愿、计划。',['Có thể nghe hiểu và sử dụng được các','từ ngữ liên quan để diễn đạt ý định và kế hoạch du lịch.'])
add(128,'goal-02','goal','掌握并列复句“……，还/也……”。','Nắm vững câu ghép đẳng lập “……，还/也……”.')
add(128,'goal-03','goal','了解中国餐桌文化、待客礼仪。',['Hiểu về văn hoá bàn ăn và nghi lễ tiếp khách của','Trung Quốc.'])
add(128,'goal-04','goal','了解中国的首都——北京。','Hiểu về thủ đô Bắc Kinh của Trung Quốc.')
heading(128,'warmup-heading','热身','Khởi động')
instr(128,'warmup-instruction','给下面的词语选择对应的图片。','Lựa chọn hình ảnh tương ứng với các từ ngữ sau.')

header(129,True)
heading(129,'text-1-heading','课文1','Bài khoá 1')
add(129,'text-1-scene','scene','在李文家，李文邀请陈天中、白家月等朋友品尝中餐。',['Lý Văn mời các bạn Trần Thiên Trung,','Bạch Gia Nguyệt thưởng thức món ăn Trung Quốc tại nhà mình.'])
instr(129,'text-1-listen','听两遍对话，选择正确答案。','Nghe hội thoại hai lượt và chọn đáp án đúng.',audioPrinted='15-1')
heading(129,'words-1-heading','生词','Từ mới',audioPrinted='15-2')
for w in [(1,'爱','ài','đgt.','thích, yêu thích'),(2,'哪个','nǎge','đt.','cái nào, nào')]:
    word(129,*w)
add(129,'tip-01-label','tip-label','小语帮忙',['Tiểu Ngữ','giúp sức'])
add(129,'tip-01','tip','劝饭是一种中式餐桌文化，体现了中国人的热情好客。',['Mời người khác ăn nhiều hơn là một','nét văn hoá trên bàn ăn của Trung','Quốc, thể hiện sự nhiệt tình và hiếu','khách của người Trung Quốc.'])
instr(129,'text-1-role-read','分角色朗读对话。','Phân vai đọc to đoạn hội thoại.')
instr(129,'text-1-questions','根据课文内容回答问题。','Trả lời câu hỏi theo nội dung bài khoá.')
add(129,'text-1-question-01','reading-question','白家月爱吃哪个菜？','Bạch Gia Nguyệt thích ăn món nào?')
add(129,'text-1-question-02','reading-question','李文做饭好吃不好吃？','Lý Văn nấu ăn có ngon không?')

header(130)
role(130,1,1,'李文','Lý Văn','你们爱吃哪个菜？','Lý Văn: Các bạn thích món ăn nào?',129)
role(130,1,2,'白家月','Bạch Gia Nguyệt','我喜欢这个，也喜欢那个。','Bạch Gia Nguyệt: Mình thích món này, cũng thích món kia nữa.',129)
role(130,1,3,'陈天中','Trần Thiên Trung','这些菜都好吃，还很好看。','Trần Thiên Trung: Những món ăn này đều ngon, còn rất đẹp mắt nữa.',129)
role(130,1,4,'李文','Lý Văn','我爱吃中国菜，也喜欢做。大家多吃点儿。',['Lý Văn: Mình thích ăn món Trung Quốc, cũng rất thích nấu nữa. Mọi người ăn nhiều','một chút nhé.'],129)
heading(130,'grammar-heading','小语讲堂','Lớp học của Tiểu Ngữ')
add(130,'grammar-01-title','grammar-title','并列复句“……，还/也……”','Câu ghép đẳng lập “……，还/也……”',printedGrammarNumber=1)
add(130,'grammar-01-explanation','grammar-explanation','并列复句由两个或两个以上逻辑关联、结构对称的小句构成。本册学习并列复句“……，还/也……”。',['Câu ghép đẳng lập là câu được tạo bởi hai hay nhiều vế câu có liên quan về mặt lôgic và','đối xứng với nhau về mặt cấu trúc. Trong quyển sách này giới thiệu câu ghép đẳng lập “……，','还/也……”.'],fragmentLineJoiners=[' ',''])
instr(130,'grammar-01-read','大声朗读。','Đọc to các câu sau.')
heading(130,'text-2-heading','课文2','Bài khoá 2')
add(130,'text-2-scene','scene','在李文家，大家边吃饭边谈论假期计划。',['Mọi người vừa ăn vừa thảo luận về kế hoạch','kỳ nghỉ tại nhà Lý Văn.'])
instr(130,'text-2-listen','听两遍对话，选择正确答案。','Nghe hội thoại hai lượt và chọn đáp án đúng.',audioPrinted='15-3')

header(131,True)
heading(131,'words-2-heading','生词','Từ mới',audioPrinted='15-4')
for w in [(3,'去年','qùnián','dt.','năm ngoái'),(4,'男朋友','nánpéngyou','dt.',['bạn trai,','người yêu']),(5,'几','jǐ','số.','vài, mấy'),(6,'年','nián','dt.','năm'),(7,'好玩儿','hǎowánr','tt.',['vui, thích,','thú vị'])]:
    word(131,*w)
heading(131,'proper-words-1-heading','专有名词','Danh từ riêng')
proper(131,1,'西安','Xī’ān','Tây An')
proper(131,2,'北京','Běijīng','Bắc Kinh')
role(131,2,1,'李文','Lý Văn','你们都想去哪儿？',['Lý Văn: Các bạn đều muốn đi','đâu vậy?'])
role(131,2,2,'安妮','Annie','去年我和男朋友去了西安，今年我想去北京。',['Annie: Năm ngoái mình và','bạn trai đã đi Tây An, năm','nay mình muốn đi Bắc Kinh.'])
role(131,2,3,'白家月','Bạch Gia Nguyệt','前几年我去了西安，非常好玩儿。今年我也想去北京。',['Bạch Gia Nguyệt: Mấy năm','trước mình đã đi Tây An, rất vui.','Năm nay mình cũng muốn đi','Bắc Kinh.'])
role(131,2,4,'李文','Lý Văn','我和王老师都是北京人，北京非常漂亮。',['Lý Văn: Mình và cô Vương đều','là người Bắc Kinh, Bắc Kinh','rất đẹp.'])
instr(131,'text-2-role-read','分角色朗读对话。','Phân vai đọc to đoạn hội thoại.')
instr(131,'text-2-questions','根据课文内容回答问题。','Trả lời câu hỏi theo nội dung bài khoá.')
add(131,'text-2-question-01','reading-question','安妮今年想去哪儿？','Annie năm nay muốn đi đâu?')
add(131,'text-2-question-02','reading-question','前几年白家月去了哪儿？','Mấy năm trước, Bạch Gia Nguyệt đã đi đâu?')

header(132)
heading(132,'text-3-heading','课文3','Bài khoá 3')
add(132,'text-3-scene','scene','在教室外，白家月、安妮和王老师在谈论去北京旅游的事。',['Bạch Gia Nguyệt, Annie và','cô Vương đang nói chuyện về việc đi du lịch Bắc Kinh ở bên ngoài lớp học.'])
instr(132,'text-3-listen','听两遍对话，选择正确答案。','Nghe hội thoại hai lượt và chọn đáp án đúng.',audioPrinted='15-5')

header(133,True)
heading(133,'words-3-heading','生词','Từ mới',audioPrinted='15-6')
for w in [(8,'飞机','fēijī','dt.','máy bay'),(9,'要','yào','đgt.',['cần,','mất (thời gian)']),(10,'小时','xiǎoshí','dt.',['tiếng đồng hồ,','giờ']),(11,'家人','jiārén','dt.','người nhà'),(12,'时间','shíjiān','dt.','thời gian'),(13,'机场','jīchǎng','dt.','sân bay'),(14,'接','jiē','đgt.','đón, tiếp đón'),(15,'住','zhù','đgt.','ở'),(16,'早','zǎo','tt.','sớm'),(17,'那','nà','liên.',['vậy thì,','thế thì'])]:
    word(133,*w)
heading(133,'proper-words-2-heading','专有名词','Danh từ riêng')
proper(133,3,'大兴机场','Dàxīng Jīchǎng','sân bay Đại Hưng')
words[-1].update({'zhPrintedLineTexts':['大兴','机场'],'pinyinPrintedLineTexts':['Dàxīng','Jīchǎng']})
role(133,3,1,'王一飞','Vương Nhất Phi','你们的飞机到北京要几个小时？',['Vương Nhất Phi: Chuyến bay của các em','đến Bắc Kinh mất mấy tiếng?'])
role(133,3,2,'白家月','Bạch Gia Nguyệt','九个小时。','Bạch Gia Nguyệt: 9 tiếng ạ.')
role(133,3,3,'王一飞','Vương Nhất Phi','我家人都在北京，星期天我姐姐也有时间，她可以去机场接你们，你们也可以住我家。',['Vương Nhất Phi: Người nhà cô đều ở','Bắc Kinh. Chủ nhật chị gái cô cũng có','thời gian, chị ấy có thể đi sân bay đón','các em, các em cũng có thể ở nhà cô.'])
role(133,3,4,'安妮','Annie','我们星期日早上八点到大兴机场，早不早？',['Annie: 8 giờ sáng Chủ nhật chúng em đã','đến sân bay Đại Hưng, có sớm không cô?'])
role(133,3,5,'王一飞','Vương Nhất Phi','不早。','Vương Nhất Phi: Không sớm đâu.')
role(133,3,6,'白家月','Bạch Gia Nguyệt','谢谢老师！那我们和您姐姐在大兴机场见！',['Bạch Gia Nguyệt: Cảm ơn cô ạ! Vậy chúng','em hẹn gặp chị cô ở sân bay Đại Hưng nhé!'])
instr(133,'text-3-role-read','分角色朗读对话。','Phân vai đọc to đoạn hội thoại.')
instr(133,'text-3-questions','根据课文内容回答问题。','Trả lời câu hỏi theo nội dung bài khoá.')
add(133,'text-3-question-01','reading-question','大兴机场在哪儿？','Sân bay Đại Hưng ở đâu?')
add(133,'text-3-question-02','reading-question','王老师的姐姐可以去接白家月和安妮吗？',['Chị gái của cô Vương có thể','đi đón Bạch Gia Nguyệt và Annie không?'])

header(134)
heading(134,'exercises-heading','综合练习','Bài tập tổng hợp')
instr(134,'exercises-01','选词填空。','Chọn từ thích hợp điền vào chỗ trống.')
instr(134,'picture-description','用本课新学的词语和语言点描述图片。',['Sử dụng từ ngữ và điểm ngôn ngữ đã học trong bài','để miêu tả các hình ảnh sau.'])

header(135,True)
heading(135,'activity-heading','课堂活动','Hoạt động trên lớp')
add(135,'activity-title','activity-title','角色扮演','Đóng vai')
add(135,'activity-instruction','activity-instruction','三个人分别扮演李文、陈天中和白家月，李文邀请陈天中和白家月做客，一起做中国菜。',['Ba người lần lượt đóng vai Lý Văn, Trần Thiên Trung và Bạch Gia Nguyệt. Lý Văn mời','Trần Thiên Trung và Bạch Gia Nguyệt đến nhà chơi và cùng làm món ăn Trung Quốc.'])
add(135,'activity-example-label','activity-example-label','小语的例子','Ví dụ của Tiểu Ngữ')
heading(135,'culture-heading','小语的彩蛋','Món quà của Tiểu Ngữ',videoPrinted='15-1')
add(135,'culture-subtitle','culture-subtitle','北京欢迎你','Bắc Kinh chào đón bạn')

header(136)
heading(136,'summary-heading','学习小结','Tổng kết học tập')
add(136,'summary-introduction','summary-instruction','13～15课我的学习情况：','Tình hình học tập từ bài 13 đến bài 15 của tôi:')
heading(136,'summary-vocabulary-heading','词语学习','Việc học từ ngữ')
add(136,'summary-vocabulary-remembered','summary-table-label','我已经记住并会使用的词语','Những từ ngữ tôi đã nhớ và biết sử dụng')
add(136,'summary-vocabulary-not-remembered','summary-table-label','我还没记住的词语','Những từ ngữ tôi chưa nhớ')
heading(136,'summary-grammar-heading','我理解并会用','Tôi đã hiểu và đã biết dùng')
add(136,'summary-understand-column','summary-table-column','理解','Đã hiểu')
add(136,'summary-use-column','summary-table-column','会用','Đã biết dùng')
for i,(zh,vi) in enumerate([
    ('能愿动词“可以”，例如：我可以吃吗？','Động từ năng nguyện “可以”, ví dụ: 我可以吃吗？'),
    ('“动词+一下”结构，例如：看一下','Cấu trúc “động từ + 一下”, ví dụ: 看一下'),
    ('双宾语句（1），例如：给我一杯水。','Câu có hai tân ngữ (1), ví dụ: 给我一杯水。'),
    ('动态助词“了（2）”，例如：读了一本书','Trợ từ động thái “了 (2)”, ví dụ: 读了一本书')
],1):
    add(136,f'summary-item-{i:02d}','summary-table-row',zh,vi,tableRow=i,mixedPrintedChineseExamplesRetained=True)

header(137,True)
add(137,'summary-item-05','summary-table-row','离合词（1），例如：吃了饭，睡一觉','Từ li hợp (1), ví dụ: 吃了饭，睡一觉',tableRow=5,mixedPrintedChineseExamplesRetained=True)
add(137,'summary-item-06','summary-table-row','范围副词“都”，例如：我们都来了。','Phó từ chỉ phạm vi “都”, ví dụ: 我们都来了。',tableRow=6,mixedPrintedChineseExamplesRetained=True)
add(137,'summary-item-07','summary-table-row','并列复句“……，还/也……”，例如：我喜欢看书，也喜欢看电影。',['Câu ghép đẳng lập “……，还/也……”, ví dụ: 我喜欢看','书，也喜欢看电影。'],tableRow=7,mixedPrintedChineseExamplesRetained=True,fragmentLineJoiners=[''])
add(137,'summary-item-08','summary-table-row','了解中国餐桌文化、待客礼仪。','Hiểu về văn hoá bàn ăn và nghi lễ tiếp khách của Trung Quốc.',tableRow=8)
heading(137,'summary-effort-heading','我需要努力的','Những điểm tôi cần cố gắng')

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
index_data=[(138,'爱','ài','15',False),(141,'哪个','nǎge','15',False),(141,'去年','qùnián','15',False),(141,'男朋友','nánpéngyou','15',False),(140,'几','jǐ','4, 15',False),(141,'年','nián','15',False),(140,'好玩儿','hǎowánr','15',False),(139,'飞机','fēijī','15',False),(143,'要','yào','11, 13, 15',False),(142,'小时','xiǎoshí','15',False),(140,'家人','jiārén','15',False),(141,'时间','shíjiān','15',False),(140,'机场','jīchǎng','15',True),(140,'接','jiē','15',True),(143,'住','zhù','15',False),(143,'早','zǎo','15',False),(141,'那','nà','9, 15',False),(144,'西安','Xī’ān','15',False),(144,'北京','Běijīng','15',False),(144,'大兴机场','Dàxīng Jīchǎng','15',False)]
for p,zh,py,labels,star in index_data:
    row={'pdfPage':p,'printedPage':f'{p-16:03d}','zhPrinted':zh,'pinyinPrinted':py,'lessonNumbersPrinted':labels,'starPrinted':star,'viGlossPrinted':False,'renderRef':f'renders/pdf-{p:03d}.png','scope':'bounded-L15-relevant-index-row-not-a-Vietnamese-definition'}
    if zh=='大兴机场':row['pinyinPrintedLineTexts']=['Dàxīng','Jīchǎng']
    appendix_rows.append(row)

pdf_path=pathlib.Path('/workspace/scratch/28b55072841a/upload/HSK1  (3.0).pdf')
assert hashlib.sha256(pdf_path.read_bytes()).hexdigest()==PDF_SHA
pdf=fitz.open(pdf_path)
pages=list(range(128,138))+list(range(138,145))
(DEST/'renders').mkdir(exist_ok=True)
renders=[]
for p in pages:
    page=pdf[p-1];target=DEST/'renders'/f'pdf-{p:03d}.png'
    target.write_bytes(page.get_pixmap(matrix=fitz.Matrix(1.6,1.6),alpha=False).tobytes('png'))
    renders.append({'pdfPage':p,'printedPageObserved':f'{p-16:03d}','file':f'renders/{target.name}','bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'actualCropBox':list(page.cropbox),'actualRotation':page.rotation,'matrix':[1.6,1.6],'fullPageAuthorVisualRead':True})
source={
    'schemaVersion':2,'documentSourceId':'hsk1-official-vietnamese-20261004','sourceRevision':'recovered-official-vietnamese-upload-99ca3e63',
    'sourcePDF':{'fileName':'HSK1  (3.0).pdf','sha256':PDF_SHA,'bytes':63200770,'pdfPageCount':148},'lesson':15,
    'pdfPages':list(range(128,138)),'printedPages':[f'{p-16:03d}' for p in range(128,138)],'appendixPDFPages':list(range(138,145)),
    'authorReview':{'reviewer':'/root/qa_hsk1_05_08','status':'author-transcribed-source-only-not-independent-acceptance','method':'All ten body pages and seven appendix pages actually visually read in original-PDF CropBox rasters; original PDF detail checked for appendix POS labels. No website VI or OCR used as transcription authority.'},
    'independentReview':{'status':'pending','reviewer':None},
    'textPolicy':{'viText':'Physical Vietnamese word-line wraps joined with one space by default. Fragment lineJoiner or per-boundary lineJoiners overrides default where a mixed CJK sentence/quoted construction crosses a physical line: concatenate continuous Chinese without injecting word space. Physical lineTexts retained; printed accents/casing/punctuation preserved, no inferred translations or automatic Unicode correction.','fragments':'Actual Vietnamese printed lines; separate Chinese-anchor PDF pages preserve cross-page role mapping.','roles':'Whole printed role prefixes retained, speakerZh/speakerViPrinted separately recorded.','rawPos':'Actual printed body labels retained separately from shared printed appendix crosswalk.','sharedAppendix':'The same appendix physical occurrences reuse the same shared source IDs across lesson packs; deduplicate them rather than count as lesson-specific new vocabulary.'},
    'occurrences':rows,'wordTableRows':words,'appendixOccurrences':appendix,'appendixRelevantIndexRows':appendix_rows,
    'layoutContinuations':[
        {'module':'text1','pdfPages':[129,130],'printedPages':['113','114'],'note':'Chinese four dialogue roles129; corresponding complete VI four roles130, explicit Chinese-anchor page129 per role.'},
        {'module':'text2','pdfPages':[130,131],'printedPages':['114','115'],'note':'Heading/scene/listening130; Chinese/VI roles and ordinary/proper words131.'},
        {'module':'text3','pdfPages':[132,133],'printedPages':['116','117'],'note':'Heading/scene/listening132; Chinese/VI six roles and ordinary/proper words133.'},
        {'module':'learning-summary','pdfPages':[136,137],'printedPages':['120','121'],'note':'Headers and rows1–4 on136; rows5–8 and effort heading137. Mixed-Chinese quoted construction/example line boundaries use explicit joiners, not automatic extra Chinese spaces.'}
    ],
    'coverage':{
        'bodyOccurrenceCount':len(rows),'byBodyCategory':dict(collections.Counter(r['category'] for r in rows)),
        'ordinaryWordRows':17,'properNameRows':3,'totalWordTableRows':len(words),'printedBodyPosOccurrences':17,'dialogueTranslatedLines':14,
        'sharedAppendixVIOccurrences':len(appendix),'appendixRelevantIndexRows':len(appendix_rows),'learningSummaryRows':8,
        'chapterBoundary':{'firstPDFPage':128,'firstPrintedPage':'112','lastPDFPage':137,'lastPrintedPage':'121','nextSectionStartActuallyObserved':{'pdfPage':138,'printedPage':'122','section':'printed-POS-crosswalk-and-vocabulary-appendix'}},
        'noPrintedVietnameseAreas':[
            {'pdfPages':[128],'area':'Six warmup word/image choices Chinese/pinyin only.'},
            {'pdfPages':[129,130,132],'area':'Listening stems/options Chinese/pinyin only, VI instructions separate.'},
            {'pdfPages':[130],'area':'Grammar examples Chinese/pinyin only, no inferred VI translations.'},
            {'pdfPages':[131],'area':'City photo captions 西安/北京 are Chinese/pinyin only; separate proper-word glosses are real VI words but not invented image subtitles.'},
            {'pdfPages':[134,135],'area':'Blank-exercise stems/options, four picture stems and classroom roleplay example dialogue have no printed VI translations.'},
            {'pdfPages':list(range(138,145)),'area':'Vocabulary/proper index body Chinese/PY/lesson-number only; no VI definitions. Actual VI appendix headers, full POS terms/abbreviations and star footnote88shared retained.'}
        ],'candidateErrata':[],
        'semanticObservations':[
            {'sourceOccurrenceId':'hsk1-official-vi-l15-pdf133-text-3-role-04','observation':'Actual printed VI is 8 giờ sáng Chủ nhật chúng em đã đến sân bay Đại Hưng, có sớm không cô? Chinese and surrounding travel-plan dialogue discuss the arrival itinerary. Printed đã is faithfully retained as a book/context tense observation; no website future-to-past repair or blanket semantic acceptance.'},
            {'word':'机场/接','observation':'Body words13/14 have no stars; appendix *机场/*接 have stars. Actual markings separately retained, no canonical overwrite.'},
            {'word':'西安/北京/大兴机场','observation':'Three proper rows no printed POS field; rawPosLabel/posOccurrenceId null and printedPOSFieldPresent false. 大兴机场 and its pinyin actually wrap in two physical lines, explicit metadata retained.'},
            {'sourceOccurrenceId':'hsk1-official-vi-l15-pdf130-grammar-01-explanation','observation':'Three physical VI lines have boundary joiners space then empty; the quoted Chinese construction crosses between lines2/3 without an invented Chinese word-space.'},
            {'sourceOccurrenceId':'hsk1-official-vi-l15-pdf137-summary-item-07','observation':'Printed mixed-language row ends line1 at 看 and line2 starts书; lineJoiner empty keeps 我喜欢看书 continuous while preserving physical lineTexts.'}
        ],
        'oldChineseSourceNotes':{'status':'not-recovered-or-read-for-this-source-pack','claim':'Only official Vietnamese PDF SHA99ca3e63; no lost source QA or old Chinese edition equivalence asserted.'}
    },
    'activation':0,'runtimeWrites':0,'websiteComparison':0,'trustedProof':False}
(DEST/'source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n')
(DEST/'render-manifest.json').write_text(json.dumps({'sourcePDFSHA256':PDF_SHA,'renderer':f'PyMuPDF {fitz.VersionBind}','matrix':[1.6,1.6],'respectsCropBox':True,'pages':renders,'originalRasterRetryObservation':'Initial private bulk .save produced zero-byte files101/129; both were regenerated through pixmap.tobytes PNG and PIL-verified before any source authoring. This standalone builder directly uses pixmap.tobytes. Only valid final raster bytes enter this pack.'},ensure_ascii=False,indent=2)+'\n')
if pathlib.Path(__file__).resolve()!=(DEST/'build-source.py').resolve():
    shutil.copyfile(__file__,DEST/'build-source.py')
print(json.dumps({'lesson':15,'bodyOccurrences':len(rows),'appendixVIOccurrences':len(appendix),'wordRows':len(words),'renders':len(renders),'sourceSHA256':hashlib.sha256((DEST/'source.json').read_bytes()).hexdigest()},ensure_ascii=False))
