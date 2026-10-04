"""Manual original-page visual transcription; no OCR or website input.

Literal text below was typed after viewing the original PDF page rasters.
This script only serializes that transcription and verifies its source bytes.
It is not an independent source acceptance or website alignment tool.
"""
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
PDF = Path('/workspace/scratch/28b55072841a/upload/HSK2 ( 3.0).pdf')
PIXELS = Path('/workspace/scratch/28b55072841a/official-vi-hsk2-l03-source-author')
PDF_SHA = '6465777a77f8d9cb0d29b47f00b36a8e9e9ff627509f0f02a9909c7aaeaa231b'
STATE = 'author-visual-transcription-pending-independent-original-page-review'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(PDF) == PDF_SHA

# These pairs were each read from the actual footer, not inferred as an offset.
PAGE_MAP = {19:33,20:34,21:35,22:36,23:37,24:38,25:39,26:40,27:41,28:42}
records = []
def add(page, section, zh, vi, **extra):
    record = {'sourceId':f'hsk2-official-vi:l03:p{page:03}:{section}',
              'pdfPage':PAGE_MAP[page], 'printedPage':page, 'section':section,
              'zhAnchor':zh, 'viPrinted':vi, 'reviewStatus':STATE}
    if page == 28:
        record['sourceScope'] = 'supplemental-connected-learning-summary-continuation'
    record.update(extra)
    records.append(record)
    return record

def number(page, opening=False):
    return add(page,'lesson-number-header' if opening else 'running-lesson-header','3','Bài 3',
               zhAnchorKind='printed-numeric-lesson-marker',layoutParts=['Bài','3'],
               layoutNote='Printed Bài and numeral 3 are adjacent layout parts. No Chinese 第3课 phrase is printed in this marker.',
               runningChineseContext=None if opening else '我想去西安旅游')
def series(page):
    add(page,'running-series-header','新HSK教程2','Giáo trình New HSK 2')
def words(page, rows):
    add(page,'words-header','生词','Từ mới')
    for ordinal, zh, py, pos, vi in rows:
        add(page,f'word{ordinal:02}',zh,vi,printedNumber=ordinal,
            printedPinyin=py,printedPOSRaw=pos,posPrinted=pos is not None,
            sourceWordKind='ordinary-numbered-word')
def dialogue(page, number, rows):
    for ordinal, (role, zh, vi) in enumerate(rows,1):
        add(page,f'text{number}-line{ordinal:02}',zh,vi,
            printedRoleZh=role,printedRoleVi={'刘明':'Lưu Minh','王一雪':'Vương Nhất Tuyết'}[role],
            printedDialogueOrdinal=ordinal,printedTextNumber=number)
    add(page,f'text{number}-role-read-instruction','分角色朗读对话，读后回答问题。',
        'Phân vai đọc to đoạn hội thoại, sau đó trả lời câu hỏi.')
def context(page, number, zh, vi, listening='dialogue-choice'):
    add(page,f'text{number}-header',f'课文{number}',f'Bài khoá {number}')
    add(page,f'text{number}-context',zh,vi)
    if listening == 'dialogue-choice':
        add(page,f'text{number}-listen-instruction','听两遍对话，选择正确答案。',
            'Nghe hội thoại hai lượt và chọn đáp án đúng.')
    else:
        add(page,f'text{number}-listen-instruction','听两遍课文，判断正误。',
            'Nghe bài khoá hai lượt và phán đoán đúng sai.')
def grammar(page, number, zh, vi):
    add(page,f'grammar{number}-section-header','小语讲堂','Lớp học của Tiểu Ngữ')
    add(page,f'grammar{number}-title',zh,vi,printedGrammarNumber=number)
def complete(page, number):
    add(page,f'grammar{number}-complete-instruction','完成对话。','Hoàn thành hội thoại.')

number(19, True)
add(19,'lesson-title','我想去西安旅游','Em muốn đi Tây An du lịch')
add(19,'goals-header','目标','Mục tiêu')
add(19,'goal1','能听懂并询问事情的原因。','Có thể nghe hiểu và hỏi được nguyên nhân của sự việc.')
add(19,'goal2','掌握结果补语的用法，能描述动作的结果。','Nắm vững cách dùng của bổ ngữ kết quả để miêu tả kết quả của hành động.')
add(19,'goal3','掌握动词重叠的用法，能用来表达动作时间短、数量少、尝试等意义。','Nắm vững cách dùng của động từ lặp lại để diễn đạt thời gian ngắn của hành động, số lượng ít hoặc thử làm gì.')
add(19,'goal4','了解西安的旅游景点。','Hiểu về các điểm tham quan du lịch ở Tây An.')
add(19,'warmup-header','热身','Khởi động')
add(19,'warmup1-instruction','给下面的词语选择对应的图片。','Lựa chọn hình ảnh tương ứng với các từ ngữ sau.')
add(19,'warmup2-instruction','给下面的动词加上合适的名词。','Hãy thêm danh từ thích hợp cho các động từ sau.')

