#!/usr/bin/env python3
"""Manual original-page transcription, HSK1 L13. No website content read."""
import collections
import hashlib
import json
import pathlib
import shutil
import fitz

WORK = pathlib.Path(__file__).resolve().parent
DEST = WORK if WORK.name == 'hsk1-l13' else pathlib.Path('/workspace/scratch/28b55072841a/hsk-hub-resume-recovered/course-app/docs/recovery-20261005/official-vi-source/hsk1-l13')
DEST.mkdir(parents=True, exist_ok=True)
PDF_SHA = '99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764'
rows = []
words = []


def add(page, tag, category, zh, lines, **metadata):
    if isinstance(lines, str):
        lines = [lines]
    row = {'occurrenceId': f'hsk1-official-vi-l13-pdf{page:03d}-{tag}', 'lesson': 13, 'pdfPage': page, 'printedPage': f'{page-16:03d}', 'category': category, 'zhContext': zh, 'viText': ' '.join(lines), 'fragments': [{'pdfPage': page, 'printedPage': f'{page-16:03d}', 'lineTexts': lines}], 'renderRef': f'renders/pdf-{page:03d}.png', **metadata}
    rows.append(row)
    return row['occurrenceId']


def header(page, title=False):
    if title:
        add(page, 'lesson-label', 'lesson-label', '请给我一杯茶', 'Bài', adjacentNumeralPrinted='13')
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


header(111,True)
add(111,'title','lesson-title','请给我一杯茶','Cho tôi một cốc trà',titlePinyinPrinted='Qǐng gěi wǒ yì bēi chá')
heading(111,'goals-heading','目标','Mục tiêu')
add(111,'goal-01','goal','能听懂并使用双宾语句（1）表示向别人提问或给予别人东西等。',['Có thể nghe hiểu','và sử dụng được câu có hai tân ngữ (1) để biểu thị việc hỏi người khác hoặc đưa cho','người khác vật gì đó...'])
add(111,'goal-02','goal','掌握能愿动词“可以”的用法。','Nắm vững cách sử dụng của động từ năng nguyện “可以”.')
add(111,'goal-03','goal','掌握“动词+一下”结构的用法。','Nắm vững cách sử dụng của cấu trúc “động từ + 一下”.')
add(111,'goal-04','goal','了解点餐常用语。','Hiểu về các mẫu câu thường dùng khi gọi đồ ăn.')
heading(111,'warmup-heading','热身','Khởi động')
instr(111,'warmup-instruction','给下面的词语选择对应的图片。','Lựa chọn hình ảnh tương ứng với các từ ngữ sau.')

header(112)
heading(112,'text-1-heading','课文1','Bài khoá 1')
add(112,'text-1-scene','scene','在教室里，下课后，白家月问王老师问题。',['Bạch Gia Nguyệt hỏi bài cô Vương ở trong lớp','sau khi tan học.'])
instr(112,'text-1-listen','听两遍对话，选择正确答案。','Nghe hội thoại hai lượt và chọn đáp án đúng.',audioPrinted='13-1')
role(112,1,1,'白家月','Bạch Gia Nguyệt','王老师，我可以再问您一个问题吗？',['Bạch Gia Nguyệt: Thưa cô Vương,','em có thể hỏi thêm cô một câu nữa','không ạ?'])
role(112,1,2,'王一飞','Vương Nhất Phi','可以。你有什么问题？',['Vương Nhất Phi: Được chứ. Em có','vấn đề gì nào?'])
role(112,1,3,'白家月','Bạch Gia Nguyệt','那个小店卖不卖手机？',['Bạch Gia Nguyệt: Cửa hàng nhỏ kia','có bán điện thoại di động không ạ?'])
role(112,1,4,'王一飞','Vương Nhất Phi','我不知道。你可以打电话问一下。',['Vương Nhất Phi: Cô không biết. Em','có thể gọi điện thoại hỏi xem.'])
instr(112,'text-1-role-read','分角色朗读对话。','Phân vai đọc to đoạn hội thoại.')
instr(112,'text-1-questions','根据课文内容回答问题。','Trả lời câu hỏi dựa theo nội dung bài khoá.')
add(112,'text-1-question-01','reading-question','白家月还有什么问题？','Bạch Gia Nguyệt còn có câu hỏi gì vậy?')
add(112,'text-1-question-02','reading-question','王老师对白家月说什么了？','Cô Vương đã nói gì với Bạch Gia Nguyệt?')

