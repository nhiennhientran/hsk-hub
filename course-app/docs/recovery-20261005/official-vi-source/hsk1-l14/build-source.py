#!/usr/bin/env python3
"""Manual original-page transcription, HSK1 L14. No website content read."""
import collections
import hashlib
import json
import pathlib
import shutil
import fitz

WORK = pathlib.Path(__file__).resolve().parent
DEST = WORK if WORK.name == 'hsk1-l14' else pathlib.Path('/workspace/scratch/28b55072841a/hsk-hub-resume-recovered/course-app/docs/recovery-20261005/official-vi-source/hsk1-l14')
DEST.mkdir(parents=True, exist_ok=True)
PDF_SHA = '99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764'
rows = []
words = []


def add(page, tag, category, zh, lines, **metadata):
    if isinstance(lines, str):
        lines = [lines]
    row = {'occurrenceId': f'hsk1-official-vi-l14-pdf{page:03d}-{tag}', 'lesson': 14, 'pdfPage': page, 'printedPage': f'{page-16:03d}', 'category': category, 'zhContext': zh, 'viText': ' '.join(lines), 'fragments': [{'pdfPage': page, 'printedPage': f'{page-16:03d}', 'lineTexts': lines}], 'renderRef': f'renders/pdf-{page:03d}.png', **metadata}
    rows.append(row)
    return row['occurrenceId']


def header(page, title=False):
    if title:
        add(page, 'lesson-label', 'lesson-label', '我看了一个电影', 'Bài', adjacentNumeralPrinted='14')
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

header(119,True)
add(119,'title','lesson-title','我看了一个电影','Mình đã xem một bộ phim',titlePinyinPrinted='Wǒ kànle yí ge diànyǐng')
heading(119,'goals-heading','目标','Mục tiêu')
add(119,'goal-01','goal','能听懂并使用动态助词“了（2）”表示动作行为已经发生或完成。',['Có thể nghe','hiểu và sử dụng được trợ từ động thái “了 (2)” để biểu thị hành động đã xảy ra hoặc đã','hoàn thành.'])
add(119,'goal-02','goal','掌握范围副词“都”的用法。','Nắm vững cách dùng của phó từ chỉ phạm vi “都”.')
add(119,'goal-03','goal','掌握部分离合词的基本用法。','Nắm vững cách dùng cơ bản của một số từ li hợp.')
add(119,'goal-04','goal','了解并能描述学习情况。','Hiểu và có thể miêu tả được tình hình học tập.')
heading(119,'warmup-heading','热身','Khởi động')
instr(119,'warmup-instruction','给下面的词语选择对应的图片。','Lựa chọn hình ảnh tương ứng với các từ ngữ sau.')

header(120)
heading(120,'text-1-heading','课文1','Bài khoá 1')
add(120,'text-1-scene','scene','在教室里，下课后，白家月和陈天中在谈论上一次课外旅行。',['Bạch Gia Nguyệt và Trần','Thiên Trung đang thảo luận về chuyến du lịch ngoại khoá lần trước ở trong lớp sau giờ tan học.'])
instr(120,'text-1-listen','听两遍对话，选择正确答案。','Nghe hội thoại hai lượt và chọn đáp án đúng.',audioPrinted='14-1')
role(120,1,1,'白家月','Bạch Gia Nguyệt','你们上火车后看见王老师了吗？',['Bạch Gia Nguyệt: Sau khi lên tàu các','bạn có nhìn thấy cô Vương không?'])
role(120,1,2,'陈天中','Trần Thiên Trung','没看见。中午车开后，有些人在看书，有些人睡觉了。',['Trần Thiên Trung: Không nhìn thấy','đâu. Buổi trưa, sau khi tàu chạy, có một','số người đọc sách, một số người ngủ.'])
role(120,1,3,'白家月','Bạch Gia Nguyệt','你呢？','Bạch Gia Nguyệt: Còn bạn thì sao?')
role(120,1,4,'陈天中','Trần Thiên Trung','我看了一个电影。',['Trần Thiên Trung: Mình đã xem một','bộ phim.'])
add(120,'tip-01-label','tip-label','小语帮忙',['Tiểu Ngữ','giúp sức'])
add(120,'tip-01','tip','本课“有些”也可以说“有的”。',['Trong bài này, “有些” cũng có thể','nói là “有的”.'])
instr(120,'text-1-role-read','分角色朗读对话。','Phân vai đọc to đoạn hội thoại.')
instr(120,'text-1-questions','根据课文内容回答问题。','Trả lời câu hỏi theo nội dung bài khoá.')
add(120,'text-1-question-01','reading-question','车开后，大家在做什么？','Sau khi tàu chạy, mọi người làm gì?')
add(120,'text-1-question-02','reading-question','陈天中为什么没看见王老师？','Tại sao Trần Thiên Trung không nhìn thấy cô Vương?')