series(20)
context(20,1,'在家门口，刘明开门进到家里。','Tại cửa ra vào, Lưu Minh mở cửa đi vào trong nhà.')
words(20,[(1,'回来','huílái','đgt.','quay về, quay lại'),(2,'这么','zhème','đt.','như vậy'),(3,'完','wán','đgt.','xong')])
dialogue(20,1,[
    ('王一雪','今天回来这么晚啊！','Hôm nay anh về muộn thế!'),
    ('刘明','工作太多了，下班的时候没做完。','Anh có nhiều việc quá, đến giờ tan làm mà vẫn chưa xong.'),
    ('王一雪','菜都做好了，过来吃饭吧。','Cơm nấu xong rồi. Anh ra ăn cơm nhé.'),
    ('刘明','我想休息一下，喝杯水。','Anh muốn nghỉ ngơi một lát, uống cốc nước đã.'),
    ('王一雪','好的。','Vâng ạ.'),
])

number(21)
grammar(21,1,'结果补语','Bổ ngữ kết quả')
add(21,'grammar1-rule1','一些动词或者形容词用在动词后面，表示动作的结果。例如：',
    'Có một số động từ hoặc tính từ có thể đặt sau động từ để biểu thị kết quả của hành động. Ví dụ:',
    printedExampleMarker='Ví dụ:',exampleMarkerOnSeparateLine=True)
add(21,'grammar1-rule2','否定形式是在动词前面加“没（有）”，同时要去掉“了”。例如：',
    'Hình thức phủ định là thêm “没（有）” vào trước động từ và bỏ “了” ở cuối câu. Ví dụ:',
    printedExampleMarker='Ví dụ:')
add(21,'grammar1-rule3','疑问形式有三种，分别是：（1）在句尾加“了吗”；（2）在句尾加“（了）没有”；（3）动词+没+动词+结果补语。例如：',
    'Hình thức nghi vấn có 3 loại: (1) thêm “了吗” vào cuối câu; (2) thêm “（了）没有” vào cuối câu; (3) động từ + 没 + động từ + bổ ngữ kết quả. Ví dụ:',
    printedExampleMarker='Ví dụ:')
complete(21,1)
context(21,2,'在客厅，刘明和王一雪在聊天儿。','Lưu Minh và Vương Nhất Tuyết đang trò chuyện trong phòng khách.')

series(22)
words(22,[(4,'一起','yìqǐ','phó.','cùng, cùng nhau'),(5,'出去','chūqù','đgt.','đi ra, đi khỏi, đi')])
dialogue(22,2,[
    ('刘明','我们找个时间去旅游，怎么样？','Chúng ta sắp xếp thời gian đi du lịch, em thấy thế nào?'),
    ('王一雪','好啊，我也很想一起出去玩。','Nhất trí! Em cũng rất muốn đi chơi cùng anh.'),
    ('刘明','你想去哪儿？','Em muốn đi đâu?'),
    ('王一雪','我还没想好呢。','Em vẫn chưa nghĩ ra.'),
    ('刘明','那你再想一想，你想好了，我来买票。','Vậy em cứ nghĩ thêm nhé. Khi nào em nghĩ xong, anh sẽ mua vé.'),
])
grammar(22,2,'动词重叠（1）','Động từ lặp lại (1)')

number(23)
add(23,'grammar2-rule1','动作性比较强、能重复或持续的动词重叠使用，表示时间短、数量少、尝试等意思，语气比较轻松、随意，多用于口语。',
    'Những động từ có tính hành động mạnh, có thể lặp đi lặp lại hoặc duy trì thì đều có thể lặp lại. Động từ lặp lại thường dùng trong văn nói, mang ngữ khí nhẹ nhàng, tự nhiên, biểu thị thời gian ngắn, số lượng ít hoặc mang sắc thái thử nghiệm...',
    zhAnchorPrintedPage=22,zhAnchorPDFPage=36,printedPages=[22,23],pdfPages=[36,37],
    sourceSpanReason='Chinese explanation printed at bottom of22; Vietnamese explanation begins at top of23.')
