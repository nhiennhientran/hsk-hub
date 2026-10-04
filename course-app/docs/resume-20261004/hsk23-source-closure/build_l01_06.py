"""Materialize manually inspected official-VI source anchors without changing course data."""
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
APP = HERE.parents[2]
PIXELS = Path('/workspace/scratch/28b55072841a/hsk23-source-review/official-vi-pixels')
REVISION = 'hsk3-official-vi-upload-20261004'
BOOK_SHA = '7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951'

# Each entry is a freshly visually checked printed headword and its raw POS set.
# Numbering follows these explicitly transcribed lists, not stable word ID suffixes.
LISTS = {
 1: '以为:đgt.|像:đgt.|长:đgt.|身高:dt.|米:lượng.|瘦:tt.|接:đgt.|行李:dt.|丢:đgt.|箱子:dt.|号码:dt.|好像:phó.|重要:tt.|着急:tt.|护照:dt.|服务台:dt.|应该:đtnn.|站:đgt.|中间:dt.|短:tt.|头发:dt.|年轻:tt.|发现:đgt.|不见:đgt.|带:đgt.|帮助:đgt.|照片:dt.',
 2: '菜单:dt.|又:phó.|饿:tt.|渴:tt.|客气:đgt./tt.|饮料:dt.|好久:tt.|服务:đgt.|员:htố.|双:lượng.|筷子:dt.|勺子:dt.|碗:dt.|马上:phó.|热情:tt.|尝:đgt.|记:đgt.|用:đgt.|鸡:dt.|张:lượng.|不用:phó.|选:đgt.|外卖:dt./đgt.|方便:tt.|蛋糕:dt.|只:phó.|方便面:dt.|简单:tt.',
 3: '初中:dt.|咱们:đt.|换:đgt.|房子:dt.|小区:dt.|环境:dt.|挺:phó.|空调:dt.|洗衣机:dt.|层:lượng.|花园:dt.|灯:dt.|关:đgt.|冰箱:dt.|卫生间:dt.|打扫:đgt.|搬家:đgt.|办:đgt.|信用卡:dt.|还:đgt.|听说:đgt.|银行:dt.|才:phó.|纸:dt.|搬:đgt.|需要:đgt./dt.',
 4: '假期:dt.|海:dt.|草原:dt.|主意:dt.|骑:đgt.|马:dt.|羊:dt.|月亮:dt.|一定:phó.|刻:lượng.|起飞:đgt.|宾馆:dt.|特别:tt./phó.|别的:đt.|一样:tt.|牛:dt.|相机:dt.|欢迎:đgt.|司机:dt.|晚点:đgt.|久:tt.|除了:giới.|以外:dt.|先:phó.|一直:phó.|干净:tt.|满意:đgt.',
 5: '总是:phó.|终于:phó.|爬:đgt.|山:dt.|锻炼:đgt.|照:đgt.|鞋:dt.|大衣:dt.|拍照:đgt.|感兴趣:|照相:đgt.|难看:tt.|比较:đgt./phó.|水平:dt.|太阳:dt.|树:dt.|干:đgt.|电:dt.|收到:đgt.|封:lượng.|邮件:dt.|难过:tt.|哈哈:|音乐:dt.|兴趣:dt.|会:dt.|结束:đgt.',
 6: '该:đtnn.|打算:đgt./dt.|高铁:dt.|行:đgt./tt.|路口:dt.|小心:đgt./tt.|迟到:đgt.|红绿灯:dt.|后来:dt.|急:tt./đgt.|如果:liên.|以前:dt.|耳机:dt.|充电宝:dt.|常用:|越:phó.|分开:đgt.|检查:đgt.|刷:đgt.|检票:đgt.|电梯:dt.|放假:đgt.|沙发:dt.|安静:tt.|选择:đgt.|必须:phó.',
}
RAW_PY_OVERRIDES = {
 (3, '卫生间'): 'wèishēng-\njiān',
 (6, '红绿灯'): 'hóng-\nlǜdēng',
 (6, '充电宝'): 'chōngdiàn-\nbǎo',
}
POS_CATEGORIES = {'dt.':'名词','đgt.':'动词','tt.':'形容词','đt.':'代词',
 'phó.':'副词','giới.':'介词','liên.':'连词','trợ.':'助词','số.':'数词',
 'lượng.':'量词','sl.':'数量词','ct.':'叹词','tượng.':'拟声词','đtnn.':'能愿动词',
 'ttố.':'前缀','htố.':'后缀'}

def sha(path):
 return hashlib.sha256(path.read_bytes()).hexdigest()

rows, pages = [], set()
for lesson_no in range(1,7):
 lesson = json.loads((APP/f'content/hsk3/lesson-{lesson_no:02}.json').read_text())
 printed = {}
 for number, entry in enumerate(LISTS[lesson_no].split('|'),1):
  zh, raw = entry.split(':',1)
  printed[zh] = (number, raw or None)
 for word in lesson['vocabulary']:
  source_list = 'proper-names' if word['zh'] == '北京南站' else 'new-words'
  number, raw = (1,None) if source_list == 'proper-names' else printed[word['zh']]
  page = word['source']['pdfPage'];pages.add(page)
  observation = 'Author visually compared Chinese, printed number, pinyin and raw POS set on the fresh official-VI page.'
  if raw is None:
   observation += ' No POS is printed; the existing editorial classification is preserved.'
  if raw and '/' in raw:
   observation += ' All printed POS share this one printed number; stable sense IDs stay separate.'
  if (lesson_no,word['zh']) in RAW_PY_OVERRIDES:
   observation += ' Raw pinyin preserves the printed line-break hyphen; normalized pronunciation is unchanged.'
  if word['zh'] in ['咱们','别的']:
   observation += ' The đ character crossbar was checked, including a 4x crop for 别的; it is not dt.'
  rows.append({'id':word['id'],'zh':word['zh'],
    'printedPinyin':RAW_PY_OVERRIDES.get((lesson_no,word['zh']),word['py']),
    'normalizedPinyin':word['py'],'printedNumber':number,
    'printedPOSRaw':raw,'rawLabel':raw,
    'posCategory':[POS_CATEGORIES[p] for p in raw.split('/')] if raw else [],
    'sourceList':source_list,'pdfPage':page,'printedPage':page-12,
    'sourceText':word['sourceText'],'observation':observation})
evidence = [{'pdfPage':p,'printedPage':p-12,
             'rasterSha256':sha(PIXELS/f'p{p:03}.png'),
             'privateRaster':str(PIXELS/f'p{p:03}.png'),
             'authorPixelsInspected':True} for p in sorted(pages)]
result={'schemaVersion':1,'sourceRevision':REVISION,'sourceSha256':BOOK_SHA,
 'review':{'status':'author-visual-checked','independentReview':'not-granted',
           'scope':'Only Chinese/pinyin/printed number/POS/source coverage; Vietnamese gloss alignment is Phase B.'},
 'counts':{'lessons':6,'stableRows':len(rows),'printedEntries':sum(len(v.split('|')) for v in LISTS.values())+1,'pages':len(pages)},
 'rows':rows,'pageEvidence':evidence}
(HERE/'official-vi-l01-06.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result['counts']))
