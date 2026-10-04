"""Manual original-page visual source transcription; no website inputs or OCR."""
from pathlib import Path
from source_writer import Writer
h=Path(__file__).resolve().parent
w=Writer(h,6,'小雪，生日快乐！',{46:60,47:61,48:62,49:63,50:64,51:65,52:66,53:67,54:68,55:69},'/workspace/scratch/28b55072841a/official-vi-hsk2-l06-source-author')
a=w.add
roles={'刘明':'Lưu Minh','王一雪':'Vương Nhất Tuyết','刘小明':'Lưu Tiểu Minh','刘小雪':'Lưu Tiểu Tuyết'}
w.number(46,True)
a(46,'lesson-title','小雪，生日快乐！','Chúc mừng sinh nhật Tiểu Tuyết!')
a(46,'goals-header','目标','Mục tiêu')
a(46,'goal1','能听懂并使用形容词重叠形式描述性质或状态。','Có thể nghe hiểu và sử dụng được tính từ lặp lại để miêu tả tính chất hoặc trạng thái.')
a(46,'goal2','掌握固定短语“什么的”的用法，能表达列举未尽的意思。','Nắm vững cách dùng của cụm từ cố định “什么的” để diễn đạt ý liệt kê chưa đầy đủ.')
a(46,'goal3','掌握结构助词“地”的用法，能描述动作进行的方式或状态。','Nắm vững cách dùng của trợ từ kết cấu “地” để miêu tả cách thức hoặc trạng thái của hành động.')
a(46,'goal4','了解中国人庆祝生日的习俗。','Hiểu về cách người Trung Quốc tổ chức sinh nhật.')
a(46,'warmup-header','热身','Khởi động')
for n in (1,2): a(46,f'warmup{n}-instruction','给下面的词语选择对应的图片。','Lựa chọn hình ảnh tương ứng với các từ ngữ sau.')

w.number(47)
w.context(47,1,'在家里，刘明和王一雪在聊天儿。','Lưu Minh và Vương Nhất Tuyết đang trò chuyện ở trong nhà.')
w.words(47,[(1,'生日','shēngrì','dt.','sinh nhật'),(2,'忘','wàng','đgt.','quên'),(3,'画','huà','đgt./dt.','vẽ, tranh'),(4,'画笔','huàbǐ','dt.','bút màu, bút vẽ'),(5,'蛋糕','dàngāo','dt.','bánh kem, bánh ga tô')])
w.records[-3].update(printedSingleRowWithMultiplePOS=True,noArtificialSplitIntoTwoPrintedWords=True)
w.dialogue(47,1,[
 ('王一雪','明天就是女儿的生日了。','Ngày mai là sinh nhật con gái rồi.'),
 ('刘明','你不说，我还真忘了。我们给她准备个什么礼物呢？','Nếu em không nhắc thì anh đã quên mất rồi. Chúng ta nên chuẩn bị quà gì cho con nhỉ?'),
 ('王一雪','她喜欢画画，你觉得画笔怎么样？','Con thích vẽ tranh. Anh thấy tặng con bút vẽ màu có được không?'),
 ('刘明','就送画笔吧！','Thế thì tặng bút màu nhé!'),
 ('王一雪','那我明天上午就去买。','Vậy thì sáng mai em sẽ đi mua.'),
 ('刘明','好的！我再给她买个大大的生日蛋糕。','Được! Anh cũng sẽ mua thêm cho con một chiếc bánh sinh nhật to.'),
],roles,readpage=48)

w.series(48)
w.grammar(48,1,'形容词重叠','Tính từ lặp lại')
a(48,'grammar1-rule','单音节形容词“A”的重叠形式为“AA”，双音节形容词“AB”的重叠形式一般为“AABB”。形容词重叠表示程度深或者表达喜爱的情感。例如：','Hình thức lặp lại của tính từ đơn âm tiết “A” là “AA”, hình thức lặp lại của tính từ song âm tiết “AB” là “AABB”. Tính từ lặp lại dùng để biểu thị mức độ cao hoặc tình cảm yêu thích, thân mật. Ví dụ:',printedExampleMarker='Ví dụ:')
w.complete(48,1)
w.context(48,2,'在客厅，刘明一家人在聊天儿。','Cả nhà Lưu Minh đang trò chuyện ở trong phòng khách.')

w.number(49)
w.words(49,[(6,'快乐','kuàilè','tt.','vui vẻ'),(7,'打开','dǎkāi','đgt.','mở ra, bóc ra')])
w.dialogue(49,2,[
 ('刘明','小雪，生日快乐！','Chúc mừng sinh nhật Tiểu Tuyết!'),
 ('刘小明','姐姐，生日快乐！','Chúc mừng sinh nhật chị!'),
 ('王一雪','小雪，这是爸爸、妈妈送你的礼物。','Tiểu Tuyết, đây là quà bố mẹ tặng con.'),
 ('刘明','你打开看看喜欢不喜欢。','Con mở ra xem có thích không.'),
 ('刘小雪','画笔！我很喜欢！','Bút vẽ à, con rất thích ạ!'),
 ('王一雪','那你想画点儿什么？','Thế con muốn vẽ gì đây?'),
 ('刘小雪','画我们的家！有爸爸、妈妈、弟弟，还有黑色的狗、白色的猫什么的。','Vẽ cả gia đình mình. Có bố, mẹ, em trai, có thêm con chó màu đen, con mèo màu trắng...'),
 ('刘小明','那我要画一个穿白色衣服的姐姐。','Vậy em muốn vẽ một chị gái mặc quần áo màu trắng.'),
],roles)

