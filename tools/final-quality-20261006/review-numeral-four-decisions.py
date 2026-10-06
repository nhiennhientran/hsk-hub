#!/usr/bin/env python3
"""Fixed four repaired numeral crops; retain every old decoder warning/cut."""
import importlib.util
from pathlib import Path

spec=importlib.util.spec_from_file_location('numeral_evidence_assembly',Path(__file__).with_name('review-numeral-seven-decisions.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.REPORT=m.BASE/'audio-review/hsk1-numeral-four-repaired-paired-01.json'
m.PEER=m.BASE/'audio-root-peer-numeral-repairs/explicit-independent-four-repaired-physical-recommendations.json'
m.FACTS_INDEX=m.BASE/'audio-hsk1/numeral-minimal-transition-syllable-evidence/producer-facts-index.json'
m.CTC_REPORTS=[m.BASE/'audio-review/independent-ctc-source-frame-review-01.json',m.BASE/'audio-review/numeric-three-new-transition-independent-ctc-01.json']
m.OUTPUT=m.BASE/'audio-review/hsk1-four-repaired-numeral-independent-decisions-01.json'
m.FIXED={'一':'75cb8adf432f14b09f156090','六':'4a0757af035aac27d599c828','千':'cf42ba2089ad9049882a487d','零':'c53f5a1a2190d5f72a667358'}
m.EXPLANATIONS={
 '一':('The new 3.035 cut precedes the first visible periodic/glide entry around 3.038 in the original phrase-final 再减一; the old 3.045 cut is retained as a cut-onset failure.','The complete i nucleus and declining original final lie inside 3.035–3.39 before the original long pause. This is the printed yī occurrence, not year-context yì or phone yāo.'),
 '六':('The new 1.345 cut is at the source qī-i to l constriction transition, removing the old selected stable previous i phase while retaining the complete original l/glide entry around 1.35.','The full iu movement and original final decay are inside the unchanged 1.80 end; the actual source 星期六 and printed liù remain separately bound. No synthetic quiet or source waveform alteration is used.'),
 '千':('The existing start retains the source q frication, glide and ian nucleus of 几千年. Printed qiān identifies this original occurrence.','The new 45.925 end is in the real low-amplitude n-to-n connected transition before the following 年 stronger entry around 45.94. The complete target nasal continuation is retained while the old 45.944 neighbor inclusion stays held.'),
 '零':('The new 10.5825 cut precedes the original weak l constriction-to-i transition around 10.584–10.59. The old 10.590 onset omission is not accepted.','The full original i nucleus, ng final and release remain before the end at 11.02. The immutable source is the final printed 0 in the phone code, explicitly separate from canonical 零/líng; neighboring preceding 九 is excluded at its real transition.'),
}
if __name__=='__main__':m.main()
