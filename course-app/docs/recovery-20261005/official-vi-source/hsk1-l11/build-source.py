#!/usr/bin/env python3
"""Manual original-page transcription, HSK1 L11. No website content read."""
import collections
import hashlib
import json
import pathlib
import shutil
import fitz

WORK = pathlib.Path(__file__).resolve().parent
DEST = WORK if WORK.name == 'hsk1-l11' else pathlib.Path('/workspace/scratch/28b55072841a/hsk-hub-resume-recovered/course-app/docs/recovery-20261005/official-vi-source/hsk1-l11')
DEST.mkdir(parents=True, exist_ok=True)
PDF_SHA = '99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764'
rows = []
words = []


def add(page, tag, category, zh, lines, **metadata):
    if isinstance(lines, str):
        lines = [lines]
    row = {'occurrenceId': f'hsk1-official-vi-l11-pdf{page:03d}-{tag}', 'lesson': 11, 'pdfPage': page, 'printedPage': f'{page-16:03d}', 'category': category, 'zhContext': zh, 'viText': ' '.join(lines), 'fragments': [{'pdfPage': page, 'printedPage': f'{page-16:03d}', 'lineTexts': lines}], 'renderRef': f'renders/pdf-{page:03d}.png', **metadata}
    rows.append(row)
    return row['occurrenceId']


def header(page, title=False):
    if title:
        add(page, 'lesson-label', 'lesson-label', '我读大学呢', 'Bài', adjacentNumeralPrinted='11')
    else:
        add(page, 'book-header', 'running-header', '新HSK教程1', 'Giáo trình New HSK 1')


def heading(page, tag, zh, vi, **meta):
    return add(page, tag, 'section-heading', zh, vi, **meta)


def instr(page, tag, zh, vi, **meta):
    return add(page, tag, 'instruction', zh, vi, **meta)


def word(page, number, zh, py, pos, lines):
    gloss = add(page, f'word-{number:02d}-gloss', 'word-gloss', zh, lines, printOrdinal=number)
    pos_id = add(page, f'word-{number:02d}-pos', 'word-pos', zh, pos, printOrdinal=number)
    words.append({'pdfPage': page, 'printedPage': f'{page-16:03d}', 'printOrdinal': number, 'kind': 'ordinary', 'zhPrinted': zh, 'pinyinPrinted': py, 'rawPosLabel': pos, 'glossOccurrenceId': gloss, 'posOccurrenceId': pos_id, 'starPrintedInBody': False})


def role(page, text, line, zh_name, vi_name, zh, vi_lines, zh_page=None):
    add(page, f'text-{text}-role-{line:02d}', 'dialogue-translation', zh, vi_lines, speakerZh=zh_name, speakerViPrinted=vi_name, textNumber=text, dialogueLine=line, zhAnchorPDFPage=zh_page or page, zhAnchorPrintedPage=f'{(zh_page or page)-16:03d}')


header(94, True)
add(94, 'title', 'lesson-title', '我读大学呢', 'Em đang học đại học', titlePinyinPrinted='Wǒ dú dàxué ne')
heading(94, 'goals-heading', '目标', 'Mục tiêu')
add(94, 'goal-01', 'goal', '能听懂并使用三种结构表达正在做的事情。', ['Có thể nghe hiểu và sử dụng được ba', 'cấu trúc diễn đạt hành động đang diễn ra.'])
add(94, 'goal-02', 'goal', '能听懂并使用正反问格式进行提问。', ['Có thể nghe hiểu và đặt câu hỏi bằng cấu trúc', 'câu hỏi chính phản.'])
add(94, 'goal-03', 'goal', '掌握能愿动词“要”表达想做、打算做的用法。', ['Nắm vững cách sử dụng của động từ', 'năng nguyện “要” để diễn đạt mong muốn làm gì hoặc dự định làm việc gì đó.'])
heading(94, 'warmup-heading', '热身', 'Khởi động')
instr(94, 'warmup-instruction', '给下面的词语选择对应的图片。', 'Lựa chọn hình ảnh tương ứng với các từ ngữ sau.')

