import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {viProposalCanonicalJSON} from '../../../../src/official-vi-revisions.ts';
const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'../../../../../');
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const read=n=>fs.readFileSync(path.join(here,n));
const load=n=>JSON.parse(read(n));
const initial=load('input-copy/draft-manifest.initial.json'),current=load('input-copy/author-manifest.v2.json');
assert.equal(sha(read('input-copy/author-manifest.v2.json')),'0bbcded8982ad7882bba79bd2107772d37597939c7f809c6b06afd136a974117');
assert.equal(sha(viProposalCanonicalJSON(initial)),'fb744e2808f60f28d43830179ec2f164f66e293789628710bbe90ee153e0b7f1');
assert.equal(sha(viProposalCanonicalJSON(current)),'c443e01f08292a0c632723b6a130b5d50382b51486c87873c59f7317ac5bfb08');
assert.equal(initial.changes.length,135);assert.equal(current.changes.length,136);
const delta=[];
function diff(a,b,p=''){
 if(JSON.stringify(a)===JSON.stringify(b))return;
 if(a===null||b===null||typeof a!=='object'||typeof b!=='object'){delta.push({path:p,before:a,after:b});return;}
 for(const key of [...new Set([...Object.keys(a),...Object.keys(b)])])diff(a[key],b[key],p+'/'+key);
}
diff(initial,current);
const deltaChecks=delta.map(d=>{
 let kind;
 if(d.path==='/revisionId'){assert.equal(d.before,'hsk3-official-vi-pilot-l10-draft-20261004');assert.equal(d.after,'hsk3-official-vi-pilot-l10-v2-20261004');kind='new-final-author-proposal-identity';}
 else if(/^\/changes\/\d+\/authorReview\/(reviewer|status)$/.test(d.path)){
  if(d.path.endsWith('/reviewer')){assert.equal(d.before,'remaining_media_audit');assert.equal(d.after,'root');}
  else{assert.equal(d.before,'proposal-awaiting-explicit-manifest-author-review');assert.equal(d.after,'accepted');}
  kind='root-explicit-author-review';
 }
 else if(/^\/changes\/\d+\/sourceAnchor\/compositionReview\/(author|status)$/.test(d.path)){
  if(d.path.endsWith('/author')){assert.equal(d.before,undefined);assert.equal(d.after,'root');}
  else{assert.equal(d.before,'pending');assert.equal(d.after,'accepted-by-author-awaiting-independent-proof');}
  kind='root-explicit-derived-composition-review';
 }
 else if(d.path==='/changes/14/sourceAnchor/pdfPages/1'){assert.equal(d.before,undefined);assert.equal(d.after,202);kind='repaired-complete-cross-page-source';}
 else if(d.path==='/changes/14/sourceAnchor/printedPages/1'){assert.equal(d.before,undefined);assert.equal(d.after,190);kind='repaired-complete-cross-page-source';}
 else if(d.path==='/changes/135'){assert.equal(d.before,undefined);assert.equal(d.after.changeId,'hsk3-l10:ee4eeda1d3f100b2e82f761a');kind='independently-reviewed-context-erratum-candidate';}
 else if(d.path.startsWith('/coverage/'))kind='explicit-changed-field-only-touched-owner-coverage';
 else throw Error('Unreviewed initial/v2 leaf delta '+JSON.stringify(d));
 return {...d,reviewDecision:'accepted',reviewKind:kind};
});
for(const key of ['schemaVersion','engine','courseId','parentDisplayRevision','baselineFiles','sources'])assert.deepEqual(initial[key],current[key]);
const stripAuthorMetadata=c=>{
 const v=structuredClone(c);delete v.authorReview;
 if(v.sourceAnchor.compositionReview){delete v.sourceAnchor.compositionReview.author;delete v.sourceAnchor.compositionReview.status;}
 if(v.changeId==='hsk3-l10:3b1e30891a53e107018a001d'){v.sourceAnchor.pdfPages=[201];v.sourceAnchor.printedPages=[189];}
 return v;
};
for(let i=0;i<135;i++)assert.deepEqual(stripAuthorMetadata(initial.changes[i]),stripAuthorMetadata(current.changes[i]));
assert.deepEqual(current.coverage.acceptedOwnerIds,[...new Set(current.changes.map(c=>c.ownerId))]);
assert.deepEqual(current.coverage.pendingOwnerIds,[]);assert.deepEqual(current.coverage.unresolvedOwnerIds,[]);
assert.equal(current.coverage.fullLessonAlignmentAccepted,false);
assert.equal(current.coverage.scope,'136 changed fields only; owner IDs identify touched consumers and do not certify all owner fields');
assert.equal(current.independentReview,undefined);
const oldDecisions=load('change-decisions.initial.json'),decisions=load('change-decisions.v2-structural.json');
assert.equal(oldDecisions.length,135);assert.equal(decisions.length,136);
for(let i=0;i<135;i++){
 const before=oldDecisions[i],after=decisions[i];assert.equal(before.changeId,after.changeId);assert.equal(before.oldValue,after.oldValue);assert.equal(before.newValue,after.newValue);assert.deepEqual(before.sourceFragments,after.sourceFragments);assert.deepEqual(before.uncitedRanges,after.uncitedRanges);
 Object.assign(after,{manualFullOldAndNewValueRead:before.manualFullOldAndNewValueRead,manualSourceAndChineseOwnerReviewCompleted:before.manualSourceAndChineseOwnerReviewCompleted,manualRationale:before.manualRationale,uncitedRangeManualDecision:before.uncitedRangeManualDecision,independentV2DeltaReviewCompleted:true,acceptedUnderProposalSHA256:'c443e01f08292a0c632723b6a130b5d50382b51486c87873c59f7317ac5bfb08'});
 assert.ok(after.sourceEvidence.every(s=>s.fullSpanMatches));
 assert.equal(after.decision,'accepted-content-and-construction');
 if(i===14){after.manualRationale='The full accepted appendix text1 line4 wording is unchanged. Corrected source page pairs now include PDF201/202 and printed189/190, exactly matching both physical source fragments. This explicitly resolves the initial held anchor, under the new canonical proposal only. Original initial held history remains preserved.';after.resolvedInitialHold={initialProposalSHA256:'fb744e2808f60f28d43830179ec2f164f66e293789628710bbe90ee153e0b7f1',initialDecision:'held-incomplete-source-page-span',newDecision:'accepted-complete-two-page-source-anchor'};}
}
const context=load('context-candidate-review.json');assert.equal(context.status,'independently-accepted-context-correction-candidate-awaiting-final-aggregate-hash-review');
const last=decisions[135];assert.equal(last.changeId,'hsk3-l10:ee4eeda1d3f100b2e82f761a');assert.equal(last.oldValue,context.target.expectedEffectiveValue);assert.equal(last.newValue,context.target.newValue);
Object.assign(last,{manualFullOldAndNewValueRead:true,manualSourceAndChineseOwnerReviewCompleted:true,manualRationale:context.semanticReview.proposedCorrectionRead+' '+context.semanticReview.corroboratingDialogue,uncitedRangeManualDecision:'This is a declared editorial correction, not a verbatim quotation. Original printed Vietnamese, explicit correction rationale, publisherIssuedCorrection:false, and same-book corroborating sources remain in the anchor.',independentV2DeltaReviewCompleted:true,acceptedUnderProposalSHA256:'c443e01f08292a0c632723b6a130b5d50382b51486c87873c59f7317ac5bfb08',classification:'official-book-erratum',originalPrintedVietnamesePreserved:true});
const acceptedChangeIds=current.changes.map(c=>c.changeId);assert.equal(new Set(acceptedChangeIds).size,136);
const consumers=current.changes.flatMap(c=>c.consumers),consumerMap=new Map(consumers.map(r=>[viProposalCanonicalJSON(r),r]));assert.equal(consumerMap.size,136);
const sourceMap=new Map(current.changes.map(c=>[viProposalCanonicalJSON(c.sourceAnchor),c.sourceAnchor]));
const structural=load('v2-structural-review.json');assert.equal(structural.proposalSHA256,'c443e01f08292a0c632723b6a130b5d50382b51486c87873c59f7317ac5bfb08');assert.equal(structural.reviewedChangeCount,136);assert.deepEqual(structural.heldChangeIds,[]);assert.equal(structural.acceptedContentAndConstruction,136);assert.equal(structural.canonicalPairs.length,33);assert.equal(structural.projectionChecks.reduce((n,r)=>n+r.changedVILeaves,0),136);assert.ok(structural.projectionChecks.every(r=>r.changedNonVILeaves===0));
const inputLedger=load('input-copy/construction-ledger.v2.json');assert.equal(inputLedger.proposalSHA256,structural.proposalSHA256);assert.equal(inputLedger.erratumInputSHA256,sha(read('input-copy/context-investigation.initial.json')));
const verification={schemaVersion:1,status:'all-v2-deltas-explicitly-reviewed',initialProposalSHA256:'fb744e2808f60f28d43830179ec2f164f66e293789628710bbe90ee153e0b7f1',v2ProposalSHA256:structural.proposalSHA256,deltaLeafCount:deltaChecks.length,deltaKindCounts:Object.fromEntries([...new Set(deltaChecks.map(r=>r.reviewKind))].map(k=>[k,deltaChecks.filter(r=>r.reviewKind===k).length])),deltaChecks,initial135CompleteContentValuesAndSourceSpansPreserved:true,oneSourcePageSpanRepaired:true,oneNewIndependentlyReviewedContextCorrection:true,unexpectedValueDeltas:0};
fs.writeFileSync(path.join(here,'v2-delta-review.json'),JSON.stringify(verification,null,2)+'\n');
fs.writeFileSync(path.join(here,'change-decisions.v2.json'),JSON.stringify(decisions,null,2)+'\n');
const review={schemaVersion:1,status:'accepted',author:'root',reviewer:'qa_hsk1_05_08',proposalSHA256:structural.proposalSHA256,inputManifestFile:'course-app/docs/resume-20261004/b10-pilot-manifests/hsk3-l10.author-manifest-v2.json',inputManifestSHA256:sha(read('input-copy/author-manifest.v2.json')),revisionId:current.revisionId,courseId:current.courseId,parentDisplayRevision:current.parentDisplayRevision,acceptedChangeIds,acceptedConsumerRefs:[...consumerMap.values()],sourceEvidenceRefs:[...sourceMap.values()],scope:{acceptedChangedFields:136,sourceAnchorsByKind:{directOfficial:99,terminologyDerived:37},wholePrintedDirectVariants:98,explicitEditorialSourceErratum:1,allChangesIndependentlyReviewed:true,allUncitedDerivedRangesIndependentlyReviewed:true,curatedOverridesIndependentlyReviewed:3,localCanonicalSensesReviewed:33,completeOfficialPDFPagePairsChecked:true,fullLessonAlignmentAccepted:false,fullWebsiteAlignmentAccepted:false,touchedOwnerIdsCertifyOnlyEnumeratedChangedFields:true},validation:{currentExpectedRawAndCommittedSHA:true,source119AndComparisonCommittedByteIdentity:true,allAuthorReviewsRootAccepted:true,privateProjectionVILeafChanges:136,privateProjectionNonVILeafChanges:0,unexpectedInitialV2ValueChanges:0,initialHeldCount:1,finalHeldCount:0,initialHeldHistoryPreserved:true,contextCorrectionExplicitNotPublisherIssued:true},evidenceFiles:{'change-decisions.v2.json':sha(read('change-decisions.v2.json')),'v2-delta-review.json':sha(read('v2-delta-review.json')),'v2-structural-review.json':sha(read('v2-structural-review.json')),'initial-review.json':sha(read('initial-review.json')),'context-candidate-review.json':sha(read('context-candidate-review.json'))},officialPDF:structural.officialPDF,baselineChecks:structural.baselineChecks,sourceCommitChecks:structural.sourceCommitChecks,visualEvidence:structural.visualEvidence,additionalDetailVisualEvidence:load('initial-review.json').additionalDetailVisualEvidence,limits:{sourceTranscriptionNotRewritten:true,rawCourseNotWritten:true,publicProofOrRegistryNotWritten:true,activationNotPerformed:true,browserOrCINotRepeated:true,deploymentNotPerformed:true}};
fs.writeFileSync(path.join(here,'review.v2.json'),JSON.stringify(review,null,2)+'\n');
const names=fs.readdirSync(here).filter(n=>fs.statSync(path.join(here,n)).isFile()&&!n.startsWith('freeze-'));
const freeze={schemaVersion:1,status:'frozen-independent-136-field-v2-acceptance',proposalSHA256:review.proposalSHA256,reviewSHA256:sha(read('review.v2.json')),reviewedChangeCount:136,acceptedChangeCount:136,heldChangeCount:0,files:Object.fromEntries(names.map(n=>[n,sha(read(n))])),inputCopies:Object.fromEntries(fs.readdirSync(path.join(here,'input-copy')).map(n=>[n,sha(read('input-copy/'+n))]))};
fs.writeFileSync(path.join(here,'freeze-v2.json'),JSON.stringify(freeze,null,2)+'\n');
console.log(JSON.stringify({status:review.status,changes:136,consumers:consumerMap.size,sourceAnchors:sourceMap.size,deltaLeaves:deltaChecks.length,projectionVI:136,nonVI:0,held:0,canonicalSHA:review.proposalSHA256,reviewSHA:sha(read('review.v2.json')),freezeSHA:sha(read('freeze-v2.json'))}));