header(113,True)
heading(113,'words-1-heading','生词','Từ mới',audioPrinted='13-2')
for w in [(1,'可以','kěyǐ','đtnn.','có thể, được (cho phép làm gì)'),(2,'再','zài','phó.','lại, thêm lần nữa'),(3,'问题','wèntí','dt.','câu hỏi, vấn đề'),(4,'卖','mài','đgt.','bán'),(5,'打电话','dǎ diànhuà',None,'gọi điện thoại'),(6,'一下','yíxià','sl.',['một chút, thử (dùng sau động từ, biểu thị','hành động xảy ra nhanh hoặc thử làm)'])]:
    word(113,*w)
heading(113,'grammar-heading','小语讲堂','Lớp học của Tiểu Ngữ')
add(113,'grammar-01-title','grammar-title','能愿动词“可以”','Động từ năng nguyện “可以”',printedGrammarNumber=1)
add(113,'grammar-01-explanation','grammar-explanation','能愿动词“可以”位于动词前，表示可能、能够或许可。',['Động từ năng nguyện “可以” được đặt trước động từ để biểu thị khả năng, năng lực hoặc','sự cho phép.'])
instr(113,'grammar-01-read','大声朗读。','Đọc to các câu sau.')
add(113,'grammar-02-title','grammar-title','“动词+一下”结构','Cấu trúc “động từ + 一下”',printedGrammarNumber=2)
add(113,'grammar-02-explanation','grammar-explanation','本课“动词+一下”结构表示做一次或试着做，动作时间短。',['Cấu trúc “động từ + 一下” trong bài này dùng để biểu thị việc thực hiện hành động','một lần hoặc thử làm việc gì đó, hành động diễn ra trong thời gian ngắn.'])
instr(113,'grammar-02-read','大声朗读。','Đọc to các câu sau.')

header(114)
heading(114,'text-2-heading','课文2','Bài khoá 2')
add(114,'text-2-scene','scene','在咖啡馆里，王一雪想吃早餐。','Vương Nhất Tuyết muốn ăn sáng ở trong quán cà phê.')
instr(114,'text-2-listen','听两遍对话，选择正确答案。','Nghe hội thoại hai lượt và chọn đáp án đúng.',audioPrinted='13-3')
role(114,2,1,'服务员','Nhân viên phục vụ','女士，请坐！您喝什么？','Nhân viên phục vụ: Mời cô ngồi! Cô uống gì ạ?')
role(114,2,2,'王一雪','Vương Nhất Tuyết','我看一下。请给我一杯牛奶。','Vương Nhất Tuyết: Để tôi xem một chút. Cho tôi một cốc sữa.')
role(114,2,3,'服务员','Nhân viên phục vụ','好的。您还要什么？','Nhân viên phục vụ: Vâng. Cô còn dùng thêm gì nữa không?')
role(114,2,4,'王一雪','Vương Nhất Tuyết','我还没吃早饭，再要这个面包和鸡蛋吧。','Vương Nhất Tuyết: Tôi vẫn chưa ăn sáng, cho tôi cái bánh mì này và trứng nhé.')
instr(114,'text-2-role-read','分角色朗读对话。','Phân vai đọc to đoạn hội thoại.')
instr(114,'text-2-questions','根据课文内容回答问题。','Trả lời câu hỏi dựa theo nội dung bài khoá.')
add(114,'text-2-question-01','reading-question','服务员问王一雪什么问题了？',['Nhân viên phục vụ hỏi Vương Nhất Tuyết','vấn đề gì vậy?'])
add(114,'text-2-question-02','reading-question','王一雪吃早饭了吗？','Vương Nhất Tuyết đã ăn sáng chưa?')

header(115,True)
heading(115,'words-2-heading','生词','Từ mới',audioPrinted='13-4')
for w in [(7,'服务员','fúwùyuán','dt.','nhân viên phục vụ, người phục vụ'),(8,'女士','nǚshì','dt.','bà, cô, quý bà, quý cô'),(9,'请','qǐng','đgt.','mời, xin, hãy'),(10,'坐','zuò','đgt.','ngồi'),(11,'给','gěi','đgt.','đưa cho, cho'),(12,'杯','bēi','dt.','ly, cốc, tách'),(13,'要','yào','đgt.','cần, muốn'),(14,'早饭','zǎofàn','dt.','bữa sáng'),(15,'这个','zhège','đt.','cái này'),(16,'面包','miànbāo','dt.','bánh mì'),(17,'鸡蛋','jīdàn','dt.','trứng gà')]:
    word(115,*w)