header(95, True)
heading(95, 'text-1-heading', '课文1', 'Bài khoá 1')
add(95, 'text-1-scene', 'scene', '在路上，李文在找饭店，王一飞给他打电话。', ['Lý Văn đang tìm nhà hàng trên đường đi,', 'Vương Nhất Phi gọi điện cho anh ấy.'])
instr(95, 'text-1-read', '朗读对话。', 'Đọc to đoạn hội thoại.', audioPrinted='11-1')
heading(95, 'words-1-heading', '生词', 'Từ mới', audioPrinted='11-2')
for w in [(1,'时候','shíhou','dt.','lúc, khi'),(2,'饭店','fàndiàn','dt.',['nhà hàng,','khách sạn']),(3,'知道','zhīdào','đgt.','biết, nhận ra'),(4,'正在','zhèngzài','phó.','đang (làm gì)'),(5,'找','zhǎo','đgt.','tìm, kiếm'),(6,'开车','kāichē','đgt.','lái xe (ô tô)'),(7,'车','chē','dt.','xe')]:
    word(95, *w)
role(95,1,1,'王一飞','Vương Nhất Phi','喂，李文，你什么时候能到饭店？',['Vương Nhất Phi: A lô, Lý Văn à, khi','nào em có thể đến nhà hàng?'])
role(95,1,2,'李文','Lý Văn','还不知道，正在找呢。它是不是在超市后边？',['Lý Văn: Cũng không biết ạ, em đang tìm','đây. Nó có phải ở phía sau siêu thị không?'])
role(95,1,3,'王一飞','Vương Nhất Phi','是的。你开车没开车？',['Vương Nhất Phi: Đúng rồi. Em có lái','xe không?'])
role(95,1,4,'李文','Lý Văn','我没开车，坐车呢。','Lý Văn: Em không lái xe, đang đi taxi đây.')
instr(95,'text-1-role-read','分角色朗读对话。',['Phân vai đọc to đoạn','hội thoại.'])
instr(95,'text-1-pair-practice','两人一组，根据实际情况对话。',['Hai người một nhóm, tiến hành hội thoại','theo tình huống thực tế.'])

header(96)
heading(96,'grammar-heading','小语讲堂','Lớp học của Tiểu Ngữ')
add(96,'grammar-01-title','grammar-title','正反问','Câu hỏi chính phản',printedGrammarNumber=1)
add(96,'grammar-01-explanation','grammar-explanation','正反问格式是“x+不/没+x”，“x”是动词或形容词。动词正反问使用“不/没”，形容词正反问使用“不”。',['Cấu trúc của câu hỏi chính phản là “x+不/没+x”, “x” là động từ hoặc tính từ. Sử dụng','“不/没” cho câu hỏi chính phản động từ và “不” cho câu hỏi chính phản tính từ.'])
instr(96,'grammar-01-read','大声朗读。','Đọc to các câu sau.')
instr(96,'grammar-01-dialogues','朗读对话。','Đọc to các đoạn hội thoại sau.')
heading(96,'text-2-heading','课文2','Bài khoá 2')
add(96,'text-2-scene','scene','在饭店里，王一飞和李文见面后聊天儿。',['Vương Nhất Phi và Lý Văn trò chuyện sau khi','gặp nhau tại nhà hàng.'])
instr(96,'text-2-listen','听两遍对话，选择正确答案。','Nghe hội thoại hai lượt và chọn đáp án đúng.',audioPrinted='11-3')

header(97, True)
heading(97,'words-2-heading','生词','Từ mới',audioPrinted='11-4')
for w in [(8,'在','zài','phó.','đang'),(9,'读','dú','đgt.','học, đọc'),(10,'大学','dàxué','dt.','đại học'),(11,'大学生','dàxuéshēng','dt.','sinh viên'),(12,'学','xué','đgt.','học'),(13,'医','yī','dt.','y, y học, y khoa')]:
    word(97,*w)
role(97,2,1,'王一飞','Vương Nhất Phi','你还在读大学吗？','Vương Nhất Phi: Em vẫn đang học đại học ạ?')
role(97,2,2,'李文','Lý Văn','对，我读大学呢，还是大学生。','Lý Văn: Đúng vậy, em đang học đại học, vẫn đang là sinh viên.')
role(97,2,3,'王一飞','Vương Nhất Phi','你们学习忙不忙？','Vương Nhất Phi: Các em học có bận không?')
role(97,2,4,'李文','Lý Văn','非常忙，我学医，我们的课很多。','Lý Văn: Bận lắm ạ, em học ngành y, chúng em có rất nhiều môn học.')
instr(97,'text-2-role-read','分角色朗读对话。','Phân vai đọc to đoạn hội thoại.')
instr(97,'text-2-pair-practice','两人一组，根据实际情况对话。',['Hai người một nhóm, tiến hành hội thoại theo tình huống','thực tế.'])

