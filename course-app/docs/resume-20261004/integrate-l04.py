"""Integrate independently transcribed L4 omissions without rewriting existing receipts."""
import json
from pathlib import Path

repo = Path(__file__).resolve().parents[3]
qa = Path(__file__).parent / 'qa-l04'
target = repo / 'hsk1-app/content/source-activities/lesson-04.json'
data = json.loads(target.read_text())
original = [a for a in data['activities'] if a['version'] == 'source-v2']
assert len(original) == 21
extra = json.loads((qa / 'additional-activities.json').read_text())
scenes = json.loads((repo / 'hsk1-app/content/textbook.json').read_text())['lessons'][3]['scenes']
speakers = {'刘明': 'Lưu Minh', '王一雪': 'Vương Nhất Tuyết', '杨同乐': 'Dương Đồng Lạc'}
printed_pinyin = [
    'Yīfēi máng ma?\nTā hěn máng.\nTā yǒu duōshao gè xuéshēng?\nTā yǒu èrshí gè xuéshēng.',
    'Wǒ yǒu liǎng gè gēge, nǐ ne?\nWǒ méiyǒu gēge.\nNǐ jiā yǒu jǐ kǒu rén?\nWǒ jiā yǒu sì kǒu rén, bàba, māma, mèimei hé wǒ.',
    'Zhè shì nín érzi ma?\nShì de. Wǒ yǒu liǎng gè háizi, yí gè érzi, yí gè nǚ’ér.\nNín érzi jǐ suì?\nTā jīnnián wǔ suì.\nNín nǚ’ér duō dà?\nTā jīnnián shí’èr.',
]
for a in extra:
    if a['kind'] == 'read-aloud':
        a['fields'] = []
    for index, section in enumerate(['text1-read-role', 'text2-role', 'text3-role']):
        if a['source']['section'] != section:
            continue
        scene = scenes[index]
        a['prompt'] = {'zh': '\n'.join(line['s'] + '：' + line['zh'] for line in scene['lines']),
                       'vi': '\n'.join(speakers[line['s']] + ': ' + line['vn'] for line in scene['lines'])}
        a['pinyin'] = printed_pinyin[index]
        a['audio'] = {'sceneId': scene['id'], 'track': scene['source']['audioTrack'], 'plays': 1, 'verifiedByListening': False}
        if index == 2:
            a['source'].update(printedPage=24, pdfPage=39, printedPages=[24, 25], pdfPages=[39, 40])
    # Keep notes about interpretation next to a read-only grammar example.
    if a['source']['section'].startswith('grammar'):
        a['instruction']['zh'] += ' 拼音为学习辅助补充。'
        a['instruction']['vi'] += ' Phiên âm là phần hỗ trợ bổ sung.'

titles = {
    'objectives': ('本课目标', 'Mục tiêu bài học'),
    'grammar1-explanation': ('“有”字句（1）', 'Câu chữ “有” (1)'),
    'numbers-explanation': ('数字的表达', 'Cách biểu đạt số'),
    'ne-explanation': ('语气助词“呢”（1）', 'Trợ từ ngữ khí “呢” (1)'),
    'classifier-explanation': ('名量词和名量结构', 'Danh lượng từ và kết cấu số-lượng-(danh)'),
    'age-tips': ('小语助力 · 询问年龄', 'Gợi ý · Hỏi tuổi'),
}
for p in json.loads((qa / 'missing-source-passages.json').read_text())['passages']:
    zh = '\n'.join(p['zh']) if isinstance(p['zh'], list) else p['zh']
    vi = '\n'.join(p['vi']) if isinstance(p['vi'], list) else p['vi']
    if p['kind'] == 'age-tips':
        zh = '“您儿子几岁？”——十岁以下时的问法。\n“您女儿多大？”——十岁以上一般不问“几岁”，要问“多大”。'
        vi = '“您儿子几岁？” — Cách hỏi tuổi trẻ em dưới mười tuổi.\n“您女儿多大？” — Với người trên mười tuổi, thông thường dùng “多大” thay cho “几岁”.'
    ztitle, vtitle = titles[p['kind']]
    extra.append({'id': f"hsk1-original-2026-l04-p{p['printedPage']:03d}-{p['kind']}-01", 'version': 'source-v1',
                  'lesson': 4, 'kind': 'read-only',
                  'source': {'sourceRevision': data['edition'], 'textbookSHA256': data['textbookSHA256'],
                             'printedPage': p['printedPage'], 'pdfPage': p['pdfPage'], 'section': p['kind'], 'ordinal': 1},
                  'title': {'zh': ztitle, 'vi': vtitle},
                  'instruction': {'zh': '阅读教材说明。', 'vi': 'Đọc phần giải thích trong sách.'},
                  'prompt': {'zh': zh, 'vi': vi}, 'fields': []})
assert len(extra) == 15
assert len({a['id'] for a in original + extra}) == 36
data['activities'] = original + extra
target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'activities': len(data['activities']), 'fields': sum(len(a['fields']) for a in data['activities']), 'originalSourceV2Unchanged': True}))
