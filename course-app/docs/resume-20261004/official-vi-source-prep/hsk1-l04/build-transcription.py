#!/usr/bin/env python3
"""Serialize manually authored visual transcription. No OCR or website input."""
from pathlib import Path
from collections import Counter
import hashlib, json, datetime, unicodedata

ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).resolve().parent
PDF = Path('/workspace/scratch/28b55072841a/upload/HSK1  (3.0).pdf')
SHA = '99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764'
RASTERS = Path('/workspace/scratch/28b55072841a/official-vi-source-preflight/pilot-pages')
# Every pair below was read from the actual visible footer, not inferred by offset.
PAGES = [(34,18,'018'),(35,19,'019'),(36,20,'020'),(37,21,'021'),
         (38,22,'022'),(39,23,'023'),(40,24,'024'),(41,25,'025'),(42,26,'026')]
entries=[]
def add(pdf,section,tag,kind,zh,lines,**extra):
    if isinstance(lines,str): lines=[lines]
    pp,label=next((p,l) for n,p,l in PAGES if n==pdf)
    text=' '.join(lines)
    entries.append(dict(sourceID=f'hsk1-vi-l04-pdf{pdf:03d}-{tag}',lesson=4,
        pdfPage=pdf,printedPage=pp,printedPageLabel=label,section=section,kind=kind,
        chineseAnchor=zh,viLines=lines,viText=text,
        authorVisualStatus='visually-transcribed-awaiting-independent-source-review',
        **extra))
def word(pdf,num,zh,py,pos,lines):
    add(pdf,'生词',f'vocab-{num:03d}','vocabulary-row',zh,lines,
        printedOrdinal=num,printPinyin=py,posRawLabel=pos,
        posPolicy='Verbatim printed Vietnamese abbreviation; no normalization or inferred category.')

add(34,'课题','lesson-marker','lesson-marker','第4课','Bài',printedNumber=4)
add(34,'课题','title','lesson-title','我有两个孩子','Chị có hai con')
add(34,'目标','goals-heading','section-heading','目标','Mục tiêu')
add(34,'目标','goal-01','goal','能听懂并使用“有”字句（1）表达领有人或物品。',[
 'Có thể nghe hiểu và sử dụng được','câu chữ “有” (1) để diễn đạt sự sở hữu đối với người hoặc vật.'])
add(34,'目标','goal-02','goal','掌握“A……，B呢？”的用法。','Nắm vững cách sử dụng của cấu trúc “A……, B呢?”.')
add(34,'目标','goal-03','goal','掌握本课数词、量词的用法。','Nắm vững cách sử dụng của số từ và lượng từ trong bài.')
add(34,'目标','goal-04','goal','了解中国人如何问答年龄，能使用合适的词语进行年龄问答。',[
 'Hiểu về cách người','Trung Quốc hỏi và trả lời về tuổi tác, đồng thời có thể sử dụng các từ ngữ phù hợp để','hỏi đáp về tuổi.'])
add(34,'热身','warmup-heading','section-heading','热身','Khởi động')
add(34,'热身','warmup-instruction','instruction','给下面的词语选择对应的图片。','Lựa chọn hình ảnh tương ứng với các từ ngữ sau.')

