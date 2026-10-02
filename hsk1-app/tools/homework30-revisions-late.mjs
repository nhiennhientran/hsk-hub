// New-version content overlays only. Immutable legacy authorities are not edited.
// Every change has its original payload and resolved authority recorded by the generator.
export const revisions = {};
const prefix = id => `hw30-v1-${id}`;
function mc(id, skill, prompt, correct, wrong, explanation, fields = {}) {
  const answer = Number(id.slice(-2)) % 4;
  const options = wrong.map(row => row[0]), optionFeedback = wrong.map(row => row[1]);
  options.splice(answer, 0, correct); optionFeedback.splice(answer, 0, `Đúng. ${explanation}`);
  revisions[prefix(id)] = { question: { prompt, stem: '', meaning: '', skill, options, answer, explanation, optionFeedback, ...fields }, review: { reason: `Substantive replacement: ${skill}. ${explanation}`, replacementProposition: prompt, distinctFromIds: [], linguisticAudit: optionFeedback } };
}
function sorting(id, prompt, meaning, tokens, answers, skill, explanation) {
  revisions[prefix(id)] = { question: { prompt, meaning, tokens, answers, skill, explanation }, review: { reason: `Replace repeated sentence with a different information relation: ${skill}.`, replacementProposition: meaning, distinctFromIds: [], linguisticAudit: [explanation] } };
}
function manual(id, prompt, skill, reason) {
  revisions[prefix(id)] = { question: { prompt, skill }, review: { reason, replacementProposition: prompt, distinctFromIds: [], linguisticAudit: ['Vietnamese prompt specifies a new combination of taught functions; no model answer is stored in the manual question.'] } };

}

// Lesson 8: adjective predication, existence negation, participant vocabulary,
// question focus and movement purpose replace repeated cat/arrival/workplace sentences.
mc('l08-choice-01', '漂亮描述外观而非数量位置', 'Câu nào nhận xét vẻ ngoài của con mèo, không nói số lượng, vị trí hay mong muốn?', '这只小猫很漂亮。', [
 ['我家没有小猫。', 'Câu này nói nhà tôi không có mèo, không nhận xét vẻ ngoài.'], ['这只小猫在学校外。', 'Câu này nói vị trí của mèo: ngoài trường.'], ['我想看小猫。', 'Câu này nói mong muốn nhìn con mèo.']], '很漂亮 nhận xét con mèo rất đẹp.');
mc('l08-choice-06', '没有否定存在', 'Bệnh viện không có bệnh nhân hôm nay. Chọn cách phủ định sự tồn tại.', '没有', [
 ['不', '不 không đứng trực tiếp trước danh từ 病人 để nói không có bệnh nhân.'], ['是', '是 dùng để xác định danh tính, không diễn tả không có.'], ['很', '很 chỉ mức độ, không phủ định sự tồn tại.']], '没有 + 病人 diễn tả không có bệnh nhân.', { stem: '医院里今天___病人。' });
mc('l08-choice-07', '医生与病人的角色区别', 'Chọn cách hiểu đúng của hai vai trò trong bệnh viện.', '医生: bác sĩ; 病人: bệnh nhân.', [
 ['医生: bệnh nhân; 病人: bác sĩ.', 'Hai vai trò đã bị đảo ngược.'], ['医生: giáo viên; 病人: học sinh.', 'Đây là vai trò ở trường, không phải nghĩa của hai từ đã cho.'], ['医生: người bán hàng; 病人: người mua hàng.', 'Đây là vai trò trong mua bán, không phải trong bệnh viện.']], '医生 là bác sĩ; 病人 là người bị bệnh.', { stem: '医生／病人' });
mc('l08-choice-08', '工作在处所短语后的动词功能', 'Trong cụm dưới đây, từ nào chỉ hoạt động, không chỉ nơi chốn hay người?', '工作', [
 ['医院', '医院 là địa điểm bệnh viện, không phải hoạt động.'], ['医生', '医生 là người bác sĩ, không phải hoạt động.'], ['下午', '下午 là thời gian buổi chiều, không phải hoạt động.']], 'Trong 在医院工作, 工作 là hoạt động làm việc; 在医院 chỉ nơi diễn ra.', { stem: '在医院工作' });
mc('l08-choice-10', '多少询问病人数量', 'Bạn cần biết số bệnh nhân trong bệnh viện, không hỏi địa điểm, thời gian hay danh tính. Chọn câu hỏi đúng trọng tâm.', '医院有多少病人？', [
 ['医院在哪儿？', 'Câu này hỏi bệnh viện ở đâu.'], ['医生几点下班？', 'Câu này hỏi giờ bác sĩ tan làm.'], ['这个病人是谁？', 'Câu này hỏi người bệnh này là ai, không hỏi số lượng.']], '多少 + 病人 hỏi số bệnh nhân.');
sorting('l08-sort-02', 'Ghép câu phân biệt hai nơi: bố ở bệnh viện còn mẹ ở trường. Bắt đầu bằng 爸爸; sau đó nói về 妈妈.', 'Bố ở bệnh viện, mẹ ở trường.', ['爸爸', '在', '医院', '妈妈', '在', '学校'], ['爸爸在医院，妈妈在学校。'], '两个主体与地点分别对应', 'Ghép đúng hai cặp chủ thể–địa điểm: 爸爸在医院 và 妈妈在学校; không chuyển địa điểm cho người còn lại.');
sorting('l08-sort-05', 'Ghép hai thông tin theo thứ tự: chưa nhìn thấy bác sĩ Hồ, rồi nói bác sĩ không ở bệnh viện. Bắt đầu bằng 我没看见.', 'Tôi chưa nhìn thấy bác sĩ Hồ; bác sĩ không ở bệnh viện.', ['我没看见', '胡医生', '他', '不', '在', '医院'], ['我没看见胡医生，他不在医院。'], '未见某人与否定其位置两层信息', '没看见 phủ định việc nhìn thấy; 不在 phủ định vị trí. Ghép đúng hai thông tin riêng, không coi chưa nhìn thấy tự nó là bằng chứng bác sĩ không ở đó.');
mc('l08-translationChoice-01', '否定学校外的位置', 'Hiệu sách không ở ngoài trường.', '书店不在学校外。', [
 ['书店在学校外。', 'Câu này khẳng định ở ngoài trường, trái với câu cần dịch.'], ['学校不在书店外。', 'Câu này đổi chủ thể thành trường học.'], ['书店没有学校。', 'Câu này dùng 没有 nói về sự tồn tại, không phủ định vị trí.']], '不在 phủ định vị trí; 学校外 là bên ngoài trường.');
mc('l08-translationChoice-02', '今天不工作与没看见区分', 'Hôm nay bác sĩ Hồ không làm việc.', '胡医生今天不工作。', [
 ['胡医生今天很忙。', 'Câu này nói bác sĩ rất bận.'], ['今天我没看见胡医生。', 'Chưa nhìn thấy bác sĩ không có nghĩa là bác sĩ không làm việc.'], ['胡医生明天不工作。', '明天 là ngày mai, không phải hôm nay.']], '今天 chỉ hôm nay; 不工作 nói không làm việc.');
