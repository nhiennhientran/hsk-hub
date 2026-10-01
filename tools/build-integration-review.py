"""Embed unchanged catalog, manifest, media and player in the teacher review page."""
from pathlib import Path
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'tools/review/hsk1-listening-device-review.html'
text=source.read_text(encoding='utf-8')
def script(path):
    code=path.read_text(encoding='utf-8')
    assert '</script' not in code.lower(), path
    return '<script>\n'+code+'\n</script>'
base=ROOT/'new-hsk1/hsk1/stage3'
text=text.replace('<script src="../../new-hsk1/hsk1/stage3/catalog.js"></script>',script(base/'catalog.js'))
text=text.replace('<script src="../../new-hsk1/hsk1/stage3/media-index.js"></script>',script(base/'media-index.js')+'\n'+'\n'.join(script(base/'media'/f'lesson-{n:02}.js') for n in range(1,16)))
text=text.replace('<script src="../../new-hsk1/hsk1/stage3/player.js"></script>',script(base/'player.js'))
text=text.replace('<a href="../../new-hsk1/hsk1/index.html">打开候选网站</a>','<p class="small">这是独立试听文件，音频已内嵌；候选网站另见整合交付包。本页不会修改学生成绩或自动上传核验结果。</p>')
assert '<script src=' not in text
out=ROOT/'dist/integration-step1';out.mkdir(parents=True,exist_ok=True)
file=out/'HSK1-Listening-Device-Review.html';file.write_text(text,encoding='utf-8')
manifest={'output':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'embedded_files':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [source,base/'catalog.js',base/'media-index.js',base/'player.js',*[base/'media'/f'lesson-{n:02}.js' for n in range(1,16)]]},'human_checks':'all pending until the reviewer marks them'}
(out/'review-build.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(file, file.stat().st_size, manifest['sha256'])
