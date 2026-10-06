#!/usr/bin/env python3
"""Proposed fixed-source supplemental check; this does not authorize acceptance.

Only seven immutable observed nuclei in six independently reviewed original
readings are eligible. The complete syllable nucleus remains separate from its
stable acoustic analysis core. Existing autocorrelation bins are never changed.
The central reviewer must independently inspect and explicitly adopt any route.
"""
import hashlib, importlib.util, json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'course-app/docs/final-quality-20261006/audio-hsk3-ctc-independent-peer'
SCOPE_FILE=BASE/'hard-six-seven-fixed-original-nucleus-scope-proposal-01.json'
SCOPE_SHA='067ec72852571812ccd9ded1d77d97c4da87d31c3d872ed02fdb878ae675630d'
PHYSICAL_FILE=BASE/'hard-six-complete-original-reading-independent-physical-recommendations-01.json'
PHYSICAL_SHA='0c4718e46b55afd41af31ba8913f9918314abd0801dbed84ae4e564150ed3744'
METHOD='fixed-original-nucleus-80ms-hann-spectral-three-harmonics-v1'
IDENTITY=('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')

def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def load(p,sha):
 if digest(p)!=sha:raise ValueError('fixed independent scope bytes changed')
 return json.loads(Path(p).read_text())
def module(path):
 s=importlib.util.spec_from_file_location('hard_six_'+path.stem.replace('-','_'),path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def validate(row,proof,root,support,nuclei,source_pinyin_character_range):
 scopes=load(SCOPE_FILE,SCOPE_SHA)['scopes'];physical=load(PHYSICAL_FILE,PHYSICAL_SHA)
 selected=[s for s in scopes if s['id']==row['id']and s['sourcePinyinCharacterRange']==source_pinyin_character_range]
 if len(selected)!=1:raise ValueError('scope is limited to the exact seven independently reviewed original nuclei')
 scoped=selected[0]
 for k in ('id','candidateId',*IDENTITY):
  if scoped[k]!=row[k]:raise ValueError('fixed source ID/candidate/bytes/frames differ: '+k)
 if scoped['sourceText']!=row['sourceZH']:raise ValueError('fixed source word differs')
 support.actual_identity(row,proof,'hard-six-fixed-original-nucleus')
 if nuclei!=[scoped['completeObservedNucleusRange16k']]:raise ValueError('complete original nucleus geometry differs from physical decision')
 for k in ('sourcePinyinCharacterRange','sourcePinyinSegment','completeObservedNucleusRange16k','analysisNucleusRange16k','actualSpectrumObservation'):
  if proof.get(k)!=scoped[k]:raise ValueError('one exact canonical syllable/core/observation must match: '+k)
 py=row['sourcePinyin'];first,last=source_pinyin_character_range
 if py[first:last]!=scoped['sourcePinyinSegment']:raise ValueError('fixed nucleus pinyin slice differs from original canonical source')
 core=scoped['analysisNucleusRange16k'];full=scoped['completeObservedNucleusRange16k']
 if not full[0]<=core[0]<core[1]<=full[1]:raise ValueError('stable original analysis core must remain within the unchanged complete nucleus')
 actual=[d for d in physical['decisions']if d['id']==row['id']and d['candidateId']==row['candidateId']and d['sourceSampleRange16k']==row['sourceSampleRange16k']and d['cropPCM_SHA256']==row['cropPCM_SHA256']]
 if len(actual)!=1:raise ValueError('independent complete-source physical decision not bound to this exact crop')
 known=actual[0]['shortSyllableDecoderDecisionEvidence'];support.actual_identity(row,known,'known-complete-original-source-physical')
 for k in ('phonemeIdentityIsKnownForThisExactSourceOccurrence','actualOriginalSyllableWaveformAndSpectrumReviewed','completeOriginalOnsetOrGlideRetained','completeOriginalRimeAndFinalRetained','neighborPhonemesExcluded','sourceOccurrenceIndependentlyIdentified','allActualCropASRDiagnosticsRetained','noSyntheticPadding'):
  if known.get(k)is not True:raise ValueError('known original source requires independent phoneme/boundary fact: '+k)
 if proof.get('category')!='fixed-ID-original-nucleus-spectrum-proxy-review':raise ValueError('fixed original nucleus requires explicit supplemental category')
 for k in ('nucleusPhaseIndependentlyReviewed','actualThreeHarmonicSourceSpectrumReviewed','F0GateAndOriginalBinsUnchanged','noToneOrPhonemeCertificationClaimed'):
  if proof.get(k)is not True:raise ValueError('independent original spectral observation missing: '+k)
 if not proof.get('explanation'):raise ValueError('concrete original nucleus explanation missing')
 data=json.loads(support.actual_file(root,scoped['actualSpectrumObservation']).read_text())
 support.actual_identity(row,data,'actual-fixed-original-nucleus-spectrum')
 if data.get('method')!=METHOD or data.get('nucleusSampleRange16k')!=core:raise ValueError('fixed original spectral method/core differs')
 acoustic=module(ROOT/'tools/final-quality-20261006/review-fixed-nucleus-spectrum.py')
 if acoustic.METHOD!=METHOD:raise ValueError('existing shared original-spectrum method changed')
 pcm=support.original_pcm(root,row);windows=acoustic.observations(pcm,*core)
 if data.get('windows')!=windows:raise ValueError('original harmonic windows do not reproduce actual immutable source PCM')
 qualifying=[w for w in windows if w['harmonicNucleusObservation']]
 if len(qualifying)<2 or any(y['sourceWindowFrames16k'][0]-x['sourceWindowFrames16k'][0]!=320 for x,y in zip(qualifying,qualifying[1:])):raise ValueError('at least two contiguous unchanged original 80ms harmonic observations required')
 return {**proof,'exactScopeEvidence':{'file':str(SCOPE_FILE.relative_to(ROOT)),'sha256':SCOPE_SHA},'independentlyReviewedSourcePhysicalEvidence':{'file':str(PHYSICAL_FILE.relative_to(ROOT)),'sha256':PHYSICAL_SHA},'actualHarmonicWindows':len(qualifying),'completeOriginalNucleusGeometryUnchanged':True,'originalVoicedProxyThresholdsUnchanged':True,'automaticApproval':False,'productionApproved':False,'pronunciationToneCertified':False}

def main():
 support=module(ROOT/'tools/final-quality-20261006/review-decisions.py')
 report=ROOT/'course-app/docs/final-quality-20261006/audio-hsk3/decoder-hard31-closure/paired-selected31-actual-current-v1.json'
 rows={r['id']:r for r in json.loads(report.read_text())['targets']}
 physical=load(PHYSICAL_FILE,PHYSICAL_SHA);checks=[]
 for d in physical['decisions']:
  row=rows[d['id']];support.contextual_decision(row,d,ROOT);support.boundary_decision(row,d,ROOT)
  for alt in d['shortSyllableDecoderDecisionEvidence']['fixedOriginalNucleusSpectrumEvidenceBySyllable']:
   result=validate(row,alt,ROOT,support,[alt['completeObservedNucleusRange16k']],alt['sourcePinyinCharacterRange'])
   checks.append({'id':row['id'],'sourcePinyinCharacterRange':alt['sourcePinyinCharacterRange'],'actualHarmonicWindows':result['actualHarmonicWindows'],'status':'proposed-frozen-source-scope-diagnostic-pass-not-approval'})
 p=ROOT/'course-app/docs/final-quality-20261006/audio-review/hard-six-seven-exact-scope-central-validation-01.json'
 p.write_text(json.dumps({'schemaVersion':1,'proposedValidator':{'file':str(Path(__file__).relative_to(ROOT)),'sha256':digest(__file__)},'immutableScopeSHA256':SCOPE_SHA,'immutableIndependentSourcePhysicalSHA256':PHYSICAL_SHA,'checks':checks,'productionApprovals':0,'sharedValidatorModified':False,'centralIndependentReviewAndExplicitAdoptionRequired':True},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'file':str(p.relative_to(ROOT)),'sha256':digest(p),'sevenActualNucleiDiagnosticPassed':len(checks),'productionApprovals':0}))
if __name__=='__main__':main()
