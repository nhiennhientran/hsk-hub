from pathlib import Path
import json
B=Path(__file__).resolve().parent
PY={
12:[['Jīntiān tiānqì zěnmeyàng?','Zhèlǐ de tiān bú tài hǎo, xià yǔ le.','Yǔ dà ma?','Yǒudiǎnr dà, wǒ juéde hěn lěng.'],['Zuótiān xià xuě le.','Shì de, tài lěng le.','Nǐ zuótiān méi lái gōngsī, shēngbìng le?','Duì, wǒ zuótiān qù yīyuàn kànbìng le.'],['Yīshēng, wǒ bìng le.','Wǒ kànkan. Nǐ juéde zěnmeyàng?','Wǒ hěn lěng.','Hǎo de, chī yìdiǎnr yào, jīntiān xiūxi bàn tiān ba.','Hǎo de.','Huí jiā hòu zài hē xiē rè shuǐ.']],
13:[['Wáng lǎoshī, wǒ kěyǐ zài wèn nín yí ge wèntí ma?','Kěyǐ. Nǐ yǒu shénme wèntí?','Nàge xiǎo diàn mài bu mài shǒujī?','Wǒ bù zhīdào. Nǐ kěyǐ dǎ diànhuà wèn yíxià.'],['Nǚshì, qǐng zuò! Nín hē shénme?','Wǒ kàn yíxià. Qǐng gěi wǒ yì bēi niúnǎi.','Hǎo de. Nín hái yào shénme?','Wǒ hái méi chī zǎofàn, zài yào zhège miànbāo hé jīdàn ba.'],['Xiānsheng, qǐng zuò! Nín yào shénme?','Wǒ yào yì jīn jiǎozi.','Hǎo de. Yì jīn jiǎozi sìshí ge.','Sìshí ge tài duō le, wǒ yào yíbàn ba.','Bàn jīn èrshí ge. Nín xiǎng hē shénme?','Qǐng gěi wǒ yì bēi chá ba.']],
14:[['Nǐmen shàng huǒchē hòu kànjiàn Wáng lǎoshī le ma?','Méi kànjiàn. Zhōngwǔ chē kāi hòu, yǒuxiē rén zài kàn shū, yǒuxiē rén shuìjiào le.','Nǐ ne?','Wǒ kànle yí ge diànyǐng.'],['Nǐmen huì shuō Hànyǔ le, yě huì xiě Hànzì le ma?','Wǒmen dōu huì xiě le.','Lǎoshī, wǒ tīng bú jiàn.','Qǐng dàjiā búyào shuōhuà! Qǐng tīng lǎoshī de wèntí: Nǐmen dōu huì xiě nǎxiē Hànzì le?','Wǒ huì xiě zhèxiē zì le, nín kàn!'],["Míngnián nǚ’ér shàng zhōngxué.",'Duì. Érzi yě shàng xiǎoxué le.','Wǒmen jiā yǒule yí ge zhōngxuéshēng.','Hái yǒule yí ge xiǎoxuéshēng.','Shàngxué hòu, tāmen dōu máng le.','Shì de. Tài wǎn le, shuìjiào ba.']],
15:[['Nǐmen ài chī nǎge cài?','Wǒ xǐhuan zhège, yě xǐhuan nàge.','Zhèxiē cài dōu hǎochī, hái hěn hǎokàn.','Wǒ ài chī Zhōngguócài, yě xǐhuan zuò. Dàjiā duō chī diǎnr.'],["Nǐmen dōu xiǎng qù nǎr?","Qùnián wǒ hé nánpéngyou qùle Xī’ān, jīnnián wǒ xiǎng qù Běijīng.","Qián jǐ nián wǒ qùle Xī’ān, fēicháng hǎowánr. Jīnnián wǒ yě xiǎng qù Běijīng.",'Wǒ hé Wáng lǎoshī dōu shì Běijīng rén, Běijīng fēicháng piàoliang.'],['Nǐmen de fēijī dào Běijīng yào jǐ ge xiǎoshí?','Jiǔ ge xiǎoshí.','Wǒ jiārén dōu zài Běijīng, xīngqītiān wǒ jiějie yě yǒu shíjiān, tā kěyǐ qù jīchǎng jiē nǐmen, nǐmen yě kěyǐ zhù wǒ jiā.','Wǒmen Xīngqīrì zǎoshang bā diǎn dào Dàxīng Jīchǎng, zǎo bu zǎo?','Bù zǎo.','Xièxie lǎoshī! Nà wǒmen hé nín jiějie zài Dàxīng Jīchǎng jiàn!']]}
for l in range(12,16):
 p=B/f'lesson-{l}.json';d=json.loads(p.read_text())
 for a in d['activities']:
  if a['source']['section'].endswith('-role-reading'):
   t=int(a['source']['section'].split('-')[1]);names=[x.split('：',1)[0] for x in a['prompt']['zh'].split('\n')];assert len(names)==len(PY[l][t-1])
   a['pinyin']='\n'.join(f'{n}：{s}' for n,s in zip(names,PY[l][t-1]))
   a['pinyinProvenance']={'basis':'manually-transcribed-from-source-page','printedPages':a['dialoguePrintedPages'],'style':'source-word-grouping; punctuation normalized','independentReview':'pending'}
  if a['source']['section']=='proper-nouns':
   start=3 if l==15 and a['source']['printedPage']==117 else 1
   a['source']['ordinal']=start
   if len(a['table']['columns'])==2:
    a['table']['columns'].insert(0,{'zh':'序号','vi':'Số'})
    for i,row in enumerate(a['table']['rows'],start):row['cells'].insert(0,{'text':{'zh':str(i),'vi':str(i)}})
  if 'table' in a:
   for r in a['table']['rows']:
    for i,c in enumerate(r['cells']):
     if c.get('text')=={'zh':'','vi':''}:r['cells'][i]={}
 for m in d.get('vocabularySourceMap',[]):
  if m.get('category')=='proper-noun':
   m['ordinal']={'汉语':1,'汉字':2,'西安':1,'北京':2,'大兴机场':3}[m['zh']]
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