heading(115,'grammar-heading','小语讲堂','Lớp học của Tiểu Ngữ')
add(115,'grammar-03-title','grammar-title','双宾语句（1）','Câu có hai tân ngữ (1)',printedGrammarNumber=3)
add(115,'grammar-03-explanation','grammar-explanation','双宾语句是一个动词带两个宾语的句子。本册学习“给、问”构成的双宾语句。',['Câu có hai tân ngữ là câu mà một động từ mang hai tân ngữ. Trong quyển sách này,','chúng ta học câu có hai tân ngữ được tạo bởi động từ “给” và “问”.'])
instr(115,'grammar-03-read','大声朗读。','Đọc to các câu sau.')
heading(115,'text-3-heading','课文3','Bài khoá 3')
add(115,'text-3-scene','scene','在餐馆里，刘明在点餐。','Lưu Minh đang gọi món ăn ở nhà hàng.')
instr(115,'text-3-listen','听两遍对话，选择正确答案。','Nghe hội thoại hai lượt và chọn đáp án đúng.',audioPrinted='13-5')

header(116)
heading(116,'words-3-heading','生词','Từ mới',audioPrinted='13-6')
for w in [(18,'先生','xiānsheng','dt.',['anh, ông,','ngài, quý ông']),(19,'一半','yíbàn','số.','một nửa'),(20,'茶','chá','dt.','trà, chè')]:
    word(116,*w)
role(116,3,1,'服务员','Nhân viên phục vụ','先生，请坐！您要什么？',['Nhân viên phục vụ: Mời anh ngồi! Anh','cần gì ạ?'])
role(116,3,2,'刘明','Lưu Minh','我要一斤饺子。','Lưu Minh: Cho tôi một cân sủi cảo.')
role(116,3,3,'服务员','Nhân viên phục vụ','好的。一斤饺子40个。',['Nhân viên phục vụ: Vâng ạ. Một cân sủi','cảo có 40 cái.'])
role(116,3,4,'刘明','Lưu Minh','40个太多了，我要一半吧。',['Lưu Minh: 40 cái thì nhiều quá, tôi lấy nửa','cân thôi nhé.'])
role(116,3,5,'服务员','Nhân viên phục vụ','半斤20个。您想喝什么？',['Nhân viên phục vụ: Nửa cân là 20 cái.','Anh muốn uống gì không ạ?'])
role(116,3,6,'刘明','Lưu Minh','请给我一杯茶吧。','Lưu Minh: Cho tôi một cốc trà nhé.')
instr(116,'text-3-role-read','分角色朗读对话。','Phân vai đọc to đoạn hội thoại.')
instr(116,'text-3-questions','根据课文内容回答问题。','Trả lời câu hỏi theo nội dung bài khoá.')
add(116,'text-3-question-01','reading-question','刘明想要多少饺子？','Lưu Minh muốn gọi bao nhiêu sủi cảo?')
add(116,'text-3-question-02','reading-question','刘明要米饭了吗？','Lưu Minh có gọi cơm trắng không?')

header(117,True)
heading(117,'exercises-heading','综合练习','Bài tập tổng hợp')
instr(117,'exercises-01','选词填空。','Chọn từ thích hợp điền vào chỗ trống.')
instr(117,'picture-description','用本课新学的词语和语言点描述图片。',['Sử dụng từ ngữ và điểm ngôn ngữ đã học trong bài','để miêu tả các hình ảnh sau.'])

