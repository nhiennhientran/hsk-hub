#!/usr/bin/env python3
"""Two exact original nuclei with independently inspected harmonic evidence.

The actual voiced-bin observations stay unchanged (3 for 百, 7 for 十).
This fixed source/frame spectral alternative is separately checked; it cannot
identify a phoneme, authorize a different crop, or certify pronunciation tone.
"""
import importlib.util
import json
from pathlib import Path

spec=importlib.util.spec_from_file_location('numeral_assembly',Path(__file__).with_name('review-numeral-seven-decisions.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.FIXED={'百':'2df2a5cedd55bb39cd3217b3','十':'a45a20efcbde78b7416208d0'}
m.OUTPUT=m.BASE/'audio-review/hsk1-bai-shi-fixed-nucleus-independent-decisions-01.json'
m.CTC_REPORTS=[m.BASE/'audio-review/independent-ctc-source-frame-review-01.json',m.BASE/'audio-review/numeric-six-ten-complete-tail-ctc-independent-ctc-01.json']
m.FACTS_INDEX=m.BASE/'audio-review/bai-shi-immutable-facts-index-01.json'
m.EXPLANATIONS={
 '百':('The original b release follows the real low-amplitude previous-yi decay and enters the a part of ai around 4.315; the unchanged 4.265 cut retains that complete attack.', 'The original ai movement and declining final continue to about 4.47 within the 4.485 end, before the following yuan stronger onset. Actual sustained harmonic energy in four original 80ms windows is separately measured; the unchanged irregular-periodicity result remains only three voiced bins.'),
 '十':('The unchanged 3.40 start retains the original sh frication beginning around 3.59 and its transition into the apical vowel near 3.75.', 'The complete original apical nucleus continues through about 3.98 before the next shi frication near 4.00, inside the actual 3.985 end. Six original 80ms windows have reproduced three-harmonic observations, while the old seven voiced bins and their original threshold are retained.'),
}
for glyph,cid,ranges in [('百',m.FIXED['百'],[('onset',[68240,69040]),('nucleus',[69040,71520]),('release',[71520,71760])]),('十',m.FIXED['十'],[('onset',[57360,60000]),('nucleus',[60000,63680]),('release',[63680,63760])])]:
 m.NUCLEUS_SPECTRUM_REVIEWS[cid]={
  'independentlyReviewedComponents16k':[{'kind':k,'sourceSampleRange16k':v,'source':'independent fixed original source phase inspection'}for k,v in ranges],
  'actualSpectrumObservation':m.ref(m.BASE/f'audio-review/{cid}-actual-nucleus-spectrum-01.json'),
  'explanation':m.EXPLANATIONS[glyph][1]+' This fixed source/frame proxy observes sustained original harmonic energy and does not certify pitch, tone or phoneme identity; those source/onset/rime/final and neighbor decisions remain independent.'}

if __name__=='__main__':
 refs=[]
 for path in [m.BASE/'audio-hsk1/numeral-original-syllable-evidence/producer-facts-index.json',m.BASE/'audio-hsk1/numeral-complete-tail-syllable-evidence/producer-facts-index.json']:
  refs.extend(x for x in json.loads(path.read_text())['targets']if x['candidateId']in m.FIXED.values())
 assert len(refs)==2 and len({x['candidateId']for x in refs})==2
 m.FACTS_INDEX.write_text(json.dumps({'schemaVersion':1,'targets':refs,'sourceFactsUnchanged':True,'originalVoicedProxyThresholdsUnchanged':True},ensure_ascii=False,indent=2)+'\n')
 m.main()