add(23,'grammar2-rule2','单音节动词的重叠形式是“A（一）A”，双音节动词的重叠形式是“ABAB”，离合词的重叠形式是“AAB”。例如：',
    'Hình thức lặp lại của động từ đơn âm tiết là “A（一）A”; hình thức lặp lại của động từ song âm tiết là “ABAB”; hình thức lặp lại của từ li hợp là “AAB”. Ví dụ:',
    zhAnchorPrintedPage=22,zhAnchorPDFPage=36,printedPages=[22,23],pdfPages=[36,37],printedExampleMarker='Ví dụ:',
    sourceSpanReason='Chinese explanation printed at bottom of22; Vietnamese explanation printed at top of23.')
complete(23,2)
context(23,3,'在客厅，刘明和王一雪在聊天儿。','Lưu Minh và Vương Nhất Tuyết đang trò chuyện trong phòng khách.')

series(24)
words(24,[(6,'洗','xǐ','đgt.','rửa'),(7,'自己','zìjǐ','đt.','tự, tự mình, bản thân'),
          (8,'拿','ná','đgt.','cầm, nắm'),(9,'手','shǒu','dt.','tay'),
          (10,'为什么','wèi shénme',None,'tại sao, vì sao'),(11,'不错','búcuò','tt.','không tồi, hay')])
add(24,'helper-header','小语助力','Tiểu Ngữ giúp sức')
add(24,'helper-duile','“对了”表示突然想起另外一件事或提出另一个话题。',
    '“对了” được dùng khi người nói chợt nhớ ra điều gì đó hoặc muốn chuyển sang chủ đề khác.')
dialogue(24,3,[
    ('刘明','吃个苹果吧，我都洗好了。','Ăn quả táo đi, anh đã rửa sạch rồi.'),
    ('王一雪','好的。','Vâng ạ.'),
    ('刘明','就在桌子上，你自己拿。','Táo để trên bàn, em tự đi lấy nhé.'),
    ('王一雪','我去洗洗手。对了，我们去西安旅游，怎么样？','Em đi rửa tay đã. À đúng rồi, mình đi Tây An du lịch, anh thấy thế nào?'),
    ('刘明','为什么想去西安？','Vì sao em muốn đi Tây An?'),
    ('王一雪','我看了看网上的介绍，这个时候去西安很不错！','Em có xem qua giới thiệu ở trên mạng. Thời điểm này đi Tây An rất tuyệt!'),
])
grammar(24,3,'动词重叠（2）','Động từ lặp lại (2)')
g3first='Khi diễn đạt tình huống đã xảy ra, hình thức lặp lại của động từ đơn âm tiết là “A了A”; động từ song âm tiết nói chung không dùng hình thức lặp lại, mà chỉ dùng cấu trúc “AB了一下”;'
g3last='còn hình thức lặp lại của từ li hợp là “A了AB”. Ví dụ:'
add(24,'grammar3-rule','表达已经发生的情况时，单音节动词的重叠形式是“A了A”；双音节动词一般不能用重叠形式，只能用“AB了一下”；离合词的重叠形式是“A了AB”。例如：',
    g3first+' '+g3last,printedPages=[24,25],pdfPages=[38,39],
    viPrintedFragments=[{'printedPage':24,'pdfPage':38,'viPrinted':g3first},{'printedPage':25,'pdfPage':39,'viPrinted':g3last}],
    printedExampleMarker='Ví dụ:',sourceSpanReason='One printed Vietnamese explanation continues over the page turn24→25; joined once without truncating the final clause.')

number(25)
complete(25,3)
context(25,4,'在家里，王一雪给好朋友打电话。','Vương Nhất Tuyết gọi điện cho bạn thân ở trong nhà.',listening='text-tf')
words(25,[(12,'送','sòng','đgt.','đưa, tiễn, tặng'),(13,'回去','huíqù','đgt.','quay về, về'),
          (14,'每','měi','đt.','mỗi, hàng (ngày, năm...)'),(15,'累','lèi','tt.','mệt')])
add(25,'text4-whole-paragraph',
    '早上，刘明开车送孩子去学校，送完孩子回家后，医院就来电话了，让他回去上班。我觉得他这个月每天都很累，真想让他休息休息。',
    'Buổi sáng, Lưu Minh lái xe đưa con đi đến trường, sau khi đưa con xong quay về nhà thì bệnh viện gọi điện đến, yêu cầu anh ấy quay về bệnh viện làm việc. Tôi cảm thấy tháng này ngày nào Lưu Minh cũng đều rất bận, thật muốn anh ấy được nghỉ ngơi một chút.',
    printedSpeaker=None,noWebsiteLinePartitionInferred=True,
    printedSemanticDifferencePreserved='Printed Vietnamese uses rất bận for Chinese 很累; source transcription preserves actual book text without editorial harmonization.')
