/* Textbook Lessons 9-15: reviewed against printed pp.61-118. The immutable
   learning catalog is shared, so textbook and review meanings cannot drift. */
(function(){
 'use strict';
 const lessons=window.HSK1_LESSONS,C=window.HSKStep3Catalog;
 if(!Array.isArray(lessons)||!C||!Array.isArray(C.vocabulary))throw new Error('Final textbook catalog not loaded');
 const labels={n:'名词 · Danh từ',v:'动词 · Động từ',prep:'介词 · Giới từ',pron:'代词 · Đại từ',modal:'能愿动词 · Động từ năng nguyện',num:'数词 · Số từ',adv:'副词 · Phó từ',conj:'连词 · Liên từ',proper:'专有名词 · Tên riêng'};
 const pos={9:{'白天':'n','和':'prep','前边':'n','外边':'n'},10:{'这边':'pron'},11:{'昨天':'n'},12:{'病':'v'},13:{'可以':'modal','卖':'v','鸡蛋':'n','要':'v','一半':'num','杯':'n'},14:{'不要':'adv','明年':'n','中午':'n'},15:{'爱':'v','西安':'proper','几':'num','那':'conj','要':'v','小时':'n','去年':'n'}};
 for(const L of lessons){
  if(L.id<9||L.id>15)continue;
  const rows=C.vocabulary.filter(v=>v.lesson===L.id),byWord=new Map();
  for(const row of rows){if(!byWord.has(row.zh))byWord.set(row.zh,[]);byWord.get(row.zh).push(row);}
  const old=new Map(L.vocab.map(v=>[v.zh,v]));
  const order=L.vocab.map(v=>v.zh).filter(w=>byWord.has(w));
  for(const word of byWord.keys())if(!order.includes(word))order.push(word);
  L.vocab=order.map(word=>{
   const sources=byWord.get(word),v=sources[0],previous=old.get(word)||{};
   const entry={...previous,zh:word,py:[...new Set(sources.map(x=>x.py))].join(' / '),vn:sources.map(x=>x.vi).join('；'),
    kind:v.category==='proper_noun'?'proper':v.extension?'extension':'core',extension:v.extension,
    sourceSenseIds:sources.map(x=>x.senseId)};
   const code=pos[L.id]?.[word];if(code){entry.pos=code;entry.posLabel=labels[code];}
   if(L.id===12&&word==='天'){entry.pos='n';entry.posLabel='名词 · Danh từ';}
   return entry;
  });
 }
 function line(l,s,i,patch){const row=lessons.find(x=>x.id===l)?.scenes?.[s]?.lines?.[i];if(!row)throw new Error('Missing reviewed dialogue '+[l,s,i].join(':'));Object.assign(row,patch);}
 line(10,0,0,{zh:'请问，有杯子吗？',py:'Qǐngwèn, yǒu bēizi ma?',vn:'Xin hỏi, ở đây có cốc không?'});
 line(10,1,2,{zh:'我想买两斤苹果。',py:'Wǒ xiǎng mǎi liǎng jīn píngguǒ.',vn:'Tôi muốn mua hai 斤 táo (1 kg).'});
 line(10,1,3,{vn:'Táo 3,5 tệ một 斤 (500 gam). Chỗ này là 7,2 tệ; tính 7 tệ nhé.'});
 line(11,2,4,{s:'刘明'});
 line(11,2,5,{s:'刘小雪',vn:'Hôm qua con hỏi em, em nói với con rằng em không đi; hôm nay em muốn chơi với các bạn nhỏ.'});
 line(12,0,2,{zh:'雨大吗？',py:'Yǔ dà ma?',vn:'Mưa có to không?'});
 line(12,0,3,{zh:'有点儿大，我觉得很冷。',py:'Yǒudiǎnr dà, wǒ juéde hěn lěng.',vn:'Hơi to, em cảm thấy rất lạnh.'});
 line(13,2,1,{vn:'Tôi muốn gọi một 斤 sủi cảo (500 gam).'});
 line(13,2,2,{zh:'好的。一斤饺子40个。',py:'Hǎo de. Yì jīn jiǎozi sìshí ge.',vn:'Vâng. Một 斤 sủi cảo (500 gam) có 40 chiếc.'});
 line(13,2,4,{vn:'Nửa 斤 (250 gam) là 20 chiếc. Ông muốn uống gì?'});
 line(13,2,5,{zh:'请给我一杯茶吧。',py:'Qǐng gěi wǒ yì bēi chá ba.',vn:'Xin cho tôi một tách trà nhé.'});
 line(15,2,1,{vn:'Chín giờ đồng hồ.'});
 const seg=window.HSK1_OFFICIAL_SEGMENTS;
 if(seg){
  // Frozen source-ASR word times plus decoded PCM pauses separate the five textbook turns.
  seg.text['14-3']=[[2.95,7.45],[7.6,9.55],[9.6,12.15],[12.2,22.15],[22.15,25.427]];
  const tracks={};
  for(const v of C.vocabulary){if(v.lesson<9||!v.audio)continue;const a=v.audio;(tracks[a.track]||(tracks[a.track]=[])).push([v.zh,a.start,a.end]);}
  for(const [track,rows] of Object.entries(tracks))seg.vocab[track]=rows;
  // No cross-lesson substitution for a word absent from the actual lesson.
  if(seg.crossLessonReuse?.['6'])delete seg.crossLessonReuse['6']['西安'];
 }
 window.HSK1_FINAL_TEXTBOOK={version:'20261001-i2-v1',scope:[9,15],wordRows:lessons.reduce((n,l)=>n+l.vocab.length,0),senseRows:C.vocabulary.length,audioCorrected:!!seg};
})();
