#!/usr/bin/env python3
"""Explicit H2 word TEXT recommendations after actual source/PCM/raw review.

These are bounded context decisions, not automatic CTC or pronunciation approval.
Every ordinal below was read against its own source JSON, original complete raw,
both actual crop raws, the nine local and six complete-source spectrum pages.
"""
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'course-app/docs/final-quality-20261006/audio-context-peer-hsk2-words'
OBS=OUT/'actual-original-word-observation-index.json'

# Broad visually observed original foreground envelopes and the next reading's
# earliest voiced phase, in original seconds. These are manual PCM observations;
# they are not ASR/CTC timestamps, threshold-derived phonemes, or tone certificates.
PHASES={
1:(2.80,3.41,3.85),2:(5.06,5.63,6.12),6:(7.14,7.98,8.34),7:(9.98,10.41,10.96),9:(3.04,3.99,4.34),13:(3.02,3.58,3.95),14:(5.29,5.93,6.28),15:(13.11,13.66,14.14),
18:(3.91,4.51,5.23),19:(6.48,6.99,7.39),22:(6.13,6.62,7.15),23:(8.14,8.96,9.15),24:(.50,1.11,1.79),25:(5.60,6.32,6.68),26:(7.90,8.48,8.91),27:(.29,.82,1.33),
30:(6.70,7.30,7.70),32:(12.47,12.97,13.53),34:(3.30,4.26,4.60),35:(15.44,15.77,16.60),36:(17.83,18.48,18.92),37:(20.57,21.47,21.99),38:(3.63,4.35,4.85),39:(6.16,6.91,7.38),
42:(.58,1.30,1.77),44:(.82,1.84,2.13),46:(6.10,6.57,7.05),47:(6.10,6.57,7.05),48:(8.37,9.40,9.74),49:(3.07,3.64,4.15),50:(5.31,5.90,6.33),51:(7.50,8.06,8.48),
52:(10.455,10.63,11.44),59:(10.58,10.77,11.51),62:(.58,1.18,1.73),66:(.74,1.43,2.62),67:(4.76,5.40,5.94),69:(5.66,6.40,6.81),70:(11.21,11.78,12.47),72:(16.36,16.88,17.50),
73:(5.90,6.40,6.84),75:(.48,1.06,1.74),76:(4.12,4.68,5.16),77:(8.92,9.52,10.16),80:(5.67,6.34,6.78),82:(.61,1.30,1.57),83:(2.48,3.15,3.52),84:(4.75,5.73,6.04),
87:(.50,1.17,1.90),88:(3.17,3.71,4.25),91:(7.78,8.44,8.88),94:(5.90,6.44,6.94),98:(.46,.99,1.57),99:(3.75,4.39,4.69),100:(6.57,7.40,7.80),101:(9.28,9.90,10.47),
102:(.40,1.11,1.62),103:(3.18,3.65,4.23),104:(.50,1.08,1.61),105:(6.31,6.84,7.33),108:(3.19,4.21,4.47),109:(6.11,7.11,7.41),110:(.50,1.40,1.86),111:(12.19,12.82,13.30),
112:(14.59,15.67,16.12),164:(.34,1.59,1.78),165:(3.44,4.19,4.88),166:(6.27,6.96,7.36),167:(8.50,9.11,9.64),168:(8.50,9.11,9.64),169:(10.72,11.42,11.88)
}
NOTES={
1:('crop-model-outlier','原给 gěi；medium 本 crop 给和完整原轨给一致，small 改 gǎi 并非同韵母。第一给读位于两次就之后、第二给之前；保留 small 异词预测，不把原整轨给的 3.88–4.02 时间借作当前首读的音素界。'),
2:('crop-model-outlier','原让 ràng；medium 让!为本 crop 正确词，small 啷通常 lāng 非完整同音。原轨让词头及两次就/给之后的第三词双读序支持身份，原识别差异不改、不推定实际声调。'),
6:('crop-model-outlier','原已经 yǐjīng；small 已經与教材词、完整原轨已经一致。medium 一卿缺原第二音节声母及第一词声调信息，保留异常。两音节第一读在不好意思两读之后、那两读之前，非用后一已经裁片替代。'),
7:('foreign-token-outlier','原那 nà；medium 那及原轨那一致，small Nah是保留的外文 decoder 预测，不把英文字音当中文声调证明。当前仅原词组最后那的第一读，第二读在后独立声区。'),
9:('crop-model-outlier','原有时 yǒushí；small 本 crop 有时和原轨有时一致，medium 鑰匙 yàoshi 不是完整同音。介绍后的第一有时保留两音节与衰减，下一有时未混入，不认证 tone。'),
13:('numeric-token-context','原万 wàn为原独立生词数位，非教材一 yī；两个 crop 的 1 原样保留，不宣称数字1即万或自动数值等价。原轨万词头、啊之后的第二词首读及本实际 crop CTC万仅共同辅助该数位文本身份，数字英读/完整声调未经认证。'),
14:('foreign-token-context','原名 míng；两 crop mean/Mean为原样保留的外文预测，未当中文英语同音认证。原完整词轨名词头、万之后的第三独立词首读和本 crop CTC明（míng）辅助中文书写名；后网上另为词头。'),
15:('same-syllable-context','原间 jiān；small 歼恩为 decoder 分字预测，medium 天 tiān非同声母。完整原词轨间和本 crop CTC肩 jiān提供同源文字辅助；外国双读之后的第六词首读仅一声区，不能把恩当实际新增尾词。'),
18:('crop-model-outlier','原这么 zhème；small 本 crop 这么与原轨相同，medium 这嘛保留末音字形/轻声差异。回来之后的第二词两相位完整，首读在第二读前停顿结束，不把嘛全局变成么。'),
19:('same-syllable-context','原完 wán；small 玩和整轨玩同 wán，CTC玩仅字形辅助。medium 晚安 wǎn ān额外安音节不等完，当前源实际单读前景只有完的一个连续声区、未包含随后第二读；保留该单模型扩词而不改变原书。'),
22:('same-syllable-context','原拿 ná；small 呐?和 medium 哪啊?为短词字形/扩词预测。原轨明确拿、拿且当前是洗/自己后首拿；CTC拿仅词形辅助。不能从哪多音字或啊预测认证声调或实际追加粒子，原原始字保留。'),
23:('crop-model-outlier','原手 shǒu；small 手、原轨手和本 crop CTC手一致；medium 少 shǎo韵母不等。拿后第四词首读的头段及尾滑动完整，后第二手和为什么仍在裁片外。'),
24:('foreign-token-outlier','原送 sòng；medium 送及原整轨送一致，small Song是外文词形预测。当前原轨第一词的第一读，不以 English Song判定中文完整音素或声调；下一第二送与回去均未并入。'),
25:('same-syllable-glyph','原每 měi；双 crop 美及原轨美都为 měi 的书写候选。回去之后第三词第一读源身份、CTC美和印刷 py仅限定此每，不全局把美替换为每、不认证 tone。'),
26:('foreign-token-outlier','原累 lèi；medium 累和原轨累一致，small Lay是短词外文预测，不能把它当英文原读。最后词首读连贯至衰减，与后第二累分开。'),
27:('neutral-aspect-context','本课原过的 py 是 guo，轻声；small 過和完整原轨过保留该词形，medium 哇是独立异词预测，不是guo同音。原轨首过在商场之前的第一读保留完整，不借第六课 guò 的 py给本课认证重声。'),
30:('same-syllable-context','原试 shì；small 是和整轨是为 shì 的同音字形，本 crop CTC是仅辅助；medium 屎 shǐ并非等声调。因为之后第三词首读身份完整，屎预测保留，未声称实际录音第三声或全部声调通过。'),
32:('held-pronunciation-conflict','原更 gèng；两 crop GONE/Gone均非中文声韵证明，整轨梗通常 gěng不等印刷 gèng，本 crop CTC更单独正确也不能覆盖这个双 crop/原轨声调歧义。当前物理首读与次读分开，但完整 gèng 声韵/声调仍待独立核，保留 TEXT hold。'),
34:('crop-model-outlier','原下来 xiàlái；medium 当前 crop 下来正确，small 下禮末韵不等。5-2整个 medium 的后段上来循环和YoYo幻觉完整保留，不能称其全轨所有词头正确。当前实际第2词首读两相位，起尾与第二读分开，仅据本 crop正确 medium/教材原词作有界文字建议。'),
35:('held-source-head-and-pronunciation','原面 miàn；small 蜜眼可能扩音，medium 棉 mián不同声调，CTC面仅单个正确字辅助。5-2完整 medium 在此后段上来循环/YoYo幻觉不能证明面词头；18实际双读组及原ordinal只能给身份候选，不替代完整当前面声韵核验，保留 hold。'),
36:('held-source-head-and-pronunciation','原等 děng；small 到 dào与 medium 大恩均未明确完整 děng，CTC等不能单独认证。5-2全轨 medium 对此后段丢失为上来循环/YoYo，真实两读声区及印刷词序仍只是源身份辅助，不证明鼻韵尾/声调，继续 hold。'),
37:('crop-model-outlier-erhua','原一会儿 yíhuìr；medium 本 crop 一会儿保留完整字形，small 疑惑不等。实际第8词首读的两段主体/末尾在当前几何内、次读在后，5-2全轨幻觉未冒充原词头证明；本 medium加实际完整源顺序只解除文字差异建议，卷舌 r 与实际 tone未认证。'),
38:('same-syllable-glyph','原爷爷 yéye；双 crop 耶耶在此为姓名称谓字形预测，整轨爷爷及 CTC爷爷保留原称谓。进来之后第二词第一读的两次音节主体完整，耶字的字形不能代替第二音节轻声认证。'),
39:('crop-model-outlier','原奶奶 nǎinai；small 來,來与medium 奈奈保留不同声母/声调字形预测。原轨奶奶、CTC奶奶以及进来/爷爷后第三词两相位共同辅助该称谓身份；不把奈 nài直接叫作 nǎi等声调，不认证轻声或tone。'),
42:('crop-model-outlier','原走 zǒu；small 本 crop 走和原轨走一致，medium 早 zǎo韵母不同。原轨第一词第一读完整，后第二走及酒店分别位于声区之外，保留早预测。'),
44:('crop-model-outlier','原生日 shēngrì；medium 本 crop 生日与完整原轨生日一致，small 生育 shēngyù末韵/声母不等。首词两个相位完整，第二生日与忘词头在裁片外。'),
46:('same-syllable-glyph','原画 huà；small 化和 medium 话为 huà同音书写候选，整轨画与 CTC画辅助教材字义。实际6-2第三词第一读完整；此词与另一教材词性ID共享原PCM，但各自ID/来源均保留。'),
47:('same-syllable-glyph','本独立ID原画 huà，非上一个ID的记录覆盖；small 化/medium 话与印刷 huà同音，整轨画明确第三词头。与另画ID实际同PCM几何是源别名，仍各自保留ID和原数据，未把一次裁片当两份新音素认证。'),
48:('same-syllable-glyph','原画笔 huàbǐ；small 畫筆为原词字形，medium 划笔中的划此候选保留为huà/hua多音字，不作全局转换。原轨画笔、CTC画笔和画之后第四词两相位辅助本词；起前低频扰动属源暂停中弱背景，真正两主体与末尾在裁片内，后第二读排除。'),
49:('crop-model-outlier-context','原鱼 yú；双 crop 嗯/嗯?不是 yú同音或完整音素证明，保留短词 decoder异字。原轨鱼、实际长之后第二词两读第一声区及 CTC鱼只共同辅助文本鱼身份，不从嗯预测或CTC词形声称送气/韵母/tone认证。'),
50:('foreign-token-context','原肉 ròu；crop Roll/roll保留外文预测，不能据其英语读音认证中文肉。完整原轨肉、当前第三词首读完整声区和 CTC肉共同辅助原词文字身份，后第二肉及过在外。'),
51:('foreign-token-outlier','本课原过 guò与第四课轻声guo区分；medium 過为当前本词，small GO!保留外文预测。原轨过、鱼肉之后第4词第一读完整，未自动把英语go等同guò或认证声调。'),
52:('neutral-de-glyph','原地的 py de；medium 得、整轨得和 CTC的在该助词为中性 de书写候选，small 哼保留单模型异字。原轨最后一词首读是独立短声区完整，不把地dì的实词读法带入、不认证实际轻声。'),
59:('neutral-de-glyph','原得 py de；small 的、medium 得、整轨的及 CTC的为当前助词de文字选择。运动/踢/足球/球后最后词首读与次读间有实际长停顿，短声区完整；不泛化的dì或得dé的其他读法。'),
62:('foreign-token-outlier','原记得 jìde；medium 本 crop 记得及原轨一致，small Tita保留外文预测。首词两个音节的完整声区和末尾释放保留，后第二记得/爱情片均不借用来认证此首读。'),
66:('same-syllable-context','原妻子 qīzi；medium 七字仅 qi/zi候选而字通常 zì不同轻声，small cheese外文预测均保留。原完整轨妻子和 CTC妻子辅助称谓，第一词两个相位完整；不从英文cheese或字调推定实际轻声。'),
67:('crop-model-outlier','原丈夫 zhàngfu；medium 本 crop 丈夫与完整原轨相同，small 帐篷 zhàngpeng第二韵不等。第二词第一读有完整首音主体和后轻音相位、与第二丈夫/饭馆分开，保留帐篷异词预测。'),
69:('crop-model-outlier-erhua','原男孩儿 nánháir；medium 本 crop 男孩儿保留儿，small及整轨男孩省字。第3词首读整个男孩声区及末尾在裁片内、次读排除，只作文字错识建议，真实r成分/声调不由儿字输出认证。'),
70:('crop-model-outlier','原个子 gèzi；medium 鴿子 gézi与原字声调不同，small Good!外文预测保留。原轨个子、CTC个子及这样后第5词两相位首读共同辅助教材文本；不把鴿gé称作gè同调、不认证tone。'),
72:('held-tail-and-pronunciation','原高 gāo；small GO!/medium 告 gào未提供当前 gāo声调证，CTC高和完整原轨高仅辅助。首读强主体虽在裁片内，源能量观测尾区超当前末界约90ms有噪声/尾音歧义，不能用quiet边缘或阈值把弱尾自动否掉；当前首读保持待核，可另审实际second候选。'),
73:('same-syllable-context','原离 lí；整轨梨和 CTC梨为 lí同音字形，small 李 lǐ及medium 禮儀 lǐyí并非完整同调/同音节数。原第三词离的第一读仅一个完整声区，额外仪预测保留，未从梨字或源序认证实际tone。'),
75:('crop-model-outlier','原周 zhōu，原轨仅此词的两读；medium 本 crop 周与整轨周相同，small 啾 jiū非完整同声韵。第一读从原暂停后进入、末尾衰减后才第二读，保留啾预测而不认证声母送气。'),
76:('foreign-token-context','原门 mén；crop 麦 mài和 malm并非标准mén转录，原样保留。原轨门、CTC门以及开学双读后第二词首读身份共同辅助此书写，完整一声区和鼻尾衰减在当前几何内，仍未完整认证音素/tone。'),
77:('foreign-token-context','原笔 bǐ；双 crop B原样保留，不把英语字母bī自动认证为 bǐ。原轨笔/CTC笔与后面后第4词首读身份辅助此字义，起前弱低频呼吸属实际源而非另词，完整发声主体和末尾在裁片内。'),
80:('crop-model-outlier','原本子 běnzi；medium 本 crop 本子和原轨本子一致，small 板子 bǎnzi韵母不同。考试/词后第3词首读的两相位保留，下一本子和错不包含，原异词保留。'),
82:('same-syllable-glyph','原考 kǎo；medium 考、整轨烤及 CTC考在当前词为kǎo同音书写候选，small 好hǎo非同声母。首词第一读完整且独立于第二考/快要，不把烤字义写入原教材。'),
83:('crop-model-outlier','原疼 téng；medium 当前 crop 疼、整轨疼和 CTC疼一致，small 彭 péng声母不同。头之后第二词首读末鼻尾衰减在cut内、后第二疼和经常在外，音素/tone未认证。'),
84:('crop-model-outlier','原经常 jīngcháng；small 经常及原轨正确，medium 精禅末韵/多音字预测保留而非泛化常=禅。疼后第3词两音节第一读完整，后第二读排除。'),
87:('held-pronunciation-conflict','原路上 lùshang；small 納稍、medium 努力均未明确完整lùshang，不能只凭 CTC路上解除。整轨路上及实际首词两读源序辅助身份，当前2相位几何完整也不证明声韵相同；完整当前声母/末音轻声仍未知，保持 hold。'),
88:('foreign-token-outlier','原慢 màn；medium 本 crop 慢与完整原轨慢一致，small Mine保留外文预测。路上两读之后第二词首读有独立完整声区，后第二慢不并入，不从英语发音证明中文tone。'),
91:('same-syllable-context','原时 shí；CTC十和完整原轨食为 shí同音字形辅助，medium 是 shì非同调，small C外文预测保留。身体之后第4词首读的擦音头部与发声主体全部在cut内；不能据字形认证实际声调或把C当原读。'),
94:('same-syllable-context','原正 zhèng；完整原轨证同 zhèng、CTC正辅助书写，crop John/done外文预测不作中文音素证明。事情/晴后第3词首读完整，鼻尾衰减与次读前静音分明，不自动从英文词释音。'),
98:('crop-model-outlier','原站 zhàn；medium 当前 crop 战!和原轨站/CTC站为此zhàn同音书写，small John外文预测保留。原首词第一读完整，第二站及小时候在外，书面站保留。'),
99:('same-syllable-glyph','原教 py jiāo；medium 教与原轨交为此处 jiāo字形候选，small see you并非原中文音节认证。新年之后第二词首读完整，两个读次明显；不把教的另读jiào代入。'),
100:('crop-model-outlier','原里面 lǐmiàn；medium 当前 crop 里面及完整原轨一致，small 离灭在韵母/声调上不完整等价。上面/洗手间后第3词两音节首读保留，后第二里面与笔不拼入。'),
101:('foreign-token-context','原笔 bǐ；small B和medium 嗶通常 bī均不当完整 bǐ声调证明。原轨笔、CTC笔和里面后第4词首读身份辅助书写，完整发声主体及末尾在当前几何内，不能用原词序冒充full phoneme。'),
102:('crop-model-outlier','原告诉 gàosu；medium 当前 crop 告诉与完整原轨相同，small 高速 gāosù声调/第二字不是完整同音。首词两相位及末端完整，后第二告诉/班在外，原错误转录原样保留。'),
103:('same-syllable-context','原班 bān；整轨搬与教材bān同音，CTC班辅助书写；crop BUN/fun外文预测不当中文完整声韵证明。告诉双读后第二词首读完整，独立于后第二班。'),
104:('same-syllable-glyph','本课原站 zhàn；medium 讚和完整原轨战均为此处zhàn同音书写候选，small John保留。原词轨首站第一读完整，后第二站和包都不拼接，原字站与ID保持。'),
105:('same-syllable-glyph','原位 wèi；medium 喂和 CTC喂同wèi，整轨位限定书写，small way外文预测保留。过年/没意思后第3词首读完整，第二位/前面排除，未把英语way当声调认证。'),
108:('crop-model-outlier-erhua','原小孩儿 xiǎoháir；medium 本 crop 小孩儿保留儿，small/原轨小孩省写儿。房子之后第二词首读有完整两相位及末尾，次读和女孩儿在外；只建议解除文字差异，r和tone未经完整音素认证。'),
109:('crop-model-outlier-erhua','原女孩儿 nǚháir；medium 本 crop 女孩儿保留儿，small/原轨女孩省写儿。小孩儿之后第3词首读两相位及末尾在当前cut内，与第二女孩儿分开；不能从medium儿字认证实际卷舌。'),
110:('same-syllable-context','原姓 xìng；medium 幸及整轨性/CTC性在该xìng为同音字形候选，small 心 xīn没有ng尾且不同tone。首词擦音起段和末鼻音衰减处于几何内部，后第二姓和眼睛排除，保留心预测且未认证鼻韵尾。'),
111:('held-pronunciation-conflict','原路 lù；small LOOL与medium 喏均不是明确当前完整 lù的字形证据。原完整词轨路和 CTC路只能辅助源身份；出门后第5词首读虽物理完整，不能以CTC或原轨另一读词形覆盖当前双模型声韵歧义，保持 hold。'),
112:('same-syllable-name-context','原颐和园 Yíhé Yuán；small 宜河原在此为 yí hé yuán的名称书写候选，medium 一合圆保留第一字通常yī与原yí不同tone；完整原轨银河园的银yín多鼻韵尾亦保留。当前本crop小模型/CTC和第6词首读三相位共同辅助名称文字，未认证鼻尾/声调，也不将原书改银河园。'),
164:('current-source-boundary-only','原手表 shǒubiǎo；两 crop 手錶/手表都保留原完整词，CTC手表只辅助。独立全源/局部谱可见第一shou、biao主体约0.34–1.59，第二读约1.78起；-42能量把两读合为一组不能当语义/边界证，当前cut1.7400625在二读前真实暂停且4quiet实核。此ID现无TEXT hold，只记录独立真实首读复验。'),
165:('current-source-boundary-only','原左边 zuǒbian；双crop左邊/左边与原书完整一致。原手表双读后第2词首读左/边两相位完整，尾前停顿后才第二读，现无TEXT hold、不制造额外纠字；原轻声未作native认证。'),
166:('current-source-boundary-only','原左 zuǒ；两crop左一致。完整原轨左词头、左边双读后第3词的第一声区与第2声区分别保留，当前仅一读。现无TEXT hold，不把谱波形或一致ASR宣称声调认证。'),
167:('foreign-token-context','本独立ID原比 bǐ；crop B/哼保留外文与异字预测，原轨笔和CTC比在此分别为bǐ同音字形辅助及原词形。左之后第4词首读完整；该几何与另一比ID为源别名，各自教材ID/历史不合并、不认证字母B=bǐ。'),
168:('foreign-token-context','本独立ID原比 bǐ，保留另一教材义项ID的独立来源；双crop B/哼不改。整轨笔bǐ和本cropCTC比辅助本教材书写，当前同源第4词首读完整且次读排除；与另比同PCM不计算成两份独立音素证明。'),
169:('current-source-boundary-only','原右边 yòubian；两crop右边与原书一致。原比双读后第5词首读右/边两相位与衰减完整，后第二右边和右独立排除；现无TEXT hold，仅独立复验首读几何，未认证轻声/native。')
}

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}