add(35,'页眉','running-header','running-header','我有两个孩子 | 第4课','Bài 4')
add(35,'课文1','text-1-heading','section-heading','课文1','Bài khoá 1')
add(35,'课文1','text-1-setting','setting','在家里，刘明和王一雪在聊天儿。','Lưu Minh và Vương Nhất Tuyết đang trò chuyện ở trong nhà.')
add(35,'课文1','text-1-read','instruction','朗读对话。','Đọc to đoạn hội thoại.',printedAudioTrack='4-1')
add(35,'生词','vocab-heading','section-heading','生词','Từ mới',printedAudioTrack='4-2')
word(35,1,'有','yǒu','đgt.','có')
word(35,2,'多少','duōshao','đt.','bao nhiêu')
word(35,3,'个','gè','lượng.',['dùng chung cho','nhiều danh từ'])
add(35,'课文1','text-1-role-read','instruction','分角色朗读对话。',['Phân vai đọc to','đoạn hội thoại.'])
add(35,'课文1/角色译文','text-1-line-01','dialogue-translation','刘明：一飞忙吗？','Lưu Minh: Nhất Phi có bận không?',speakerZh='刘明',speakerVi='Lưu Minh',lineOrdinal=1)
add(35,'课文1/角色译文','text-1-line-02','dialogue-translation','王一雪：她很忙。','Vương Nhất Tuyết: Dì ấy rất bận.',speakerZh='王一雪',speakerVi='Vương Nhất Tuyết',lineOrdinal=2)
add(35,'课文1/角色译文','text-1-line-03','dialogue-translation','刘明：她有多少个学生？','Lưu Minh: Dì ấy có bao nhiêu học sinh?',speakerZh='刘明',speakerVi='Lưu Minh',lineOrdinal=3)
add(35,'课文1/角色译文','text-1-line-04','dialogue-translation','王一雪：她有二十个学生。','Vương Nhất Tuyết: Dì ấy có hai mươi học sinh.',speakerZh='王一雪',speakerVi='Vương Nhất Tuyết',lineOrdinal=4)
add(35,'小语讲堂','grammar-heading','section-heading','小语讲堂','Lớp học của Tiểu Ngữ')
add(35,'小语讲堂/1','grammar-1-title','grammar-title','“有”字句（1）','Câu chữ “有” (1)',grammarOrdinal=1)
add(35,'小语讲堂/1','grammar-1-body','grammar-explanation','本课“有”表示领有，否定形式为“没/没有”。','Từ “有” trong bài này biểu thị sự sở hữu. Phủ định của “有” là “没/没有”.',grammarOrdinal=1)

add(36,'页眉','running-header','running-header','新HSK教程1','Giáo trình New HSK 1')
add(36,'小语讲堂/1','grammar-1-read','instruction','大声朗读。','Đọc to các câu sau.',grammarOrdinal=1)
add(36,'小语讲堂/2','grammar-2-title','grammar-title','数字的表达','Cách diễn đạt các con số',grammarOrdinal=2)
add(36,'小语讲堂/2','grammar-2-body','grammar-explanation','汉语中，数字有阿拉伯数字和汉字两种写法，例如“1”和“一”。',[
 'Trong tiếng Trung Quốc, các con số có thể được viết dưới hai dạng: số Ả Rập (ví dụ: “1”)','và chữ Hán (ví dụ: “一”).'],grammarOrdinal=2)
add(36,'小语讲堂/2/（1）','grammar-2-1-title','grammar-subtitle','0–99的写法和读法','Cách viết và cách đọc các con số từ 0–99',grammarOrdinal=2,subsectionOrdinal=1)
add(36,'小语讲堂/2/（1）','grammar-2-1-read','instruction','大声朗读。','Đọc to các con số sau.',grammarOrdinal=2,subsectionOrdinal=1)

add(37,'页眉','running-header','running-header','我有两个孩子 | 第4课','Bài 4')
add(37,'小语讲堂/2/（2）','grammar-2-2-title','grammar-subtitle','“百”以上（含）、“万”以内数字的写法与读法',[
 'Cách viết và cách đọc các số','từ 100 (kể cả 100) đến 10.000.'],grammarOrdinal=2,subsectionOrdinal=2)
add(37,'小语讲堂/2/（2）','grammar-2-2-read','instruction','大声朗读。','Đọc to các con số sau.',grammarOrdinal=2,subsectionOrdinal=2)
add(37,'小语讲堂/2/（3）','grammar-2-3-title','grammar-subtitle','“2”的写法和读法','Cách viết và cách đọc số “2”',grammarOrdinal=2,subsectionOrdinal=3)
add(37,'小语讲堂/2/（3）','grammar-2-3-body','grammar-explanation','数字“2”写作、读作“二（èr）”或“两（liǎng）”；序数词里用“二”，量词前用“两”。',[
 'Số “2” có thể được viết và đọc là “二 (èr)” hoặc “两 (liǎng)”. Thông thường, “二 (èr)”','được dùng chỉ số thứ tự, chẳng hạn như “第二”, còn “两 (liǎng)” được dùng trước lượng từ.'],grammarOrdinal=2,subsectionOrdinal=3)