mc('l08-translationChoice-03', '能力加地点加见面动作', 'Hôm nay tôi có thể gặp bác sĩ ở trường.', '今天我能在学校见医生。', [
 ['今天医生能在学校见我。', 'Câu này đổi chủ thể có khả năng gặp thành bác sĩ.'], ['今天我不能在学校见医生。', '不能 phủ định khả năng gặp, trái với đề bài.'], ['今天我想去医院工作。', 'Câu này nói muốn đến bệnh viện làm việc.']], '能 chỉ khả năng; 在学校 chỉ nơi gặp; 见医生 là gặp bác sĩ.');
mc('l08-translationChoice-04', '去加见表示移动目的', 'Chúng ta đến trường gặp bác sĩ Hồ nhé.', '我们去学校见胡医生吧。', [
 ['胡医生去学校见我们。', 'Câu này đổi người di chuyển thành bác sĩ Hồ.'], ['我们在学校工作吧。', 'Câu này đề nghị làm việc ở trường, không phải đi gặp bác sĩ.'], ['我们去医院吃午饭吧。', 'Câu này đổi địa điểm và mục đích thành ăn trưa ở bệnh viện.']], '去学校 + 见胡医生 nối nơi đến với mục đích đi; 吧 làm lời đề nghị.');
mc('l08-translationChoice-05', '只加指示词与形容词否定', 'Con mèo nhỏ này không lớn.', '这只小猫不大。', [
 ['这只小猫很多。', '很多 diễn tả số lượng nhiều, không phù hợp với một con mèo xác định.'], ['这只小猫很大。', '很大 khẳng định to, trái với 不大.'], ['我没有小猫。', 'Câu này nói tôi không có mèo, không nhận xét kích thước con mèo này.']], '这只 chỉ con mèo này; 不大 phủ định kích thước lớn.');
manual('l08-translation-01', 'Tôi không có mèo; bạn có mèo không? Viết cả lời nói và câu hỏi.', '否定所有与向对方确认', 'The old location answer was exposed as an automatic distractor. New writing combines negative possession with a separate question to the listener.');
manual('l08-translation-02', 'Mẹ tôi làm việc ở trường, không làm việc ở hiệu sách.', '同一主体两个工作地点对照', 'Avoid a one-noun workplace substitution; require an affirmative location plus an explicitly excluded workplace.');
manual('l08-translation-03', 'Tôi muốn ăn trưa ở nhà; bạn muốn ăn ở đâu?', '个人愿望与询问对方地点', 'Replace a meeting-place substitution with the speaker’s preference followed by an open location question to the listener.');

// Lesson 9: attribution, classifier use, demonstration, ownership and negative existence.
mc('l09-choice-04', '和连接两个参与者', 'Trong câu dưới đây, 和 nối hai người nào cùng đi mua sách?', '我 và 朋友.', [
 ['书店 và 书.', '书店 là nơi mua; 书 là vật được mua, không phải hai người được 和 nối.'], ['朋友 và 书店.', '书店 là địa điểm, không phải người cùng đi.'], ['我 và 书.', '书 là vật được mua, không phải người.']], '我和朋友 là hai người cùng thực hiện hành động; 在书店 chỉ nơi mua.', { stem: '我和朋友在书店买书。' });
mc('l09-choice-06', '本与数量名词组合', 'Cô giáo muốn mua ba quyển sách. Chọn lượng từ phù hợp với 书.', '本', [
 ['只', '只 dùng cho một số con vật, không dùng để đếm sách.'], ['口', '口 trong bài trước dùng để đếm người trong gia đình.'], ['家', '家 dùng với cơ sở như cửa hàng, không dùng với quyển sách.']], 'Số lượng sách dùng số + 本 + 书.', { stem: '老师想买三___书。' });
mc('l09-choice-08', '那加量词区别远指与处所', 'Trong 那本书, 那 có tác dụng gì?', 'Chỉ quyển sách ở phía xa người nói.', [
 ['Cho biết có mấy quyển sách.', 'Số lượng cần số đếm; 那 chỉ đối tượng được nói đến.'], ['Cho biết ai sở hữu quyển sách.', 'Quan hệ sở hữu cần cụm như 我的; 那 không tự chỉ người sở hữu.'], ['Nói quyển sách nằm bên trên vật khác.', 'Bên trên là 上; 那 là từ chỉ định.']], '那 + 本 + 书 nghĩa là quyển sách kia.', { stem: '那本书很好看。' });
mc('l09-choice-10', '玩作为动物活动', 'Con chó nhỏ đang chơi ở bên ngoài. Chọn từ chỉ hoạt động chơi.', '玩', [
 ['本', '本 là lượng từ của sách, không phải hoạt động của chó.'], ['第', '第 tạo số thứ tự, không phải động từ hoạt động.'], ['那', '那 là từ chỉ định, không diễn tả chơi.']], '玩 là chơi; 在外边 chỉ nơi diễn ra hoạt động.', { stem: '小狗在外边___。' });
sorting('l09-sort-01', 'Ghép câu nói vị trí cuốn sách của một người bạn. Bắt đầu bằng 朋友的书.', 'Cuốn sách của người bạn ở phía trước tivi.', ['朋友的书', '在', '电视', '前边'], ['朋友的书在电视前边。'], '所属名词短语加位置', '朋友的书 là chủ thể đã xác định; dùng 在 để nói vị trí, không dùng 有 để giới thiệu sự tồn tại.');
sorting('l09-sort-03', 'Ghép hai ý theo thứ tự: có ba quyển sách, rồi xác định quyển thứ nhất. Bắt đầu bằng 我.', 'Tôi có ba quyển sách; đây là quyển thứ nhất.', ['我', '有', '三本书', '这', '是', '第一本'], ['我有三本书，这是第一本。'], '数量与序号同句对照', '三本书 là số lượng; 第一本 là vị trí trong thứ tự. Giữ hai chức năng riêng trong hai vế.');
sorting('l09-sort-04', 'Ghép kế hoạch có cả thời gian, người cùng đi và nơi đến. Bắt đầu bằng 星期六.', 'Thứ Bảy tôi đến rạp chiếu phim cùng bạn.', ['星期六', '我', '和朋友', '去', '电影院'], ['星期六我和朋友去电影院。'], '时间同行者和移动目的地', '星期六 đặt ở đầu; 我和朋友 là những người cùng đi; 去电影院 nêu nơi đến, khác 在学校学习.');
mc('l09-translationChoice-01', '处所没有的存在否定', 'Trên tivi không có sách.', '电视上没有书。', [
 ['电视上有书。', '有 khẳng định có sách, trái với không có.'], ['书上没有电视。', 'Câu này đảo chỗ sách và tivi.'], ['我没有电视。', 'Câu này nói tôi không có tivi, không nói về sách trên tivi.']], '电视上 là địa điểm; 没有书 phủ định sự tồn tại của sách ở đó.');
