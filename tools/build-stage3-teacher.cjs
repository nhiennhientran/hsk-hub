#!/usr/bin/env node
'use strict';

// Teacher-only reference. Question text, answers and vocabulary are read from
// the learner JSON files; this file must never contain a parallel answer bank.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const ROOT = path.resolve(__dirname, '..');
const APP = 'new-hsk1/hsk1/stage3';
const OUTPUT = path.join(ROOT, 'dist/stage3/HSK1-Step3-Teacher-Guide.html');
const SUFFIXES = ['01-05', '06-10', '11-15'];
const inputs = [];
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const num = value => Number(value).toFixed(3).replace(/\.?0+$/, '');
const read = file => {
  const raw = fs.readFileSync(path.join(ROOT, file));
  const data = JSON.parse(raw);
  inputs.push({file, sha256: sha(raw)});
  return data;
};

const listening = SUFFIXES.flatMap(s => read(`${APP}/data/listening-${s}.json`));
const vocabulary = SUFFIXES.flatMap(s => read(`${APP}/data/vocabulary-${s}.json`));
const manifestFile = `${APP}/media-manifest.json`;
const manifestRaw = fs.readFileSync(path.join(ROOT, manifestFile));
const manifest = JSON.parse(manifestRaw);
const clipById = new Map(manifest.clips.map(clip => [clip.id, clip]));
const declaredInputs = new Map(manifest.sourceData.map(row => [row.file, row.sha256]));

assert.equal(listening.length, 75, 'The approved Stage 3 listening bank must have 75 questions.');
assert.equal(vocabulary.length, 344, 'The approved Stage 3 vocabulary bank must have 344 source/sense records.');
assert.equal(new Set(listening.map(row => row.id)).size, listening.length, 'Duplicate listening ID.');
assert.equal(new Set(vocabulary.map(row => row.id)).size, vocabulary.length, 'Duplicate vocabulary ID.');
assert.equal(clipById.size, manifest.clips.length, 'Duplicate manifest clip ID.');
for (const input of inputs) {
  assert.equal(declaredInputs.get(input.file), input.sha256,
    `Media manifest is stale for ${input.file}. Rebuild with python tools/build-stage3-media.py, then rerun this generator.`);
}
for (const row of [...listening, ...vocabulary]) {
  assert.ok(Number.isInteger(row.lesson) && row.lesson >= 1 && row.lesson <= 15, `${row.id}: invalid lesson.`);
  assert.ok(row.source.printPages.length && row.source.pdfPages.length, `${row.id}: missing textbook source.`);
  if (row.audio) {
    const clip = clipById.get(row.id);
    assert.ok(clip, `${row.id}: missing media manifest entry.`);
    for (const key of ['track', 'start', 'end']) {
      assert.equal(clip[key], row.audio[key], `${row.id}: manifest ${key} differs from source JSON.`);
    }
  } else {
    assert.ok(!clipById.has(row.id), `${row.id}: audio-null row unexpectedly has a media clip.`);
  }
}
for (const q of listening) {
  assert.equal(q.options.length, 4, `${q.id}: requires four options.`);
  assert.equal(q.optionFeedback.length, 4, `${q.id}: requires four feedback entries.`);
  assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, `${q.id}: invalid correct option.`);
  assert.ok(q.transcript.length, `${q.id}: missing transcript.`);
}
for (let lesson = 1; lesson <= 15; lesson++) {
  assert.equal(listening.filter(q => q.lesson === lesson).length, 5, `Lesson ${lesson}: requires five listening questions.`);
}