add(37,'小语讲堂/2/（3）','grammar-2-3-read','instruction','大声朗读。','Đọc to các con số sau.',grammarOrdinal=2,subsectionOrdinal=3)
add(37,'小语讲堂/2/（3）/例表','grammar-2-3-example-book','inline-example','两本书','(hai quyển sách)',grammarOrdinal=2,subsectionOrdinal=3,tablePosition={'row':2,'column':3})
add(37,'课文2','text-2-heading','section-heading','课文2','Bài khoá 2')
add(37,'课文2','text-2-setting','setting','在公司里，王一雪和杨同乐休息时聊天儿。',[
 'Vương Nhất Tuyết và Dương Đồng Lạc','trò chuyện với nhau trong giờ nghỉ ở công ty.'])
add(37,'课文2','text-2-listen','instruction','听两遍对话，选择正确答案。','Nghe hội thoại hai lượt và chọn đáp án đúng.',printedAudioTrack='4-3')

add(38,'页眉','running-header','running-header','新HSK教程1','Giáo trình New HSK 1')
add(38,'课文2/角色译文','text-2-line-01','dialogue-translation','王一雪：我有两个哥哥，你呢？','Vương Nhất Tuyết: Chị có hai anh trai. Em thì sao?',speakerZh='王一雪',speakerVi='Vương Nhất Tuyết',lineOrdinal=1)
add(38,'课文2/角色译文','text-2-line-02','dialogue-translation','杨同乐：我没有哥哥。','Dương Đồng Lạc: Em không có anh trai.',speakerZh='杨同乐',speakerVi='Dương Đồng Lạc',lineOrdinal=2)
add(38,'课文2/角色译文','text-2-line-03','dialogue-translation','王一雪：你家有几口人？','Vương Nhất Tuyết: Nhà em có mấy người?',speakerZh='王一雪',speakerVi='Vương Nhất Tuyết',lineOrdinal=3)
add(38,'课文2/角色译文','text-2-line-04','dialogue-translation','杨同乐：我家有四口人，爸爸、妈妈、妹妹和我。',[
 'Dương Đồng Lạc: Nhà em có bốn người: bố, mẹ,','em gái và em.'],speakerZh='杨同乐',speakerVi='Dương Đồng Lạc',lineOrdinal=4)
add(38,'生词','vocab-heading','section-heading','生词','Từ mới',printedAudioTrack='4-4')
word(38,4,'哥哥','gēge','dt.','anh trai')
word(38,5,'呢','ne','trợ.','thì sao (dùng ở cuối câu hỏi)')
word(38,6,'没有','méiyǒu','đgt.','không có')
word(38,7,'家','jiā','dt.','gia đình, nhà')
word(38,8,'几','jǐ','đt.','mấy')
word(38,9,'口','kǒu','lượng.','chỉ người trong gia đình')
word(38,10,'爸爸','bàba','dt.','bố, ba')
word(38,11,'妈妈','māma','dt.','mẹ')
word(38,12,'妹妹','mèimei','dt.','em gái')
word(38,13,'和','hé','liên.','và')
add(38,'课文2','text-2-role-read','instruction','分角色朗读对话。','Phân vai đọc to đoạn hội thoại.')
add(38,'课文2','text-2-pair-work','instruction','两人一组，根据实际情况对话。',[
 'Hai người một nhóm, tiến hành hội thoại theo tình huống','thực tế.'])

add(39,'页眉','running-header','running-header','我有两个孩子 | 第4课','Bài 4')
add(39,'小语讲堂','grammar-heading','section-heading','小语讲堂','Lớp học của Tiểu Ngữ')
add(39,'小语讲堂/3','grammar-3-title','grammar-title','语气助词“呢”（1）','Trợ từ ngữ khí “呢” (1)',grammarOrdinal=3)
add(39,'小语讲堂/3','grammar-3-body','grammar-explanation','本课“呢”在句末，表示疑问，询问上文提到的情况。基本结构：A……，B呢？',[
 'Từ “呢” trong bài này được dùng ở cuối câu để biểu thị nghi vấn, dùng để hỏi về tình huống','đã được đề cập trước đó. Cấu trúc cơ bản: A …… , B 呢?'],grammarOrdinal=3)