w.series(50)
w.grammar(50,2,'固定短语“什么的”','Cụm từ cố định “什么的”')
a(50,'grammar2-rule','固定短语“什么的”表示“……之类”的意思。基本结构：……什么的。例如：','Cụm từ cố định “什么的” có ý nghĩa là “vân vân (...)”. Cấu trúc cơ bản: ……什么的. Ví dụ:',printedExampleMarker='Ví dụ:',printedFormula='……什么的',layoutNote='The printed Chinese formula remains Chinese inside the Vietnamese rule; the following Latin period is retained.')
w.complete(50,2)
w.context(50,3,'在客厅，刘明一家人在给刘小雪过生日。','Gia đình Lưu Minh đang tổ chức sinh nhật cho Lưu Tiểu Tuyết ở trong phòng khách.')

w.number(51)
a(51,'helper-header','小语助力','Tiểu Ngữ giúp sức')
a(51,'helper-body','中国人过生日的时候一般要吃面条儿，因为面条儿长长的，寓意“长寿”。','Khi tổ chức sinh nhật, người Trung Quốc thường ăn mì sợi, vì mì sợi dài có ngụ ý là “trường thọ”.')
w.words(51,[(8,'长','cháng','tt.','dài'),(9,'鱼','yú','dt.','cá'),(10,'肉','ròu','dt.','thịt'),(11,'过','guò','đgt.','trải qua, đón (sinh nhật)'),(12,'地','de','trợ.','dùng để nối trạng ngữ với động từ')])
w.dialogue(51,3,[
 ('刘明','小雪，看看今天有什么好吃的。','Tiểu Tuyết, con nhìn xem hôm nay có những món gì ngon nào.'),
 ('刘小雪','长长的面条儿，大大的蛋糕。','Mì sợi dài và chiếc bánh ga tô lớn.'),
 ('刘明','你看，还有鱼啊肉啊什么的，都是你喜欢吃的。','Con nhìn xem, còn có cá, thịt và những món khác nữa. Tất cả đều là những món con thích ăn.'),
 ('刘小雪','谢谢爸爸、妈妈！','Cảm ơn bố mẹ ạ!'),
 ('王一雪','快去叫弟弟过来吃饭吧，吃完饭我们还要出去玩呢。','Mau gọi em trai con ra ăn cơm đi. Ăn xong chúng ta sẽ đi chơi nhé.'),
 ('刘小雪','过生日真好啊！','Sinh nhật thật tuyệt!'),
 ('王一雪','是的，过生日就要吃好吃的，还要高高兴兴地玩。','Đúng vậy, sinh nhật thì phải ăn món ngon, còn phải chơi vui nữa.'),
],roles)
w.grammar(51,3,'结构助词“地”','Trợ từ kết cấu “地”')
a(51,'grammar3-rule','结构助词“地”一般用在形容词和动词中间，表示动作行为的状态或方式。例如：','Trợ từ kết cấu “地” thường đặt giữa tính từ và động từ để biểu thị cách thức hoặc trạng thái của hành động. Ví dụ:',printedExampleMarker='Ví dụ:',sectionPrintedPages=[51,52],sectionPDFPages=[65,66],sectionSpanReason='Rule and Vietnamese rule are on printed51; Chinese-only examples continue on printed52. No cross-page Vietnamese body is inferred.')

w.series(52)
w.complete(52,3)
w.context(52,4,'在房间，王一雪在写日记。','Vương Nhất Tuyết đang viết nhật ký ở trong phòng.',text=True)
w.words(52,[(13,'床','chuáng','dt.','giường'),(14,'舒服','shūfu','tt.','thoải mái, dễ chịu')])
a(52,'text4-whole-paragraph','今天是女儿的生日。我们买了蛋糕，做了面条儿，还做了鱼啊肉啊什么的。吃完晚饭，一家人去看了个电影。回家后，孩子们早早地就上床了。明天不上学，他们说要舒舒服服地睡一觉，让我们晚点儿叫他们起床。这是很忙、很累，但很快乐的一天。','Hôm nay là sinh nhật con gái. Chúng tôi đã mua một chiếc bánh ga tô, nấu mì sợi, còn làm các món như cá, thịt... Sau khi ăn tối xong, cả gia đình chúng tôi đã đi xem phim. Sau khi về nhà, bọn trẻ đi ngủ sớm. Ngày mai không phải đi học, chúng nói muốn ngủ một giấc thật thoải mái, bảo chúng tôi gọi chúng dậy muộn hơn một chút. Hôm nay là một ngày rất bận rộn và mệt, nhưng cũng là một ngày rất vui.',printedSpeaker=None,noWebsiteLinePartitionInferred=True)

