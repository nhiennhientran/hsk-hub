"""Manual original-page visual source transcription; no website inputs."""
from pathlib import Path
from source_writer import Writer
h=Path(__file__).resolve().parent
w=Writer(h,5,'第一次去中国朋友家',{37:51,38:52,39:53,40:54,41:55,42:56,43:57,44:58,45:59},'/workspace/scratch/28b55072841a/official-vi-hsk2-l05-source-author')
a=w.add;roles={'安妮':'Annie','白家月':'Bạch Gia Nguyệt','王一雪':'Vương Nhất Tuyết','白家月、安妮':'Bạch Gia Nguyệt và Annie','刘爷爷':'Ông Lưu'}
w.number(37,True)
a(37,'lesson-title','第一次去中国朋友家','Lần đầu đến thăm nhà bạn người Trung Quốc')
a(37,'goals-header','目标','Mục tiêu')
a(37,'goal1','能听懂并使用趋向补语表达动作的方向。','Có thể nghe hiểu và sử dụng được bổ ngữ xu hướng để diễn đạt phương hướng của động tác.')
a(37,'goal2','掌握固定格式“都……了”，能表达已经或者达到的意思。','Nắm được cấu trúc cố định “都……了” để diễn đạt được ý đã làm gì hoặc đạt được điều gì.')
a(37,'goal3','了解中国人见面时的称呼方式。','Hiểu về cách thức chào hỏi của người Trung Quốc khi gặp mặt.')
a(37,'warmup-header','热身','Khởi động')
for n in (1,2):a(37,f'warmup{n}-instruction','给下面的词语选择对应的图片。','Lựa chọn hình ảnh tương ứng với các từ ngữ sau.')

w.series(38)
w.context(38,1,'在宾馆楼下，安妮给白家月打电话。','Annie gọi điện thoại cho Bạch Gia Nguyệt ở dưới sảnh khách sạn.')
w.words(38,[(1,'快','kuài','phó./tt.','mau, nhanh'),(2,'下来','xiàlái','đgt.','xuống, xuống dưới, xuống đây'),(3,'上来','shànglái','đgt.','lên, lên trên, lên đây'),(4,'上去','shàngqù','đgt.','lên, lên trên, lên đi'),(5,'下面','xiàmian','dt.','dưới, phía dưới'),(6,'等','děng','đgt.','đợi'),(7,'一会儿','yíhuìr','sl.','một lát'),(8,'下去','xiàqù','đgt.','xuống, đi xuống, xuống kia')])
a(38,'word05-subword-mian','面','phía',printedPinyin='miàn',printedPOSRaw='htố.',posPrinted=True,sourceWordKind='printed-unnumbered-subword-under-number5',parentPrintedWordNumber=5)
w.dialogue(38,1,[
 ('安妮','家月，快下来吧，第一次去中国朋友家，别晚了。','Gia Nguyệt, mau xuống nhé, lần đầu đến thăm nhà bạn người Trung Quốc, đừng đến muộn nhé.'),
 ('白家月','还有时间，你上来吧。','Vẫn còn thời gian, bạn lên đây đi.'),
 ('安妮','我不上去了，就在下面等你。','Mình không lên nữa, đợi bạn ở dưới này thôi.'),
 ('白家月','那我一会儿就下去。','Vậy thì một lát nữa mình sẽ xuống.'),
 ('安妮','你快点儿吧。','Bạn nhanh lên một chút nhé.'),
 ('白家月','没事，一雪姐说11点前到就可以。','Không sao đâu, chị Nhất Tuyết bảo chúng ta đến trước 11 giờ là được.'),
],roles,readpage=39)

w.number(39)
w.grammar(39,1,'简单趋向补语（1）','Bổ ngữ xu hướng đơn (1)')
a(39,'grammar1-rule1','简单趋向补语的基本结构是“动词+来/去”。其中，“来”表示动作朝着说话人的方向进行，“去”表示动作背离说话人的方向进行，最常用的动词有“上、下、进、出（chū, ra）、回、过”。例如：','Cấu trúc cơ bản của bổ ngữ xu hướng đơn là “động từ + 来/去”. Trong đó, “来” biểu thị hành động di chuyển hướng về phía người nói, “去” biểu thị hành động di chuyển xa phía người nói, các động từ được dùng phổ biến nhất bao gồm “上”, “下”, “进”, “出”, “回” và “过”. Ví dụ:',printedExampleMarker='Ví dụ:')
a(39,'grammar1-rule1-chu-annotation','出','ra',printedPinyin='chū',printedParentheticalAnnotation=True,annotationContext='Chinese rule includes 出 (chū, ra) before 回、过; this annotation is a separate printed VI occurrence.')
a(39,'grammar1-example3-chulai-annotation','出来','ra đây',printedPinyin='chūlái',printedParentheticalAnnotation=True,zhContext='我在外边呢，你出来（chūlái, ra đây）吧。（说话人在外边，听话人在里边）')
a(39,'grammar1-rule2','另外，“叫、开、买、拿、请、送、要、找、走”等动词也可以用在这个结构中。例如：','Ngoài ra, các động từ như “叫”, “开”, “买”, “拿”, “请”, “送”, “要”, “找” và “走” cũng có thể được dùng trong cấu trúc này. Ví dụ:',printedExampleMarker='Ví dụ:')
a(39,'grammar1-qilai-annotation','起来','đứng lên, đứng dậy, thức dậy',printedPinyin='qǐlái',printedParentheticalAnnotation=True)
a(39,'grammar1-rule3','“起来（qǐlái, đứng lên, đứng dậy, thức dậy）”是一种比较特殊的用法，它表示起床或动作向上的趋向。例如：','“起来” là một cách dùng đặc biệt trong tiếng Trung Quốc, có thể mang nghĩa “thức dậy (ra khỏi giường)” hoặc biểu thị sự chuyển động theo hướng đi lên. Ví dụ:',printedExampleMarker='Ví dụ:')
w.complete(39,1)