add(39,'小语讲堂/3','grammar-3-read','instruction','大声朗读。','Đọc to các câu sau.',grammarOrdinal=3)
add(39,'小语讲堂/4','grammar-4-title','grammar-title','名量词和名量结构','Danh lượng từ và cấu trúc danh lượng',grammarOrdinal=4)
add(39,'小语讲堂/4','grammar-4-body','grammar-explanation','数词后一般要带量词；名量词“口、个”和名量结构“四口人、两个哥哥”。',[
 'Khi diễn đạt số lượng, trong tiếng Trung Quốc sau số từ thường phải có lượng từ.',
 'Trong bài này, chúng ta học các danh lượng từ dùng để biểu thị số lượng người hoặc vật, như',
 '“口”, “个” và cấu trúc [số từ + lượng từ + (danh từ)], chẳng hạn như “四口人” (bốn nhân khẩu)',
 'và “两个哥哥” (hai người anh trai).'],grammarOrdinal=4)
add(39,'小语讲堂/4','grammar-4-read','instruction','大声朗读。','Đọc to các cụm từ sau.',grammarOrdinal=4)
add(39,'小语讲堂/4','grammar-4-complete','instruction','完成对话。','Hoàn thành hội thoại.',grammarOrdinal=4)

add(40,'页眉','running-header','running-header','新HSK教程1','Giáo trình New HSK 1')
add(40,'课文3','text-3-heading','section-heading','课文3','Bài khoá 3')
add(40,'课文3','text-3-setting','setting','在街上，王一雪带着儿子偶遇杨同乐。',[
 'Khi Vương Nhất Tuyết đang đi cùng con trai trên phố','thì tình cờ gặp Dương Đồng Lạc.'])
add(40,'课文3','text-3-listen','instruction','听两遍对话，选择正确答案。','Nghe hội thoại hai lượt và chọn đáp án đúng.',printedAudioTrack='4-5')
add(40,'课文3/小语助力','hint-heading','hint-label','小语助力',['Tiểu Ngữ','giúp sức'])
add(40,'课文3/小语助力','hint-under-ten','hint-explanation','十岁以下时的问法。',[
 'Đây là cách để hỏi tuổi','của trẻ em dưới mười tuổi.'])
add(40,'课文3/小语助力','hint-over-ten','hint-explanation','十岁以上一般不问“几岁”，要问“多大”。',[
 'Đối với','những người trên mười tuổi, chúng ta thường hỏi “多大”,','không hỏi “几岁”.'])
add(40,'课文3/角色译文','text-3-line-01','dialogue-translation','杨同乐：这是您儿子吗？','Dương Đồng Lạc: Đây là con trai chị phải không?',speakerZh='杨同乐',speakerVi='Dương Đồng Lạc',lineOrdinal=1)
add(40,'课文3/角色译文','text-3-line-02','dialogue-translation','王一雪：是的。我有两个孩子，一个儿子，一个女儿。',[
 'Vương Nhất Tuyết: Đúng vậy. Chị có hai con,','một con trai và một con gái.'],speakerZh='王一雪',speakerVi='Vương Nhất Tuyết',lineOrdinal=2)
add(40,'课文3/角色译文','text-3-line-03','dialogue-translation','杨同乐：您儿子几岁？','Dương Đồng Lạc: Con trai chị mấy tuổi rồi?',speakerZh='杨同乐',speakerVi='Dương Đồng Lạc',lineOrdinal=3)
add(40,'课文3/角色译文','text-3-line-04','dialogue-translation','王一雪：他今年五岁。','Vương Nhất Tuyết: Cháu năm nay năm tuổi.',speakerZh='王一雪',speakerVi='Vương Nhất Tuyết',lineOrdinal=4)
add(40,'课文3/角色译文','text-3-line-05','dialogue-translation','杨同乐：您女儿多大？','Dương Đồng Lạc: Con gái chị bao nhiêu tuổi?',speakerZh='杨同乐',speakerVi='Dương Đồng Lạc',lineOrdinal=5)
add(40,'课文3/角色译文','text-3-line-06','dialogue-translation','王一雪：她今年十二。','Vương Nhất Tuyết: Cháu năm nay mười hai tuổi.',speakerZh='王一雪',speakerVi='Vương Nhất Tuyết',lineOrdinal=6)