header(98)
heading(98,'grammar-heading','小语讲堂','Lớp học của Tiểu Ngữ')
add(98,'grammar-02-title','grammar-title','时间副词“在/正在”','Phó từ chỉ thời gian “在/正在”',printedGrammarNumber=2)
add(98,'grammar-02-explanation','grammar-explanation','时间副词“在/正在”位于动词前，表示动作正在进行或情况在继续。本课有两种形式：（1）在/正在+动词；（2）在/正在+动词+呢。此外，表达正在做的事情还有第三种形式：（3）动词+呢。否定回答时，使用副词“没（有）”。',['Phó từ chỉ thời gian “在/正在” đứng trước động từ để biểu thị hành động đang diễn ra','hoặc tình huống đang tiếp diễn. Trong bài học này giới thiệu hai hình thức: (1) 在/正在 + động từ;','(2) 在/正在 + động từ + 呢. Ngoài ra, để diễn đạt đang làm việc gì có thể sử dụng hình thức','thứ ba: (3) động từ + 呢. Khi trả lời phủ định, sử dụng phó từ “没(有)”.'])
instr(98,'grammar-02-read','大声朗读。','Đọc to các câu sau.')
instr(98,'grammar-02-dialogues','朗读对话。','Đọc to các đoạn hội thoại sau.')
heading(98,'text-3-heading','课文3','Bài khoá 3')
add(98,'text-3-scene','scene','星期六早上，刘明要去医院加班，出门前和女儿对话。',['Sáng thứ Bảy, Lưu Minh phải đến','bệnh viện làm thêm giờ, anh trò chuyện với con gái trước khi ra khỏi nhà.'])
instr(98,'text-3-listen','听两遍对话，选择正确答案。','Nghe hội thoại hai lượt và chọn đáp án đúng.',audioPrinted='11-5')

header(99,True)
heading(99,'words-3-heading','生词','Từ mới',audioPrinted='11-6')
for w in [(14,'弟弟','dìdi','dt.','em trai'),(15,'起床','qǐchuáng','đgt.',['thức dậy,','ngủ dậy, dậy']),(16,'睡觉','shuìjiào','đgt.','ngủ'),(17,'睡','shuì','đgt.','ngủ'),(18,'那里','nàlǐ','đt.','ở kia, chỗ đó'),(19,'哪里','nǎlǐ','đt.',['đâu, chỗ nào,','nơi nào']),(20,'昨天','zuótiān','dt.','hôm qua'),(21,'问','wèn','đgt.','hỏi'),(22,'对','duì','giới.','với, đối với'),(23,'说','shuō','đgt.','nói'),(24,'要','yào','đtnn.',['cần, muốn,','phải']),(25,'小朋友','xiǎopéngyǒu','dt.','bạn nhỏ')]:
    word(99,*w)
instr(99,'text-3-role-read','分角色朗读对话。','Phân vai đọc to đoạn hội thoại.')
instr(99,'text-3-questions','根据课文内容回答问题。','Trả lời câu hỏi theo nội dung bài khoá.')
add(99,'text-3-question-01','reading-question','弟弟起床没起床？','Em trai đã thức dậy chưa?')
add(99,'text-3-question-02','reading-question','弟弟今天要做什么？','Hôm nay em trai định làm gì?')

header(100)
role(100,3,1,'刘明','Lưu Minh','弟弟起床没起床呢？','Lưu Minh: Em đã thức dậy chưa con?',99)
role(100,3,2,'刘小雪','Lưu Tiểu Tuyết','没起床呢，还在睡觉。','Lưu Tiểu Tuyết: Chưa thức dậy ạ, em vẫn còn đang ngủ.',99)
role(100,3,3,'刘明','Lưu Minh','还睡呢？他今天去不去那里？','Lưu Minh: Vẫn còn ngủ à? Hôm nay em có đi đến đó không?',99)
role(100,3,4,'刘小雪','Lưu Tiểu Tuyết','去哪里？','Lưu Tiểu Tuyết: Đi đâu ạ?',99)
role(100,3,5,'刘明','Lưu Minh','去超市。','Lưu Minh: Đi siêu thị.',99)
role(100,3,6,'刘小雪','Lưu Tiểu Tuyết','我昨天问他，他对我说，他不去，他今天要和小朋友玩。',['Lưu Tiểu Tuyết: Hôm qua con hỏi em rồi. Em nói với con là em không đi, hôm nay','em muốn chơi với các bạn.'],99)
heading(100,'grammar-heading','小语讲堂','Lớp học của Tiểu Ngữ')
add(100,'grammar-03-title','grammar-title','能愿动词“要”','Động từ năng nguyện “要”',printedGrammarNumber=3)
add(100,'grammar-03-explanation','grammar-explanation','能愿动词“要”在动词前，表示想做、打算做。',['Động từ năng nguyện “要” đặt trước động từ, biểu thị mong muốn hoặc dự định làm việc','gì đó.'])
instr(100,'grammar-03-read','大声朗读。','Đọc to các câu sau.')
heading(100,'exercises-heading','综合练习','Bài tập tổng hợp')
instr(100,'exercises-01','选词填空。','Chọn từ thích hợp điền vào chỗ trống.')

