"""Manually typed after actual full-page and precision-crop visual reading."""
from pathlib import Path
from source_writer import Writer
h=Path(__file__).resolve().parent
w=Writer(h,4,'你穿红色的很好看',{29:43,30:44,31:45,32:46,33:47,34:48,35:49,36:50},'/workspace/scratch/28b55072841a/official-vi-hsk2-l04-source-author')
a=w.add;roles={'王一雪':'Vương Nhất Tuyết','刘小雪':'Lưu Tiểu Tuyết'}
w.number(29,True)
a(29,'lesson-title','你穿红色的很好看','Con mặc đồ màu đỏ rất đẹp')
a(29,'goals-header','目标','Mục tiêu')
a(29,'goal1','能听懂并询问过去的经历。','Có thể nghe hiểu và hỏi về những trải nghiệm trong quá khứ.')
a(29,'goal2','能听懂并使用描述的方式指称事物。','Có thể nghe hiểu và sử dụng được cách thức miêu tả đối tượng được đề cập đến.')
a(29,'goal3','掌握因果复句“因为……，所以……”的用法，能表达事情的原因和结果。','Nắm vững cách dùng của câu ghép nhân quả “因为……，所以……”, để diễn đạt nguyên nhân và kết quả của sự việc.')
a(29,'warmup-header','热身','Khởi động')
a(29,'warmup1-instruction','给下面的词语选择对应的图片。','Lựa chọn hình ảnh tương ứng với các từ ngữ sau.')
a(29,'warmup2-instruction','读一读下列词语，圈出自己曾经有过的经历。','Đọc các từ ngữ sau, khoanh vào những điều bản thân đã trải nghiệm.')
a(29,'warmup2-table-column0','动词','Động từ',printedTableColumnOrdinal=0)
for n in range(1,4):a(29,f'warmup2-table-column{n}',f'情况{n}',f'Lựa chọn {n}',printedTableColumnOrdinal=n)
for n,zh,py,vi in [(1,'绿茶','lǜchá','trà xanh'),(2,'红茶','hóngchá','hồng trà'),(3,'花茶','huāchá','trà hoa')]:
    a(29,f'warmup2-tea-cell{n}',zh,vi,printedPinyin=py,printedTableRowZh='喝',printedTableColumnOrdinal=n,printedParentheticalAnnotation=True)

w.series(30)
w.context(30,1,'在商场门口，王一雪和刘小雪在聊天儿。','Vương Nhất Tuyết và Lưu Tiểu Tuyết đang trò chuyện ở trước cửa trung tâm thương mại.')
w.words(30,[(1,'过','guo','trợ.','đã từng'),(2,'商场','shāngchǎng','dt.','trung tâm thương mại, khu mua sắm'),(3,'进去','jìnqù','đgt.','đi vào'),(4,'条','tiáo','lượng.','cái, chiếc (quần, váy...)'),(5,'裤子','kùzi','dt.','quần')])
w.dialogue(30,1,[
 ('刘小雪','妈妈，我们来过这家商场吗？','Mẹ ơi, chúng ta đã từng đến trung tâm mua sắm này chưa ạ?'),
 ('王一雪','没来过，这是新开的。','Chưa con ạ, đây là trung tâm mua sắm mới mở.'),
 ('刘小雪','我们进去看看吧。','Chúng ta đi vào xem một chút nhé.'),
 ('王一雪','好啊！你想买点儿什么？','Được thôi. Con muốn mua chút gì không?'),
 ('刘小雪','我想买条裤子。','Con muốn mua chiếc quần.'),
 ('王一雪','没问题。','Được nhé.'),
],roles)