header(118)
heading(118,'activity-heading','课堂活动','Hoạt động trên lớp')
add(118,'activity-title','activity-title','角色扮演','Đóng vai')
add(118,'activity-instruction','activity-instruction','三人一组，一个人扮演服务员，两个人扮演顾客，表演在咖啡馆点餐。',['Ba người một nhóm, một người đóng vai phục vụ, hai người còn lại đóng vai khách hàng,','thực hiện việc gọi món trong quán cà phê.'])
add(118,'activity-example-label','activity-example-label','小语的例子','Ví dụ của Tiểu Ngữ')
add(118,'activity-example-customer-1','activity-example-role-label','顾客1','(Khách hàng 1)',printedSurroundingChinese='顾客1(Khách hàng 1): 我要一杯茶。')
add(118,'activity-example-customer-2','activity-example-role-label','顾客2','(Khách hàng 2)',printedSurroundingChinese='顾客2(Khách hàng 2): 我要一杯牛奶。')
heading(118,'culture-heading','小语的彩蛋','Món quà của Tiểu Ngữ',videoPrinted='13-1')
add(118,'culture-subtitle','culture-subtitle','中国茶','Trà Trung Quốc')

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
index_data=[(139,'杯','bēi','13',False),(139,'茶','chá','13',False),(139,'打电话','dǎ diànhuà','13',False),(139,'服务员','fúwùyuán','13',True),(139,'给','gěi','13',False),(140,'鸡蛋','jīdàn','13',False),(140,'可以','kěyǐ','13',False),(140,'卖','mài','13',False),(141,'面包','miànbāo','13',False),(141,'女士','nǚshì','13',False),(141,'请','qǐng','13',False),(142,'问题','wèntí','13',False),(142,'先生','xiānsheng','13',False),(143,'一半','yíbàn','13',False),(143,'一下','yíxià','13',False),(143,'要','yào','11, 13, 15',False),(143,'早饭','zǎofàn','13',False),(143,'这个','zhège','13',False),(143,'坐','zuò','6, 13',False),(143,'再','zài','12, 13',False)]
for p,zh,py,labels,star in index_data:
    appendix_rows.append({'pdfPage':p,'printedPage':f'{p-16:03d}','zhPrinted':zh,'pinyinPrinted':py,'lessonNumbersPrinted':labels,'starPrinted':star,'viGlossPrinted':False,'renderRef':f'renders/pdf-{p:03d}.png','scope':'bounded-L13-relevant-index-row-not-a-Vietnamese-definition'})

