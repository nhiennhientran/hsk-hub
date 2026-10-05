import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

// Read-only producer scan. Equal copy in JSON and SVG remains two occurrences.
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const local = name => name.split(':').at(-1);
const vietnamese = /[áàãéèíìóòõúùýỳÁÀÃÉÈÍÌÓÒÕÚÙÝỲđĐăĂâÂêÊôÔơƠưƯạảấầẩẫậắằẳẵặẹẻẽếềểễệỉĩịọỏốồổỗộớờởỡợụủũứừửữựỵỷỹẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈĨỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦŨỨỪỬỮỰỴỶỸ]/u;
const asciiVietnamese = /\b(?:Nghe|Chọn|Bạn|Tôi|Bài|Câu|Xin|không|Danh|nghĩa|cảm|là|của|và|theo|từ|trợ|động|như|một|này|học|Vào|Hãy|đúng|sai|biết|Nói|Lưu|viết|nào|tốt|vui)\b/u;
const chinese = /[\u3400-\u9fff]/u;
const xmlEntity = value => value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
  if (entity.startsWith('#x')) return String.fromCodePoint(parseInt(entity.slice(2), 16));
  if (entity.startsWith('#')) return String.fromCodePoint(Number(entity.slice(1)));
  return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[entity];
});