w.number(31)
w.grammar(31,1,'动态助词“过”','Trợ từ động thái “过”')
a(31,'grammar1-rule1','动态助词“过”用在动词后面，表示动作曾在过去发生，但未持续到现在。基本结构：主语+动词+过+宾语。否定形式是在动词前面加“没（有）”。例如：','Trợ từ động thái “过” đặt sau động từ, biểu thị động tác đã từng xảy ra trong quá khứ, không kéo dài đến hiện tại. Cấu trúc cơ bản: Chủ ngữ + động từ + 过 + tân ngữ. Hình thức phủ định là thêm “没（有）” trước động từ. Ví dụ:',printedExampleMarker='Ví dụ:')
a(31,'grammar1-rule2','疑问形式有三种：（1）在句尾加“吗”；（2）在句尾加“没有”；（3）动词+没+动词+过。例如：','Hình thức nghi vấn có 3 dạng: (1) cuối câu thêm “吗”; (2) cuối câu thêm “没有”; (3) động từ + 没 + động từ + 过. Ví dụ:',printedExampleMarker='Ví dụ:')
w.complete(31,1)
w.context(31,2,'在商场，王一雪和刘小雪在看衣服。','Vương Nhất Tuyết và Lưu Tiểu Tuyết đang xem quần áo ở trong trung tâm thương mại.')

w.series(32)
w.words(32,[(6,'白色','báisè','dt.','màu trắng'),(7,'因为','yīnwèi','liên.','bởi vì, vì'),(8,'试','shì','đgt.','thử'),(9,'红色','hóngsè','dt.','màu đỏ'),(10,'所以','suǒyǐ','liên.','cho nên, nên')])
w.dialogue(32,2,[
 ('刘小雪','妈妈，我想买这条白色的裤子。','Mẹ ơi, con muốn mua chiếc quần màu trắng này.'),
 ('王一雪','你有很多白色的衣服，为什么还买白色的？','Con đã có rất nhiều quần áo màu trắng rồi, sao vẫn còn mua màu trắng nữa?'),
 ('刘小雪','因为我喜欢白色啊！','Vì con thích màu trắng ạ.'),
 ('王一雪','我觉得这条白色的不太好看，你试试那条红色的吧。','Mẹ thấy chiếc quần màu trắng này không được đẹp lắm, con thử chiếc màu đỏ kia xem sao.'),
 ('刘小雪','我没穿过红色的，红色的好看吗？','Con chưa từng mặc quần màu đỏ, quần màu đỏ có đẹp không mẹ?'),
 ('王一雪','就是因为没穿过，所以要试试啊！','Chính là vì chưa từng mặc nên cần phải thử xem.'),
],roles)
w.grammar(32,2,'因果复句“因为……，所以……”','Câu ghép nhân quả “因为……，所以……”')

w.number(33)
rule='Câu ghép chỉ quan hệ nguyên nhân kết quả được tạo bởi cấu trúc “因为……所以……”. “因为” và “所以” có thể sử dụng thành cặp, cũng có thể lược bớt một trong hai từ này. Ví dụ:'
a(33,'grammar2-rule','“因为……所以……”构成因果关系复句。“因为”和“所以”可以成对使用，也可以只用其中的一个。例如：',rule,
 zhAnchorPrintedPage=32,zhAnchorPDFPage=46,printedPages=[32,33],pdfPages=[46,47],viPrintedFragments=[{'pdfPage':47,'printedPage':33,'viPrinted':rule}],printedExampleMarker='Ví dụ:',sourceSpanReason='Chinese rule is on printed32/PDF46; Vietnamese body on printed33/PDF47.')
w.complete(33,2)
w.context(33,3,'在商场，王一雪和刘小雪在看书包。','Vương Nhất Tuyết và Lưu Tiểu Tuyết đang xem cặp sách ở trong trung tâm thương mại.')