header(121,True)
heading(121,'words-1-heading','生词','Từ mới',audioPrinted='14-2')
for w in [(1,'上','shàng','đgt.','lên (xe, tàu...)'),(2,'火车','huǒchē','dt.','tàu, tàu hoả, xe lửa'),(3,'中午','zhōngwǔ','dt.','buổi trưa'),(4,'开','kāi','đgt.','lái, chạy, khởi hành (phương tiện giao thông)'),(5,'有些','yǒuxiē','đt.','có một số, có một vài'),(6,'有的','yǒude','đt.','có người, có cái'),(7,'了','le','trợ.','dùng sau động từ chỉ sự hoàn thành của động tác')]:
    word(121,*w)
heading(121,'grammar-heading','小语讲堂','Lớp học của Tiểu Ngữ')
add(121,'grammar-01-title','grammar-title','动态助词“了（2）”','Trợ từ động thái “了 (2)”',printedGrammarNumber=1)
add(121,'grammar-01-explanation','grammar-explanation','动态助词“了（2）”在动词后，表示动作行为已经发生或完成。否定时用“没”，不加“了”。',['Trợ từ động thái “了 (2)” đứng sau động từ để biểu thị hành động đã xảy ra hoặc đã','hoàn thành. Khi phủ định dùng “没”, bỏ “了”.'])
instr(121,'grammar-01-read','大声朗读。','Đọc to các câu sau.')
instr(121,'grammar-01-complete-dialogues','完成对话。','Hoàn thành hội thoại.')
add(121,'grammar-02-title','grammar-title','离合词（1）','Từ li hợp (1)',printedGrammarNumber=2)

header(122)
add(122,'grammar-02-explanation','grammar-explanation','本册中的“上课、下课、上班、下班、说话、读书、睡觉、看病、生病”等是一类特殊的动词结构，可分可合，合在一起时是词，中间加其他成分则变成短语，所以被称为离合词。离合词分离时，可插入的成分有限。',['Các từ như “上课”, “下课”, “上班”, “下班”, “说话”, “读书”, “睡觉”, “看病”, “生病”...','trong quyển sách này là cấu trúc động từ đặc biệt, khi sử dụng có thể tách ra hoặc hợp lại.','Khi hợp lại sẽ là từ, khi thêm các thành phần khác vào giữa thì trở thành cụm từ, do vậy được','gọi là từ li hợp. Khi các từ li hợp tách ra, chỉ có một số thành phần có thể chèn vào giữa.'],zhAnchorPDFPage=121,zhAnchorPrintedPage='105',pairedPDFPages=[121,122],pairedPrintedPages=['105','106'])
instr(122,'grammar-02-read','大声朗读。','Đọc to các từ, cụm từ sau.')
add(122,'grammar-02-table-combine','grammar-table-column','合','(hợp)',printedSurroundingChinese='合 (hợp)')
add(122,'grammar-02-table-separate','grammar-table-column','分','(tách)',printedSurroundingChinese='分 (tách)')
heading(122,'text-2-heading','课文2','Bài khoá 2')
add(122,'text-2-scene','scene','在课堂上，王一飞询问学生们的学习情况。',['Cô Vương Nhất Phi hỏi thăm tình hình học tập','của học sinh ở trong lớp học.'])
instr(122,'text-2-listen','听两遍对话，选择正确答案。','Nghe hội thoại hai lượt và chọn đáp án đúng.',audioPrinted='14-3')

