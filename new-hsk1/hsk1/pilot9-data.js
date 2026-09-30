/* Reviewed against 新HSK教程1, printed pp.61-67; objective answers pp.6-7.
   Only Lesson 9 is piloted. New items are adaptations, not official exam items. */
(function(root){
  'use strict';
  const source=(page,kind='adapted',answerKey='')=>({book:'新HSK教程1 (HSK3.0)',page,pdfPage:page+15,kind,answerKey});
  const mc=(id,prompt,stem,options,answer,explain,page,extra={})=>({id,type:'choice',prompt,stem,options,answer,explain,source:source(page),...extra});
  const groups=[
    {id:'words',title:'Từ vựng & pinyin',zh:'词汇与拼音',intro:'Chọn một đáp án A, B, C hoặc D. Chú ý nghĩa của từ trong bài 9.',questions:[
      mc('9-w1','“本” trong “一本中文书” có nghĩa gì?','一本中文书',['Lượng từ dùng cho sách: quyển, cuốn','Một ngày','Một người bạn','Phía trước'],'Lượng từ dùng cho sách: quyển, cuốn','本 là lượng từ dùng cho sách: 一 + 本 + 中文书 = một quyển sách tiếng Trung. Không dùng 个 thay cho 本 trong mẫu câu của bài.',64),
      mc('9-w2','“家” trong câu này dùng để làm gì?','学校前边有一家电影院。',['Chỉ thành viên trong gia đình','Lượng từ cho cơ sở kinh doanh, ở đây là một rạp chiếu phim','Động từ “về nhà”','Chỉ thời gian buổi tối'],'Lượng từ cho cơ sở kinh doanh, ở đây là một rạp chiếu phim','Trong 一家电影院, 家 là lượng từ cho một cơ sở kinh doanh. Nghĩa này khác với 家 trong 在家里: ở nhà.',62),
      mc('9-w3','Chọn nghĩa đúng của “白天” trong câu.','我白天在家里读书。',['Buổi tối','Ngày mai','Ban ngày','Thứ Bảy'],'Ban ngày','白天 (báitiān) = ban ngày, đối lập với 晚上 = buổi tối. Trong bài khóa 3, ban ngày Dương Đồng Lạc đọc sách ở nhà.',66),
      mc('9-w4','Trong “椅子上”, “上” được đọc thế nào theo giáo trình?','椅子上',['shǎng','shāng','shàng, thanh 4','shang, thanh nhẹ'],'shang, thanh nhẹ','Khi 上 đứng sau danh từ chỉ vị trí như 椅子上, giáo trình ghi thanh nhẹ: yǐzi shang. Trong 上午, 上 đọc thanh 4: shàngwǔ. Nghe audio để phân biệt.',64),
      mc('9-w5','Chọn nghĩa đúng trong tình huống khen bạn hát.','你唱歌很好听。',['Bạn hát rất hay.','Bạn nấu ăn rất ngon.','Bạn trông rất đẹp.','Bạn đọc sách rất nhanh.'],'Bạn hát rất hay.','好听 dùng để khen âm thanh dễ nghe, hay. 好看 khen vẻ ngoài; 好吃 khen đồ ăn. Trong câu này, 唱歌 = hát.',66)
    ]},
    {id:'grammar',title:'Ngữ pháp trong ngữ cảnh',zh:'语法与情境',intro:'Dùng 有 để nói “có”, đặt thời gian trước nơi chốn, và dùng 第 để chỉ thứ tự.',questions:[
      mc('9-g1','Điền từ mang nghĩa “có”: Trên ghế có một quyển sách tiếng Trung.','椅子上____一本中文书。',['在','有','第','不'],'有','Mẫu câu tồn hiện: nơi chốn + 有 + số lượng + vật. 椅子上有一本中文书。 Không dùng 不 để phủ định 有; dạng phủ định của 有 là 没有.',63),
      mc('9-g2','Chọn cụm từ phù hợp để hoàn thành câu.','她____在家里学习。',['在学校','是','今天上午','椅子'],'今天上午','今天上午 chỉ thời gian, đứng trước 在家里 chỉ nơi chốn: 她今天上午在家里学习。 Câu được chuyển thể từ bài chọn từ điền chỗ trống ở p.67; đáp án gốc là D.',67,{source:source(67,'adapted','答案 PDF p.7: 第9课 P67 (2) D')}),
      mc('9-g3','Chọn câu theo mẫu của bài: chủ ngữ + thời gian + nơi chốn + hành động.','Sáng mai tôi học ở trường.',['我在学校学习明天上午。','我明天上午学习在学校。','我明天上午在学习学校。','我明天上午在学校学习。'],'我明天上午在学校学习。','我 = chủ ngữ; 明天上午 = thời gian; 在学校 = nơi chốn; 学习 = hành động. Thời gian cũng có thể đứng đầu câu: 明天上午我在学校学习。',63),
      mc('9-g4','Điền lượng từ cho “quyển sách tiếng Trung thứ hai”.','第二____中文书',['本','个','口','只'],'本','Thứ tự: 第 + số + lượng từ + danh từ. 第二本中文书 = quyển sách tiếng Trung thứ hai; 两本中文书 = hai quyển sách tiếng Trung.',65),
      mc('9-g5','Điền cụm từ phù hợp trong lời đáp.','陈天中：你下午去哪儿？\n安妮：我下午还____上课。',['是','今天上午','在学校','好听'],'在学校','在学校 chỉ nơi chốn, đặt sau 下午 và trước động từ 上课. Câu được chuyển thể từ p.67; đáp án gốc là C.',67,{source:source(67,'adapted','答案 PDF p.7: 第9课 P67 (4) C')})
    ]},
    {id:'listening',title:'Nghe tiếng Trung → chọn nghĩa Việt',zh:'听力',intro:'Nghe audio gốc rồi chọn nghĩa tiếng Việt. Chưa xem chữ Hán hoặc pinyin trước khi nộp. Có thể nghe lại và chọn tốc độ 0,8× hoặc 1×.',questions:[
      mc('9-l1','Nghe câu nói và chọn nghĩa đúng.','',[
        'Phía trước trường có một siêu thị.','Phía trước trường có một rạp chiếu phim.','Phía sau trường có một rạp chiếu phim.','Bên ngoài rạp chiếu phim có một trường học.'
      ],'Phía trước trường có một rạp chiếu phim.','前边 = phía trước; 有一家电影院 = có một rạp chiếu phim. Chú ý vật được nói đến là rạp chiếu phim, không phải siêu thị.',62,{audio:{file:'9-1.mp3',start:0.37,end:3.435},transcript:'学校前边有一家电影院。',pinyin:'Xuéxiào qiánbian yǒu yì jiā diànyǐngyuàn.'}),
      mc('9-l2','Nghe đoạn hẹn gặp và chọn đúng thời gian, địa điểm.','',[
        'Gặp lúc sáu giờ tối ở bên ngoài rạp chiếu phim.','Gặp lúc bảy giờ sáng ở bên ngoài rạp chiếu phim.','Gặp lúc bảy giờ tối ở bên trong rạp chiếu phim.','Gặp lúc bảy giờ tối ở bên ngoài rạp chiếu phim.'
      ],'Gặp lúc bảy giờ tối ở bên ngoài rạp chiếu phim.','七点 = bảy giờ; 外边 = bên ngoài. Lời đáp nói 晚上七点见, xác nhận đó là bảy giờ tối.',62,{audio:{file:'9-1.mp3',start:8.13,end:15.681},transcript:'好！我们七点在电影院外边见，好吗？好的，晚上七点见！',pinyin:'Hǎo! Wǒmen qī diǎn zài diànyǐngyuàn wàibian jiàn, hǎo ma? Hǎo de, wǎnshang qī diǎn jiàn!'}),
      mc('9-l3','Nghe lời đáp về quyển sách.','',[
        'Đây là quyển sách tiếng Trung thứ hai của tôi.','Đây là quyển sách tiếng Trung thứ nhất của tôi.','Đây là quyển sách tiếng Trung thứ ba của tôi.','Tôi có hai quyển sách tiếng Việt.'
      ],'Đây là quyển sách tiếng Trung thứ hai của tôi.','第二本 = quyển thứ hai, không phải “hai quyển” (两本). Đáp án khách quan của giáo trình p.64, câu (2), là B: 第二本.',64,{audio:{file:'9-3.mp3',start:5.701,end:12.865},transcript:'是我的书，谢谢。这是我的第二本中文书。',pinyin:'Shì wǒ de shū, xièxie. Zhè shì wǒ de dì èr běn Zhōngwén shū.',source:source(64,'adapted','答案 PDF p.6: 第9课 P63/64 (2) B')}),
      mc('9-l4','Nghe và chọn đúng kế hoạch học tập.','',[
        'Sáng mai tôi đọc sách ở nhà.','Tối mai tôi học ở trường.','Sáng mai tôi học ở trường.','Sáng nay tôi học ở trường.'
      ],'Sáng mai tôi học ở trường.','明天上午 = sáng mai; 在学校 = ở trường; 学习 = học. Cần nghe đủ thời gian, địa điểm và hoạt động.',64,{audio:{file:'9-3.mp3',start:17.981,end:21.824},transcript:'我明天上午在学校学习。',pinyin:'Wǒ míngtiān shàngwǔ zài xuéxiào xuéxí.'}),
      mc('9-l5','Nghe kế hoạch ngày thứ Bảy và chọn nghĩa đúng.','',[
        'Ban ngày tôi đọc sách ở nhà, buổi tối ra ngoài hát với bạn bè.','Ban ngày tôi hát ở nhà, buổi tối đi học ở trường.','Ban ngày tôi đọc sách ở trường, buổi tối xem tivi với bạn bè.','Ban ngày tôi nấu ăn ở nhà, buổi tối ra ngoài xem phim.'
      ],'Ban ngày tôi đọc sách ở nhà, buổi tối ra ngoài hát với bạn bè.','白天在家里读书 = ban ngày đọc sách ở nhà; 晚上和朋友们去外边唱歌 = buổi tối ra ngoài hát với bạn bè. Câu có hai hoạt động ở hai thời điểm.',66,{audio:{file:'9-5.mp3',start:4.087,end:10.967},transcript:'我白天在家里读书，晚上和朋友们去外边唱歌。',pinyin:'Wǒ báitiān zài jiā li dúshū, wǎnshang hé péngyoumen qù wàibian chànggē.'})
    ]},
    {id:'reading',title:'Đọc hiểu đoạn hội thoại',zh:'阅读理解',intro:'Đọc đoạn hội thoại ở p.64, rồi trả lời 5 câu. Các câu hỏi được chuyển thể cho học viên Việt Nam.',passage:[
      '白家月：椅子上有一本中文书，那是谁的书？',
      '陈天中：是我的书，谢谢。这是我的第二本中文书。',
      '白家月：不客气。你明天上午在哪儿？',
      '陈天中：我明天上午在学校学习。'
    ],questions:[
      mc('9-r1','Quyển sách nằm ở đâu?','中文书在哪儿？',['Trên bàn','Ở ngoài trường','Dưới ghế','Trên ghế'],'Trên ghế','Câu đầu có 椅子上有一本中文书。 椅子上 = trên ghế.',64),
      mc('9-r2','Quyển sách là của ai?','那是谁的书？',['白家月','陈天中','安妮','王一雪'],'陈天中','陈天中 trả lời 是我的书. 我 chỉ người đang nói, ở đây là 陈天中.',64),
      mc('9-r3','Đây là quyển sách tiếng Trung thứ mấy của Trần Thiên Trung?','第几本中文书？',['Thứ nhất','Thứ hai','Thứ ba','Thứ tư'],'Thứ hai','这是我的第二本中文书。 第二本 = quyển thứ hai. Đáp án gốc của câu nghe cùng nội dung là B.',64,{source:source(64,'adapted','答案 PDF p.6: 第9课 P63/64 (2) B')}),
      mc('9-r4','Trần Thiên Trung học ở trường khi nào?','什么时候在学校学习？',['Chiều nay','Tối mai','Sáng mai','Sáng nay'],'Sáng mai','Câu cuối có 明天上午: 明天 = ngày mai; 上午 = buổi sáng.',64),
      mc('9-r5','Chọn câu trả lời đủ cả nơi chốn và hoạt động theo đoạn văn.','你明天上午在哪儿？',['我明天上午在学校学习。','我明天上午在家里读书。','我晚上去电影院看电影。','我明天上午和朋友们唱歌。'],'我明天上午在学校学习。','Đối chiếu câu cuối: 在学校学习. Không đổi 学校 thành 家里, hoặc 学习 thành 唱歌.',64)
    ]},
    {id:'ordering',title:'Sắp xếp từ thành câu',zh:'词语排序',intro:'Mỗi câu có 5 thẻ từ/cụm từ đã xáo trộn. Chạm thẻ để đưa vào câu; chạm lại để trả về. Có thể dùng Tab và Enter.',questions:[
      {id:'9-o1',type:'order',prompt:'Phía trước trường có một rạp chiếu phim.',tokens:['学校','前边','有','一家','电影院'],accepted:['学校前边有一家电影院。'],explain:'Nơi chốn 学校前边 đứng đầu, sau đó là 有 + 一家电影院. 家 là lượng từ cho rạp chiếu phim.',source:source(62)},
      {id:'9-o2',type:'order',prompt:'Sáng mai tôi học ở trường.',tokens:['我','明天上午','在','学校','学习'],accepted:['我明天上午在学校学习。','明天上午我在学校学习。'],explain:'Mẫu chính: 我 + 明天上午 + 在学校 + 学习. Cũng chấp nhận 明天上午我在学校学习。 Thời gian đứng trước nơi chốn.',source:source(63)},
      {id:'9-o3',type:'order',prompt:'Đây là quyển sách tiếng Trung thứ hai của tôi.',tokens:['这','是','我的','第二本','中文书'],accepted:['这是我的第二本中文书。'],explain:'这 + 是 + 我的 + 第二本 + 中文书. 第 đứng trước số 二; 本 đứng sau số và trước 中文书.',source:source(64)},
      {id:'9-o4',type:'order',prompt:'Ban ngày tôi đọc sách ở nhà.',tokens:['我','白天','在','家里','读书'],accepted:['我白天在家里读书。','白天我在家里读书。'],explain:'我 + 白天 + 在家里 + 读书. Cũng có thể đặt 白天 ở đầu câu. Đọc 读书 ở đây theo nghĩa đọc sách.',source:source(66)},
      {id:'9-o5',type:'order',prompt:'Chúng ta gặp nhau lúc bảy giờ ở bên ngoài rạp chiếu phim.',tokens:['我们','七点','在','电影院外边','见'],accepted:['我们七点在电影院外边见。','七点我们在电影院外边见。'],explain:'我们 + 七点 + 在电影院外边 + 见. 七点 cũng có thể đứng đầu câu. Không bỏ 在 trước cụm nơi chốn.',source:source(63)}
    ]},
    {id:'translation',title:'Dịch tiếng Việt → tiếng Trung',zh:'越译中',intro:'Viết câu bằng chữ Hán. Dấu câu và khoảng trắng không ảnh hưởng điểm. Có nhiều cách diễn đạt đúng được chấp nhận; câu chưa có trong danh sách được ghi “Chờ đối chiếu”, không tự kết luận sai.',questions:[
      {id:'9-t1',type:'translation',prompt:'Sáng mai tôi học ở trường.',accepted:['我明天上午在学校学习。','明天上午我在学校学习。','明天早上我在学校学习。','我明天早上在学校学习。'],incorrect:[{text:'我明天晚上在学校学习。',why:'晚上 = buổi tối; đề bài yêu cầu 上午/早上 = buổi sáng.'},{text:'我明天上午在学校。',why:'Câu còn thiếu hoạt động 学习 = học.'},{text:'我上午在学校学习。',why:'Thiếu 明天 = ngày mai.'},{text:'我明天上午在学校不学习。',why:'Không thêm 不: đề bài là câu khẳng định.'}],explain:'我 + 明天上午 + 在学校 + 学习. Chấp nhận thời gian ở đầu câu và 早上 trong nghĩa sáng mai. Giữ đủ chủ thể, ngày mai, buổi sáng, trường học và học tập.',source:source(63)},
      {id:'9-t2',type:'translation',prompt:'Trên ghế có một quyển sách tiếng Trung.',accepted:['椅子上有一本中文书。','在椅子上有一本中文书。','椅子上面有一本中文书。','在椅子上面有一本中文书。','椅子上有一本汉语书。','在椅子上有一本汉语书。'],incorrect:[{text:'椅子上有一个中文书。',why:'Sách dùng lượng từ 本, không dùng 个 trong bài này.'},{text:'椅子下有一本中文书。',why:'下 = phía dưới; đề bài yêu cầu 上 = phía trên.'},{text:'椅子上没有一本中文书。',why:'没有 phủ định ý “có”; đề bài là câu khẳng định.'}],explain:'椅子上 + 有 + 一本中文书. Chấp nhận 在椅子上 và 上面. 中文书 hoặc 汉语书 đều diễn đạt sách tiếng Trung; mẫu của bài dùng 中文书.',source:source(64)},
      {id:'9-t3',type:'translation',prompt:'Đây là quyển sách tiếng Trung thứ hai của tôi.',accepted:['这是我的第二本中文书。','这是我第二本中文书。','这本是我的第二本中文书。','这是我的第二本汉语书。','这是我第二本汉语书。'],incorrect:[{text:'这是我的两本中文书。',why:'两本 = hai quyển; 第二本 = quyển thứ hai.'},{text:'这是我的第二个中文书。',why:'Sau 第二, dùng 本 cho sách.'},{text:'这是我的第一本中文书。',why:'第一 = thứ nhất; đề bài yêu cầu 第二 = thứ hai.'}],explain:'这是 + 我的 + 第二本中文书. Cần giữ 第: đây là thứ tự “thứ hai”, không phải số lượng “hai quyển”.',source:source(64)},
      {id:'9-t4',type:'translation',prompt:'Chúng ta gặp nhau lúc bảy giờ ở bên ngoài rạp chiếu phim.',accepted:[
        '我们七点在电影院外边见。','七点我们在电影院外边见。','我们七点在电影院外面见。','七点我们在电影院外面见。',
        '我们七点在电影院外边见面。','七点我们在电影院外边见面。','我们七点在电影院外面见面。','七点我们在电影院外面见面。',
        '咱们七点在电影院外边见。','咱们七点在电影院外面见。','咱们七点在电影院外边见面。','咱们七点在电影院外面见面。'
      ],incorrect:[{text:'我们七点在电影院里见。',why:'里 = bên trong; đề bài yêu cầu 外边/外面 = bên ngoài.'},{text:'我们六点在电影院外边见。',why:'六点 = sáu giờ; đề bài yêu cầu 七点 = bảy giờ.'}],explain:'我们 + 七点 + 在电影院外边 + 见. Chấp nhận 见面, 外面 và cách đặt thời gian đầu câu. Đề bài không chỉ rõ sáng hay tối nên không tự thêm buổi sáng hoặc tối.',source:source(63)},
      {id:'9-t5',type:'translation',prompt:'Ban ngày tôi đọc sách ở nhà.',accepted:['我白天在家里读书。','白天我在家里读书。','我白天在家读书。','白天我在家读书。','我白天在家里看书。','白天我在家里看书。','我白天在家看书。','白天我在家看书。'],incorrect:[{text:'我晚上在家里读书。',why:'晚上 = buổi tối; đề bài yêu cầu 白天 = ban ngày.'},{text:'我白天在学校读书。',why:'学校 = trường học; đề bài yêu cầu 家/家里 = nhà.'},{text:'我白天在家里看电视。',why:'看电视 = xem tivi; đề bài yêu cầu đọc sách.'}],explain:'我 + 白天 + 在家里 + 读书. Chấp nhận 在家 hoặc 在家里; 读书 hoặc 看书 khi diễn đạt đọc sách trong ngữ cảnh này.',source:source(66)}
    ]}
  ];
  const bank={version:'20260930-pilot9-v1',lessonId:9,title:'我明天上午在学校学习',groups};
  if(typeof module==='object'&&module.exports)module.exports=bank;
  else root.HSK1_PILOT9=bank;
  if(root.HSK1_LESSONS){
    const lesson=root.HSK1_LESSONS.find(x=>x.id===9);
    if(lesson){
      const word=lesson.vocab.find(x=>x.zh==='家');
      if(word)Object.assign(word,{py:'jiā',vn:'lượng từ cho cơ sở kinh doanh (一家电影院: một rạp chiếu phim)',posLabel:'量词 · Lượng từ'});
      const shang=lesson.vocab.find(x=>x.zh==='上');
      if(shang)Object.assign(shang,{py:'shang / shàng',vn:'trên (thanh nhẹ sau danh từ: 椅子上); cao hơn / trước trong thứ tự, thời gian (thanh 4)',posLabel:'方位词 · Từ chỉ vị trí'});
      if(!lesson.vocab.some(x=>x.zh==='白天'))lesson.vocab.push({zh:'白天',py:'báitiān',vn:'ban ngày',kind:'core',posLabel:'名词 · Danh từ'});
    }
  }
})(typeof window==='object'?window:globalThis);