w.series(34)
w.words(34,[(11,'书包','shūbāo','dt.','cặp sách'),(12,'过去','guòqù','đgt.','sang, đi sang'),(13,'绿色','lǜsè','dt.','màu xanh lá cây'),(14,'黑色','hēisè','dt.','màu đen'),(15,'更','gèng','phó.','càng, hơn')])
w.dialogue(34,3,[
 ('刘小雪','妈妈，我想买个新书包。','Mẹ ơi, con muốn mua cặp sách mới ạ.'),
 ('王一雪','好，那边卖书包，我们过去看看吧。','Được, đằng kia có bán cặp sách, chúng ta sang đó xem thử nhé.'),
 ('刘小雪','这么多漂亮的书包！','Bao nhiêu là cặp sách đẹp!'),
 ('王一雪','红色的、绿色的、黑色的，你想买哪个？','Cái màu đỏ, cái màu xanh lá cây, cái màu đen, con muốn mua cái nào?'),
 ('刘小雪','绿色的吧。','Cái màu xanh lá cây ạ.'),
 ('王一雪','不错，我也觉得绿色的更好看。','Đẹp đấy, mẹ cũng thấy cặp sách màu xanh lá cây đẹp hơn.'),
],roles,zhpage=33)
w.grammar(34,3,'“的”字短语','Cụm từ chữ “的”')
a(34,'grammar3-rule','结构助词“的”用在名词、代词、动词、形容词等后面，组成“的”字短语，相当于名词性短语。例如：','Trợ từ kết cấu “的” đặt sau danh từ, đại từ, động từ, tính từ... tạo thành cụm từ chữ “的”, cụm từ này sẽ tương đương với một cụm danh từ. Ví dụ:',printedExampleMarker='Ví dụ:')
w.complete(34,3)

w.number(35)
w.context(35,4,'在房间，刘小雪在写日记。','Lưu Tiểu Tuyết đang viết nhật ký ở trong phòng.',text=True)
w.words(35,[(16,'颜色','yánsè','dt.','màu sắc')])
a(35,'text4-whole-paragraph','我和妈妈去了一家商场。因为是新开的，所以这几天东西很便宜。商场里的衣服颜色很多。我没穿过红色的裤子，妈妈让我试了试，我觉得我穿红色的也很好看。','Mình đã đi đến một trung tâm thương mại với mẹ. Vì trung tâm thương mại vừa mới khai trương, nên mấy hôm nay đồ rất rẻ. Quần áo trong trung tâm thương mại có rất nhiều màu sắc. Mình chưa từng mặc quần màu đỏ, mẹ đã bảo mình thử xem, mình nghĩ mình mặc quần màu đỏ cũng rất đẹp.',printedSpeaker=None,noWebsiteLinePartitionInferred=True)
a(35,'text4-read-instruction','朗读课文，读后选择正确答案。','Đọc to bài khoá, sau đó lựa chọn đáp án đúng.')
a(35,'integrated-header','综合练习','Bài tập tổng hợp')
a(35,'integrated1-instruction','选词填空。','Chọn từ thích hợp điền vào chỗ trống.')

w.series(36)
a(36,'integrated2-instruction','用本课新学的词语和语言点描述图片。','Sử dụng từ ngữ và điểm ngôn ngữ đã học trong bài để miêu tả các hình ảnh sau.')
a(36,'classroom-header','课堂活动','Hoạt động trên lớp')
a(36,'roleplay-header','角色扮演','Đóng vai')
a(36,'roleplay-instruction','两人一组，一人扮演售货员，一人扮演顾客。顾客想买裤子，询问裤子的颜色、大小和价钱，等等。尽可能使用本课所学生词和语法。','Hai người một nhóm, một người đóng vai người bán hàng, một người đóng vai khách hàng. Khách hàng muốn mua quần, đến hỏi màu sắc, kích cỡ, giá tiền... Cố gắng sử dụng tối đa từ ngữ và điểm ngôn ngữ đã học trong bài.')
a(36,'roleplay-example-header','小语的例子','Ví dụ của Tiểu Ngữ')
w.freeze('Actual original footers029–036: eight lesson pages. PDF51/footer037 begins Bài5 and is excluded; no connected summary continuation at this boundary.',16,18,
 boundary_pages={51:{'printedPage':37,'wholePageActuallyVisuallyViewed':True,'footerActuallyVisuallyRead':True,'boundary':'Opening Bài5, not part of L4.'}})