// A non-executing XML tokenizer for repository SVG. It preserves nested text,
// sibling-index XPaths and IDs; malformed XML fails rather than being skipped.
function parseSVG(text, file) {
  const tokens = text.match(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE[^>]*>|<\/?[^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>|[^<]+/g) ?? [];
  const stack = [], roots = [], all = [];
  for (const token of tokens) {
    if (token.startsWith('<!--') || token.startsWith('<?')) continue;
    if (token.startsWith('<!DOCTYPE')) throw Error(`Unsupported SVG DTD: ${file}`);
    if (token.startsWith('<![CDATA[')) {
      for (const node of stack) node.value += token.slice(9,-3);
      continue;
    }
    if (token.startsWith('</')) {
      const name = token.match(/^<\/\s*([^\s>]+)/)?.[1];
      if (!stack.length || stack.at(-1).name !== name) throw Error(`Unbalanced XML: ${file}`);
      stack.pop(); continue;
    }
    if (token.startsWith('<')) {
      const name = token.match(/^<\s*([^\s/>]+)/)?.[1];
      if (!name) throw Error(`Invalid XML element: ${file}`);
      const parent = stack.at(-1), tag = local(name);
      const count = parent ? (parent.counts[tag] = (parent.counts[tag] ?? 0) + 1) : roots.length + 1;
      const attrs = {};
      for (const match of token.matchAll(/([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) attrs[match[1]] = xmlEntity(match[3] ?? match[4]);
      const node = {name,tag,attrs,xpath:(parent?.xpath ?? '')+`/${tag}[${count}]`,value:'',counts:{}};
      if (!parent) roots.push(node);
      all.push(node);
      if (!/\/\s*>$/.test(token)) stack.push(node);
      continue;
    }
    const value = xmlEntity(token);
    for (const node of stack) node.value += value;
  }
  if (stack.length || roots.length !== 1 || roots[0].tag !== 'svg') throw Error(`Invalid SVG document: ${file}`);
  return all.flatMap(node => {
    const rows = [];
    if (['text','title','desc'].includes(node.tag) && node.value.trim()) rows.push({tag:node.tag,elementId:node.attrs.id ?? null,xpath:node.xpath,value:node.value.trim()});
    for (const attribute of ['alt','title','aria-label','aria-description']) if (node.attrs[attribute]) rows.push({tag:'attribute',attribute,elementId:node.attrs.id ?? null,xpath:node.xpath+'/@'+attribute,value:node.attrs[attribute]});
    return rows;
  });
}

export function scanRuntimeSVG({root, gitRoot=root, expectedHead}) {
  root = path.resolve(root);
  const sourceRef = expectedHead ?? 'HEAD';
  const sourceHead = execFileSync('git',['rev-parse',sourceRef],{cwd:gitRoot,encoding:'utf8'}).trim();
  const sourceTree = execFileSync('git',['rev-parse',sourceRef+'^{tree}'],{cwd:gitRoot,encoding:'utf8'}).trim();
  const inputs = new Map();
  const read = file => {
    const bytes = fs.readFileSync(path.join(root,file)), sha256 = hash(bytes);
    // A doc-only HEAD advance is permitted; every scanned source byte must match
    // the requested source revision. No working-source changes are hidden.
    const frozen = execFileSync('git',['show',sourceHead+':'+file],{cwd:gitRoot,maxBuffer:16*1024*1024});
    if (hash(frozen) !== sha256) throw Error(`SVG scan source mismatch at ${sourceHead}: ${file}`);
    inputs.set(file,{file,sha256,bytes:bytes.length}); return bytes;
  };
  const active = new Map(), historical = new Map();
  for (const level of [2,3]) for (let n=1;n<=(level===2?15:18);n++) {
    const manifestFile=`course-app/content/hsk${level}/lesson-${String(n).padStart(2,'0')}.json`;
    const lesson=JSON.parse(read(manifestFile));
    for (const [i,pic] of (lesson.illustrationManifest ?? []).entries()) {
      if (pic.publicationStatus !== 'approved' || !pic.file?.endsWith('.svg')) continue;
      const assetFile='course-app/public/'+pic.file;
      const binding={assetId:pic.id,illustrationId:pic.id,assetFile,manifestFile,manifestPointer:`/illustrationManifest/${i}`,manifestSHA256:inputs.get(manifestFile).sha256,lesson:n,level,source:pic.source ?? null,textbookRelation:pic.textbookRelation ?? null,activityBindings:pic.activityBindings ?? [],sourceFieldBindings:pic.sourceFieldBindings ?? [],publicationStatus:pic.publicationStatus,expectedAssetSHA256:pic.assetSha256,chineseContext:pic.description?.zh ?? pic.alt?.zh ?? pic.title?.zh ?? null,fields:[]};
      for (const field of ['alt','description','label','title']) if (typeof pic[field]?.vi === 'string') binding.fields.push({field,file:manifestFile,pointer:`/illustrationManifest/${i}/${field}/vi`,value:pic[field].vi,semanticId:pic.id+':'+field+':vi',consumerRole:{alt:'outer HTML img.alt and zoom img.alt',description:'zoom description paragraph',label:'figcaption',title:'loaded manifest title metadata'}[field]});
      if (!active.has(assetFile)) active.set(assetFile,[]);
      active.get(assetFile).push(binding);
    }
  }
  const historicalFile='hsk1-app/content/source-activities/lesson-04.json';
  const old=JSON.parse(read(historicalFile));
  for (const [i,figure] of (old.figures ?? []).entries()) if (figure.file?.endsWith('.svg')) historical.set('hsk1-app/content/source-activities/'+figure.file,{assetId:figure.id,figureId:figure.id,manifestFile:historicalFile,manifestPointer:`/figures/${i}`,manifestSHA256:inputs.get(historicalFile).sha256,source:figure.source ?? null,chineseContext:figure.alt?.zh ?? null,state:'historical-schematic-imported-but-not-current-catalogue'});
  const paths=execFileSync('git',['ls-tree','-r','--name-only',sourceHead],{cwd:gitRoot,encoding:'utf8'}).trim().split('\n').filter(file=>file.endsWith('.svg')).sort();
  const files=[],records=[],bindings=[],falsePositiveCandidates=[],elementCounts={},languageCounts={};
  for (const file of paths) {
    const bytes=read(file),assetSHA256=inputs.get(file).sha256,manifestBindings=active.get(file) ?? [],historicalBinding=historical.get(file) ?? null;
    const state=manifestBindings.length?'active-approved-course-manifest-and-packaging-binding':historicalBinding?'historical-schematic-imported-but-not-current-catalogue':'retained-static-icon';
    for (const binding of manifestBindings) if (binding.expectedAssetSHA256 !== assetSHA256) throw Error('Approved SVG asset SHA mismatch: '+file);
    const stringNodes=parseSVG(bytes.toString('utf8'),file).map(node=>{
      const candidate=vietnamese.test(node.value)||asciiVietnamese.test(node.value);
      const pinyinFalsePositive=candidate && file==='course-app/public/illustrations/hsk3-l18-warmup1-1.svg' && ['title','text'].includes(node.tag) && node.value.includes('Guònián hǎo');
      const classification=pinyinFalsePositive?'Chinese-pinyin':candidate?(chinese.test(node.value)?'Chinese-and-Vietnamese':'Vietnamese'):chinese.test(node.value)?'Chinese':'other-language-or-graphic-label';
      elementCounts[node.tag]=(elementCounts[node.tag] ?? 0)+1;
      languageCounts[classification]=(languageCounts[classification] ?? 0)+1;
      if (pinyinFalsePositive) falsePositiveCandidates.push({file,assetSHA256,...node,classification,reason:'Chinese title explicitly identifies Guònián hǎo as 拼音'});
      return {...node,classification,vietnameseCandidate:candidate&&!pinyinFalsePositive};
    });
    files.push({file,sha256:assetSHA256,bytes:bytes.length,format:'svg',component:manifestBindings.length?'course-illustration-svg':historicalBinding?'hsk1-historical-schematic-svg':'retained-icon-svg',state,service:'approved illustration manifest / retained static asset',consumers:manifestBindings.length?['lesson illustration external img','asset accessibility metadata']:historicalBinding?['historical sourceLesson export','retained static SVG imports']:['retained icon'],manifestBindings,historicalBinding,stringNodes});
    for (const node of stringNodes.filter(node=>node.vietnameseCandidate)) {
      // One stable asset ID + XPath record; equal text is never merged.
      const owners=manifestBindings.length?manifestBindings:[historicalBinding ?? {assetId:file,lesson:null,chineseContext:null}];
      for (const owner of owners) {
        const activeConsumer=manifestBindings.length>0,component=activeConsumer?`hsk${owner.level}-illustration-svg`:historicalBinding?'hsk1-historical-schematic-svg':'retained-icon-svg';
        const recordId=hash(file+'\0'+node.xpath+'\0'+owner.assetId).slice(0,24),semanticKey=owner.assetId+':svg:'+node.xpath;
        const role=node.tag==='desc'?'svg-description':node.tag==='title'?'svg-title':node.tag==='text'?'svg-text':'svg-accessibility-attribute';
        const matches=(owner.fields ?? []).filter(field=>node.value===field.value||node.value.includes(field.value));
        records.push({recordId,semanticKey,component,itemId:owner.assetId,ownerKey:owner.assetId,file,pointer:node.xpath,value:node.value,chineseContext:owner.chineseContext ?? null,source:owner.source ?? null,lesson:owner.lesson ?? null,sourceKind:'svg-embedded',visibility:node.tag==='text'?'active-svg-body':'source-accessibility/assetmetadata',catalogueState:state,assetSHA256,elementId:node.elementId,xmlTag:node.tag,languageClassification:node.classification,officialAuditStatus:'pending-phase-B',learningFieldOccurrence:activeConsumer&&node.tag==='text',accessibilityFieldOccurrence:activeConsumer&&node.tag!=='text',currentAccessibilityMetadataCandidate:activeConsumer&&node.tag!=='text',sourceRelation:'editorial-illustration',explicitRole:role,consumerRole:role,confidence:'language-detection-candidate',frozen:false,consumers:[node.tag==='text'?'visible SVG text':'SVG source accessibility metadata; outer HTML img ALT is a separate consumer'],accessibilityExposure:'Exact exposure depends on embedding/direct SVG navigation; no native accessibility certification claimed'});

      }
    }
    for (const owner of manifestBindings) {
      const consumers=records.filter(row=>row.file===file&&row.itemId===owner.assetId).map(row=>({recordId:row.recordId,semanticKey:row.semanticKey,xpath:row.pointer,elementId:row.elementId,xmlTag:row.xmlTag,explicitRole:row.explicitRole,matchingManifestFieldConsumers:owner.fields.filter(field=>row.value===field.value||row.value.includes(field.value))}));
      bindings.push({semanticId:owner.assetId,kind:'approved-svg-asset',course:`hsk${owner.level}`,assetId:owner.assetId,assetFile:file,assetSHA256,manifestFile:owner.manifestFile,manifestPointer:owner.manifestPointer,manifestSHA256:owner.manifestSHA256,jsonManifestFieldConsumers:owner.fields,svgElementConsumers:consumers,source:owner.source,textbookRelation:owner.textbookRelation,activityBindings:owner.activityBindings,sourceFieldBindings:owner.sourceFieldBindings,catalogueState:state,sourceRelation:'editorial-illustration',officialAuditStatus:'pending-phase-B',learningFieldOccurrence:false,currentAccessibilityMetadataCandidate:true,identityRule:'Stable approved asset identity; SVG nodes remain distinct from JSON ALT/caption consumers',nativeAssistiveTechnologyCertified:false});
    }
  }
  const uniqueIDs=new Set(records.map(row=>row.recordId)),uniqueSemanticKeys=new Set(records.map(row=>row.semanticKey));
  if (uniqueIDs.size!==records.length || uniqueSemanticKeys.size!==records.length) throw Error('Duplicate SVG consumer identity');
  return {files,records,bindings,summary:{schemaVersion:1,sourceHead,sourceTree,snapshotMode:'requested git revision; exact working-source SHA matches required',scannedSVGAssets:files.length,activeApprovedSVGAssets:active.size,activeManifestBindings:[...active.values()].reduce((n,rows)=>n+rows.length,0),historicalHSK1SVGAssets:historical.size,retainedIconSVGAssets:files.filter(row=>row.state==='retained-static-icon').length,allStringElementCounts:elementCounts,stringLanguageClassifications:languageCounts,vietnameseSVGRecords:records.length,activeVietnameseSVGRecords:records.filter(row=>row.catalogueState==='active-approved-course-manifest-and-packaging-binding').length,learningVietnameseSVGRecords:records.filter(row=>row.learningFieldOccurrence).length,accessibilityVietnameseSVGRecords:records.filter(row=>row.accessibilityFieldOccurrence).length,bindings:bindings.length,falsePositiveCandidates,parseFailures:[],inputSHA256:[...inputs.values()],officialVietnameseLanguageAuditPerformed:false}};
}