const noAudio = vocabulary.filter(v => !v.audio);
const senses = new Set(vocabulary.map(v => v.senseId));
const writtenForms = new Set(vocabulary.map(v => v.zh));
const category = kind => ({word: '词语／短语', sentence: '完整话轮', dialogue: '短对话'}[kind] || kind);
const pages = source => `印刷页 ${source.printPages.map(esc).join('、')} / PDF页 ${source.pdfPages.map(esc).join('、')} · ${esc(source.section)}`;
const audioText = row => {
  if (!row.audio) return '<strong class="no-audio">无独立原音</strong><br>教材数字表；保留回忆与自评，不以其他词音代替。';
  const a = row.audio, clip = clipById.get(row.id);
  return `音轨 <code>${esc(a.track)}</code> · ${num(a.start)}–${num(a.end)} 秒<br><span class="minor">独立片段 ${num(clip.duration)} 秒；${esc(a.timingBasis)}</span>`;
};
const question = q => `<article class="question" id="${esc(q.id)}" data-question-id="${esc(q.id)}">
  <div class="question-heading"><h4>${esc(q.id)}</h4><span class="tag">第${q.lesson}课 · ${esc(category(q.kind))}</span></div>
  <p class="task" lang="vi">${esc(q.promptVi)}</p>
  <p class="minor">目标：${esc(q.skill)}</p>
  <div class="transcript">${q.transcript.map((t, i) => `<div class="turn"><span class="turn-number">${q.transcript.length > 1 ? `话轮 ${i + 1}` : '原文'}</span>${t.speaker ? `<span class="minor">${esc(t.speaker)}</span>` : ''}<p class="zh" lang="zh-Hans">${esc(t.zh)}</p><p class="pinyin">${esc(t.py)}</p><p lang="vi">${esc(t.vi)}</p></div>`).join('')}</div>
  <p class="answer"><strong>正确项（标准库顺序）：${'ABCD'[q.answer]}</strong> · <span lang="vi">${esc(q.options[q.answer])}</span></p>
  <table class="options"><caption>标准库选项与逐项反馈；学生端字母位置每轮可能不同</caption><thead><tr><th scope="col">标准库</th><th scope="col">越语选项</th><th scope="col">逐项反馈</th></tr></thead><tbody>${q.options.map((option, i) => `<tr${i === q.answer ? ' class="correct"' : ''}><th scope="row">${'ABCD'[i]}${i === q.answer ? '<br><span class="correct-label">正确</span>' : ''}</th><td lang="vi">${esc(option)}</td><td lang="vi">${esc(q.optionFeedback[i])}</td></tr>`).join('')}</tbody></table>
  <p class="explanation"><strong>解析：</strong><span lang="vi">${esc(q.explanationVi)}</span></p>
  <p class="keywords"><strong>关键词：</strong>${q.keywords.map(k => `<span lang="zh-Hans">${esc(k.zh)}</span> · ${esc(k.py)} · <span lang="vi">${esc(k.vi)}</span>`).join('；')}</p>
  <div class="source"><p>${pages(q.source)}</p><p>${audioText(q)}</p></div>
</article>`;
const vocabRow = v => `<tr id="${esc(v.id)}" data-vocabulary-id="${esc(v.id)}"><th scope="row"><span class="zh" lang="zh-Hans">${esc(v.zh)}</span><span class="pinyin block">${esc(v.py)}</span><span class="minor block">第${v.lesson}课${v.extension ? ' · 教材扩展' : ''}${v.category === 'proper_noun' ? ' · 专名' : ''}</span></th><td lang="vi">${esc(v.vi)}</td><td><span lang="zh-Hans">${esc(v.senseZh)}</span>${v.cueZh ? `<p class="cue">语境提示：${esc(v.cueZh)}</p>` : ''}<code class="record-id">${esc(v.senseId)}</code></td><td>${pages(v.source)}</td><td>${audioText(v)}</td></tr>`;
const lessonSection = lesson => {
  const qs = listening.filter(q => q.lesson === lesson);
  const vs = vocabulary.filter(v => v.lesson === lesson);
  return `<section class="lesson" id="lesson-${lesson}" data-lesson="${lesson}" aria-labelledby="lesson-title-${lesson}"><h2 id="lesson-title-${lesson}">第${lesson}课 <small>Bài ${lesson}</small></h2><p class="lesson-count">${qs.length}道听力题 · ${vs.length}条词汇义项记录</p><h3>听力题与教师参考</h3>${qs.map(question).join('\n')}<h3>词汇义项与教材来源</h3><div class="table-scroll"><table class="vocabulary"><caption>第${lesson}课词卡：${vs.length}条；同字不同义分行保存</caption><thead><tr><th scope="col">中文／拼音</th><th scope="col">本课越语义</th><th scope="col">中文义项／提示</th><th scope="col">教材出处</th><th scope="col">本课词音</th></tr></thead><tbody>${vs.map(vocabRow).join('\n')}</tbody></table></div><p class="back-top"><a href="#contents">返回15课目录</a></p></section>`;
};