mc('l09-translationChoice-02', '否定一种活动并说明另一活动', 'Buổi tối tôi không xem tivi; tôi đọc sách.', '我晚上不看电视，我读书。', [
 ['我晚上看电视，不读书。', 'Câu này đảo việc làm và không làm.'], ['我白天不看电视，我读书。', '白天 là ban ngày, không phải buổi tối.'], ['我晚上和朋友唱歌。', 'Câu này nói hoạt động hát cùng bạn, không có hai thông tin cần dịch.']], '不看电视 phủ định xem tivi; vế sau nêu hoạt động đọc sách.');
mc('l09-translationChoice-03', '否定朋友的所有关系', 'Đó không phải là sách của bạn tôi.', '那不是我朋友的书。', [
 ['那是我朋友的书。', 'Câu này khẳng định sách của bạn tôi, trái với phủ định.'], ['那不是我的朋友。', 'Câu này phủ định người bạn, không nói về sách.'], ['我的朋友没有书。', 'Không có sách khác với quyển sách kia không thuộc về bạn tôi.']], '不是 phủ định việc nhận định; 我朋友的书 là sách của bạn tôi.');
mc('l09-translationChoice-04', '拥有两类物品的有无对照', 'Chúng tôi có tivi nhưng không có sách.', '我们有电视，没有书。', [
 ['我们有书，没有电视。', 'Câu này đảo hai loại vật có và không có.'], ['我们看电视，也读书。', 'Câu này nói hoạt động, không nói có hay không có đồ vật.'], ['电视上有我们的书。', 'Câu này nói vị trí của sách, không phủ định việc có sách.']], '有电视 và 没有书 đối chiếu việc sở hữu hai loại đồ vật.');
mc('l09-translationChoice-05', '外边介绍动物存在', 'Bên ngoài rạp chiếu phim có một con chó.', '电影院外边有一只狗。', [
 ['电影院里有一只狗。', '里 là bên trong, trái với bên ngoài.'], ['电影院外边没有狗。', '没有 phủ định sự tồn tại của chó.'], ['我和朋友去电影院。', 'Câu này nói người đi xem phim, không giới thiệu con chó ở bên ngoài.']], '电影院外边 là nơi; 有一只狗 giới thiệu một con chó ở đó.');
manual('l09-translation-01', 'Quyển sách trên bàn là của cô giáo, không phải của tôi.', '位置限定加所有关系纠正', 'Replace a one-to-two-books scalar edit with identification of an already located book and correction of its owner.');
manual('l09-translation-02', 'Bạn tôi muốn xem tivi, nhưng tôi muốn đọc sách.', '两个主体的不同愿望', 'Replace a shop-type substitution with contrasting preferences of two people.');
manual('l09-translation-03', 'Tôi có hai quyển sách tiếng Trung; bạn tôi không có quyển nào.', '两人拥有情况与否定存在', 'Old ordinal full sentence was provided verbatim by translation-choice. New writing combines a quantity and a second person’s lack of books.');
manual('l09-translation-04', 'Tối mai tôi muốn đọc sách ở nhà cùng bạn.', '未来愿望加地点与同行者', 'Remove an exposed school-to-home distractor and combine desire, time, location and companion in one new scenario.');

// Lesson 10: seller roles, scarcity, units, wearing vs buying, and demonstratives.
mc('l10-choice-06', '售货员的职业含义', '售货员 là người làm công việc gì?', 'Bán hàng.', [
 ['Khám bệnh.', 'Khám bệnh là công việc của bác sĩ.'], ['Dạy học.', 'Dạy học là công việc của giáo viên.'], ['Đi học ở trường.', 'Đó là hoạt động của học sinh, không phải nghĩa của 售货员.']], '售货员 là nhân viên bán hàng.');
mc('l10-choice-08', '少与不多的数量对应', 'Chọn cách nhận xét tương ứng với “không có nhiều quần áo”, không nói về giá hay kích thước.', '衣服少。', [
 ['衣服贵。', '贵 nhận xét giá đắt, không nói số lượng.'], ['衣服便宜。', '便宜 nhận xét giá rẻ, không nói số lượng.'], ['衣服大。', '大 nói kích thước lớn, không nói số lượng ít.']], '不多 và 少 đều nói số lượng không nhiều.', { stem: '这个商店的衣服不多。' });
mc('l10-choice-09', '斤作为水果单价的重量单位', 'Người bán báo giá táo theo đơn vị khối lượng đã học. Chọn đơn vị thích hợp.', '斤', [
 ['件', '件 đếm quần áo, không phải đơn vị khối lượng táo.'], ['本', '本 đếm sách, không phải đơn vị khối lượng.'], ['口', '口 trong bài dùng với số người trong gia đình, không dùng báo giá táo theo cân.']], '五元一斤 nghĩa là năm tệ cho mỗi 斤; đây là đơn vị khối lượng.', { stem: '苹果五元一___。' });
mc('l10-choice-10', '女与男的性别词义', 'Theo câu dưới đây, nhân viên bán hàng được mô tả là nam hay nữ?', 'Nữ.', [
 ['Nam.', 'Nam tương ứng với 男, nhưng câu đã cho dùng 女.'], ['Cả nam lẫn nữ.', 'Câu nói một người và dùng 女, không nói cả hai.'], ['Không có thông tin về giới tính.', '女的 đã cung cấp thông tin này.']], '女的 chỉ người nữ.', { stem: '这个售货员是女的。' });
sorting('l10-sort-02', 'Ghép câu mô tả người bán đang mặc gì. Bắt đầu bằng 售货员.', 'Nhân viên bán hàng mặc một món quần áo đẹp.', ['售货员', '穿', '一件', '漂亮的', '衣服'], ['售货员穿一件漂亮的衣服。'], '穿的动作与形容词修饰衣服', '穿 là mặc, không phải 买 là mua. 漂亮的 bổ nghĩa cho 衣服; 一件 là số lượng.');
sorting('l10-sort-05', 'Ghép câu xác định nơi có quần áo ở phía kia. Bắt đầu bằng 那些衣服.', 'Những món quần áo kia ở cửa hàng kia.', ['那些衣服', '在', '那家', '商店'], ['那些衣服在那家商店。'], '复数远指与商店量词家', '那些衣服 chỉ nhiều món quần áo ở xa; 那家商店 dùng 家 cho cửa hàng. 在 nối đồ vật với vị trí.');
mc('l10-translationChoice-01', '衣服的每件价格', 'Quần áo ở đây tám mươi nhân dân tệ một chiếc.', '这儿的衣服八十元一件。', [
 ['这儿的衣服十八元一件。', '十八 là mười tám, không phải tám mươi.'], ['这儿有八十件衣服。', 'Câu này nói có tám mươi chiếc, không nói đơn giá.'], ['我想买八十件衣服。', 'Câu này nói muốn mua tám mươi chiếc, không nói giá một chiếc.']], '八十元一件 diễn tả giá mỗi chiếc, không phải tổng số quần áo.');
mc('l10-translationChoice-02', '这边表示人的方位', 'Nhân viên bán hàng ở phía này.', '售货员在这边。', [
 ['售货员在那边。', '那边 là phía kia, trái với phía này.'], ['售货员没有钱。', 'Câu này nói nhân viên không có tiền, không nói vị trí.'], ['这边的衣服很贵。', 'Câu này nhận xét giá quần áo, không xác định người bán.']], '在这边 nghĩa là ở phía này.');