w.series(40)
w.context(40,2,'在王一雪家，白家月和安妮来做客。','Bạch Gia Nguyệt và Annie đến chơi nhà Vương Nhất Tuyết.')
w.words(40,[(9,'进来','jìnlái','đgt.','vào, đi vào, vào đây'),(10,'爷爷','yéye','dt.','ông nội'),(11,'奶奶','nǎinai','dt.','bà nội'),(12,'礼物','lǐwù','dt.','quà, quà tặng'),(13,'准备','zhǔnbèi','đgt.','chuẩn bị')])

w.number(41)
w.dialogue(41,2,[
 ('王一雪','家月、安妮，快进来！我给你们介绍一下，这是孩子们的爷爷、奶奶。','Gia Nguyệt, Annie, mau vào đi! Để chị giới thiệu một chút nhé, đây là ông nội và bà nội của các con chị.'),
 ('白家月、安妮','你们好！','Chúng cháu chào hai bác!'),
 ('王一雪','爸，妈，这是白家月，这是安妮。她们都是一飞的学生。','Bố mẹ ơi, đây là Bạch Gia Nguyệt, còn đây là Annie. Các em ấy đều là học sinh của Nhất Phi.'),
 ('刘爷爷','家月、安妮，你们好！','Chào Gia Nguyệt! Chào Annie!'),
 ('白家月','这是送你们的礼物。','Đây là chút quà chúng cháu biếu hai bác ạ.'),
 ('刘爷爷','你们太客气了，还拿这么多礼物来！','Các cháu thật chu đáo, còn mang nhiều quà đến như vậy.'),
 ('白家月','一雪姐，这是给孩子们准备的礼物。','Chị Nhất Tuyết, đây là quà mà chúng em chuẩn bị cho các em nhỏ.'),
 ('王一雪','谢谢！你们别客气，快坐吧！','Cảm ơn rất nhiều! Các em đừng khách sáo, mau ngồi xuống đi!'),
],roles,zhpage=40)
w.grammar(41,2,'简单趋向补语（2）','Bổ ngữ xu hướng đơn (2)')
a(41,'grammar2-rule1','动词既带简单趋向补语，又带宾语时，如果宾语是地点名词，放在“来/去”前面；宾语是事物名词，放在“来/去”前后都可以。例如：','Khi một động từ vừa mang bổ ngữ xu hướng vừa mang tân ngữ, nếu tân ngữ là danh từ chỉ địa điểm thì đặt trước “来/去”; nếu tân ngữ là danh từ chỉ sự vật thì có thể đặt trước hoặc sau “来/去”. Ví dụ:',printedExampleMarker='Ví dụ:')
a(41,'grammar2-rule2','另外，动词“开、买、拿、请、送、要、找、走”等也可以加上“上、下、进、出、回、过”等简单趋向补语。这种情况下，动词一般带宾语，并且放在“上、下、进、出、回、过”后面。例如：','Ngoài ra, các động từ như “开”, “买”, “拿”, “请”, “送”, “要”, “找”, “走”... cũng có thể kết hợp với các bổ ngữ xu hướng như “上”, “下”, “进”, “出”, “回”, “过”. Ví dụ:',printedExampleMarker='Ví dụ:',sourceSemanticOmissionCandidate=True,omittedChineseClause='这种情况下，动词一般带宾语，并且放在“上、下、进、出、回、过”后面。',silentVietnameseCompletionPerformed=False)
w.complete(41,2)