header(123,True)
heading(123,'words-2-heading','生词','Từ mới',audioPrinted='14-4')
for w in [(8,'写','xiě','đgt.','viết'),(9,'都','dōu','phó.','đều'),(10,'听见','tīngjiàn','đgt.','nghe thấy'),(11,'不要','búyào','phó.',['đừng,','không được']),(12,'说话','shuōhuà','đgt.','nói chuyện'),(13,'听','tīng','đgt.','nghe'),(14,'哪些','nǎxiē','đt.','những... nào'),(15,'字','zì','dt.','chữ')]:
    word(123,*w)
heading(123,'proper-words-heading','专有名词','Danh từ riêng')
proper(123,1,'汉语','Hànyǔ',['tiếng Trung Quốc,','tiếng Hán'])
proper(123,2,'汉字','Hànzì','chữ Hán')
role(123,2,1,'王一飞','Vương Nhất Phi','你们会说汉语了，也会写汉字了吗？',['Vương Nhất Phi: Các em đã biết nói tiếng Trung Quốc rồi, cũng đã biết viết chữ Hán','rồi phải không?'])
role(123,2,2,'白家月','Bạch Gia Nguyệt','我们都会写了。','Bạch Gia Nguyệt: Chúng em đều biết viết rồi ạ.')
role(123,2,3,'陈天中','Trần Thiên Trung','老师，我听不见。','Trần Thiên Trung: Thưa cô, em không nghe thấy ạ.')
role(123,2,4,'王一飞','Vương Nhất Phi','请大家不要说话！请听老师的问题：你们都会写哪些汉字了？',['Vương Nhất Phi: Mọi người đừng nói chuyện! Hãy lắng nghe câu hỏi của cô: Các em','đã biết viết những chữ Hán nào rồi?'])
role(123,2,5,'陈天中','Trần Thiên Trung','我会写这些字了，您看！','Trần Thiên Trung: Cô xem này, em đã biết viết những chữ này rồi!')
instr(123,'text-2-role-read','分角色朗读对话。','Phân vai đọc to đoạn hội thoại.')
instr(123,'text-2-questions','根据课文内容回答问题。','Trả lời câu hỏi theo nội dung bài khoá.')
add(123,'text-2-question-01','reading-question','白家月会写汉字了吗？','Bạch Gia Nguyệt đã biết viết chữ Hán chưa?')
add(123,'text-2-question-02','reading-question','陈天中会写汉字了吗？','Trần Thiên Trung đã biết viết chữ Hán chưa?')

header(124)
heading(124,'grammar-heading','小语讲堂','Lớp học của Tiểu Ngữ')
add(124,'grammar-03-title','grammar-title','范围副词“都”','Phó từ chỉ phạm vi “都”',printedGrammarNumber=3)
add(124,'grammar-03-explanation','grammar-explanation','范围副词“都”表示全部、总括，总括的对象在“都”前。否定时，否定词在“都”后。',['Phó từ chỉ phạm vi “都” dùng để biểu thị toàn bộ, tất cả. Đối tượng được bao quát đứng','trước “都”. Khi phủ định, từ phủ định đứng sau “都”.'])
instr(124,'grammar-03-read','大声朗读。','Đọc to các câu sau.')
heading(124,'text-3-heading','课文3','Bài khoá 3')
add(124,'text-3-scene','scene','在家里，刘明和王一雪在谈论孩子的升学情况。',['Lưu Minh và Vương Nhất Tuyết đang','trò chuyện về tình hình học tập của các con ở trong nhà.'])
instr(124,'text-3-listen','听两遍对话，选择正确答案。','Nghe hội thoại hai lượt và chọn đáp án đúng.',audioPrinted='14-5')

