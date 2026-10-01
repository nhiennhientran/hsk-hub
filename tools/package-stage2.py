#!/usr/bin/env python3
"""Package the Step 2 review, source dependencies and actual QA evidence."""
from pathlib import Path
import hashlib
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist/stage2'
OUT.mkdir(parents=True, exist_ok=True)
teacher_parts = [ROOT / f'docs/stage2/teacher-{part}.md' for part in ('01-05', '06-10', '11-15')]
bank = []
for part in ('01-05', '06-10', '11-15'):
    bank.extend(json.loads((ROOT / f'new-hsk1/hsk1/stage2/question-bank/bank-{part}.json').read_text(encoding='utf-8')))
def cell(value):
    return str(value).replace('|', '\\|').replace('\n', ' ')
teacher = '# HSK1第二步教师参考：全部15课\n\n'
teacher += '共150道客观题与75道越译中参考。学生页面不加载本文；越译中由教师判断，不用此文做自动逐字评分。选择题字母对应题库原始顺序，学生页面会打乱选项，应按答案文字和题目ID核对。\n\n'
teacher += '## 一、150道客观题答案索引\n\n'
for lesson in bank:
    teacher += f"### 第{lesson['id']}课：{lesson['title']}\n\n"
    teacher += '| 题目ID | 类型 | 正确答案／本题全部登记的语序 | 考点 | 教材印刷页 |\n|---|---|---|---|---|\n'
    for kind in ('choice', 'sort'):
        for q in lesson[kind]:
            answer = f"{'ABCD'[q['answer']]}：{q['options'][q['answer']]}" if kind == 'choice' else ' / '.join(q['answers'])
            teacher += f"| `{q['id']}` | {'选择' if kind == 'choice' else '组句'} | {cell(answer)} | {cell(q['skill'])} | {', '.join(map(str,q['source']['printPages']))} |\n"
    teacher += '\n'
teacher += '## 二、75道自由翻译参考与评阅提示\n\n'
for path in teacher_parts:
    skip = False
    for line in path.read_text(encoding='utf-8').splitlines():
        heading = re.match(r'^(#{1,6})\s+(.+)$', line)
        if heading:
            level, label = len(heading[1]), heading[2]
            if level <= 3:
                skip = label in ('客观题', '选择题核查', '排序题核查')
            if not skip:
                line = '#' * min(level + 1, 6) + ' ' + label
        if not skip:
            teacher += line + '\n'
    teacher += '\n---\n\n'
for lesson in bank:
    for kind in ('choice', 'sort', 'translation'):
        for q in lesson[kind]:
            assert q['id'] in teacher, f"Missing teacher entry: {q['id']}"
teacher_file = ROOT / 'docs/stage2/teacher-reference.md'
teacher_file.write_text(teacher.rstrip() + '\n', encoding='utf-8')

files = {}
def add(path, name=None):
    path = ROOT / path
    if not path.is_file():
        raise FileNotFoundError(path)
    files[name or path.relative_to(ROOT).as_posix()] = path.read_bytes()

add('dist/stage2/HSK1-Step2-All15Lessons.html', 'HSK1-Step2-All15Lessons.html')
add('docs/stage2/teacher-reference.md', 'HSK1-Step2-Teacher-Reference.md')
add('docs/stage2/README.md', 'README.md')
files['README.md'] = ('# 打开第二步审阅包\n\n解压后用浏览器打开同目录的 `HSK1-Step2-All15Lessons.html` 即可做题；教师参考在 `HSK1-Step2-Teacher-Reference.md`。下方保留仓库说明和可重建的源文件路径。测试结果见 `docs/stage2/test-report.md`。\n\n---\n\n').encode('utf-8') + files['README.md']
for directory in ('new-hsk1/hsk1/stage2', 'docs/stage2'):
    for path in sorted((ROOT / directory).rglob('*')):
        if path.is_file(): add(path.relative_to(ROOT))
for relative in (
    'new-hsk1/hsk1/learning.css',
    'new-hsk1/hsk1/learning-engine.js',
    'new-hsk1/hsk1/stage1/sample-bank.js',
    'new-hsk1/hsk1/stage1/engine.js',
    'new-hsk1/hsk1/question-bank/bank-01-05.json',
    'new-hsk1/hsk1/question-bank/bank-06-10.json',
    'new-hsk1/hsk1/question-bank/bank-11-15.json',
    'docs/stage1/course-map.json',
    'docs/stage1/course-map.md',
    'tools/tests/question-helpers.cjs',
    'tools/tests/stage2-engine.test.cjs',
    'tools/tests/stage2-browser.cjs',
    'tools/tests/stage2-curriculum.cjs',
    'tools/build-stage2.cjs',
    'tools/serve-stage2.cjs',
    'tools/package-stage2.py',
    '.github/workflows/hsk1-stage2-qa.yml',
    'dist/stage2/HSK1-Step2-All15Lessons.html',
    'dist/stage2/build-manifest.json',
): add(relative)
for name in ('stage2-browser.json', 'stage2-ci-summary.json', 'stage2-curriculum-result.json', 'stage2-engine-result.json'):
    path = ROOT / 'tools/tests/results' / name
    if path.is_file(): add(path.relative_to(ROOT))
for path in sorted((ROOT / 'tools/tests/results').glob('stage2-*.png')):
    add(path.relative_to(ROOT))
digest = lambda data: hashlib.sha256(data).hexdigest()
manifest = {
    'stage': 2,
    'scope': '15 lessons, 225 homework tasks; independent review build',
    'files': [{'path': name, 'bytes': len(data), 'sha256': digest(data)} for name, data in sorted(files.items())],
}
files['MANIFEST.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
target = OUT / 'HSK1-Step2-Review.zip'
with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name, data in sorted(files.items()):
        info = zipfile.ZipInfo(name, date_time=(2026, 10, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, data)
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == len(files)
    for item in manifest['files']:
        assert digest(archive.read(item['path'])) == item['sha256']
print(json.dumps({'file': str(target), 'bytes': target.stat().st_size, 'files': len(files),
                  'sha256': digest(target.read_bytes()), 'teacher_reference': str(teacher_file)}, ensure_ascii=False))