add(41,'页眉','running-header','running-header','我有两个孩子 | 第4课','Bài 4')
add(41,'课文3','text-3-role-read','instruction','分角色朗读对话。',[
 'Phân vai đọc to đoạn','hội thoại.'])
add(41,'课文3','text-3-questions-instruction','instruction','根据课文内容回答问题。',[
 'Trả lời câu hỏi','theo nội dung bài khoá.'])
add(41,'课文3/问题','text-3-question-01','question-translation','王一雪有几个儿子？几个女儿？',[
 'Vương Nhất Tuyết có mấy','con trai? Mấy con gái?'],questionOrdinal=1)
add(41,'课文3/问题','text-3-question-02','question-translation','王一雪儿子今年几岁？',[
 'Con trai của Vương Nhất Tuyết','năm nay lên mấy?'],questionOrdinal=2)
add(41,'生词','vocab-heading','section-heading','生词','Từ mới',printedAudioTrack='4-6')
word(41,14,'儿子','érzi','dt.','con trai')
word(41,15,'孩子','háizi','dt.',['con, trẻ con,','trẻ em'])
word(41,16,'女儿','nǚ’ér','dt.','con gái')
word(41,17,'岁','suì','lượng.','tuổi')
word(41,18,'他','tā','đt.',['anh ấy, cậu','ấy, ông ấy...'])
word(41,19,'今年','jīnnián','dt.','năm nay')
word(41,20,'多','duō','đt.',['bao nhiêu','(phó từ chỉ','mức độ)'])
word(41,21,'大','dà','tt.',['lớn','(chỉ tuổi tác)'])
add(41,'综合练习','exercises-heading','section-heading','综合练习','Bài tập tổng hợp')
add(41,'综合练习','cloze-instruction','instruction','选词填空。','Chọn từ thích hợp điền vào chỗ trống.')
add(41,'综合练习','picture-description-instruction','instruction','用本课新学的词语和语言点描述图片。',[
 'Sử dụng từ ngữ và điểm ngôn ngữ đã học trong bài để','miêu tả các hình ảnh sau.'])

add(42,'页眉','running-header','running-header','新HSK教程1','Giáo trình New HSK 1')
add(42,'课堂活动','class-activity-heading','section-heading','课堂活动','Hoạt động trên lớp')
add(42,'课堂活动','pair-heading','activity-heading','双人活动','Hoạt động theo nhóm hai người')
add(42,'课堂活动','pair-instruction','instruction','两人一组，互相询问个人和家庭情况（年龄、家庭人口等），可虚拟。',[
 'Hai người một nhóm, hỏi nhau về thông tin cá nhân và tình hình gia đình (tuổi tác,',
 'số người trong gia đình...), có thể hư cấu.'])
add(42,'课堂活动/小语的例子','example-heading','example-label','小语的例子','Ví dụ của Tiểu Ngữ')
add(42,'小语的彩蛋','bonus-heading','section-heading','小语的彩蛋','Món quà của Tiểu Ngữ',printedVideoResource='4-1')
add(42,'小语的彩蛋/视频画面','age-caption','image-caption','年龄的问法','Cách hỏi tuổi',printedVideoResource='4-1')