mc('l10-translationChoice-03', '对比两组苹果并表达购买选择', 'Những quả táo kia đắt; tôi muốn mua những quả táo này.', '那些苹果很贵，我想买这些苹果。', [
 ['这些苹果很贵，我想买那些苹果。', 'Câu này đảo nhóm đắt và nhóm muốn mua.'], ['那些苹果很便宜，我不想买苹果。', 'Câu này đổi đắt thành rẻ và phủ định mong muốn mua.'], ['我想买一件衣服，不买苹果。', 'Câu này chuyển sang mua quần áo.']], '那些 chỉ nhóm kia; 这些 chỉ nhóm này. Hai vế nối nhận xét giá với lựa chọn mua.');
mc('l10-translationChoice-04', '穿与买的意图区别', 'Tôi muốn mặc món quần áo đó.', '我想穿那件衣服。', [
 ['我想买那件衣服。', '买 là mua; đề bài nói mặc.'], ['我不想穿那件衣服。', '不想 phủ định mong muốn, trái với câu cần dịch.'], ['那件衣服很漂亮。', 'Câu này nhận xét món quần áo đẹp, không nói mong muốn mặc.']], '想穿 là muốn mặc; 那件衣服 là món quần áo đó.');
mc('l10-translationChoice-05', '数量与总价成对表达', 'Một chiếc cốc ba tệ, hai chiếc sáu tệ.', '一个杯子三块钱，两个杯子六块钱。', [
 ['一个杯子六块钱，两个杯子三块钱。', 'Câu này đảo giá tương ứng với từng số lượng.'], ['我有三个杯子和六个杯子。', 'Câu này nói số cốc đang có, không nói giá.'], ['三个杯子一块钱，六个杯子两块钱。', 'Câu này đảo số lượng và số tiền.']], 'Số lượng đặt trước 杯子; giá dùng số + 块钱. Mỗi vế có cặp số lượng–giá tương ứng.');
manual('l10-translation-03', 'Cửa hàng này có nhiều quần áo, nhưng tôi không muốn mua quần áo ở đây.', '存在数量与购买意愿不相同', 'Replace a 不贵/不太贵 scalar paraphrase with contrast between stock quantity and personal buying intention.');

// Lesson 11: unknown information, direction, reported uncertainty and identification.
mc('l11-choice-08', '不知道是否定掌握信息', 'Bạn hỏi bố về một thông tin. Bố trả lời như dưới đây. Câu trả lời thể hiện điều gì?', 'Bố không biết thông tin được hỏi.', [
 ['Bố chắc chắn thông tin đó đúng.', '不知道 nói không biết, không xác nhận đúng.'], ['Bố đang hỏi bạn tên gì.', 'Đây là một lời đáp, không phải câu hỏi tên.'], ['Bố đang lái xe.', 'Câu đã cho không nói về lái xe.']], '不知道 diễn tả không biết thông tin.', { stem: '我不知道。' });
mc('l11-choice-09', '引语中我指向说话者而非听者', 'Theo lời nói được trích dẫn, ai dự định đi nhà hàng vào ngày mai?', '爸爸', [
 ['妈妈', '妈妈 là người nghe, không phải người tự xưng 我 trong lời nói của bố.'], ['弟弟', 'Câu đã cho không nhắc đến em trai.'], ['爸爸和妈妈', 'Chỉ bố nói về dự định của mình; chưa có thông tin mẹ cũng đi.']], 'Trong lời bố nói với mẹ, 我 là bố. 对妈妈 chỉ người được nói chuyện cùng.', { stem: '爸爸对妈妈说：“我明天要去饭店。”' });
sorting('l11-sort-01', 'Ghép câu nói em trai đang ăn ở nhà hàng. Bắt đầu bằng 我弟弟 và đặt 正在 trước cụm địa điểm.', 'Em trai tôi đang ăn cơm ở nhà hàng.', ['我弟弟', '正在', '饭店', '吃饭'], ['我弟弟正在饭店吃饭。'], '正在加地点与正在进行的活动', '正在 chỉ hoạt động diễn ra lúc nói; 饭店 là nơi ăn. Câu này phối hợp chủ thể, thời thể, nơi chốn và hành động.');
mc('l11-translationChoice-01', '正在找的宾语用谁提问', 'Bạn đang tìm ai?', '你正在找谁？', [
 ['谁正在找你？', 'Câu này hỏi ai đang tìm bạn, đảo hướng người tìm và người được tìm.'], ['你在哪里工作？', 'Câu này hỏi nơi làm việc.'], ['你想什么时候起床？', 'Câu này hỏi thời gian muốn thức dậy.']], '你 là người tìm; 谁 đứng sau 找 để hỏi người được tìm.');
mc('l11-translationChoice-02', '什么时候询问下班时间', 'Cô giáo tan làm khi nào?', '老师什么时候下班？', [
 ['老师在哪里工作？', 'Câu này hỏi địa điểm làm việc, không hỏi thời gian.'], ['老师什么时候起床？', 'Câu này hỏi lúc thức dậy, không phải tan làm.'], ['老师下午下班。', 'Câu này thông báo buổi chiều tan làm, không đặt câu hỏi.']], '什么时候 hỏi thời gian; 下班 là tan làm.');
mc('l11-translationChoice-03', '认识询问是否相识', 'Bạn có quen bác sĩ Hồ không?', '你认识胡医生吗？', [
 ['胡医生在哪里？', 'Câu này hỏi bác sĩ ở đâu, không hỏi có quen hay không.'], ['你是胡医生吗？', 'Câu này hỏi bạn có phải bác sĩ Hồ không, không hỏi quen biết.'], ['你在医院工作吗？', 'Câu này hỏi nơi làm việc, không hỏi quen bác sĩ Hồ.']], '认识 một người là quen/biết người đó; 吗 tạo câu hỏi có–không.');
mc('l11-translationChoice-04', '不知道的陈述与明天询问的安排', 'Bố tôi không biết; ngày mai tôi hỏi bố.', '我爸爸不知道，我明天问他。', [
 ['我爸爸不知道，他明天问我。', 'Câu này đổi người sẽ hỏi thành bố và người được hỏi thành tôi.'], ['我爸爸知道，我明天不问他。', 'Câu này đảo trạng thái biết và phủ định việc sẽ hỏi.'], ['我爸爸不知道，我昨天问他。', '昨天 là hôm qua, không phải lịch hỏi vào ngày mai.']], 'Vế đầu nêu bố không biết; vế sau dùng 我 làm người hỏi, 明天 làm thời gian và 他 chỉ bố.');
mc('l11-translationChoice-05', '身份否定与正面说明', 'Em trai tôi không phải sinh viên đại học; cậu ấy là bác sĩ.', '我弟弟不是大学生，他是医生。', [
 ['我弟弟是大学生，不是医生。', 'Câu này đảo thân phận được khẳng định và phủ định.'], ['我弟弟在大学工作，他不认识医生。', 'Làm việc ở đại học và không quen bác sĩ không phải hai thông tin cần dịch.'], ['我弟弟想学医，他是大学生。', 'Câu này nói muốn học y và đang là sinh viên, khác với đề bài.']], '不是大学生 phủ định thân phận sinh viên; 他是医生 xác định nghề bác sĩ.');
