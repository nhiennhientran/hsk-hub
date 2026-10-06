#!/usr/bin/env python3
"""Validate a fixed-ID statistical no-speech exception; never infer approval.

Only three literal, unprompted observations of the same actual crop plus an
independent complete original-reading/neighbor/spectrum decision may explain
the retained Whisper no-speech proxy. Other diagnostic holds stay closed.
"""
import importlib.util
import json
from pathlib import Path
import re

NO_SPEECH = 'crop-ASR-hallucination-or-no-speech-warning'
MODEL_SHA = 'c71f0ce00bec95b07744e116345e33d8cbbe08cef896382cf907bf4b51a2cd51'
GLYPH_SCOPE_REFERENCE = {
    'file': 'course-app/docs/final-quality-20261006/audio-review/explicit-noSpeech-glyph-scopes-02.json',
    'sha256': '5c6a84d57d5154ea8eced03495aa4ef23e2e7ffca60afb00bb036ef1ac4f0fad',
}
LEXICAL_ER_UTTERANCE_IDS = {'textbook-l14-text-3-line-01', 'textbook-l14-text-3-line-01-sentence-1'}
BACKGROUND_PEER_REFERENCE={'file':'course-app/docs/final-quality-20261006/audio-context-peer-hsk3-background6/independent-background6-explicit-decisions-v1.json','sha256':'0ac6af09df37893ddec2b7b68a3740ade2147cbbd61bc47d35cd2b7ebef0a53f'}
BACKGROUND_INPUT_REFERENCE={'file':'course-app/docs/final-quality-20261006/audio-hsk3/background-word-next10-evidence/background6-candidates.json','sha256':'c5cd96033b0ae69468384688499fe749afe72357203277e8efe2b1192b5c112e'}
BACKGROUND_SCOPES={
 'hsk3-fltrp-2026:l15:word18':('5bbe8981bfdf4006a92dd204','course-assets/hsk3/audio/15-4.mp3','80c5252f84bdaab161d6944ab7cc6bb7279ee4689a39638ad9e2820a4f76be81',(293439,308160),'084ae252ad503b1fd5a3e55b60a77f0332ce02a48bf51404f397967e5de31df6'),
 'hsk3-fltrp-2026:l17:word08':('fe8ce9045480cff067c3ccbb','course-assets/hsk3/audio/17-2.mp3','d70131dfef19b24c516a64480860f375f00551a7cb1c9d9075fd7ca1ca9f09c6',(278399,295841),'106fc6d907ee4a02bd98d490d14001d7acea8d42126680ca2ddc1854c41732a6'),
}
FIXED_NUMERIC_UTTERANCE=('hsk2-fltrp-2026:l08:text1:line6:sentence2','4acc949f511f58d47457b597',(269760,286400),'2ee5443d661303fae6f60679787e94fe8034e5ffa44df2bc75c9e940cc69e15d')


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(file))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m


def literal(text):
    # Remove whitespace/punctuation only. Script, digits and Roman letters
    # remain; no case, orthographic, homophone or numeral substitutions occur.
    import unicodedata
    return ''.join(c for c in text if not c.isspace() and not unicodedata.category(c).startswith('P'))


def integer_pair(value):
    return isinstance(value, list) and len(value) == 2 and all(type(x) is int for x in value)