w.number(53)
a(53,'text4-read-instruction','朗读课文，读后选择正确答案。','Đọc to bài khoá, sau đó lựa chọn đáp án đúng.')
a(53,'integrated-header','综合练习','Bài tập tổng hợp')
a(53,'integrated1-instruction','选词填空。','Chọn từ thích hợp điền vào chỗ trống.')
a(53,'integrated2-instruction','用本课新学的词语和语言点描述图片。','Sử dụng từ ngữ và điểm ngôn ngữ đã học trong bài để miêu tả các hình ảnh sau.')

w.series(54)
a(54,'classroom-header','课堂活动','Hoạt động trên lớp')
a(54,'roleplay-header','角色扮演','Đóng vai')
a(54,'roleplay-instruction','三人一组，一人扮演过生日的人，两人扮演朋友，三人一起庆祝生日。朋友们说生日祝福、送礼物、问生日愿望。过生日的人表达想吃什么、想去哪儿玩，等等。尽可能使用本课所学生词和语法。','Ba người một nhóm, một người đóng vai người được tổ chức sinh nhật, hai người đóng vai bạn bè, ba người cùng nhau chúc mừng sinh nhật. Các bạn nói những lời chúc sinh nhật, tặng quà, hỏi điều ước trong ngày sinh nhật. Người được tổ chức sinh nhật diễn đạt muốn ăn gì, muốn đi đâu chơi... Cố gắng sử dụng tối đa từ ngữ và điểm ngôn ngữ đã học trong bài.')
a(54,'roleplay-example-header','小语的例子','Ví dụ của Tiểu Ngữ')
a(54,'bonus-header','小语的彩蛋','Món quà của Tiểu Ngữ')
a(54,'bonus-video-caption','生日特色食物','Các món ăn đặc sắc trong tiệc sinh nhật')

w.number(55)
summary={'sourceScope':'connected-learning-summary4–6'}
for section,zh,vi in [
 ('learning-summary-header','学习小结','Tổng kết học tập'),
 ('learning-summary-scope','4~6课我的学习情况：','Tình hình học tập từ bài 4 đến bài 6 của tôi:'),
 ('learning-summary-words-header','词语学习','Việc học từ ngữ'),
 ('learning-summary-remembered','我已经记住并会使用的词语','Những từ ngữ tôi đã nhớ và biết sử dụng'),
 ('learning-summary-unremembered','我还没记住的词语','Những từ ngữ tôi chưa nhớ'),
 ('learning-summary-understand-use','我理解并会用','Tôi đã hiểu và đã biết dùng'),
 ('learning-summary-column-understand','理解','Đã hiểu'),
 ('learning-summary-column-use','会用','Đã biết dùng'),
 ('learning-summary-need-effort','我需要努力的','Những điểm tôi cần cố gắng'),
]:a(55,section,zh,vi,**summary)
for i,zh,vi in [
 (1,'动态助词“过”，例如：我去过北京。','Trợ từ động thái “过”, ví dụ: 我去过北京。'),
 (2,'因果复句“因为……，所以……”，例如：因为我生病了，所以没去上班。','Câu ghép nhân quả “因为……，所以……”, ví dụ: 因为我生病了，所以没去上班。'),
 (3,'“的”字短语，例如：红色的好看。','Cụm từ chữ “的”, ví dụ: 红色的好看。'),
 (4,'简单趋向补语（1），例如：你过来吧。','Bổ ngữ xu hướng đơn (1), ví dụ: 你过来吧。'),
 (5,'简单趋向补语（2），例如：王老师进教室去了。','Bổ ngữ xu hướng đơn (2), ví dụ: 王老师进教室去了。'),
 (6,'固定格式“都……了”，例如：都12点了，你快睡觉吧。','Cấu trúc cố định “都……了”, ví dụ: 都12点了，你快睡觉吧。'),
 (7,'形容词重叠，例如：他每天都高高兴兴的。','Tính từ lặp lại, ví dụ: 他每天都高高兴兴的。'),
 (8,'固定短语“什么的”，例如：妈妈做了鱼啊肉啊什么的。','Cụm từ cố định “什么的”, ví dụ: 妈妈做了鱼啊肉啊什么的。'),
 (9,'结构助词“地”，例如：他早早地到了教室。','Trợ từ kết cấu “地”, ví dụ: 他早早地到了教室。'),
]:a(55,f'learning-summary-grammar-row{i:02}',zh,vi,printedRowOrdinal=i,ChineseExamplePrintedInsideVI=True,**summary)

w.freeze('Actual original footers046–055: ten source pages PDF60–69. Printed046–054 are the lesson body; printed055 is the connected learning summary for lessons4–6. PDF70/footer056 opens Bài7 and is excluded.',14,21,
 boundary_pages={70:{'printedPage':56,'wholePageActuallyVisuallyViewed':True,'footerActuallyVisuallyRead':True,'boundary':'Opening Bài7, not part of L6 or its connected learning summary.'}})