manual('l11-translation-04', 'Tôi học y ở đại học; em trai tôi cũng học y.', '学习专业与另一个人的相同情况', 'Old writing was supplied verbatim in translation-choice. New writing specifies field and institution, then a separate participant sharing the field.');

// Lesson 12: polysemy, motion back, clinical purpose and degree/quantity contrast.
mc('l12-choice-06', '天作为时间单位而非天气', 'Trong cụm dưới đây, 天 có nghĩa gì?', 'Ngày, một đơn vị thời gian.', [
 ['Thời tiết.', 'Trong 三天, 天 đếm thời gian chứ không chỉ thời tiết.'], ['Mưa.', 'Mưa là 雨; 天 không mang nghĩa đó trong cụm này.'], ['Công ty.', 'Công ty là 公司, không phải 天.']], '三天 là ba ngày; 天 đứng sau số để đếm thời gian.', { stem: '休息三天' });
mc('l12-choice-07', '回表示返回熟悉的地点', 'Bạn đang ở công ty và muốn trở về nhà. Chọn động từ thể hiện việc trở về.', '回', [
 ['问', '问 là hỏi, không phải trở về.'], ['喝', '喝 là uống, không chỉ di chuyển.'], ['看病', '看病 là khám bệnh, không phải trở về nhà.']], '回家 nghĩa là trở về nhà.', { stem: '我想___家。' });
mc('l12-choice-08', '看病作为求医目的', 'Bạn bị ốm và đến bệnh viện để được bác sĩ khám. Cụm nào diễn tả đúng mục đích này?', '看病', [
 ['看见', '看见 chỉ nhìn thấy, không đồng nghĩa đi khám bệnh.'], ['读书', '读书 là đọc sách.'], ['起床', '起床 là thức dậy.']], '看病 là đi khám bệnh, khác với 看见 chỉ việc nhìn thấy.');
mc('l12-choice-09', '有点儿与一点儿的句法对比', 'Chọn hai cụm theo thứ tự: nước hơi nóng; tôi muốn uống một ít sữa.', '有点儿；一点儿', [
 ['一点儿；有点儿', 'Trước tính từ 热 dùng 有点儿; trước danh từ 牛奶 sau 喝 dùng 一点儿.'], ['有点儿；有点儿', 'Có thể nói 有点儿热, nhưng không dùng 喝有点儿牛奶 để chỉ lượng sữa.'], ['一点儿；一点儿', 'Sau 水 để nói hơi nóng cần 有点儿热, không phải 一点儿热 trong mẫu câu này.']], '有点儿 + tính từ diễn tả mức độ; động từ + 一点儿 + danh từ diễn tả lượng nhỏ.', { stem: '水___热，我想喝___牛奶。' });
sorting('l12-sort-02', 'Ghép câu nêu nhận định của bạn về cô giáo. Bắt đầu bằng 我觉得.', 'Tôi nghĩ cô giáo không bị ốm.', ['我觉得', '老师', '没', '生病'], ['我觉得老师没生病。'], '觉得后接完整判断而非只说感觉', '觉得 theo sau cả nhận định 老师没生病; 没 phủ định việc bị bệnh. Đây là ý kiến của người nói, không phải chẩn đoán y khoa.');
sorting('l12-sort-03', 'Ghép nhận xét về nhiệt độ nước rồi nói quyết định lúc này. Bắt đầu bằng 这里的水.', 'Nước ở đây nóng quá; bây giờ tôi không uống.', ['这里的水', '太', '热', '了', '我现在', '不', '喝'], ['这里的水太热了，我现在不喝。'], '程度评价与当前选择组合', '太热了 là nhận xét mức độ nóng; 我现在不喝 nêu lựa chọn hiện tại, không nói không bao giờ uống.');
sorting('l12-sort-04', 'Ghép câu thông báo ở công ty có một lượng nước nhỏ. Bắt đầu bằng 公司里.', 'Trong công ty có một chút nước.', ['公司里', '有', '一点儿', '水'], ['公司里有一点儿水。'], '一点儿修饰存在的数量', '有一点儿水 diễn tả có một lượng nước nhỏ ở địa điểm 公司里, khác với mong muốn uống.');
mc('l12-translationChoice-01', '来朝向对方所在公司并询问明天', 'Bạn nói với đồng nghiệp đang ở công ty: “Ngày mai bạn có đến công ty không?”', '你明天来公司吗？', [
 ['你今天在公司吗？', 'Câu này hỏi hôm nay có ở công ty hay không, không hỏi có đến vào ngày mai.'], ['公司明天来你吗？', 'Công ty không phải người di chuyển; câu đã đảo sai chủ thể.'], ['你明天想喝水吗？', 'Câu này hỏi muốn uống nước, không hỏi đến công ty.']], '明天 chỉ ngày mai; 来公司 nói đến công ty; 吗 tạo câu hỏi.');
mc('l12-translationChoice-02', '雨作名词与下雨动作不同', 'Mưa ở đây không lớn.', '这里的雨不大。', [
 ['这里不下雨。', 'Không có mưa khác với có mưa nhưng mưa không lớn.'], ['这里的雨很大。', '很大 khẳng định mưa lớn, trái với 不大.'], ['我不喜欢喝水。', 'Câu này nói sở thích uống nước, không nói lượng mưa.']], '雨 là danh từ chỉ mưa; 不大 nói mức độ mưa không lớn, không phủ định đang mưa.');
mc('l12-translationChoice-04', '不想加喝冷水的意愿否定', 'Tôi không muốn uống nước lạnh.', '我不想喝冷水。', [
 ['我想喝冷水。', 'Câu này khẳng định muốn uống, trái với phủ định.'], ['我没看见水。', 'Chưa nhìn thấy nước không có nghĩa không muốn uống.'], ['我想喝热水。', 'Câu này nói muốn uống nước nóng, chưa nêu phủ định mong muốn uống nước lạnh.']], '不想 phủ định mong muốn; 冷水 là nước lạnh.');
mc('l12-translationChoice-05', '今天休息与明天再来两时点', 'Nói với đồng nghiệp ở công ty: “Hôm nay tôi nghỉ; ngày mai tôi lại đến công ty.”', '我今天休息，明天再来公司。', [
 ['我今天来公司，明天休息。', 'Câu này đảo lịch hôm nay và ngày mai.'], ['我今天生病了，昨天没来公司。', 'Câu này nói bị ốm và hôm qua vắng mặt, không nói kế hoạch quay lại ngày mai.'], ['我明天休息，再喝一点儿水。', 'Câu này chuyển sang nghỉ ngày mai và uống thêm nước.']], '再来 chỉ một lần đến tiếp theo; hai vế phân biệt hôm nay nghỉ và ngày mai đến lại.');