add(25,'text4-read-instruction','朗读课文，读后选择正确答案。','Đọc to bài khoá, sau đó lựa chọn đáp án đúng.')

series(26)
add(26,'integrated-header','综合练习','Bài tập tổng hợp')
add(26,'integrated1-instruction','选词填空。','Chọn từ thích hợp điền vào chỗ trống.')
add(26,'integrated2-instruction','用本课新学的词语和语言点描述图片。','Sử dụng từ ngữ và điểm ngôn ngữ đã học trong bài để miêu tả các hình ảnh sau.')

number(27)
add(27,'classroom-header','课堂活动','Hoạt động trên lớp')
add(27,'pair-header','双人活动','Hoạt động theo nhóm hai người')
add(27,'pair-instruction','两人一组，互相询问：想不想去旅游？想好去哪儿旅游了吗？为什么选择该旅游地？等等。尽可能使用本课所学生词和语法。',
    'Hai người một nhóm, hỏi nhau về các thông tin sau: Có muốn đi du lịch hay không? Muốn đi đâu du lịch? Tại sao lựa chọn địa điểm du lịch đó? Cố gắng sử dụng tối đa từ ngữ và điểm ngôn ngữ đã học trong bài.')
add(27,'pair-example-header','小语的例子','Ví dụ của Tiểu Ngữ')
add(27,'bonus-header','小语的彩蛋','Món quà của Tiểu Ngữ')
add(27,'bonus-video-caption','西安的旅游景点','Các điểm tham quan du lịch ở Tây An')
add(27,'learning-summary-header','学习小结','Tổng kết học tập')
add(27,'learning-summary-scope','1~3课我的学习情况：','Tình hình học tập từ bài 1 đến bài 3 của tôi:')
add(27,'learning-summary-words-header','词语学习','Việc học từ ngữ')
add(27,'learning-summary-words-known','我已经记住并会使用的词语','Những từ ngữ tôi đã nhớ và biết sử dụng')
add(27,'learning-summary-words-not-known','我还没记住的词语','Những từ ngữ tôi chưa nhớ')

# The actual next original page remains the connected L1–3 learning summary.
series(28)
add(28,'learning-summary-can-understand-use','我理解并会用','Tôi đã hiểu và đã biết dùng')
add(28,'learning-summary-understand-column','理解','Đã hiểu')
add(28,'learning-summary-use-column','会用','Đã biết dùng')
summary_rows=[
    ('语气助词“吧”（2），例如：你是老师吧？','Trợ từ ngữ khí “吧” (2), ví dụ: 你是老师吧？'),
    ('“是……的”句，例如：我是昨天到的。','Câu “是……的”, ví dụ: 我是昨天到的。'),
    ('兼语句，例如：我想请你帮个忙。','Câu kiêm ngữ, ví dụ: 我想请你帮个忙。'),
    ('固定格式“还是……吧”，例如：我们还是打车去吧。','Cấu trúc cố định “还是……吧”, ví dụ: 我们还是打车去吧。'),
    ('用“多”表达概数，例如：我有二十多本中文书。','Sử dụng “多” để diễn đạt số ước lượng, ví dụ: 我有二十多本中文书。'),
    ('动词或动词性短语、主谓短语作定语，例如：你认识那个唱歌的人吗？','Động từ, cụm động từ, cụm chủ vị làm định ngữ, ví dụ: 你认识那个唱歌的人吗？'),
    ('结果补语，例如：我吃完饭了。','Bổ ngữ kết quả, ví dụ: 我吃完饭了。'),
    ('动词重叠（1），例如：我想休息休息。','Động từ lặp lại (1), ví dụ: 我想休息休息。'),
    ('动词重叠（2），例如：我看了看这本书。','Động từ lặp lại (2), ví dụ: 我看了看这本书。'),
]
for n,(zh,vi) in enumerate(summary_rows,1):
    add(28,f'learning-summary-grammar-row{n:02}',zh,vi,
        printedTableRowOrdinal=n,printedChineseExampleWithinVietnameseCell=True,
        noVietnameseExampleTranslationInvented=True)
add(28,'learning-summary-needs-effort','我需要努力的','Những điểm tôi cần cố gắng')