const html = `<!doctype html>
<html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><link rel="icon" href="data:,"><title>HSK1 第三步 · 教师审阅手册</title>
<style>
:root{font-family:system-ui,-apple-system,"Segoe UI","Noto Sans CJK SC","Microsoft YaHei",sans-serif;color:#18282b;background:#f1f5f4;font-size:16px;line-height:1.65;--accent:#176258;--border:#cddbd7;--muted:#526560}*{box-sizing:border-box}body{margin:0}a{color:#125b52;text-underline-offset:3px}header,main,footer{max-width:1160px;margin:auto;padding:2rem 2.2rem}header{background:#e0eee8;border-bottom:4px solid var(--accent)}.eyebrow{font-size:.85rem;letter-spacing:.08em;font-weight:700;color:var(--accent)}h1{font-size:2.3rem;line-height:1.2;margin:.5rem 0 1rem}h2{font-size:1.7rem;color:#174c44;border-bottom:2px solid var(--accent);padding-bottom:.35rem;line-height:1.4}h2 small{font-size:.75em;font-weight:500;color:var(--muted)}h3{font-size:1.25rem;margin:1.8rem 0 .7rem}h4{margin:0;font-size:1.05rem}p{margin:.45rem 0 .75rem}.stats{display:flex;flex-wrap:wrap;gap:.7rem;margin:1.3rem 0 0}.stats span,.tag{background:#fff;border:1px solid var(--border);border-radius:.45rem;padding:.35rem .75rem}.stats strong{font-size:1.15rem;color:var(--accent)}.notice{border-left:5px solid var(--accent);padding:.9rem 1.15rem;background:#eaf3ef;margin:1rem 0}.notice strong{color:#16483f}.lead{font-size:1.08rem}.minor,.record-id,.pinyin{color:var(--muted)}.minor{font-size:.85rem}.pinyin{font-size:.94rem}.block{display:block}code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.83em;overflow-wrap:anywhere}.toc{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.55rem;list-style:none;padding:0}.toc a{display:block;padding:.6rem;text-align:center;border:1px solid var(--border);border-radius:.35rem;background:white}.toolbar{display:flex;gap:1rem;align-items:center;flex-wrap:wrap;margin:1rem 0;padding:.8rem;background:#fff;border:1px solid var(--border);border-radius:.4rem}.toolbar select,.toolbar button{font:inherit;border:1px solid #829e96;border-radius:.3rem;padding:.35rem .65rem;background:#fff;color:#173e36}.toolbar button{background:var(--accent);color:white}.toolbar select:focus-visible,.toolbar button:focus-visible,a:focus-visible{outline:3px solid #b7791f;outline-offset:3px}.lesson{margin-top:3rem;padding-top:.6rem;scroll-margin-top:1rem}.lesson-count{color:var(--muted)}.question{background:#fff;border:1px solid var(--border);border-radius:.6rem;padding:1.2rem 1.4rem;margin:1rem 0 1.4rem}.question-heading{display:flex;justify-content:space-between;align-items:center;gap:.6rem;flex-wrap:wrap}.tag{font-size:.8rem;white-space:nowrap;background:#f1f5f4}.task{font-size:1.08rem;font-weight:650;margin-top:.8rem}.transcript{border-left:3px solid #b3cec1;padding-left:1rem;margin:1rem 0}.turn+.turn{border-top:1px dashed var(--border);padding-top:.7rem;margin-top:.8rem}.turn p{margin:.1rem 0}.turn-number{font-size:.78rem;color:var(--muted);margin-right:.7rem}.zh{font-size:1.17rem;font-weight:550}.answer{background:#eef6ee;padding:.7rem .9rem;border-radius:.3rem;border:1px solid #bad2ba}.answer strong{color:#28592f}.explanation{margin-top:.8rem}.source{font-size:.85rem;color:var(--muted);border-top:1px dashed var(--border);padding-top:.5rem}.source p{margin:.2rem 0}.keywords{font-size:.93rem}table{width:100%;border-collapse:collapse;background:#fff;font-size:.91rem;table-layout:fixed;margin:.8rem 0 1rem}caption{text-align:left;font-size:.85rem;color:var(--muted);padding:0 0 .4rem}th,td{border:1px solid var(--border);padding:.55rem .65rem;vertical-align:top;text-align:left;overflow-wrap:anywhere}thead th{background:#eaf1ed;font-weight:650}.options th:first-child{width:12%}.options th:nth-child(2){width:34%}.correct td,.correct th{background:#f1f7ee}.correct-label{font-size:.8rem;font-weight:700;color:#28592f}.vocabulary th:first-child{width:17%}.vocabulary th:nth-child(2){width:20%}.vocabulary th:nth-child(3){width:26%}.vocabulary th:nth-child(4){width:16%}.vocabulary th:nth-child(5){width:21%}.record-id{display:block;margin-top:.4rem;font-size:.7rem;line-height:1.4}.cue{font-size:.85rem;margin:.4rem 0}.no-audio{font-size:.85rem;color:#694b15}.schedule th:first-child{width:27%}.back-top{font-size:.9rem}.provenance{font-size:.83rem}.provenance th:first-child{width:49%}.provenance code{font-size:.78rem;word-break:break-all}footer{color:var(--muted);font-size:.85rem;border-top:1px solid var(--border)}[hidden]{display:none!important}.print-scope{font-size:.85rem;color:var(--muted)}
@media(max-width:720px){header,main,footer{padding:1.3rem 1rem}h1{font-size:1.8rem}.toc{grid-template-columns:repeat(3,minmax(0,1fr))}.question{padding:1rem}.table-scroll{overflow-x:auto}.vocabulary{min-width:820px}.options{font-size:.84rem}.options th,.options td{padding:.4rem}.question-heading{align-items:flex-start}}
@page{size:A4 portrait;margin:13mm 12mm 15mm}
@media print{:root{font-size:10pt;line-height:1.4;color:#111;background:white}body,header,main,footer{background:white;max-width:none;margin:0;padding:0}header{border-bottom:1.5pt solid #555;padding-bottom:5mm;margin-bottom:5mm}h1{font-size:23pt}h2{font-size:18pt;border-color:#555}h3{font-size:13pt}h4{font-size:11pt}h2,h3,h4,caption{break-after:avoid}p{orphans:3;widows:3}.toolbar,.back-top{display:none!important}.stats{margin:.7rem 0}.stats span{border-color:#bbb;padding:.3rem .6rem}.toc{grid-template-columns:repeat(5,minmax(0,1fr));gap:2mm}.toc a{padding:2mm}.lesson{break-before:page;margin:0;padding:0}.question{padding:3mm;border:1px solid #ccc;border-radius:0;margin:3mm 0 5mm;break-inside:auto}.question-heading,.turn,.answer,.source,tr{break-inside:avoid}.transcript{padding-left:3mm;margin:3mm 0}.table-scroll{overflow:visible}.vocabulary{min-width:0}.vocabulary,.options{font-size:8.3pt}th,td{padding:2mm 2.2mm}.vocabulary .zh{font-size:11pt}.vocabulary .pinyin{font-size:8.3pt}.vocabulary .minor{font-size:7.5pt}.record-id{font-size:6.5pt}.options th:first-child{width:10%}.correct-label{font-size:8pt}.tag{font-size:8pt}.source,.minor{font-size:8pt}.provenance{font-size:7.4pt}.provenance code{font-size:6.7pt}.notice{padding:3mm;border-left:2pt solid #555}.provenance-section{break-before:page}thead{display:table-header-group}a{color:inherit;text-decoration:none}footer{margin-top:5mm;padding-top:3mm;font-size:8pt}}
</style></head><body>
<header><p class="eyebrow">新HSK教程1 · 第三步教师参考</p><h1>原音听力与混课词卡<br>教师审阅手册</h1><p class="lead">帮助教师核对本课目标、原文与答案，并安排适合越南学生的听辨、回忆和复述练习。</p><div class="stats"><span><strong>${listening.length}</strong> 道听力</span><span><strong>${vocabulary.length}</strong> 条词汇义项记录</span><span><strong>${writtenForms.size}</strong> 个不同词形</span><span><strong>15</strong> 课</span></div></header>
<main><section aria-labelledby="read-first"><h2 id="read-first">使用前先明确</h2><div class="notice"><p><strong>这是含答案的教师审阅版。</strong>学生首次听辨时使用学生页面；本手册显示中文、拼音、越译和全部解析，适合备课及提交后的讲解。</p><p><strong>学生端每一轮都会重新打乱ABCD选项。</strong>本手册按JSON标准库顺序列出A—D，仅用于核查。教师认定答案时请核对<strong>原音中文与正确选项的完整越语文本</strong>，不要只核对学生截图上的字母。当前一轮的题序和选项顺序保持固定，刷新恢复也不重排。</p></div>
<p>第三步听力有独立的总分与首次／最近提交记录，不计入第二步的225项作业。词卡记录的是学生自评与复习日程，不是机器判定翻译正确率；第二步75道自由越译汉继续由教师看截图反馈，网页不替教师评分。本手册不改变这些边界。</p>
<p>全部${vocabulary.length}条为按课次保留的义项来源记录，共${senses.size}个稳定义项。不同课重复出现的同一汉字可以有不同义项；学生混课时按义项ID合并同义来源，不能只按汉字去重。例如第12课“天”的天气／计日义、第14课“上”的登乘／就学义要分开学习。</p></section>

<section aria-labelledby="teaching"><h2 id="teaching">建议的课堂与课后用法</h2><ol><li><strong>首次先听，不看汉字。</strong>先选已经学过的单课，默认1倍速，让学生判断中文的意思。第一次没有把握也可先说听懂的关键词；不要先投屏本手册答案。</li><li><strong>按需重听，再提交。</strong>允许无限重听且不扣分。可用0.65／0.75倍慢听，再回到1倍确认；熟练后用1.25／1.5倍复习。学生主动提交当前题后，才显示中文、拼音、越译、关键词和选项解释，并解锁下一题。</li><li><strong>提交后用意义带动复述。</strong>让学生指出原音中支持答案的词，再读原文、遮住原文复述。教师可按已学词替换人物、时间或物品，鼓励学生表达同类意思；这些口头活动由教师反馈，不冒充网页自动评分。</li><li><strong>跨课按已学范围选择。</strong>首次学习先单课，熟悉后勾选两三课混合辨认，比较相近词义。已错听力组依据“最近一次提交答错”筛选；它与词卡“Chưa nhớ”自评组分开。</li><li><strong>词卡先回忆再翻面。</strong>中文→越语时先说本课意思；多义词先结合卡面中文短语判断本课义，不猜系统要考哪一义。越语→中文时先说或写汉字，翻面后对照。反向回忆的中文音频在翻面之后才出现，避免声音提前提示答案。翻面后由学生选择“Chưa nhớ／Còn khó／Đã nhớ”，每轮每卡自评一次。</li></ol>
<table class="schedule"><caption>学生端固定间隔日程；不是个性化模型预测</caption><thead><tr><th scope="col">学生自评</th><th scope="col">接下来的安排</th></tr></thead><tbody><tr><th scope="row">Chưa nhớ · 未记住</th><td>10分钟后再练，记忆级别重置。</td></tr><tr><th scope="row">Còn khó · 还有困难</th><td>1天后再练，保留当前记忆级别。</td></tr><tr><th scope="row">Đã nhớ · 已记住</th><td>新卡或已到期卡按1、3、7、14、30天逐级安排；最高维持30天。未到期提前重复选择“已记住”，不再升阶，也不推迟原有到期时间。</td></tr></tbody></table><p>这是帮助安排再次回忆的固定日程，依赖学生诚实自评。教师可结合课堂表达、听辨错误与作业截图了解实际掌握情况，不能把自评次数当成语言能力分数。</p>
<p><strong>分数读法：</strong>本轮先显示“已提交／本轮总题数”和“正确／已提交题数”；全部提交后才是完整本轮得分。全册另显示“已提交／${listening.length}”以及这些已提交题目的首次正确数、最近正确数。首次记录不会被重练覆盖；重练改善体现在最近成绩中。未提交题目不应被解释为答错。</p>
</section>

<section aria-labelledby="limitations"><h2 id="limitations">教材与音频的实际边界</h2><p>中文短片段来自用户提供的《新HSK教程1》配套原录音。越语选项、释义与讲解为教学编写内容，不标为出版社官方越译。本文只列${listening.length}题所需的短片段与词汇依据，不嵌入教材整页图片或PDF。</p><p>词卡中有<strong>${noAudio.length}个数字词没有对应的独立原音片段</strong>：${noAudio.map(v => `<span lang="zh-Hans">${esc(v.zh)}</span>`).join('、')}。这些词来自教材第4课数字表，仍保留在回忆、自评和选课统计中；不借用其他课的录音，也不把合成语音标成原录音。</p><p>下文时间码是站点音轨的秒数，来自与题库一致的媒体清单。独立片段经解码、裁切和重新编码，实际MP3时长可能略长于请求区间；不是无损复制。时间码字段${esc('site-candidate')}是数据来源标记，本身不等于“人工听取通过”。</p><p><strong>自动识别不能替代耳听。</strong>ASR、教材文字、波形与解码检查各自提供不同证据，自动识别可能混淆人名、同音字、儿化与切口。当前模型工具没有直接听取音频，本手册生成也不构成听感验收。教师课前可检查所用片段的首尾与清晰度；项目具体音源与浏览器验收状态见随交付的第三步检查报告。</p><p>教材中的人物、航班时长和场景是练习情境，不是现实出行信息。听力题不能根据朗读者声音性别或仅凭“tāmen”读音区分“他们／她们／它们”。词卡书面义项仍分别保留。</p></section>

<nav id="contents" aria-label="15课目录"><h2>15课目录</h2><ul class="toc">${Array.from({length:15}, (_, i) => `<li><a href="#lesson-${i + 1}" data-toc-lesson="${i + 1}">第${i + 1}课 · Bài ${i + 1}</a></li>`).join('')}</ul></nav>
<div class="toolbar" id="toolbar" hidden><label for="lesson-filter">显示课次 <select id="lesson-filter"><option value="all">全部15课</option>${Array.from({length:15}, (_, i) => `<option value="${i + 1}">第${i + 1}课 · Bài ${i + 1}</option>`).join('')}</select></label><button type="button" id="print-guide">打印当前显示内容</button><span>也可在打印窗口保存为PDF。</span></div><p class="print-scope" id="print-scope" aria-live="polite">当前范围：全部15课；${listening.length}道听力，${vocabulary.length}条词汇义项记录。</p>
${Array.from({length:15}, (_, i) => lessonSection(i + 1)).join('\n')}

<section class="provenance-section" aria-labelledby="provenance-title"><h2 id="provenance-title">版本与可核查来源</h2><p>本手册由<code>node tools/build-stage3-teacher.cjs</code>从6份当前JSON和媒体清单直接生成。答案、原文、释义及时间码不在生成器中另存第二套；生成时检查源文件SHA256与媒体清单一致，并检查每条有音频记录的轨号及起止点。若题库或词卡修订，先更新媒体清单，再重新生成本手册。</p><table class="provenance"><caption>本手册绑定的输入文件与SHA256</caption><thead><tr><th scope="col">输入文件</th><th scope="col">SHA256</th></tr></thead><tbody>${[...inputs, {file:manifestFile, sha256:sha(manifestRaw)}].map(file => `<tr><td><code>${esc(file.file)}</code></td><td><code>${esc(file.sha256)}</code></td></tr>`).join('')}</tbody></table><p>媒体清单记录：${manifest.clips.length}个片段，含${manifest.listeningCount}个听力片段与${manifest.vocabularyAudioRecords}条词卡音频记录。编码：${esc(manifest.encoding.codec)}，${esc(manifest.encoding.bitrate)}，${esc(manifest.encoding.sampleRate)} Hz，${esc(manifest.encoding.channels)}声道。上表哈希用于版本对应，不代表独立教学审校已完成。</p></section>
</main><footer>HSK1 第三步教师审阅手册 · 默认展示全15课；打印单课时保留使用说明与版本证据。页面不依赖外部字体、图片、脚本或CDN。</footer>
<script>
(() => {
  'use strict';
  const filter = document.getElementById('lesson-filter');
  const sections = [...document.querySelectorAll('[data-lesson]')];
  const apply = value => {
    filter.value = value;
    sections.forEach(section => { section.hidden = value !== 'all' && section.dataset.lesson !== value; });
    const visible = sections.filter(section => !section.hidden);
    const questions = visible.reduce((sum, section) => sum + section.querySelectorAll('[data-question-id]').length, 0);
    const cards = visible.reduce((sum, section) => sum + section.querySelectorAll('[data-vocabulary-id]').length, 0);
    document.getElementById('print-scope').textContent = '当前范围：' + (value === 'all' ? '全部15课' : '第' + value + '课') + '；' + questions + '道听力，' + cards + '条词汇义项记录。';
  };
  document.getElementById('toolbar').hidden = false;
  filter.addEventListener('change', () => apply(filter.value));
  document.getElementById('print-guide').addEventListener('click', () => window.print());
  for (const link of document.querySelectorAll('[data-toc-lesson]')) link.addEventListener('click', () => {
    if (filter.value !== 'all') apply(link.dataset.tocLesson);
  });
})();
</script></body></html>\n`;

fs.mkdirSync(path.dirname(OUTPUT), {recursive:true});
fs.writeFileSync(OUTPUT, html);
console.log(JSON.stringify({output:path.relative(ROOT, OUTPUT), listening:listening.length,
  vocabularyRecords:vocabulary.length, senses:senses.size, writtenForms:writtenForms.size,
  noIndependentAudio:noAudio.length, mediaClips:manifest.clips.length,
  bytes:Buffer.byteLength(html), sha256:sha(html)}, null, 2));