manual('l12-translation-01', 'Chị gái tôi bị ốm rồi; hôm nay chị ấy không đến công ty.', '新状态与当天行动的联系', 'The old whole writing answer occurred in a choice stem. New writing links another person’s changed condition with a separate attendance statement.');

// Lesson 13: address, bread classifier, buying/selling, 再/在 and recipient roles.
mc('l13-choice-06', '女士作为对女客人的礼貌称呼', 'Người phục vụ muốn gọi lịch sự một vị khách nữ. Chọn cách xưng hô phù hợp, không phải tên nghề.', '女士', [
 ['先生', '先生 dùng để gọi lịch sự một người nam.'], ['服务员', '服务员 là người phục vụ, không phải cách gọi nữ khách trong tình huống này.'], ['售货员', '售货员 là nhân viên bán hàng, không phải cách gọi nữ khách.']], '女士 là cách xưng hô lịch sự với một người nữ.');
mc('l13-choice-07', '个与杯用于固体食物和饮料', 'Vị khách gọi trứng và một ổ bánh mì. Chọn lượng từ thích hợp với 面包.', '个', [
 ['杯', '杯 là cốc, dùng với đồ uống, không phải ổ bánh mì.'], ['本', '本 dùng với sách.'], ['口', '口 trong các bài trước đếm người trong gia đình, không dùng đếm ổ bánh mì ở đây.']], '一个面包 là một ổ bánh mì.', { stem: '先生要两个鸡蛋和一___面包。' });
mc('l13-choice-08', '卖与买的交易方向', 'Người phục vụ nói câu dưới đây. Họ đang nói về bên nào của việc mua bán trà?', 'Bên bán trà.', [
 ['Bên mua trà.', 'Mua là 买, nhưng câu dùng 卖.'], ['Người được tặng trà.', 'Câu không nói cho/tặng trà.'], ['Người đang uống trà.', 'Uống là 喝; câu đang nói hoạt động bán.']], '卖 là bán, khác 买 là mua.', { stem: '我们这里卖茶。' });
mc('l13-choice-09', '再与在的意义区分', 'Người nghe đã từng đến và bạn mời họ đến thêm một lần vào ngày mai. Chọn từ đúng.', '再', [
 ['在', '在 chỉ vị trí hoặc hoạt động đang diễn ra, không mang nghĩa thêm một lần trong lời mời này.'], ['一下', '一下 chỉ thời lượng ngắn của hành động, không diễn tả một lần đến tiếp theo.'], ['杯', '杯 là lượng từ đồ uống, không phù hợp với 来.']], '再来 nghĩa là lại đến, thêm một lần nữa trong tương lai.', { stem: '明天请___来。' });
mc('l13-choice-10', '给出一半后计算剩余数量', 'Bạn có mười quả trứng và cho mẹ một nửa. Sau đó bạn còn bao nhiêu quả?', '五个。', [
 ['十个。', 'Mười quả là số ban đầu, chưa trừ phần đã cho mẹ.'], ['两个。', 'Một nửa của mười là năm, không phải hai.'], ['一个。', '一半 không có nghĩa là một quả; nó chỉ một nửa tổng số.']], 'Một nửa của mười là năm; sau khi cho năm quả, bạn còn năm quả.', { stem: '我有十个鸡蛋，给妈妈一半。' });
sorting('l13-sort-05', 'Ghép câu nói cửa hàng bán cả bánh mì và trứng. Bắt đầu bằng 这个小店.', 'Cửa hàng nhỏ này bán bánh mì và trứng.', ['这个小店', '卖', '面包', '和', '鸡蛋'], ['这个小店卖面包和鸡蛋。'], '卖的两个并列宾语', '面包和鸡蛋 là hai loại hàng cùng được bán; 和 nối hai tân ngữ, không nối hai người.');
mc('l13-translationChoice-01', '问的对象与问题宾语', 'Người phục vụ muốn hỏi vị khách nam một câu.', '服务员想问先生一个问题。', [
 ['先生想问服务员一个问题。', 'Câu này đảo người hỏi và người được hỏi.'], ['服务员想给先生一个鸡蛋。', 'Câu này nói đưa trứng, không nói hỏi một câu.'], ['服务员不想问先生问题。', 'Câu này phủ định mong muốn hỏi, trái với đề bài.']], '服务员 là người hỏi; 先生 là người được hỏi; 一个问题 là nội dung hỏi.');
mc('l13-translationChoice-02', '地点中是否可以买某物', 'Ở đây có thể mua bánh mì không?', '这里可以买面包吗？', [
 ['这里可以吃面包吗？', '吃 là ăn; đề bài hỏi mua.'], ['这里的面包很贵。', 'Câu này nhận xét giá, không hỏi có thể mua hay không.'], ['这里的面包不多。', 'Câu này nhận xét số lượng bánh mì ít, không hỏi có thể mua hay không.']], '可以买面包 hỏi khả năng mua bánh mì; 这里 chỉ địa điểm.');
mc('l13-translationChoice-04', '给的接收者与礼貌请求', 'Bạn có thể cho tôi quyển sách kia không?', '你可以给我那本书吗？', [
 ['我可以给你那本书吗？', 'Câu này đảo người cho và người nhận.'], ['你可以问我一个问题吗？', 'Câu này đề nghị hỏi, không đề nghị cho sách.'], ['你想买我的书吗？', 'Câu này hỏi muốn mua sách, không nhờ cho quyển sách kia.']], '你 là người được nhờ cho; 我 là người nhận; 那本书 là vật được cho.');
mc('l13-translationChoice-05', '一半选择与拒绝另一类食物', 'Trong số những ổ bánh mì này, tôi lấy một nửa; tôi không lấy trứng.', '这些面包，我要一半，不要鸡蛋。', [
 ['这些鸡蛋，我要一半，不要面包。', 'Câu này đảo loại thức ăn lấy một nửa và loại không lấy.'], ['这些面包我不要，我要鸡蛋。', 'Câu này từ chối bánh mì và chọn trứng, ngược với đề bài.'], ['我想问面包和鸡蛋多少钱。', 'Câu này hỏi giá, không nêu lựa chọn số lượng.']], '一半 chỉ một nửa số bánh mì được nói tới; 不要鸡蛋 từ chối loại thức ăn khác.');
manual('l13-translation-03', 'Tôi muốn hỏi người phục vụ một câu. Viết tiếp câu hỏi: Cửa hàng này có bán bánh mì không? Dùng câu hỏi chính–phản.', '问一个问题与独立正反问组合', 'Replace a near-copy of the book-look cloze with two independent sentences: wanting to ask the server one question, then an A-not-A stock question. No unintroduced embedded-question construction is required.');

// Lesson 14: subset/all scope, speech vs writing, boarding vs schooling and mixed ability.
mc('l14-choice-06', '有些表示部分而非全部', 'Câu dưới đây khẳng định điều gì, không tự suy thêm về những học sinh còn lại?', 'Một số học sinh biết viết chữ này.', [
 ['Tất cả học sinh đều biết viết chữ này.', '有些 chỉ một số, không khẳng định tất cả.'], ['Không học sinh nào biết viết chữ này.', 'Câu nói có một số biết viết, không phải không ai biết.'], ['Tất cả học sinh đều không biết viết chữ này.', 'Đây là phủ định toàn bộ, trái với 有些学生会写.']], '有些 chỉ một bộ phận trong nhóm; câu không cho biết chắc toàn bộ những người còn lại có biết hay không.', { stem: '有些学生会写这个汉字。' });