header(101,True)
instr(101,'picture-description','用本课新学的词语和语言点描述图片。',['Sử dụng từ ngữ và điểm ngôn ngữ đã học trong bài','để miêu tả các hình ảnh sau.'])
heading(101,'activity-heading','课堂活动','Hoạt động trên lớp')
add(101,'activity-title','activity-title','双人活动','Hoạt động theo nhóm hai người')
add(101,'activity-instruction','activity-instruction','两人一组，互相问答做不做某事。','Hai người một nhóm, lần lượt hỏi và trả lời về việc có làm hay không làm một việc nào đó.')
add(101,'activity-example-label','activity-example-label','小语的例子','Ví dụ của Tiểu Ngữ')

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
index_data=[(139,'车','chē','11',False),(139,'大学','dàxué','11',False),(139,'大学生','dàxuéshēng','11',False),(139,'弟弟','dìdi','11',False),(139,'读','dú','11',False),(139,'对','duì','3, 11',False),(139,'饭店','fàndiàn','11',False),(140,'开车','kāichē','11',False),(141,'哪里','nǎlǐ','11',False),(141,'那里','nàlǐ','11',False),(141,'起床','qǐchuáng','11',False),(141,'时候','shíhou','11',False),(142,'睡','shuì','11',False),(142,'睡觉','shuìjiào','11',False),(142,'说','shuō','11',False),(142,'问','wèn','11',False),(142,'小朋友','xiǎopéngyǒu','11',False),(142,'学','xué','11',False),(143,'要','yào','11, 13, 15',False),(143,'医','yī','11',True),(143,'在','zài','7, 8, 11',False),(143,'找','zhǎo','11',False),(143,'正在','zhèngzài','11',False),(143,'知道','zhīdào','11',False),(143,'昨天','zuótiān','11',False)]
for p,zh,py,labels,star in index_data:
    appendix_rows.append({'pdfPage':p,'printedPage':f'{p-16:03d}','zhPrinted':zh,'pinyinPrinted':py,'lessonNumbersPrinted':labels,'starPrinted':star,'viGlossPrinted':False,'renderRef':f'renders/pdf-{p:03d}.png','scope':'bounded-L11-relevant-index-row-not-a-Vietnamese-definition'})