header(125,True)
role(125,3,1,'刘明','Lưu Minh','明年女儿上中学。',['Lưu Minh: Sang năm con gái lên','trung học.'])
role(125,3,2,'王一雪','Vương Nhất Tuyết','对。儿子也上小学了。',['Vương Nhất Tuyết: Đúng vậy. Con trai','cũng lên tiểu học.'])
role(125,3,3,'刘明','Lưu Minh','我们家有了一个中学生。',['Lưu Minh: Nhà mình có một học','sinh trung học rồi.'])
role(125,3,4,'王一雪','Vương Nhất Tuyết','还有了一个小学生。',['Vương Nhất Tuyết: Còn có thêm một','học sinh tiểu học nữa.'])
role(125,3,5,'刘明','Lưu Minh','上学后，他们都忙了。',['Lưu Minh: Sau khi vào học, các con','đều bận rộn cả.'])
role(125,3,6,'王一雪','Vương Nhất Tuyết','是的。太晚了，睡觉吧。',['Vương Nhất Tuyết: Đúng vậy. Muộn','quá rồi, đi ngủ thôi.'])
add(125,'tip-02-label','tip-label','小语帮忙',['Tiểu Ngữ','giúp sức'])
add(125,'tip-02','tip','还有两个近似的代词，一个是“她们”，指称自己和对方以外的若干女性；另一个是“它们”，指称不止一个的事物等。三个词读音一样，但所指意义不同。',['Còn có hai đại từ','tương tự, một là “她们”, dùng để','chỉ một nhóm nữ giới nhưng','không bao gồm người nghe và','người nói, đại từ còn lại là “它们”,','dùng để chỉ nhiều hơn một sự vật.','Ba từ này có cách đọc giống nhau','nhưng nghĩa khác nhau.'])
heading(125,'words-3-heading','生词','Từ mới',audioPrinted='14-6')
for w in [(16,'明年','míngnián','dt.','sang năm, năm tới'),(17,'上','shàng','đgt.','lên, bắt đầu (làm gì đó vào thời gian cố định)'),(18,'中学','zhōngxué','dt.','trường trung học, trung học'),(19,'小学','xiǎoxué','dt.','trường tiểu học, tiểu học'),(20,'中学生','zhōngxuéshēng','dt.','học sinh trung học, học sinh cấp hai'),(21,'小学生','xiǎoxuéshēng','dt.','học sinh tiểu học, học sinh cấp một'),(22,'上学','shàngxué','đgt.','đi học, bắt đầu đi học'),(23,'他们','tāmen','đt.','họ, chúng, bọn họ, các anh ấy, các em ấy...'),(24,'她们','tāmen','đt.','họ, chúng, bọn họ, các chị ấy, các em ấy...'),(25,'它们','tāmen','đt.',['chúng (đại từ nhân xưng ngôi thứ ba số nhiều,','chỉ vật)']),(26,'晚','wǎn','tt.','muộn, trễ')]:
    word(125,*w)

header(126)
instr(126,'text-3-role-read','分角色朗读对话。','Phân vai đọc to đoạn hội thoại.')
instr(126,'text-3-questions','根据课文内容回答问题。','Trả lời câu hỏi theo nội dung bài khoá.')
add(126,'text-3-question-01','reading-question','明年女儿和儿子都上小学吗？',['Sang năm, con gái và con trai đều bắt đầu học','tiểu học phải không?'])
add(126,'text-3-question-02','reading-question','上学后，他们忙不忙？','Sau khi vào học, các bạn ấy có bận không?')
heading(126,'exercises-heading','综合练习','Bài tập tổng hợp')
instr(126,'exercises-01','选词填空。','Chọn từ thích hợp điền vào chỗ trống.')
instr(126,'picture-description','用本课新学的词语和语言点描述图片。',['Sử dụng từ ngữ và điểm ngôn ngữ đã học trong bài','để miêu tả các hình ảnh sau.'])