mc('l14-choice-09', '听汉语与写汉字的活动区别', 'Cô giáo yêu cầu nghe chứ không viết. Hoạt động nào phù hợp?', '听汉语。', [
 ['写汉字。', '写汉字 là viết chữ Hán, trái với yêu cầu không viết.'], ['写名字。', '写名字 vẫn là viết, không phải nghe.'], ['看汉字。', '看汉字 là nhìn chữ viết; cô giáo yêu cầu nghe âm thanh.']], '听 dùng với âm thanh/ngôn ngữ nói; 汉语 là tiếng Trung.', { stem: '请听，不要写。' });
mc('l14-choice-10', '上在交通与教育语境的不同意义', 'Chọn cặp nghĩa đúng của 上 trong hai cụm dưới đây.', 'Lên tàu hỏa／đi học tiểu học.', [
 ['Mua tàu hỏa／xây trường tiểu học.', '上 không có nghĩa mua hay xây trong hai cụm này.'], ['Rời tàu hỏa／nghỉ học tiểu học.', 'Rời tàu là 下火车; 上小学 là đi học, không phải nghỉ học.'], ['Lái tàu hỏa／dạy ở trường tiểu học.', '上 không có nghĩa lái tàu hay làm giáo viên trong hai cụm này.']], '上火车 là lên tàu; 上小学 là theo học tiểu học.', { stem: '上火车／上小学' });
sorting('l14-sort-04', 'Ghép hai vế nói cả nhóm học tiểu học, không phải trung học. Bắt đầu bằng 他们.', 'Họ đều là học sinh tiểu học, không phải học sinh trung học.', ['他们', '都', '是', '小学生', '不', '是', '中学生'], ['他们都是小学生，不是中学生。'], '都的范围与身份排除', '都 áp dụng cho cả nhóm 他们; 不是中学生 loại trừ một thân phận khác cho chính nhóm đó.');
sorting('l14-sort-05', 'Ghép câu báo rằng cả nhóm đã nghe thấy. Bắt đầu bằng 他们.', 'Họ đều đã nghe thấy rồi.', ['他们', '都', '听见', '了'], ['他们都听见了。'], '都与听见结果和了的配合', '都 chỉ cả nhóm; 听见 là nghe được/nghe thấy; 了 báo kết quả đã có, khác với khả năng phủ định 听不见.');
mc('l14-translationChoice-01', '没否定过去写字行为', 'Hôm qua cô giáo không viết những chữ Hán này.', '老师昨天没写这些汉字。', [
 ['老师昨天写了这些汉字。', 'Câu này khẳng định đã viết, trái với phủ định.'], ['老师今天不想写汉字。', 'Câu này nói hôm nay không muốn viết, không nói hôm qua đã không viết những chữ này.'], ['老师明天要写这些汉字。', 'Câu này nói dự định ngày mai, không nói việc hôm qua không xảy ra.']], '昨天 xác định quá khứ; 没写 phủ định hành động viết đã không xảy ra.');
mc('l14-translationChoice-02', '有的有的表示组内不同能力', 'Có học sinh biết viết chữ này; có học sinh không biết viết.', '有的学生会写这个字，有的学生不会写。', [
 ['学生都会写这个字。', 'Câu này nói tất cả đều biết viết, không nêu hai nhóm khác nhau.'], ['学生都不会写这个字。', 'Câu này phủ định toàn bộ, không có nhóm biết viết.'], ['有的学生想去学校，有的想回家。', 'Câu này phân chia mong muốn đi đâu, không nói khả năng viết chữ.']], '有的……有的…… phân biệt các bộ phận trong cùng một nhóm; 会／不会 đối chiếu khả năng.');
mc('l14-translationChoice-03', '不要禁止登车而非表达不想要物品', 'Xin đừng lên tàu hỏa.', '请不要上火车。', [
 ['请上火车。', 'Câu này mời lên tàu, không ngăn lên tàu.'], ['我不想要火车。', 'Câu này nói không muốn có tàu, không phải lời nhắc đừng lên tàu.'], ['我不坐火车。', 'Câu này nói lựa chọn của người nói, không yêu cầu người nghe đừng lên tàu.']], '不要 + 上火车 là lời yêu cầu không thực hiện hành động lên tàu.');
mc('l14-translationChoice-04', '当天不上学而在家休息', 'Theo lịch hôm nay, con trai tôi nghỉ ở nhà, không đi học.', '我儿子今天在家休息，不上学。', [
 ['我儿子今天上学，不在家休息。', 'Câu này đảo việc đi học và nghỉ ở nhà.'], ['我儿子明天想去商店。', 'Câu này nói mong muốn đi cửa hàng ngày mai, không nói lịch học hôm nay.'], ['我儿子今天在学校写字。', 'Câu này nói đang ở trường viết chữ, không nghỉ ở nhà.']], '今天在家休息 nêu lịch nghỉ hôm nay; 不上学 phủ định việc đi học theo lịch này.');
mc('l14-translationChoice-05', '这些与那些字的能力对照', 'Tôi biết viết những chữ này, nhưng không biết viết những chữ kia.', '我会写这些字，不会写那些字。', [
 ['我会写那些字，不会写这些字。', 'Câu này đảo hai nhóm chữ.'], ['我不会写这些字，也不会写那些字。', 'Câu này phủ định khả năng với cả hai nhóm, trái với biết viết nhóm này.'], ['我昨天没写这些字。', 'Câu này nói hôm qua không viết, không đối chiếu khả năng với hai nhóm chữ.']], '会写这些字 và 不会写那些字 phân biệt khả năng theo hai đối tượng được chỉ định.');
manual('l14-translation-04', 'Con gái tôi là học sinh tiểu học; con trai tôi là học sinh trung học.', '两个家庭成员分别对应两种学生身份', 'Remove the exact future-schooling sentence supplied in listening/translation-choice; require a two-person classification with different education levels.');

// Lesson 15: family nouns, arrival order, pickup roles, choice and time availability.
mc('l15-choice-06', '家人的集合含义', '家人 chỉ nhóm người nào?', 'Những người trong gia đình.', [
 ['Tất cả nhân viên ở sân bay.', 'Nhân viên sân bay không mặc nhiên là người nhà.'], ['Mọi hành khách đi cùng chuyến bay.', 'Đi cùng máy bay không tạo quan hệ gia đình.'], ['Những người bán hàng trong cửa hàng.', 'Đây là nghề nghiệp, không phải quan hệ gia đình.']], '家人 là người nhà, các thành viên trong gia đình.');