assert len(records)==115, len(records)
assert len({r['sourceId'] for r in records})==len(records)
assert sum('printedNumber' in r for r in records)==15
assert sum('printedRoleVi' in r for r in records)==16
assert [r['printedNumber'] for r in records if 'printedNumber' in r]==list(range(1,16))
assert [r['zhAnchor'] for r in records if r.get('posPrinted') is False]==['为什么']
manifest=json.loads((PIXELS/'render-manifest.json').read_text())
import fitz
doc=fitz.open(PDF)
p42=doc[41]
manifest.append({'pdfPage':42,'file':str(PIXELS/'pdf042-boundary.png'),
                 'sha256':sha(PIXELS/'pdf042-boundary.png'),'cropBox':list(p42.cropbox),
                 'pageRect':list(p42.rect),'rotation':p42.rotation,'renderScale':2.5})
for row in manifest:
    assert sha(Path(row['file']))==row['sha256']
    row['printedPage'] = {v:k for k,v in PAGE_MAP.items()}[row['pdfPage']]
    row['footerActuallyVisuallyRead']=True
    row['wholePageActuallyVisuallyViewed']=True
    if row['pdfPage']==42:
        row['scopeNote']='Actual connected learning-summary continuation outside originally anticipated PDF33–41.'
(HERE/'source-page-evidence.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
detail=[]
for file in ['detail-crops.json','new-detail-crops.json']:
    detail.extend(json.loads((PIXELS/file).read_text()))
# This new crop actually covers the word table, rather than the earlier exploratory crop.
detail.append({'pdfPage':38,'path':str(PIXELS/'pdf038-vocab-actual-original-6x.png'),
               'clipDisplayCoordinates':[265,83,524,231],'scale':6,
               'sha256':sha(PIXELS/'pdf038-vocab-actual-original-6x.png')})
for row in detail:
    path=Path(row.get('path') or row.get('file'))
    assert sha(path)==row['sha256']
    row['actuallyViewed']=True
    if path.name=='pdf038-vocab-original-6x.png':
        row['use']='Exploratory crop covers dialogue, not word table. No POS conclusion relies on this crop.'
    else:
        row['use']='Author precision visual source check; not independent acceptance.'
(HERE/'source-detail-crop-evidence.json').write_text(json.dumps(detail,ensure_ascii=False,indent=2)+'\n')
result={'schemaVersion':1,'status':'author-source-transcription-awaiting-independent-original-page-review',
        'author':'qa_hsk1_05_08','level':2,'lesson':3,'officialPDFSHA256':PDF_SHA,
        'readProof':{'actualOriginalPDFFootersRead':list(PAGE_MAP),'pdfPagesRead':list(PAGE_MAP.values()),
                     'originalCropBoxAndRotationPreserved':True,
                     'allTenOriginalPageImagesActuallyViewed':True,
                     'sourcePageEvidence':'source-page-evidence.json',
                     'sourceDetailCropEvidence':'source-detail-crop-evidence.json',
                     'OCRUsed':False,'PDFTextExtractionUsed':False},
        'scope':{'initialAnticipatedPrintedPages':[19,27],'actualPrintedPages':[19,28],
                 'actualPDFPages':[33,42],'boundaryDiscovery':'Printed028/PDF42 is the connected L1–3 learning-summary continuation. It is included explicitly to avoid omitting nine printed grammar-table rows and summary labels.',
                 'primaryLessonPageCount':9,'supplementalConnectedSummaryPageCount':1},
        'counts':{'sourceItems':len(records),'ordinaryNumberedWords':15,'properNounWordRows':0,
                  'printedRoleTranslationLines':16,'text4WholeUnlabelledParagraphs':1,
                  'connectedSummaryGrammarRows':9},
        'transcriptionPolicy':{'layoutLineWrapsJoinedWithSpaces':True,
                               'fullwidthChineseParenthesesWithinChineseFormulaRetained':True,
                               'noSemanticVietnameseCorrectionsToPrintedSource':True,
                               'printedDiacriticsAndPunctuationPreserved':True,
                               'dialogueRoleLabelsStoredSeparatelyFromUtterance':True,
                               'singlePrintedParagraphCanSpanPagesWithoutDuplicatingOccurrence':True},
        'boundaries':{'websiteVietnameseRead':False,'websiteComparisonPerformed':False,
                      'websiteVietnameseAlignmentComplete':False,'sourceOnlyChineseExamplesNotInventedAsOfficialVietnamese':True,
                      'printedChineseOnlyExamplesAndOptionsHaveNoInventedOfficialVi':True,
                      'sourceItemCountIsNotWebsiteConsumerCoverage':True,'productionChanged':False,
                      'independentSourceAcceptancePerformed':False},'records':records}
(HERE/'source-transcription.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'sourceItemCount':len(records),'sourceTranscriptionSHA256':sha(HERE/'source-transcription.json'),
                  'pages':len(manifest),'ordinaryWords':15,'roleLines':16},ensure_ascii=False))