header(127,True)
heading(127,'activity-heading','课堂活动','Hoạt động trên lớp')
add(127,'activity-title','activity-title','双人活动','Hoạt động theo nhóm hai người')
add(127,'activity-instruction','activity-instruction','两人一组，说一说上星期六或星期日你都做了什么。','Hai người một nhóm, nói về những việc bạn đã làm vào thứ Bảy hoặc Chủ nhật tuần trước.')
add(127,'activity-example-label','activity-example-label','小语的例子','Ví dụ của Tiểu Ngữ')

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
index_data=[(139,'不要','búyào','14',False),(139,'都','dōu','14',False),(140,'火车','huǒchē','14',False),(140,'开','kāi','14',False),(140,'了','le','12, 14',False),(141,'明年','míngnián','14',False),(141,'哪些','nǎxiē','14',False),(141,'上','shang/shàng','9, 14',False),(142,'说话','shuōhuà','14',False),(142,'他们','tāmen','14',False),(142,'它们','tāmen','14',False),(142,'她们','tāmen','14',False),(142,'听','tīng','14',False),(142,'听见','tīngjiàn','14',False),(142,'晚','wǎn','14',False),(142,'上学','shàngxué','14',False),(142,'小学','xiǎoxué','14',False),(142,'小学生','xiǎoxuéshēng','14',False),(142,'写','xiě','14',False),(143,'有的','yǒude','14',False),(143,'有些','yǒuxiē','14',False),(143,'中午','zhōngwǔ','14',False),(143,'中学','zhōngxué','14',False),(143,'中学生','zhōngxuéshēng','14',False),(143,'字','zì','14',False),(144,'汉语','Hànyǔ','14',False),(144,'汉字','Hànzì','14',False)]
for p,zh,py,labels,star in index_data:
    appendix_rows.append({'pdfPage':p,'printedPage':f'{p-16:03d}','zhPrinted':zh,'pinyinPrinted':py,'lessonNumbersPrinted':labels,'starPrinted':star,'viGlossPrinted':False,'renderRef':f'renders/pdf-{p:03d}.png','scope':'bounded-L14-relevant-index-row-not-a-Vietnamese-definition'})