mc('l15-choice-07', '比较两个到达时刻而非回答时长', 'Theo hai thời điểm đã cho, ai đến sân bay sớm hơn?', '我', [
 ['姐姐', 'Chị gái đến lúc tám giờ, sau bảy giờ.'], ['两个人都八点到。', 'Chỉ chị gái đến lúc tám giờ; người nói đến lúc bảy giờ.'], ['不知道。', 'Đã có đủ hai thời điểm để so sánh.']], 'Bảy giờ sớm hơn tám giờ; người nói đến trước chị gái.', { stem: '我早上七点到机场，姐姐早上八点到机场。' });
mc('l15-choice-08', '接人的行动与到达方向', 'Bạn vừa xuống máy bay. Bố đến sân bay để đưa bạn đi cùng. 接 trong tình huống này có nghĩa gì?', 'Đón một người.', [
 ['Đi học.', 'Đi học là 上学, không phải 接 trong tình huống sân bay.'], ['Mua đồ.', 'Mua đồ là 买东西.'], ['Viết chữ.', 'Viết chữ là 写字.']], '接 một người ở sân bay là đến đón người đó.');
mc('l15-choice-10', '哪个从给定集合中选择', 'Bạn hỏi người nghe muốn chọn món nào trong những món đang có. Chọn từ hỏi một lựa chọn cụ thể.', '哪个', [
 ['哪里', '哪里 hỏi địa điểm, không chọn một món trong nhóm.'], ['去年', '去年 là thời gian năm ngoái, không phải từ hỏi lựa chọn.'], ['小时', '小时 là đơn vị thời lượng.']], '哪个 hỏi chọn cái/món nào trong một tập hợp xác định.', { stem: '这些菜，你想吃___？' });
sorting('l15-sort-01', 'Ghép câu kể hai nơi đã đến trong cùng năm ngoái. Bắt đầu bằng 我; nói 北京 trước, 西安 sau.', 'Năm ngoái tôi đã đi Bắc Kinh, còn đi cả Tây An.', ['我', '去年', '去', '了', '北京', '还', '去', '了', '西安'], ['我去年去了北京，还去了西安。'], '还添加另一个已完成的经历', '还 bổ sung một chuyến đi đã hoàn thành khác trong cùng năm; hai vế đều dùng 去了, không chuyển vế sau thành dự định năm nay.');
sorting('l15-sort-03', 'Ghép câu nói cả nhóm có thời gian để đi đón người nhà. Bắt đầu bằng 我们.', 'Chúng tôi có thời gian đi sân bay đón người nhà.', ['我们', '有时间', '去机场', '接', '家人'], ['我们有时间去机场接家人。'], '有时间表示可安排的时间加行动目的', '有时间 nói có thời gian dành cho việc gì, không phải chuyến đi mất bao lâu. 去机场接家人 nêu việc có thể sắp xếp.');
sorting('l15-sort-04', 'Ghép câu đính chính giờ máy bay đến. Bắt đầu bằng 飞机; nói tám giờ rồi phủ định chín giờ.', 'Máy bay đến Bắc Kinh lúc tám giờ, không phải chín giờ.', ['飞机', '八点', '到', '北京', '不', '是', '九点'], ['飞机八点到北京，不是九点。'], '到达时刻与纠正错误时刻', '八点 là thời điểm máy bay đến; 不是九点 sửa một thời điểm sai, không nói thời lượng bay.');
mc('l15-translationChoice-01', '家人的交通偏好否定', 'Gia đình tôi không thích đi máy bay.', '我的家人不爱坐飞机。', [
 ['我的家人爱坐飞机。', 'Câu này khẳng định thích, trái với phủ định.'], ['我的家人没有飞机。', 'Không có máy bay không nói lên việc có thích đi máy bay hay không.'], ['我的家人正在机场工作。', 'Câu này nói công việc ở sân bay, không nói sở thích đi lại.']], '不爱坐飞机 phủ định sở thích sử dụng máy bay; 家人 là chủ thể tập thể.');
mc('l15-translationChoice-02', '居住年限而非旅行小时数', 'Bạn muốn sống ở Bắc Kinh mấy năm?', '你想在北京住几年？', [
 ['你想几点到北京？', 'Câu này hỏi thời điểm đến, không hỏi số năm sống ở đó.'], ['你在北京有几个家人？', 'Câu này hỏi số người nhà, không hỏi thời lượng cư trú.'], ['你去年住在哪里？', 'Câu này hỏi nơi ở năm ngoái, không hỏi dự định sống bao nhiêu năm.']], '住几年 hỏi thời lượng cư trú theo năm; 在北京 là nơi ở.');
mc('l15-translationChoice-03', '集合内询问来接人的主体', 'Trong những người này, ai đến đón bạn?', '这些人里，谁来接你？', [
 ['这些人里，你来接谁？', 'Câu này hỏi bạn đón ai, đảo vai người đón và người được đón.'], ['这些人都想去机场吗？', 'Câu này hỏi cả nhóm muốn đến sân bay, không hỏi ai đón bạn.'], ['你想和这些人住几年？', 'Câu này hỏi thời gian ở cùng, không nói việc đón.']], '谁 là chủ thể đến đón; 你 là người được đón; 这些人里 giới hạn tập hợp người được hỏi.');
mc('l15-translationChoice-04', '否定一个目的地并说明另一个接人地点', 'Tôi không đi sân bay; tôi đến trường đón người nhà.', '我不去机场，我去学校接家人。', [
 ['我不去学校，我去机场接家人。', 'Câu này đảo địa điểm không đi và địa điểm đến đón.'], ['家人不来学校，我去机场。', 'Câu này đổi chủ thể của mệnh đề đầu và bỏ mục đích đón ở trường.'], ['我去学校学习，不接家人。', 'Câu này phủ định việc đón và đổi mục đích sang học.']], 'Hai vế đối chiếu nơi không đến với nơi thực sự đến và mục đích 接家人.');
mc('l15-translationChoice-05', '没有时间表达无法安排旅行', 'Năm nay tôi không có thời gian đi Bắc Kinh.', '我今年没有时间去北京。', [
 ['我今年有时间去北京。', 'Câu này khẳng định có thời gian, trái với phủ định.'], ['我去年没有去北京。', 'Câu này nói năm ngoái không đi, không nói khả năng sắp xếp năm nay.'], ['去北京要几个小时？', 'Câu này hỏi thời lượng chuyến đi, không nói có thời gian dành cho chuyến đi hay không.']], '没有时间去北京 nói không sắp xếp được thời gian cho chuyến đi, khác với thời gian di chuyển mất bao lâu.');
manual('l15-translation-03', 'Tôi có hai giờ; tôi muốn ở nhà cùng gia đình.', '可用时间与在家陪家人的愿望', 'Replace a destination/transport substitution in a three-hour duration frame with available time plus a stay-at-home preference.');

sorting('l08-sort-01', 'Ghép hai vị trí đối chiếu. Bắt đầu bằng 房间; nói về 书店 ở vế thứ hai.', 'Căn phòng ở ngoài trường; hiệu sách ở trong trường.', ['房间', '在学校外', '书店', '在学校里'], ['房间在学校外，书店在学校里。'], '两种地点与里外的对照', 'Ghép 房间 với 学校外 và 书店 với 学校里. Trong hai vế, không đảo vị trí trong/ngoài giữa căn phòng và hiệu sách.');