def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
assert sha(PDF)==SHA
assert len(entries)==105
assert len({r['sourceID'] for r in entries})==len(entries)
assert all(r['viText'] and r['chineseAnchor'] and unicodedata.normalize('NFC',r['viText'])==r['viText'] for r in entries)
words=[r for r in entries if r['kind']=='vocabulary-row']
assert [r['printedOrdinal'] for r in words]==list(range(1,22))
assert len([r for r in entries if r['kind']=='dialogue-translation'])==14
page_evidence=[]
for n,p,label in PAGES:
    path=RASTERS/f'hsk1-p{n:03d}.png'
    page_evidence.append(dict(pdfPage=n,printedPage=p,observedFooterLabel=label,
        mappingMethod='actual-footer-visually-read-by-author-on-each-whole-page',
        rasterPath=str(path),rasterSHA256=sha(path),
        vietnameseOccurrenceCount=sum(r['pdfPage']==n for r in entries),
        authorWholePageViewed=True,independentVisualReview=False))
data=dict(schemaVersion=1,status='source-preparation-author-transcription-awaiting-independent-review',
    recordedAtUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    source=dict(file=PDF.name,localPath=str(PDF),bytes=PDF.stat().st_size,pdfSHA256=SHA,
        level=1,lesson=4,sourceRole='uploaded-official-Vietnamese-edition-not-old-Chinese-source',
        exactPDFPages=[n for n,_,_ in PAGES]),
    method=dict(author='qa_hsk1_05_08',decisive='Whole-page visual reading + targeted magnified raster crops',
        OCRUsed=False,websiteVietnameseReadOrCompared=False,
        textLayerUsed=False,punctuationPolicy='Visual Unicode transcription; printed line wraps joined with one space; ordinary layout spacing normalized. Raster has no recoverable original Unicode encoding.',
        preserve=['Vietnamese accents','printed speaker names/pronouns','printed POS raw labels','gloss parentheses and inline Chinese examples','repeat occurrences as distinct IDs'],
        excludedFromVietnameseEntries=['Chinese-only sentences/questions/options/example bubbles','Pinyin-only labels','numeric-only cells/page numbers/audio resource digits'],
        websiteConformanceComplete=False,activeRevisionAccepted=False,independentSourceAcceptance=False),
    pageEvidence=page_evidence,entries=entries,
    counts=dict(entries=len(entries),vocabularyRows=len(words),dialogueTranslationLines=14,
        byPDFPage=dict(sorted(Counter(r['pdfPage'] for r in entries).items())),
        byKind=dict(sorted(Counter(r['kind'] for r in entries).items()))),
    sourceObservations=[
        dict(id='observation-title',sourceIDs=['hsk1-vi-l04-pdf034-title'],note='Printed title is Chị có hai con; preserved as printed, no website comparison or correction decision.'),
        dict(id='observation-pos',sourceIDs=['hsk1-vi-l04-pdf035-vocab-002','hsk1-vi-l04-pdf038-vocab-008','hsk1-vi-l04-pdf041-vocab-018','hsk1-vi-l04-pdf041-vocab-020'],note='Thin crossbar in đt. visually inspected at 2x crop; retain literal abbreviation, including 多 row with parenthetical phó từ chỉ mức độ; no inferred category or erratum judgement.'),
        dict(id='observation-numeric-table',sourceIDs=['hsk1-vi-l04-pdf037-grammar-2-3-example-book'],note='Only 两本书 table cell prints Vietnamese gloss (hai quyển sách); no added translations for other Chinese-only numerical/example cells.'),
        dict(id='observation-text2-span',sourceIDs=['hsk1-vi-l04-pdf037-text-2-setting','hsk1-vi-l04-pdf038-text-2-line-01'],note='Text2 introduction/listening instruction on PDF37; translated role dialogue and vocab4–13 on PDF38; occurrence pages are not flattened to a single page.'),
    ])
(OUT/'transcription.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
tsv=['sourceID\tpdfPage\tprintedPage\tsection\tkind\tchineseAnchor\tposRawLabel\tviText']
for r in entries:
    values=[r['sourceID'],r['pdfPage'],r['printedPage'],r['section'],r['kind'],r['chineseAnchor'],r.get('posRawLabel',''),r['viText']]
    assert all('\t' not in str(v) and '\n' not in str(v) for v in values)
    tsv.append('\t'.join(map(str,values)))
(OUT/'transcription.tsv').write_text('\n'.join(tsv)+'\n')
(OUT/'page-evidence.json').write_text(json.dumps(page_evidence,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(data['counts'],ensure_ascii=False))
