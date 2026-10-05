"""Record completed root manual L14 reading; guards do not confer approval."""
import hashlib,json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[5];OUT=Path(__file__).resolve().parent
sb=(OUT/'author-input/source.json').read_bytes();s=json.loads(sb)
assert hashlib.sha256(sb).hexdigest()=='1f126ede5386c2e476ca5af42b88e6f9990829c29dfb3299031ffe8ce7f98886'
prior=ROOT/'course-app/docs/recovery-20261005/qa-official-vi/hsk1-l11'
pr=json.loads((prior/'review.json').read_bytes())
assert s['appendixOccurrences']==json.loads((prior/'author-input/source.json').read_bytes())['appendixOccurrences']
for p in range(138,146):assert (OUT/f'renders/pdf-{p:03}-independent.png').read_bytes()==(prior/f'renders/pdf-{p:03}-independent.png').read_bytes()
prev=ROOT/'course-app/docs/recovery-20261005/qa-official-vi/hsk1-l13'
assert (OUT/'renders/pdf-119-independent.png').read_bytes()==(prev/'renders/pdf-119-independent.png').read_bytes()
detail=OUT/'renders/pdf-123-reading-questions-detail.png';db=detail.read_bytes()
assert len(db)==633638 and hashlib.sha256(db).hexdigest()=='fcb10d2357352b29fff731de59b88f698928d10a505b3c9eeced807666639671'
with Image.open(detail) as im:im.load();assert im.size==(2020,320)
manual={
119:'Whole page actually viewed in L13 boundary reading; exact same fresh raster verified. Full 我看了一个电影 / Mình đã xem một bộ phim, four goals and warmup instruction match. First goal preserves its three actual physical lines; warmup choices contain Chinese/pinyin without VI glosses.',
120:'Actual whole-page comparison: complete extracurricular-trip scene, listening label, four entire Chinese/VI dialogue turns, all speaker bindings and physical line wraps match. Complete 有些/有的 tip, role-reading instruction and both bilingual questions verified.',
121:'Actual whole page read: ordinary words1–7, Chinese/pinyin/printed POS and complete glosses match. Two-line 了(2) explanation, read/complete-dialogue instructions and Từ li hợp (1) title match. Whole Chinese explanation for grammar2 continues to its corresponding full VI on122; no inferred VI for Chinese-only examples.',
122:'Actual whole-page reading: complete four-line grammar2 translation correctly paired with full Chinese explanation on121. All nine quoted separable verbs and ASCII three-dot ellipsis retained. Table column VI (hợp)/(tách), read instruction, complete classroom scene and listening label verified.',
123:'Actual whole-page reading: eight ordinary words8–15 and two proper rows 汉语/汉字 with actual blank POS match. Full five Chinese/VI dialogue turns, all Vương Nhất Phi/Bạch Gia Nguyệt/Trần Thiên Trung speaker bindings and physical wraps checked. Both bilingual reading questions match. Additional original-PDF detail was actually viewed: both Chinese questions explicitly print 汉字; no mistaken reading as 这字.',
124:'Actual whole-page comparison: complete scope-adverb 都 title/explanation and its two physical VI lines match. Read instruction, full children-study scene and listening label match. Chinese grammar examples and listening choices have no invented VI translations.',
125:'Actual whole-page comparison: complete six Chinese/VI family dialogue turns match, with full speaker prefixes and two physical lines per turn. Entire eight-line pronoun tip about 她们/它们 matches. Words16–26 and every original pinyin/POS/gloss verified, including two separate 上 senses, dt. for 中学/小学, two-line 它们 gloss and ASCII ellipsis in 他们/她们.',
126:'Actual whole-page comparison: role-reading and question instructions, two entire bilingual questions, exercise heading and fill-blank/picture instructions match. First reading question and picture instruction retain two physical VI lines. Chinese-only stems/options and first two pictures viewed; no invented VI answers.',
127:'Actual whole-page comparison: continued picture descriptions contain Chinese only. Activity heading, Hoạt động theo nhóm hai người, full bilingual Saturday/Sunday group instruction and Ví dụ của Tiểu Ngữ match. Whole page closes L14; no missing VI in the Chinese-only example.',
128:'Actual whole next boundary viewed: Bài15 / 大兴机场见！ / Hẹn gặp ở sân bay Đại Hưng! starts the next lesson; excluded from L14 body IDs.'}
obs={str(p):{'pdfPage':p,'printedPage':f'{p-16:03}','actuallyViewedWholePage':True,'scope':'body' if p<128 else 'boundary-only','observation':t} for p,t in manual.items()}
rows={139:'不要 búyào14 / 都 dōu14',140:'火车 huǒchē14 / 开 kāi14 / 了 le12,14',141:'明年 míngnián14 / 哪些 nǎxiē14 / 上 shang/shàng9,14',142:'说话 shuōhuà14 / 他们、它们、她们 tāmen14 / 听 tīng14 / 听见 tīngjiàn14 / 晚 wǎn14 / 上学 shàngxué14 / 小学 xiǎoxué14 / 小学生 xiǎoxuéshēng14 / 写 xiě14',143:'有的 yǒude14 / 有些 yǒuxiē14 / 中午 zhōngwǔ14 / 中学 zhōngxué14 / 中学生 zhōngxuéshēng14 / 字 zì14',144:'汉语 Hànyǔ14 / 汉字 Hànzì14'}
for p in range(138,146):
    obs[str(p)]={**pr['pageObservations'][str(p)],'originalManualReadingReuse':'Exact88 shared source-object/eight raster equality to prior actual root L11 whole-page reading verified.','observation':'Prior actual shared-POS/header/footnote reading reused after exact equality; all16 POS classes and quoted ASCII * remain faithful. '+('Current whole page actually re-viewed and every current relevant index row manually checked: '+rows[p]+'.' if p in rows else 'No current L14 index body row on this page.')+' Index rows contain Chinese/pinyin/lesson references only, no VI definitions.'}
notes={'schemaVersion':3,'lesson':14,'reviewer':'/root','status':'all-source-records-manually-reviewed','selectedSource':'author-input/source.json','selectedSourceSHA256':hashlib.sha256(sb).hexdigest(),'selectedAuthorRevision':'original immutable recovery author source, no repairs','bodyOccurrenceCount':136,'wordRows':28,'uniqueWordHeadwords':27,'printedPOS':26,'dialogueTurnsByText':{'1':4,'2':5,'3':6},'pageObservations':obs,'resolvedAuthorTranscriptionRepairs':[],'textbookSemanticObservations':[{'word':'上','observation':'Two numbered body rows1/17 have distinct glosses for boarding versus beginning school; retained separately, despite one unique headword in the index.'},{'word':'汉语/汉字','observation':'Both body proper-name rows print no POS field; source nulls retained rather than inferred noun abbreviations.'}],'additionalActuallyViewedDetail':{'file':str(detail.relative_to(OUT)),'sha256':hashlib.sha256(db).hexdigest(),'bytes':len(db),'pdfPage':123,'confirmedChineseQuestions':['白家月会写汉字了吗？','陈天中会写汉字了吗？'],'actuallyViewed':True,'fullPNGDecoded':True}}
p=OUT/'manual-notes.json';assert not p.exists();p.write_bytes((json.dumps(notes,ensure_ascii=False,indent=2)+'\n').encode())
print('L14 full manual notes ready:136 body +88 shared,27 index rows.')