def main():
    assert sha(OBS)=='993b5002a9b8af5c646350e7221468675f44c53c8d681cb13549a82b88bb2646'
    observed=json.loads(OBS.read_text());sources={r['sourceTrack']:r for r in observed['originalSources']}
    assert set(NOTES)==set(PHASES)=={r['poolOrdinal'] for r in observed['targets']}
    decisions=[];held=[]
    for row in observed['targets']:
        ordinal=row['poolOrdinal'];category,note=NOTES[ordinal];is_hold=category.startswith('held-')
        start,end=row['sourceSampleRange16k'];marks=[round(v*16000) for v in PHASES[ordinal][:2]];next_voice=round(PHASES[ordinal][2]*16000)
        assert start<=marks[0]<marks[1]<=end<=next_voice<=row['actualOriginalSampleCount16k']
        assert row['originalReadingOrdinal']==1
        source=sources[row['sourceTrack']];heads=row['printedHeadsInOriginalSourceOrder']
        head_index=next(i for i,h in enumerate(heads) if h['sourceZH']==row['sourceText'] and h['sourcePinyin']==row['sourcePinyin'])
        previous_head=heads[head_index-1] if head_index else None;next_head=heads[head_index+1] if head_index+1<len(heads) else None
        order_note=f"已独立看完整原轨谱 {Path(source['actualWholeSourceWaveformSpectrum']['file']).name} panel{source['actualWholeSourceWaveformSpectrum']['panelOrdinal']} 与本ID局部谱 {Path(row['actualSourceWaveformAndSpectrum']['file']).name} panel{row['actualSourceWaveformAndSpectrum']['panelOrdinal']}：原书词頭序第{head_index+1}项 py={row['sourcePinyin']!r}，原两读均在同真实源，当前为首读；前词={None if previous_head is None else previous_head['sourceZH']!r}、后词={None if next_head is None else next_head['sourceZH']!r}。整轨模型可能压掉重复，原能量分组仅候选，不用run count或源词序认证全部音素。"
        boundary_note=f"实际整数cut={row['sourceSampleRange16k']}；独立可见宽前景包络={marks}，第二读最早可见前景约frame{next_voice}，当前相邻第二读未混入；4个真实20ms边缘RMS={row['actualEdgeRMSDbFS20ms']}均<=既有-45dBFS。包络是人工选定机器谱观测，非CTC/Whisper词时戳或自动阈值音素界，安静起尾本身不证明内容或tone。"
        rationale=note+order_note+boundary_note
        raw=[{'sourceText':row['sourceText'],'observedRawText':m['rawTranscript'],**{k:m[k] for k in ('file','sha256','modelRepository','modelRevision')},'rawRetainedVerbatim':True} for m in row['actualCropModelEvidence']]
        proof={'sourceText':row['sourceText'],'sourceTrack':row['sourceTrack'],'sourceSHA256':row['sourceSHA256'],'sourcePCM_SHA256':row['sourcePCM_SHA256'],
               'sourceSampleRange16k':row['sourceSampleRange16k'],'cropPCM_SHA256':row['cropPCM_SHA256'],'sourcePinyin':row['sourcePinyin'],
               'canonicalPrintedSource':row['canonicalPrintedSource'],'sourceGroupEvidence':row['sourceGroupEvidence'],
               'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,'originalRepeatedReadingsChecked':True,'neighborSpeechExcluded':True,
               'actualCropBoundariesChecked':True,'phoneticEquivalenceIsAuxiliaryOnly':True,'actualOriginalPCMObservation':{**ref(OBS),'id':row['id']},
               'actualOriginalWholeSourceSpectrum':source['actualWholeSourceWaveformSpectrum'],'actualCurrentCropSourceSpectrum':row['actualSourceWaveformAndSpectrum'],
               'actualFourEdgeRMSDbFS20ms':row['actualEdgeRMSDbFS20ms'],'manuallyObservedForegroundEnvelope16k':marks,'manuallyObservedFollowingReadingEarliestForeground16k':next_voice,
               'sourceHeadOrdinalOneBasedAuxiliaryOnly':head_index+1,'originalCurrentReadingOrdinal':1,'originalSourceOccurrenceAuxiliaryOnly':row['originalOccurrenceObservationAuxiliaryOnly'],
               'actualCTCWordIdentityAuxiliaryOnly':row['actualCTCAuxiliaryOnly'],'CTCTimestampsNeverUsedForPhonemeOrBoundaryMarks':True,
               'rawDifferences':raw,'explanation':rationale,'fullPhonemeCertification':False}
        decision={'id':row['id'],'poolOrdinal':ordinal,'sourceSampleRange16k':row['sourceSampleRange16k'],'decision':'hold' if is_hold else 'accept',
                  'category':category,'recommendationScope':'independent machine-only exact original first-reading source-context TEXT recommendation; no complete phoneme, tone, native, human or device certificate',
                  'sourceContextChecked':True,'rationale':rationale,'sourceContextEvidence':proof,'resolvedTextHolds':[] if is_hold else row['holdsUnchanged'],
                  'resolvedSourceHolds':[],'resolvedBoundaryHolds':[],'retainedHolds':row['holdsUnchanged'] if is_hold else [],'acknowledgedFlags':row['flagsUnchanged'],
                  'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False,
                  'rawEvidenceUnchanged':True,'originalGeometryUnchanged':True,'productionApproved':False}
        decisions.append(decision)
        if is_hold:held.append({'id':row['id'],'poolOrdinal':ordinal,'canonicalSource':row['canonicalPrintedSource'],'sourceText':row['sourceText'],'sourcePinyin':row['sourcePinyin'],
                               'sourceTrack':row['sourceTrack'],'sourceSHA256':row['sourceSHA256'],'sourcePCM_SHA256':row['sourcePCM_SHA256'],'sourceSampleRange16k':row['sourceSampleRange16k'],
                               'cropPCM_SHA256':row['cropPCM_SHA256'],'rawDifferences':raw,'fullOriginalSourceEvidence':row['fullOriginalSourceEvidence'],
                               'actualCTCAuxiliaryOnly':row['actualCTCAuxiliaryOnly'],'reason':note,'canonicalPhonemesApproved':False,'recordedVariantApproved':False})
    counts={**observed['counts'],'explicitPerIDRecommendations':71,'scopedAcceptRecommendations':sum(d['decision']=='accept' for d in decisions),
            'heldRecommendations':len(held),'alreadyNoTextHoldIDsObserved':sum(not r['holdsUnchanged'] for r in observed['targets']),
            'actualTextHoldIDsWithAcceptRecommendation':sum(d['decision']=='accept' and bool(d['resolvedTextHolds']) for d in decisions),
            'allLocalAndFullSourcePagesIndependentlyViewed':15}
    report={'schemaVersion':1,'status':'explicit-independent-peer-recommendations-not-production-authority','reviewer':'/root/acceptance_scope_plan',
            'sourcePoolEvidence':observed['sourcePoolEvidence'],'reviewReportFile':observed['pairedReviewReportEvidence']['file'],
            'reviewReportSHA256':observed['pairedReviewReportEvidence']['sha256'],'actualObservationEvidence':ref(OBS),'scriptEvidence':ref(Path(__file__)),
            'counts':counts,'decisions':decisions,'newInferencePerformed':False,'sourceModified':False,'proposalsModified':False,
            'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False,'productionApproved':False}
    path=OUT/'explicit-word-context-peer-recommendations.json';path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    holdpath=OUT/'held-current-first-reading-word-scopes.json';holdpath.write_text(json.dumps({'schemaVersion':1,'status':'held-exact-original-scopes-no-variant-approval',
                               'recommendationEvidence':ref(path),'targets':held,'originalSourceUnchanged':True,'studentVariantOverlayWritten':False,
                               'humanListening':False,'nativeSpeakerReview':False,'fullPhonemeCertification':False},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'file':str(path.relative_to(ROOT)),'sha256':sha(path),'heldFile':str(holdpath.relative_to(ROOT)),'heldSHA256':sha(holdpath),'counts':counts}))

if __name__=='__main__':main()