pdf_path=pathlib.Path('/workspace/scratch/28b55072841a/upload/HSK1  (3.0).pdf')
assert hashlib.sha256(pdf_path.read_bytes()).hexdigest()==PDF_SHA
pdf=fitz.open(pdf_path)
pages=list(range(111,119))+list(range(138,145))
(DEST/'renders').mkdir(exist_ok=True)
renders=[]
for p in pages:
    page=pdf[p-1];target=DEST/'renders'/f'pdf-{p:03d}.png'
    target.write_bytes(page.get_pixmap(matrix=fitz.Matrix(1.6,1.6),alpha=False).tobytes('png'))
    renders.append({'pdfPage':p,'printedPageObserved':f'{p-16:03d}','file':f'renders/{target.name}','bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'actualCropBox':list(page.cropbox),'actualRotation':page.rotation,'matrix':[1.6,1.6],'fullPageAuthorVisualRead':True})
source={
    'schemaVersion':2,'documentSourceId':'hsk1-official-vietnamese-20261004','sourceRevision':'recovered-official-vietnamese-upload-99ca3e63',
    'sourcePDF':{'fileName':'HSK1  (3.0).pdf','sha256':PDF_SHA,'bytes':63200770,'pdfPageCount':148},'lesson':13,
    'pdfPages':list(range(111,119)),'printedPages':[f'{p-16:03d}' for p in range(111,119)],'appendixPDFPages':list(range(138,145)),
    'authorReview':{'reviewer':'/root/qa_hsk1_05_08','status':'author-transcribed-source-only-not-independent-acceptance','method':'All eight body pages and seven appendix pages actually visually read in original-PDF CropBox rasters; original PDF detail checked for appendix POS labels. No website VI or OCR used as transcription authority.'},
    'independentReview':{'status':'pending','reviewer':None},
    'textPolicy':{'viText':'Physical visual line wraps joined with one space; printed words, accents, casing and punctuation retained. No inferred translations of Chinese-only examples. Unicode character inventory is recorded without automatic content correction.','fragments':'Actual Vietnamese printed lines; separate Chinese-anchor PDF pages preserve cross-page role mapping.','roles':'Whole printed role prefixes retained, speakerZh/speakerViPrinted separately recorded.','rawPos':'Actual printed body labels retained separately from shared printed appendix crosswalk.','sharedAppendix':'The same appendix physical occurrences reuse the same shared source IDs across lesson packs; deduplicate them rather than count as lesson-specific new vocabulary.'},
    'occurrences':rows,'wordTableRows':words,'appendixOccurrences':appendix,'appendixRelevantIndexRows':appendix_rows,
    'layoutContinuations':[
        {'module':'text1-and-words','pdfPages':[112,113],'printedPages':['096','097'],'note':'All Chinese and VI roles112; words and grammar113.'},
        {'module':'text2-and-words','pdfPages':[114,115],'printedPages':['098','099'],'note':'Complete Chinese and VI dialogue114; words115.'},
        {'module':'text3','pdfPages':[115,116],'printedPages':['099','100'],'note':'Heading/scene/listening item1 on115; listening item2 and complete Chinese/VI roles plus words116.'}
    ],
    'coverage':{
        'bodyOccurrenceCount':len(rows),'byBodyCategory':dict(collections.Counter(r['category'] for r in rows)),
        'ordinaryWordRows':len(words),'properNameRows':0,'printedBodyPosOccurrences':19,'dialogueTranslatedLines':14,
        'sharedAppendixVIOccurrences':len(appendix),'appendixRelevantIndexRows':len(appendix_rows),
        'chapterBoundary':{'firstPDFPage':111,'firstPrintedPage':'095','lastPDFPage':118,'lastPrintedPage':'102','nextLessonStartActuallyObserved':{'pdfPage':119,'printedPage':'103','lesson':14}},
        'noPrintedVietnameseAreas':[
            {'pdfPages':[111],'area':'Warmup choices/images are Chinese/pinyin only.'},
            {'pdfPages':[112,114,115,116],'area':'Listening stems/options are Chinese/pinyin only; VI instructions retained.'},
            {'pdfPages':[113,115],'area':'All grammar examples are Chinese/pinyin only, no inferred VI translations.'},
            {'pdfPages':[117],'area':'Blank-exercise stems/options and four picture stems have no VI translations.'},
            {'pdfPages':[118],'area':'Roleplay example Chinese sentences have no VI translations; the two actual Khách hàng labels are independently transcribed.'},
            {'pdfPages':list(range(138,145)),'area':'Index headword/pinyin/lesson-number body has no Vietnamese definitions. All printed VI headers, full POS terms/abbreviations and star footnote retained as88shared physical occurrences.'}
        ],'candidateErrata':[],
        'semanticObservations':[
            {'word':'打电话','observation':'Body row5 has a blank POS cell. rawPosLabel/posOccurrenceId null; do not invent a printed verb label.'},
            {'word':'服务员','observation':'Body row7 no printed star; appendix *服务员 has star. Source markings remain separate, no canonical overwrite.'},
            {'word':'杯','observation':'Body actual raw POS is dt., faithfully retained rather than normalizing it to a measure-word category.'},
            {'sourceOccurrenceId':'hsk1-official-vi-l13-pdf116-text-3-role-02','observation':'Chinese 一斤 is printed Vietnamese một cân. This literal book translation is retained without a website semantic override or unit-conversion claim.'}
        ],
        'oldChineseSourceNotes':{'status':'not-recovered-or-read-for-this-source-pack','claim':'Only official Vietnamese PDF SHA99ca3e63; no old Chinese edition/source appendix equivalence or lost QA acceptance.'}
    },
    'activation':0,'runtimeWrites':0,'websiteComparison':0,'trustedProof':False}
(DEST/'source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n')
(DEST/'render-manifest.json').write_text(json.dumps({'sourcePDFSHA256':PDF_SHA,'renderer':f'PyMuPDF {fitz.VersionBind}','matrix':[1.6,1.6],'respectsCropBox':True,'pages':renders,'originalRasterRetryObservation':'Initial private bulk .save produced zero-byte files101/129; both were regenerated through pixmap.tobytes PNG and PIL-verified before any source authoring. This standalone builder directly uses pixmap.tobytes. Only valid final raster bytes enter this pack.'},ensure_ascii=False,indent=2)+'\n')
if pathlib.Path(__file__).resolve()!=(DEST/'build-source.py').resolve():
    shutil.copyfile(__file__,DEST/'build-source.py')
print(json.dumps({'lesson':13,'bodyOccurrences':len(rows),'appendixVIOccurrences':len(appendix),'wordRows':len(words),'renders':len(renders),'sourceSHA256':hashlib.sha256((DEST/'source.json').read_bytes()).hexdigest()},ensure_ascii=False))