pdf_path=pathlib.Path('/workspace/scratch/28b55072841a/upload/HSK1  (3.0).pdf')
assert hashlib.sha256(pdf_path.read_bytes()).hexdigest()==PDF_SHA
pdf=fitz.open(pdf_path)
pages=list(range(94,102))+list(range(138,145))
(DEST/'renders').mkdir(exist_ok=True)
renders=[]
for p in pages:
    page=pdf[p-1];target=DEST/'renders'/f'pdf-{p:03d}.png'
    target.write_bytes(page.get_pixmap(matrix=fitz.Matrix(1.6,1.6),alpha=False).tobytes('png'))
    renders.append({'pdfPage':p,'printedPageObserved':f'{p-16:03d}','file':f'renders/{target.name}','bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'actualCropBox':list(page.cropbox),'actualRotation':page.rotation,'matrix':[1.6,1.6],'fullPageAuthorVisualRead':True})
source={
    'schemaVersion':2,'documentSourceId':'hsk1-official-vietnamese-20261004','sourceRevision':'recovered-official-vietnamese-upload-99ca3e63',
    'sourcePDF':{'fileName':'HSK1  (3.0).pdf','sha256':PDF_SHA,'bytes':63200770,'pdfPageCount':148},'lesson':11,
    'pdfPages':list(range(94,102)),'printedPages':[f'{p-16:03d}' for p in range(94,102)],'appendixPDFPages':list(range(138,145)),
    'authorReview':{'reviewer':'/root/qa_hsk1_05_08','status':'author-transcribed-source-only-not-independent-acceptance','method':'All eight body pages and seven appendix pages actually visually read in original-PDF CropBox rasters; original PDF detail checked for appendix POS labels. No website VI or OCR used as transcription authority.'},
    'independentReview':{'status':'pending','reviewer':None},
    'textPolicy':{'viText':'Physical visual line wraps joined with one space; printed words, accents, casing and punctuation retained. No inferred translations of Chinese-only examples. Unicode character inventory is recorded without automatic content correction.','fragments':'Actual Vietnamese printed lines; separate Chinese-anchor PDF pages preserve cross-page role mapping.','roles':'Whole printed role prefixes retained, speakerZh/speakerViPrinted separately recorded.','rawPos':'Actual printed body labels retained separately from shared printed appendix crosswalk.','sharedAppendix':'The same appendix physical occurrences reuse the same shared source IDs across lesson packs; deduplicate them rather than count as lesson-specific new vocabulary.'},
    'occurrences':rows,'wordTableRows':words,'appendixOccurrences':appendix,'appendixRelevantIndexRows':appendix_rows,
    'layoutContinuations':[{'module':'text2','pdfPages':[96,97],'printedPages':['080','081'],'note':'Heading, scene and listening on96; Chinese and Vietnamese dialogue/words on97.'},{'module':'text3','pdfPages':[98,99,100],'printedPages':['082','083','084'],'note':'Heading/scene/listening98; Chinese dialogue and words99; Vietnamese role translations100. Each role has explicit Chinese anchor99.'},{'module':'blank-exercise-and-picture-description','pdfPages':[100,101],'printedPages':['084','085'],'note':'Blank exercise100; picture description and pair activity101, with separate printed VI instructions.'}],
    'coverage':{'bodyOccurrenceCount':len(rows),'byBodyCategory':dict(collections.Counter(r['category'] for r in rows)),'ordinaryWordRows':len(words),'properNameRows':0,'printedBodyPosOccurrences':25,'dialogueTranslatedLines':14,'sharedAppendixVIOccurrences':len(appendix),'appendixRelevantIndexRows':len(appendix_rows),'chapterBoundary':{'firstPDFPage':94,'firstPrintedPage':'078','lastPDFPage':101,'lastPrintedPage':'085','nextLessonStartActuallyObserved':{'pdfPage':102,'printedPage':'086','lesson':12}},'noPrintedVietnameseAreas':[{'pdfPages':[94],'area':'Warmup six word choices/images are Chinese/pinyin only.'},{'pdfPages':[96,98,100],'area':'All grammar example sentences/dialogues printed Chinese only; VI instructions transcribed, no invented VI examples.'},{'pdfPages':[96,98],'area':'Listening stems and answer choices are Chinese/pinyin only.'},{'pdfPages':[100,101],'area':'Blank-exercise stems/options, four picture stems and pair activity example dialogue contain no printed Vietnamese translations.'},{'pdfPages':list(range(138,145)),'area':'Vocabulary/proper index body consists of Chinese headwords, pinyin and lesson labels; no Vietnamese word definitions printed. All actual VI headers, POS table terms/abbreviations and star footnote are separately transcribed.'}],'candidateErrata':[],'semanticObservations':[{'sourceOccurrenceId':'hsk1-official-vi-l11-pdf095-text-1-role-04','observation':'Chinese 坐车呢 is translated with taxi by the printed VI. The narrower printed wording is faithfully retained; no website replacement or blanket semantic acceptance is made.'},{'word':'医','observation':'The body word row has no printed star; the appendix index marks *医. Both actual markings are retained separately, no canonical star overwrite.'}],'oldChineseSourceNotes':{'status':'not-recovered-or-read-for-this-source-pack','claim':'This transcription belongs only to official Vietnamese PDF SHA99ca3e63; no equivalence with any old Chinese source/appendix or prior lost QA is asserted.'}},
    'activation':0,'runtimeWrites':0,'websiteComparison':0,'trustedProof':False}
(DEST/'source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n')
(DEST/'render-manifest.json').write_text(json.dumps({'sourcePDFSHA256':PDF_SHA,'renderer':f'PyMuPDF {fitz.VersionBind}','matrix':[1.6,1.6],'respectsCropBox':True,'pages':renders,'originalRasterRetryObservation':'Initial private bulk .save produced zero-byte files101/129; both were regenerated through pixmap.tobytes PNG and PIL-verified before any source authoring. This standalone builder directly uses pixmap.tobytes. Only valid final raster bytes enter this pack.'},ensure_ascii=False,indent=2)+'\n')
if pathlib.Path(__file__).resolve()!=(DEST/'build-source.py').resolve():
    shutil.copyfile(__file__,DEST/'build-source.py')
print(json.dumps({'lesson':11,'bodyOccurrences':len(rows),'appendixVIOccurrences':len(appendix),'wordRows':len(words),'renders':len(renders),'sourceSHA256':hashlib.sha256((DEST/'source.json').read_bytes()).hexdigest()},ensure_ascii=False))