def validate(row, decision, root, support=None):
    support = support or load('triple_support', 'review-decisions.py')
    proof = decision.get('tripleLiteralNoSpeechDecisionEvidence', {})
    support.actual_identity(row, proof, 'triple-literal-noSpeech')
    category = proof.get('category')
    background_category=category=='triple-literal-original-background-noSpeech-proxy-review'
    if category not in ('triple-literal-noSpeech-proxy-review', 'triple-fixed-source-glyph-noSpeech-proxy-review', 'triple-literal-original-background-noSpeech-proxy-review'):
        raise ValueError('triple review needs its fixed-ID category')
    validated_background=None
    if background_category:
        actual=(row.get('candidateId'),row.get('sourceTrack'),row.get('sourceSHA256'),tuple(row.get('sourceSampleRange16k',[])),row.get('cropPCM_SHA256'))
        if BACKGROUND_SCOPES.get(row['id'])!=actual or proof.get('authorizedOriginalBackgroundPeerEvidence')!=BACKGROUND_PEER_REFERENCE or proof.get('authorizedImmutableInputEvidence')!=BACKGROUND_INPUT_REFERENCE:
            raise ValueError('combined background proxy is restricted to two exact source crops and immutable peer/input pins')
        pool=json.loads(support.actual_file(root,BACKGROUND_INPUT_REFERENCE).read_text())
        if len([x for x in pool['targets']if x.get('id')==row['id']and x.get('candidateId')==row['candidateId']and x.get('sourceSampleRange16k')==row['sourceSampleRange16k']and x.get('cropPCM_SHA256')==row['cropPCM_SHA256']])!=1:
            raise ValueError('combined background crop is absent from its immutable original input')
        peer=json.loads(support.actual_file(root,BACKGROUND_PEER_REFERENCE).read_text())
        peers=[x for x in peer['decisions']if x['id']==row['id']and x['candidateId']==row['candidateId']and x['sourceSampleRange16k']==row['sourceSampleRange16k']]
        if len(peers)!=1 or decision.get('boundaryDecisionEvidence')!=peers[0].get('boundaryDecisionEvidence') or decision.get('boundaryDecisionEvidence',{}).get('category')!='continuous-original-background' or proof.get('originalBackgroundAndEverySyllableIndependentlyReviewed')is not True:
            raise ValueError('combined proxy requires the independent exact original-background and complete-syllable decision')
        validated_background=support.boundary_decision(row,decision,root)
    glyph_scope = proof.get('explicitSourceGlyphScopeEvidence')
    approved_traditional = None
    if category == 'triple-fixed-source-glyph-noSpeech-proxy-review':
        registered = json.loads(support.actual_file(root, GLYPH_SCOPE_REFERENCE).read_text())
        exact = [x for x in registered['targets'] if all(x.get(k) == row[k] for k in ('id', 'candidateId', 'sourceSampleRange16k', 'cropPCM_SHA256')) and x['canonicalSourceText'] == row['sourceZH']]
        if len(exact) != 1:
            raise ValueError('glyph proxy lies outside the exact byte-pinned authorized source-frame scope')
        entry = exact[0]
        approved_traditional = entry['explicitTraditionalSourceText']
        if not glyph_scope or glyph_scope.get('id')!=row['id'] or glyph_scope.get('candidateId')!=row['candidateId'] or glyph_scope.get('sourceSampleRange16k')!=row['sourceSampleRange16k'] or glyph_scope.get('cropPCM_SHA256')!=row['cropPCM_SHA256'] or glyph_scope.get('canonicalSourceText')!=row['sourceZH'] or glyph_scope.get('originalTraditionalSourceText')!=approved_traditional or glyph_scope.get('onlyExplicitTraditionalSimplifiedGlyphDifference')is not True or glyph_scope.get('noGlobalConversion')is not True:
            raise ValueError('glyph proxy requires an exact source-frame whitelist and explicit approved glyph pair')
        if entry.get('originalRawResultWhitelist')is not None and glyph_scope.get('originalRawResultWhitelist')!=entry['originalRawResultWhitelist']:
            raise ValueError('fixed glyph scope must retain the separately registered actual raw whitelist')
        approved_pool=json.loads(support.actual_file(root,entry['immutableInputScope']).read_text())
        matched=[x for x in approved_pool['targets']if x['id']==row['id']and x['candidateId']==row['candidateId']and x['sourceSampleRange16k']==row['sourceSampleRange16k']and x['cropPCM_SHA256']==row['cropPCM_SHA256']]
        if len(matched)!=1:raise ValueError('glyph proxy lies outside the explicitly approved immutable per-ID scope')
    elif glyph_scope:
        raise ValueError('strict literal review cannot conceal a script-conversion scope')
    def same_text(text):
        compared=literal(text)
        return compared==literal(row['sourceZH']) or (category=='triple-fixed-source-glyph-noSpeech-proxy-review' and compared==approved_traditional)
    permitted_holds={NO_SPEECH,'non-quiet-boundary-needs-independent-phoneme-review'}if background_category else{NO_SPEECH}
    if set(row['holds']) != permitted_holds:
        raise ValueError('triple review can explain only a sole no-speech hold')
    if row['unit'] not in ('word', 'line', 'sentence') or row.get('expectedReadingCount', 1) != 1 or row.get('clipUnit') != {'word':'single-original-pronunciation', 'line':'original-source-line', 'sentence':'single-original-sentence'}[row['unit']]:
        raise ValueError('triple review needs exactly one original reading or utterance')
    lexical_er = row['id'] in LEXICAL_ER_UTTERANCE_IDS and row['sourceZH'] == '明年女儿上中学。' and row['candidateId'] == {'textbook-l14-text-3-line-01':'25b40d0fe8a7b4e2613c365c', 'textbook-l14-text-3-line-01-sentence-1':'c757a20d594aadb1339e6471'}[row['id']] and row['sourceSampleRange16k'] == [11200, 44480] and row['cropPCM_SHA256'] == '1b5ea6f2da92e253c090469554fb1f22f4a45335916658db0218e2d2da7dd735'
    numeric_utterance=(row['id'],row.get('candidateId'),tuple(row['sourceSampleRange16k']),row['cropPCM_SHA256'])==FIXED_NUMERIC_UTTERANCE and row['sourceZH']=='八千八！' and row['unit']=='sentence' and row['sourceTrack']=='course-assets/hsk2/audio/8-1.mp3' and row['sourceSHA256']=='89d72e1fd90022c963425095512515838d1f54d999457275a9cd28e03827277e' and row['canonicalSource']['file']=='course-app/content/hsk2/lesson-08.json' and row['canonicalSource']['sha256']=='90c7c19aac1d78ed62752356eefe09b6d3ee968c528c2008a53f0f2b1f96d00a' and row['canonicalSource']['sourceJSONPointer']=='/texts/0/lines/5'
    if numeric_utterance:
        numeric=proof.get('independentFixedNumericUtteranceReviewEvidence',{})
        support.actual_identity(row,numeric,'fixed numeric utterance')
        if numeric.get('category')!='single-fixed-original-three-syllable-numeral-utterance' or any(numeric.get(k)is not True for k in ('completeOriginalNumeralUtteranceIndependentlyReviewed','allThreePrintedSyllablesPresentInSourceOrder','noDigitOrAlternateNumberConversion')) or not numeric.get('explanation'):
            raise ValueError('fixed numeric utterance needs explicit complete original number/phoneme review')
        syllables=numeric.get('originalSyllableComponents16k',[]);previous=row['sourceSampleRange16k'][0]
        if len(syllables)!=3:raise ValueError('fixed numeral utterance requires all three original source syllables')
        for part,expected in zip(syllables,('bā','qiān','bā')):
            frames=part.get('sourceSampleRange16k')
            if part.get('originalPrintedPinyin')!=expected or not integer_pair(frames)or not previous<=frames[0]<frames[1]<=row['sourceSampleRange16k'][1]or not part.get('onsetRimeAndFinalExplanation'):
                raise ValueError('fixed numeral utterance source component/order differs')
            previous=frames[1]
    if not re.search(r'[\u3400-\u9fff]', row['sourceZH']) or ('儿' in row['sourceZH'] and not lexical_er) or re.search(r'[0-9A-Za-z]', row['sourceZH']) or (re.fullmatch(r'[一二三四五六七八九十百千万亿零两]+[！!。.]?', row['sourceZH'])and not numeric_utterance):
        raise ValueError('numeral, rhotic or non-CJK target needs the separate phoneme contract')
    required = ('completeOriginalOnsetRimeAndFinalReviewed', 'neighborPhonemesExcluded',
                'sourceOrderChecked', 'originalPrintedPronunciationChecked',
                'allASRWarningsRetained', 'noSyntheticPadding')
    if any(proof.get(k) is not True for k in required) or proof.get('phonemeIdentityUnknown') is not False:
        raise ValueError('triple review lacks explicit known complete original reading')
    if any(proof.get(k, False) for k in ('humanListening', 'nativeSpeakerReview', 'pronunciationToneCertified', 'devicePlaybackCertified', 'fullPhonemeCertification')):
        raise ValueError('triple review cannot claim unsupported certification')
    if not all(proof.get(k) for k in ('explanation', 'onsetExplanation', 'rimeAndFinalExplanation', 'originalReadingExplanation')):
        raise ValueError('triple review requires concrete component and original-reading explanations')
    edges = row.get('actualEdgeRMSDbFS20ms', {})
    if not background_category and (not edges or any(v is not None and v > -45 for v in edges.values())):
        raise ValueError('triple review requires every actual available 20-ms edge to be quiet')
    models = row['rawModelEvidence']; snapshots = set(); warnings = []
    for e in models:
        raw = json.loads(support.actual_file(root, e).read_text()); support.unprompted(raw)
        model = (raw.get('modelRepository'), raw.get('modelRevision'))
        if model not in support.PINNED_MODELS or not same_text(e['rawTranscript']):
            raise ValueError('triple review needs two pinned literal crop transcripts')
        snapshots.add(model)
        if set(e['holds']) - {NO_SPEECH}:
            raise ValueError('another actual crop diagnostic cannot use the no-speech route')
        if raw.get('candidateId') != row['id'] or raw.get('originalSourceTrack') != row['sourceTrack'] or raw.get('originalSourceSHA256') != row['sourceSHA256'] or raw.get('sourceSampleRange16k') != row['sourceSampleRange16k'] or raw.get('cropPCM_SHA256') != row['cropPCM_SHA256']:
            raise ValueError('triple Whisper binding differs from the actual crop')
        segments = raw.get('rawSegments', [])
        if not segments or ''.join(s.get('text', '') for s in segments) != e['rawTranscript']:
            raise ValueError('triple Whisper native transcript changed or missing')
        if glyph_scope:
            whitelisted=[x for x in glyph_scope.get('originalRawResultWhitelist',[])if x.get('file')==e['file']and x.get('sha256')==e['sha256']and x.get('modelRepository')==e['modelRepository']and x.get('rawTranscript')==e['rawTranscript']]
            if len(whitelisted)!=1:raise ValueError('glyph scope must retain each exact actual Whisper result')
        for s in segments:
            if s.get('compression_ratio', 0) > 2.4:
                raise ValueError('compression/caption diagnostic is not a sole no-speech proxy')
            if s.get('no_speech_prob', 0) > .6:
                warnings.append({'modelRepository': model[0], 'segmentId': s.get('id'), 'no_speech_prob': s['no_speech_prob']})
    if snapshots != support.PINNED_MODELS or not warnings:
        raise ValueError('two distinct actual model snapshots and a retained no-speech probability are required')
    ctc_ref = proof.get('independentlyVerifiedCTCSupplementalEvidence', {})
    checked = json.loads(support.actual_file(root, ctc_ref).read_text())
    if checked.get('status') != 'independent-CTC-bytes-source-frames-verified-not-approved':
        raise ValueError('CTC needs independent actual byte/source/frame verification')
    matching = [x for x in checked.get('observations', []) if x.get('id') == row['id'] and x.get('sourceSampleRange16k') == row['sourceSampleRange16k'] and x.get('cropPCM_SHA256') == row['cropPCM_SHA256']]
    if len(matching) != 1:
        raise ValueError('CTC verification does not bind the same exact target crop')
    obs = matching[0]; support.actual_identity(row, {**obs, 'sourceText': row['sourceZH']}, 'triple-CTC')
    raw = json.loads(support.actual_file(root, obs['rawEvidence']).read_text())
    if raw.get('modelSHA256') != MODEL_SHA or raw.get('expectedTextPromptUsed') is not False or raw.get('rawText') != obs['rawText'] or json.loads(raw['rawResultString']) != raw['rawResult'] or raw['rawResult']['text'] != raw['rawText'] or not same_text(raw['rawText']):
        raise ValueError('CTC model/native literal crop observation differs')
    if glyph_scope:
        whitelisted=[x for x in glyph_scope.get('originalRawResultWhitelist',[])if x.get('file')==obs['rawEvidence']['file']and x.get('sha256')==obs['rawEvidence']['sha256']and x.get('modelRepository')=='SenseVoiceSmall-int8'and x.get('rawTranscript')==raw['rawText']]
        if len(whitelisted)!=1:raise ValueError('glyph scope must retain the exact actual CTC native result')
    original = proof.get('originalPrintedSource', {})
    original_path = support.actual_file(root, original)
    if str(original_path.resolve()) != str((root / row['canonicalSource']['file']).resolve()) or original['sha256'] != row['canonicalSource']['sha256'] or original.get('sourceJSONPointer') != row['canonicalSource']['sourceJSONPointer']:
        raise ValueError('triple printed source differs from the pinned canonical row')
    syllable = load('triple_syllable_features', 'review-syllable-evidence.py')
    obj = syllable.pointer(json.loads(original_path.read_text()), original['sourceJSONPointer'])
    zh = obj.get('zh', obj.get('sourceText')); py = obj.get('py', obj.get('sourcePinyin'))
    track = obj.get('audioTrack') or obj.get('audio', {}).get('track')
    parent = original['sourceJSONPointer']
    while not track and parent:
        parent = parent.rpartition('/')[0]
        if parent:
            ancestor = syllable.pointer(json.loads(original_path.read_text()), parent)
            if isinstance(ancestor, dict):
                track = ancestor.get('audioTrack') or ancestor.get('audio', {}).get('track') or ancestor.get('source', {}).get('audioTrack')
    canonical_zh = row['sourceZH'] if row['unit']=='word' else row['canonicalSource']['parentZH']
    expected_printed_py=row['sourcePinyin'] if row['unit']=='word' else row['canonicalSource']['sourcePinyin']
    if zh != canonical_zh or py != expected_printed_py or not track or not row['sourceTrack'].endswith('/' + str(track) + '.mp3'):
        raise ValueError('canonical printed head/pinyin/recording identity differs')
    if lexical_er:
        if row['canonicalSource']['file'] != 'hsk1-app/content/textbook.json' or row['canonicalSource']['sha256'] != '5079b381a30d5d7785db5ee93d17b1ad71380a53633146001150c874f27558d7' or row['canonicalSource']['sourceJSONPointer'] != '/lessons/13/scenes/2/lines/0' or py != 'míng nián nǚ ér shàng zhōng xué。':
            raise ValueError('independent lexical er must remain the exact printed daughter utterance')
        er = proof.get('independentLexicalErReviewEvidence', {})
        if er.get('category') != 'separate-original-lexical-er-syllable' or er.get('sourceSampleRange16k') != [21280, 28480] or er.get('separateNuAndErSyllablesIndependentlyReviewed') is not True or not er.get('explanation'):
            raise ValueError('lexical er requires explicit complete independent daughter syllable review')
    pcm = support.original_pcm(root, row); first, last = row['sourceSampleRange16k']
    marks = proof.get('selectedCompleteOriginalReadingFrames16k'); limits = proof.get('independentlyReviewedNeighborLimits16k')
    if not integer_pair(marks) or not integer_pair(limits) or not 0 <= limits[0] <= first <= marks[0] < marks[1] <= last <= limits[1] <= len(pcm)//4:
        raise ValueError('complete original-reading and neighbor extents do not fit this crop')
    reading = proof.get('sourceReadingEvidence' if row['unit']=='word' else 'sourceUtteranceEvidence', {})
    if row['unit']=='word':
        heads = reading.get('canonicalHeads', []); hi = reading.get('selectedHeadOrdinal0Based'); ri = reading.get('selectedRepetition1Based')
        if type(hi) is not int or not 0 <= hi < len(heads) or heads[hi] != row['sourceZH'] or ri not in (1, 2) or ri != row.get('repetition'):
            raise ValueError('source head and actual original repetition are not fixed')
        counts=[2]*len(heads)
        registered_four={'v-l03-lex-f0ef38a883-s1':('谁','shéi / shuí'),
                         'v-l07-lex-c5a8f40bc0-s1':('里','li / lǐ'),
                         'v-l09-lex-586e4f0ccf-s1':('边','bian / biān'),
                         'v-l09-lex-b967ce841a-s1':('上','shang / shàng')}
        for alt in reading.get('originalFourReadingHeadEvidence',[]):
            source_ref=alt.get('canonicalPrintedSource',{})
            source_path=support.actual_file(root,source_ref)
            original_obj=syllable.pointer(json.loads(source_path.read_text()),source_ref.get('sourceJSONPointer',''))
            registered=registered_four.get(original_obj.get('id'))
            if not registered or (original_obj.get('zh'),original_obj.get('py'))!=registered or alt.get('head')!=registered[0] or alt.get('actualPrintedPinyin')!=registered[1] or alt.get('actualFourReadingsIndependentlyReviewed')is not True or not alt.get('explanation') or not row['sourceTrack'].endswith('/'+original_obj.get('audio',{}).get('track','')+'.mp3'):
                raise ValueError('only four exact registered printed alternative heads can use an actual four-reading map')
            indexes=[i for i,h in enumerate(heads)if h==registered[0]]
            if len(indexes)!=1 or indexes[0]==hi or counts[indexes[0]]!=2:
                raise ValueError('four-reading evidence must uniquely bind a neighboring canonical head')
            counts[indexes[0]]=4
        ordered = reading.get('orderedOriginalReadings', []); selected = []; previous = 0
        if len(ordered) != sum(counts):
            raise ValueError('complete original head-reading map is required')
        labels=[(h,j+1)for h,n in zip(heads,counts)for j in range(n)]
        selected_index=sum(counts[:hi])+ri-1
        for i, entry in enumerate(ordered):
            bounds = entry.get('sourceSampleRange16k')
            if (entry.get('head'),entry.get('readingOrdinal')) != labels[i] or not integer_pair(bounds) or not previous <= bounds[0] < bounds[1] <= len(pcm)//4:
                raise ValueError('original complete reading map inverts, overlaps or changes source order')
            previous = bounds[1]
            if i == selected_index:
                selected = bounds
            elif bounds[0] < last and bounds[1] > first:
                raise ValueError('crop includes another original head or repeated reading')
        if selected != marks:
            raise ValueError('chosen complete reading differs from the explicitly inspected source map')
    else:
        if reading.get('canonicalSourceId')!=row['canonicalSource']['sourceId'] or reading.get('sentenceOrdinal')!=row['canonicalSource']['sentenceOrdinal'] or reading.get('parentZH')!=canonical_zh or reading.get('actualUtteranceFrames16k')!=marks:
            raise ValueError('single utterance does not bind original line and sentence ordinal')
        for key, side in [('previousActualSpeechFrames16k','previous'), ('followingActualSpeechFrames16k','following')]:
            adjacent=reading.get(key)
            if adjacent is not None and (not integer_pair(adjacent) or not 0<=adjacent[0]<adjacent[1]<=len(pcm)//4 or (side=='previous' and adjacent[1]>first) or (side=='following' and adjacent[0]<last)):
                raise ValueError('utterance crop includes adjacent original speech')
        if reading.get('completeOriginalUtteranceIndependentlyReviewed') is not True:
            raise ValueError('entire original utterance needs explicit independent start-to-end review')
    refs = reading.get('wholeSourceEvidence', [])
    if not refs:
        raise ValueError('complete original source needs immutable no-prompt model context')
    for ref in refs:
        full = json.loads(support.actual_file(root, ref).read_text()); support.unprompted(full)
        if full.get('cropPCM_SHA256', full.get('track', {}).get('pcm', {}).get('sha256')) != row['sourcePCM_SHA256']:
            raise ValueError('whole original source context has another decoded PCM')
    wave = json.loads(support.actual_file(root, proof.get('waveformObservation', {})).read_text())
    if any(wave.get(k) != row[k] for k in ('sourceTrack', 'sourceSHA256', 'sourcePCM_SHA256')):
        raise ValueError('spectrum is not this original source')
    plots = [x for x in wave.get('plots', []) if x.get('id') == row['id'] and x.get('sourceSampleRange16k') == [first,last] and x.get('cropPCM_SHA256') == row['cropPCM_SHA256']]
    if len(plots) != 1:
        raise ValueError('spectrum lacks a unique exact frame/crop plot')
    support.actual_file(root, plots[0])
    actual = json.loads(support.actual_file(root, proof.get('actualSyllableFeatureEvidence', {})).read_text())
    support.actual_identity(row, actual, 'triple-actual-features')
    bins = syllable.features(pcm, first, last)
    if actual.get('featureBins') != bins or actual.get('featureBinsSHA256') != syllable.feature_sha(bins):
        raise ValueError('voiced observations do not reproduce actual original PCM')
    voiced = [x for x in bins if x['voicedObservation'] and marks[0] <= x['sourceWindowFrames16k'][0] and x['sourceWindowFrames16k'][1] <= marks[1]]
    if len(voiced) < 10 or max(x['sourceWindowFrames16k'][1] for x in voiced) - min(x['sourceWindowFrames16k'][0] for x in voiced) < 1280:
        raise ValueError('original selected reading lacks a real voiced nucleus observation')
    return dict(proof, retainedWhisperNoSpeechWarnings=warnings, allRawEvidenceUnchanged=True,
                independentlyValidatedOriginalBackgroundDecision=validated_background,
                statisticalNoSpeechThresholdUnchanged=True, CTCAloneNeverAccepts=True,
                automaticProductionApproval=False)