pdf_path=pathlib.Path('/workspace/scratch/28b55072841a/upload/HSK1  (3.0).pdf')
assert hashlib.sha256(pdf_path.read_bytes()).hexdigest()==PDF_SHA
pdf=fitz.open(pdf_path)
pages=list(range(119,128))+list(range(138,145))
(DEST/'renders').mkdir(exist_ok=True)
renders=[]
for p in pages:
    page=pdf[p-1];target=DEST/'renders'/f'pdf-{p:03d}.png'
    target.write_bytes(page.get_pixmap(matrix=fitz.Matrix(1.6,1.6),alpha=False).tobytes('png'))
    renders.append({'pdfPage':p,'printedPageObserved':f'{p-16:03d}','file':f'renders/{target.name}','bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'actualCropBox':list(page.cropbox),'actualRotation':page.rotation,'matrix':[1.6,1.6],'fullPageAuthorVisualRead':True})
source={
    'schemaVersion':2,'documentSourceId':'hsk1-official-vietnamese-20261004','sourceRevision':'recovered-official-vietnamese-upload-99ca3e63',
    'sourcePDF':{'fileName':'HSK1  (3.0).pdf','sha256':PDF_SHA,'bytes':63200770,'pdfPageCount':148},'lesson':14,
    'pdfPages':list(range(119,128)),'printedPages':[f'{p-16:03d}' for p in range(119,128)],'appendixPDFPages':list(range(138,145)),
    'authorReview':{'reviewer':'/root/qa_hsk1_05_08','status':'author-transcribed-source-only-not-independent-acceptance','method':'All nine body pages and seven appendix pages actually visually read in original-PDF CropBox rasters; original PDF detail checked for appendix POS labels. No website VI or OCR used as transcription authority.'},
    'independentReview':{'status':'pending','reviewer':None},
    'textPolicy':{'viText':'Physical visual line wraps joined with one space; printed words, accents, casing and punctuation retained. No inferred translations of Chinese-only examples. Unicode character inventory is recorded without automatic content correction.','fragments':'Actual Vietnamese printed lines; separate Chinese-anchor PDF pages preserve cross-page role mapping.','roles':'Whole printed role prefixes retained, speakerZh/speakerViPrinted separately recorded.','rawPos':'Actual printed body labels retained separately from shared printed appendix crosswalk.','sharedAppendix':'The same appendix physical occurrences reuse the same shared source IDs across lesson packs; deduplicate them rather than count as lesson-specific new vocabulary.'},
    'occurrences':rows,'wordTableRows':words,'appendixOccurrences':appendix,'appendixRelevantIndexRows':appendix_rows,
    'layoutContinuations':[
        {'module':'grammar2','pdfPages':[121,122],'printedPages':['105','106'],'note':'Chinese full explanation121/105; corresponding full printed VI explanation122/106. Explicit paired pages retained on occurrence.'},
        {'module':'text2','pdfPages':[122,123],'printedPages':['106','107'],'note':'Heading, scene, listening122; Chinese/VI five roles and ordinary/proper words123.'},
        {'module':'text3','pdfPages':[124,125,126],'printedPages':['108','109','110'],'note':'Heading, scene, listening124; Chinese/VI six roles, tip, words125; role-read, VI reading questions126.'},
        {'module':'picture-description','pdfPages':[126,127],'printedPages':['110','111'],'note':'Instruction and images1/2 on126; images3/4 on127. Only actual VI instruction is transcribed.'}
    ],
    'coverage':{
        'bodyOccurrenceCount':len(rows),'byBodyCategory':dict(collections.Counter(r['category'] for r in rows)),
        'ordinaryWordRows':26,'properNameRows':2,'totalWordTableRows':len(words),'printedBodyPosOccurrences':26,'dialogueTranslatedLines':15,
        'sharedAppendixVIOccurrences':len(appendix),'appendixRelevantIndexRows':len(appendix_rows),
        'chapterBoundary':{'firstPDFPage':119,'firstPrintedPage':'103','lastPDFPage':127,'lastPrintedPage':'111','nextLessonStartActuallyObserved':{'pdfPage':128,'printedPage':'112','lesson':15}},
        'noPrintedVietnameseAreas':[
            {'pdfPages':[119],'area':'Six warmup word/image choices Chinese/pinyin only.'},
            {'pdfPages':[120,122,124],'area':'Listening stems/options Chinese/pinyin only; actual VI instructions separate.'},
            {'pdfPages':[121,122,124],'area':'Grammar example sentences, fill dialogues and separable-word table body Chinese/pinyin only. Actual VI reading instructions and two table header labels retained.'},
            {'pdfPages':[126,127],'area':'Blank-exercise stems/options, four picture stems and activity example paragraph no VI translation printed.'},
            {'pdfPages':list(range(138,145)),'area':'Vocabulary/proper index body Chinese/PY/lesson-number only; no VI definitions. All actual VI appendix headers, POS full terms/abbreviations and star footnote88shared retained.'}
        ],'candidateErrata':[],
        'semanticObservations':[
            {'sourceOccurrenceId':'hsk1-official-vi-l14-pdf122-grammar-02-explanation','observation':'Full printed Vietnamese paragraph on122 preserves Chinese anchor121 and both actual footer pairs, not a falsely same-page direct fragment.'},
            {'word':'汉语/汉字','observation':'Proper-name two rows have no printed POS column. Null rawPosLabel/posOccurrenceId and printedPOSFieldPresent false distinguish no field from ordinary blank.'},
            {'word':'上','observation':'Ordinary rows1 and17 share headword but have distinct original glosses/ordinals; appendix has one 上 shang/shàng row with lesson9,14, retained without sense collapse.'},
            {'sourceOccurrenceId':'hsk1-official-vi-l14-pdf125-tip-02','observation':'All printed pronoun explanation about 她们/它们 retained whole, including exclusions and identical pronunciation statement.'}
        ],
        'oldChineseSourceNotes':{'status':'not-recovered-or-read-for-this-source-pack','claim':'Only official Vietnamese PDF SHA99ca3e63; no lost QA acceptance or old Chinese edition equivalence.'}
    },
    'activation':0,'runtimeWrites':0,'websiteComparison':0,'trustedProof':False}
(DEST/'source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n')
(DEST/'render-manifest.json').write_text(json.dumps({'sourcePDFSHA256':PDF_SHA,'renderer':f'PyMuPDF {fitz.VersionBind}','matrix':[1.6,1.6],'respectsCropBox':True,'pages':renders,'originalRasterRetryObservation':'Initial private bulk .save produced zero-byte files101/129; both were regenerated through pixmap.tobytes PNG and PIL-verified before any source authoring. This standalone builder directly uses pixmap.tobytes. Only valid final raster bytes enter this pack.'},ensure_ascii=False,indent=2)+'\n')
if pathlib.Path(__file__).resolve()!=(DEST/'build-source.py').resolve():
    shutil.copyfile(__file__,DEST/'build-source.py')
print(json.dumps({'lesson':14,'bodyOccurrences':len(rows),'appendixVIOccurrences':len(appendix),'wordRows':len(words),'renders':len(renders),'sourceSHA256':hashlib.sha256((DEST/'source.json').read_bytes()).hexdigest()},ensure_ascii=False))
