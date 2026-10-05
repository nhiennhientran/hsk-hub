"""Record root's completed L13 original-page manual observations."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[5];OUT=Path(__file__).resolve().parent
source_bytes=(OUT/'author-input/source.json').read_bytes();s=json.loads(source_bytes)
assert hashlib.sha256(source_bytes).hexdigest()=='599d8063b2bcfe4fc0f9ff1d14b8e62d27be2a4f97ae83950bcbef81d9c0c6b0'
prior=ROOT/'course-app/docs/recovery-20261005/qa-official-vi/hsk1-l11'
previous=ROOT/'course-app/docs/recovery-20261005/qa-official-vi/hsk1-l12'
assert (OUT/'renders/pdf-111-independent.png').read_bytes()==(previous/'renders/pdf-111-independent.png').read_bytes()
prior_review=json.loads((prior/'review.json').read_bytes())
assert s['appendixOccurrences']==json.loads((prior/'author-input/source.json').read_bytes())['appendixOccurrences']
for p in range(138,146):
    assert (OUT/f'renders/pdf-{p:03}-independent.png').read_bytes()==(prior/f'renders/pdf-{p:03}-independent.png').read_bytes()
manual={
111:'Original whole page actually viewed in L12 boundary review; byte-identical raster now verified. Full 请给我一杯茶 / Cho tôi một cốc trà, Bài13, all four goals and warmup instruction match. First goal has three physical VI lines and three ASCII dots. Warmup pictures/options are Chinese/pinyin only.',
112:'New whole-page actual reading: full classroom scene, listening instruction and four complete Chinese/VI roles match. Chinese bubble labels use 白家月/王一飞; teacher title 王老师/cô Vương in context remains distinct from original Vương Nhất Phi speaker prefix. Every role and physical wrap, role/read instruction and both full bilingual questions verified.',
113:'New whole-page actual reading: words1–6, actual headwords/pinyin/gloss/POS verified. 打电话 has a truly blank POS cell, preserved null. Full 可以 and 动词+一下 grammar explanations/titles and instructions match with physical wraps; Chinese-only grammar examples have no inferred VI translations.',
114:'New whole-page actual reading: complete café scene, listening instruction and four whole paired Chinese/VI roles, with Vương Nhất Tuyết and Nhân viên phục vụ roles, match. Both complete reading questions and instructions match, including two physical lines of the first question.',
115:'New whole-page actual reading: words7–17 and all raw POS/glosses/pinyin match, including actual dt. on 杯 and đgt. on 要. 服务员 is unstarred in body. Full two-line Câu có hai tân ngữ explanation, grammar/read labels, text3 scene and listening instruction match. Examples and choices are Chinese-only.',
116:'New whole-page actual reading: words18–20 with all original POS/gloss/pinyin and six complete Chinese/VI dialogue turns match. Whole speaker prefixes Nhân viên phục vụ/Lưu Minh, five multi-line role/word areas, numbers40/20 and printed cân wording retained. Both reading questions and instructions match, including original cơm trắng for 米饭.',
117:'New whole-page actual reading: exercise heading, full fill-blank and two-line picture instruction match. Chinese blank stems/options and four picture prompts were viewed in full, without invented VI answers or translations.',
118:'New whole-page actual reading: role-play heading/title/full two-line instruction and Ví dụ của Tiểu Ngữ match. Both actual inline role labels (Khách hàng 1)/(Khách hàng 2) captured, with otherwise Chinese-only example dialogue. Complete Món quà của Tiểu Ngữ and Trà Trung Quốc labels match. Whole page closes lesson13; no summary or unseen video transcript inferred.',
119:'New whole boundary actually viewed: Bài14 / 我看了一个电影 / Mình đã xem một bộ phim starts the next chapter. Excluded from L13 accepted body source IDs.'
}
observations={str(p):{'pdfPage':p,'printedPage':f'{p-16:03}','actuallyViewedWholePage':True,
    'scope':'body' if p<119 else 'boundary-only','observation':note} for p,note in manual.items()}
for page in range(138,146):
    observations[str(page)]={**prior_review['pageObservations'][str(page)],
        'originalManualReadingReuse':'Actual prior root L11 original whole-page reading, exact88 source-object and eight original-raster equality verified.',
        'observation':prior_review['pageObservations'][str(page)]['observation']+' L13 relevant20 Chinese/pinyin/lesson references manually checked against those full original pages; 打电话 keeps dǎ diànhuà, appendix marks *服务员, and 要/坐/再 retain all actual multi-lesson references. Index contains no VI word glosses.'}
notes={'schemaVersion':3,'lesson':13,'reviewer':'/root','status':'all-source-records-manually-reviewed',
    'selectedSource':'author-input/source.json','selectedSourceSHA256':hashlib.sha256(source_bytes).hexdigest(),
    'selectedAuthorRevision':'original immutable recovery author source, no repairs',
    'bodyOccurrenceCount':115,'wordRows':20,'uniqueWordHeadwords':20,'printedPOS':19,
    'dialogueTurnsByText':{'1':4,'2':4,'3':6},'pageObservations':observations,
    'resolvedAuthorTranscriptionRepairs':[],
    'textbookSemanticObservations':[
      {'word':'杯','observation':'Actual body115 prints dt.; preserve the printed source label separately from any website normalized POS decision.'},
      {'word':'服务员','observation':'Body115 unstarred, appendix139 starred; actual physical markings retained separately.'},
      {'occurrenceId':'hsk1-official-vi-l13-pdf116-text-3-role-02','observation':'Printed cân is retained for Chinese 斤 in this chapter; source fidelity alone does not redefine this unit as one kilogram.'}
    ]}
p=OUT/'manual-notes.json';assert not p.exists()
p.write_bytes((json.dumps(notes,ensure_ascii=False,indent=2)+'\n').encode())
print('Root manual L13 notes ready; structural freeze remains a separate step.')
