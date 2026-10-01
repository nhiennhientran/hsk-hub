#!/usr/bin/env python3
"""Package the exact tested Step 3 runtime, teacher guide, source, and evidence."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist/stage3'
TESTED_COMMIT = '6301e2d03fef32f334ca2fba1fd36d53189aa586'

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def main():
    build = json.loads((OUT / 'build-manifest.json').read_text())
    browser = json.loads((ROOT / 'tools/tests/results/stage3-browser.json').read_text())
    assert browser['passed'] and browser['sourceCommit'] == TESTED_COMMIT
    assert len(browser['checks']) == 35 and all(c['status'] == 'passed' for c in browser['checks'])
    assert not browser['errors'] and not browser['networkFailures']
    assert sha((OUT / build['studentFile']).read_bytes()) == build['sha256']
    for row in build['sources']:
        assert sha((ROOT / row['file']).read_bytes()) == row['sha256'], 'Runtime changed after testing: ' + row['file']

    paths = set()
    for folder in ['new-hsk1/hsk1/stage3', 'docs/stage3']:
        paths.update(p for p in (ROOT / folder).rglob('*') if p.is_file() and p.suffix in ['.js','.json','.html','.css','.md'])
    paths.update(ROOT / p for p in [
        'new-hsk1/hsk1/learning.css', 'docs/stage1/course-map.json',
        'tools/build-stage3-media.py', 'tools/build-stage3.cjs', 'tools/build-stage3-teacher.cjs',
        'tools/serve-stage3.cjs', 'tools/stage3-audio-audit.py', 'tools/stage3-transcribe-audio.py',
        'tools/package-stage3.py', 'tools/tests/stage3-engine.test.cjs', 'tools/tests/stage3-browser.cjs',
        'tools/tests/results/stage3-engine.tap', 'tools/tests/results/stage3-browser.json',
        'tools/tests/results/stage3-asr-tracks.json', 'tools/tests/results/stage3-asr-clips.json',
        'tools/tests/results/stage3-asr-recheck.json',
        'dist/stage3/HSK1-Step3-Listening-Vocabulary.html', 'dist/stage3/HSK1-Step3-Teacher-Guide.html',
        'dist/stage3/build-manifest.json'])
    paths.update((ROOT / 'tools/tests/results').glob('stage3-*.png'))
    paths.update((ROOT / '.github/workflows').glob('hsk1-stage3-*.yml'))
    assert all(p.is_file() for p in paths)
    files = {str(p.relative_to(ROOT)):p.read_bytes() for p in sorted(paths)}
    files['README-ZH.md'] = '''# 第三步审阅包

先打开：

1. `dist/stage3/HSK1-Step3-Listening-Vocabulary.html`：含全部音频的学生单文件。
2. `dist/stage3/HSK1-Step3-Teacher-Guide.html`：全部75题答案／解析与344词卡。
3. `docs/stage3/acceptance.md`：实际运行范围、结果、音源修正和限制。
4. `docs/stage3/README.md`：学习、备份、复习规则与构建说明。

请下载解压后用普通浏览器打开HTML。某些聊天应用内的文件预览器会限制脚本或声音。

本包是第三步独立审阅版。正式网站整合、旧模块整体回归与发布属于第四步。
所有成绩与复习记录保存在学生当前浏览器，可显式导出JSON。截图里的分数是测试数据。

源码位于 `new-hsk1/hsk1/stage3/`；它已包含按课媒体包，可直接运行本地预览。
本审阅包不重复收录原教材PDF、上传RAR或完整93条源录音。如需重新裁切原音，
请在完整GitHub项目（相同审阅提交）中运行构建脚本；原站录音路径是
`new-hsk1/hsk1/audio/`。本包中的单文件学生页已经包含学习所需的全部405媒体ID。

`tools/tests/results/`内的JSON、TAP和4张截图是实际测试与ASR证据，
不是学生作业备份。不要把它们作为学生进度导入。

详细文件SHA256在 `REVIEW-FILES.json` 中；ZIP自身的校验值另存于外部的
`dist/stage3/package-manifest.json`，避免校验值包含自身形成循环。
'''.encode()
    inventory = [{'file':name, 'bytes':len(data), 'sha256':sha(data)} for name,data in sorted(files.items())]
    info = {'stage':3, 'testedCommit':TESTED_COMMIT, 'browserRun':'36816487219',
            'audioRecheckRun':'36816487307', 'files':inventory,
            'exclusions':['Uploaded textbook PDF and RAR', 'Original 93 full recordings already in the project',
                          'Synthetic learner backup files made by the test suite']}
    files['REVIEW-FILES.json'] = (json.dumps(info, ensure_ascii=False, indent=2)+'\n').encode()
    target = OUT / 'HSK1-Step3-Review-Package.zip'
    with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name,data in sorted(files.items()):
            entry = zipfile.ZipInfo(name, date_time=(2026,10,1,0,0,0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = (0o100644 << 16)
            archive.writestr(entry, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    with zipfile.ZipFile(target) as archive:
        assert archive.testzip() is None
        assert len(archive.namelist()) == len(files)
        for name,data in files.items():
            assert sha(archive.read(name)) == sha(data), 'Archive differs: ' + name
    result = {'stage':3, 'zipFile':target.name, 'bytes':target.stat().st_size,
              'sha256':sha(target.read_bytes()), 'fileCount':len(files),
              'testedCommit':TESTED_COMMIT, 'browserRun':'36816487219',
              'studentFile':build['studentFile'], 'studentSha256':build['sha256'],
              'includes':inventory}
    (OUT / 'package-manifest.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({k:result[k] for k in result if k!='includes'}, ensure_ascii=False))

if __name__ == '__main__':
    main()