w.series(42)
w.context(42,3,'在王一雪家，白家月和安妮在吃饭。','Bạch Gia Nguyệt và Annie đang ăn cơm ở nhà Vương Nhất Tuyết.')
w.words(42,[(14,'奶茶','nǎichá','dt.','trà sữa'),(15,'跟','gēn','giới./liên.','với, và')])
w.dialogue(42,3,[
 ('王一雪','都12点了，我们吃饭吧。','Đã 12 giờ rồi, chúng ta ăn cơm thôi.'),
 ('白家月','这么多好吃的，您太客气了！','Nhiều món ngon quá ạ. Chị chu đáo quá!'),
 ('王一雪','都是我自己做的，你们多吃点儿。','Tất cả những món này đều là chị nấu cả đấy. Các em ăn nhiều một chút nhé.'),
 ('白家月','奶茶也很好喝，是您自己做的吗？','Trà sữa cũng rất ngon. Chị tự làm à?'),
 ('王一雪','不是，奶茶是爷爷买的。','Không, trà sữa là ông nội bọn trẻ mua.'),
 ('白家月','在哪儿买的？我还没喝过这么好喝的奶茶。','Ông mua ở đâu vậy ạ? Em chưa từng uống trà sữa ngon như thế này ạ.'),
 ('王一雪','就在前边的商场，吃完饭你们可以跟我去看看。','Ở trung tâm thương mại phía trước. Ăn xong các em có thể cùng chị xem qua.'),
],roles,readpage=43)

w.number(43)
w.grammar(43,3,'固定格式“都……了”','Cấu trúc cố định “都……了”')
a(43,'grammar3-rule','固定格式“都……了”表示已经、达到，一般含有强调或者不满的语气。例如：','Cấu trúc cố định “都……了” biểu thị ý đã làm gì hoặc đạt được điều gì, thường mang sắc thái nhấn mạnh hoặc không hài lòng. Ví dụ:',printedExampleMarker='Ví dụ:')
w.complete(43,3)
w.context(43,4,'在宾馆，白家月给李文发信息。','Bạch Gia Nguyệt gửi tin nhắn cho Lý Văn khi đang ở trong khách sạn.',text=True)
w.words(43,[(16,'走','zǒu','đgt.','đi bộ, đi'),(17,'酒店','jiǔdiàn','dt.','khách sạn')])
a(43,'text4-whole-paragraph','回国前一天，我们去一雪姐家了。到她家的时候，饭菜都做好了。刘爷爷还准备了奶茶。因为吃了太多东西，我们吃完饭是走回酒店的。','Một ngày trước khi về nước, chúng tôi đã đi thăm nhà chị Nhất Tuyết. Khi chúng tôi đến nơi, đồ ăn đã sẵn sàng. Bác Lưu còn chuẩn bị cả trà sữa nữa. Vì ăn quá nhiều món, nên sau bữa ăn chúng tôi đã đi bộ về khách sạn.',printedSpeaker=None,noWebsiteLinePartitionInferred=True)

w.series(44)
a(44,'text4-read-instruction','朗读课文，读后选择正确答案。','Đọc to bài khoá, sau đó lựa chọn đáp án đúng.')
a(44,'integrated-header','综合练习','Bài tập tổng hợp')
a(44,'integrated1-instruction','选词填空。','Chọn từ thích hợp điền vào chỗ trống.')
a(44,'integrated2-instruction','用本课新学的词语和语言点描述图片。','Sử dụng từ ngữ và điểm ngôn ngữ đã học trong bài để miêu tả các hình ảnh sau.')

w.number(45)
a(45,'classroom-header','课堂活动','Hoạt động trên lớp')
a(45,'roleplay-header','角色扮演','Đóng vai')
a(45,'roleplay-instruction','四人一组，一人扮演主人，两人扮演家庭成员，一人扮演客人。客人来家里做客，大家互相打招呼，主人给家里人介绍客人，主人招待客人，等等。尽可能使用本课所学生词和语法。','Bốn người một nhóm, một người đóng vai chủ nhà, hai người đóng vai thành viên gia đình, một người đóng vai khách. Khách đến thăm nhà, mọi người chào hỏi lẫn nhau; chủ nhà giới thiệu khách với các thành viên trong gia đình và tiếp đãi khách... Cố gắng sử dụng tối đa từ ngữ và điểm ngôn ngữ đã học trong bài.')
a(45,'roleplay-example-header','小语的例子','Ví dụ của Tiểu Ngữ')
a(45,'bonus-header','小语的彩蛋','Món quà của Tiểu Ngữ')
a(45,'bonus-video-caption','中国人打招呼的方式','Cách thức chào hỏi của người Trung Quốc')
errata=[{'sourceId':'hsk2-official-vi:l05:p041:grammar2-rule2','kind':'printed-Vietnamese-rule-omits-Chinese-object-position-clause','pdfPage':55,'printedPage':41,'originalChineseClause':'这种情况下，动词一般带宾语，并且放在“上、下、进、出、回、过”后面。','observation':'The printed Vietnamese paragraph ends after listing compatible directional complements and Ví dụ:. It does not contain a translation of the displayed object-position clause. Original Vietnamese is preserved exactly; no completion invented. Candidate is pending independent original-page semantic review, not an accepted runtime erratum.'}]
w.freeze('Actual original footers037–045: nine source pages PDF51–59. PDF60/footer046 opens Bài6 and is excluded; no connected summary after L5.',17,21,errata,
 boundary_pages={60:{'printedPage':46,'wholePageActuallyVisuallyViewed':True,'footerActuallyVisuallyRead':True,'boundary':'Opening Bài6, not part of L5.'}})
