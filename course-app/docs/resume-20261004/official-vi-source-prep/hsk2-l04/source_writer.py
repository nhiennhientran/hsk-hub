"""Serialize manual, source-only visual transcription. Never performs OCR.
This helper verifies original PDF/raster hashes, not transcription accuracy.
"""
import hashlib,json
from pathlib import Path
PDF=Path('/workspace/scratch/28b55072841a/upload/HSK2 ( 3.0).pdf')
PDF_SHA='6465777a77f8d9cb0d29b47f00b36a8e9e9ff627509f0f02a9909c7aaeaa231b'
STATE='author-visual-transcription-pending-independent-original-page-review'
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
class Writer:
    def __init__(self,here,lesson,title,page_map,pixels):
        self.here=Path(here);self.lesson=lesson;self.title=title;self.pages=page_map;self.pixels=Path(pixels);self.records=[]
        assert sha(PDF)==PDF_SHA
    def add(self,page,section,zh,vi,**extra):
        r={'sourceId':f'hsk2-official-vi:l{self.lesson:02}:p{page:03}:{section}','pdfPage':self.pages[page],'printedPage':page,'section':section,'zhAnchor':zh,'viPrinted':vi,'reviewStatus':STATE};r.update(extra);self.records.append(r);return r
    def number(self,page,opening=False):
        self.add(page,'lesson-number-header' if opening else 'running-lesson-header',str(self.lesson),f'Bài {self.lesson}',zhAnchorKind='printed-numeric-lesson-marker',layoutParts=['Bài',str(self.lesson)],layoutNote=f'Bài and numeral {self.lesson} are printed layout parts; no Chinese 第{self.lesson}课 phrase is invented.',runningChineseContext=None if opening else self.title)
    def series(self,page): self.add(page,'running-series-header','新HSK教程2','Giáo trình New HSK 2')
    def words(self,page,rows):
        self.add(page,'words-header','生词','Từ mới')
        for n,zh,py,pos,vi in rows:self.add(page,f'word{n:02}',zh,vi,printedNumber=n,printedPinyin=py,printedPOSRaw=pos,posPrinted=pos is not None,sourceWordKind='ordinary-numbered-word')
    def context(self,page,n,zh,vi,text=False):
        self.add(page,f'text{n}-header',f'课文{n}',f'Bài khoá {n}');self.add(page,f'text{n}-context',zh,vi)
        self.add(page,f'text{n}-listen-instruction','听两遍课文，判断正误。' if text else '听两遍对话，选择正确答案。','Nghe bài khoá hai lượt và phán đoán đúng sai.' if text else 'Nghe hội thoại hai lượt và chọn đáp án đúng.')
    def dialogue(self,page,n,rows,rolemap,zhpage=None):
        for i,(role,zh,vi) in enumerate(rows,1):
            extra={'printedRoleZh':role,'printedRoleVi':rolemap[role],'printedDialogueOrdinal':i,'printedTextNumber':n}
            if zhpage is not None:extra.update({'zhAnchorPrintedPage':zhpage,'zhAnchorPDFPage':self.pages[zhpage],'printedPages':[zhpage,page],'pdfPages':[self.pages[zhpage],self.pages[page]],'sourceSpanReason':'Chinese dialogue and Vietnamese role translation are printed on consecutive pages.'})
            self.add(page,f'text{n}-line{i:02}',zh,vi,**extra)
        self.add(page,f'text{n}-role-read-instruction','分角色朗读对话，读后回答问题。','Phân vai đọc to đoạn hội thoại, sau đó trả lời câu hỏi.')
    def grammar(self,page,n,zh,vi):
        self.add(page,f'grammar{n}-section-header','小语讲堂','Lớp học của Tiểu Ngữ');self.add(page,f'grammar{n}-title',zh,vi,printedGrammarNumber=n)
    def complete(self,page,n):self.add(page,f'grammar{n}-complete-instruction','完成对话。','Hoàn thành hội thoại.')
    def freeze(self,scope_note,expected_words,expected_roles,errata=None,boundary_pages=None):
        assert len({r['sourceId'] for r in self.records})==len(self.records)
        assert sum('printedNumber' in r for r in self.records)==expected_words
        assert sum('printedRoleVi' in r for r in self.records)==expected_roles
        manifest=json.loads((self.pixels/'render-manifest.json').read_text()); inverse={v:k for k,v in self.pages.items()};source=[];bound=[]
        for r in manifest:
            assert sha(r['file'])==r['sha256']
            if r['pdfPage'] in inverse:r.update(printedPage=inverse[r['pdfPage']],footerActuallyVisuallyRead=True,wholePageActuallyVisuallyViewed=True);source.append(r)
            elif boundary_pages and r['pdfPage'] in boundary_pages:r.update(boundary_pages[r['pdfPage']]);bound.append(r)
        assert len(source)==len(self.pages)
        details=json.loads((self.pixels/'detail-crops.json').read_text()) if (self.pixels/'detail-crops.json').exists() else []
        for r in details:assert sha(r['file'])==r['sha256'];r.update(actuallyViewed=True,use='Author precision original-page visual check; not independent acceptance.')
        result={'schemaVersion':1,'status':'author-source-transcription-awaiting-independent-original-page-review','author':'qa_hsk1_05_08','level':2,'lesson':self.lesson,'officialPDFSHA256':PDF_SHA,'readProof':{'actualOriginalPDFFootersRead':list(self.pages),'pdfPagesRead':list(self.pages.values()),'originalCropBoxAndRotationPreserved':True,'allSourceWholePageImagesActuallyViewed':True,'OCRUsed':False,'PDFTextExtractionUsed':False},'scope':{'actualPrintedPages':list(self.pages),'actualPDFPages':list(self.pages.values()),'scopeNote':scope_note},'counts':{'sourceItems':len(self.records),'ordinaryNumberedWords':expected_words,'printedRoleTranslationLines':expected_roles},'transcriptionPolicy':{'layoutLineWrapsJoinedWithSpaces':True,'printedVietnameseDiacriticsAndPunctuationRetained':True,'dialogueRoleLabelsStoredSeparatelyFromUtterance':True,'noSilentSemanticRepairOfOfficialSource':True},'boundaries':{'websiteVietnameseRead':False,'websiteComparisonPerformed':False,'websiteAlignmentComplete':False,'sourceCountIsNotWebsiteCoverage':True,'ChineseOnlyExamplesAndOptionsNotInventedAsOfficialVI':True,'productionChanged':False,'independentSourceAcceptancePerformed':False},'records':self.records}
        for f,v in [('source-transcription.json',result),('source-page-evidence.json',source),('source-detail-crop-evidence.json',details),('source-boundary-evidence.json',bound),('source-erratum-candidates.json',{'status':'source-observations-only-awaiting-independent-review','officialPDFSHA256':PDF_SHA,'silentRepairPerformed':False,'observations':errata or []})]:
            (self.here/f).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
        files=['source-transcription.json','source-page-evidence.json','source-detail-crop-evidence.json','source-boundary-evidence.json','source-erratum-candidates.json','build-source-transcription.py','source_writer.py','README.md']
        m={'schemaVersion':1,'status':'frozen-author-source-input-awaiting-independent-original-page-review','sourceTranscriptionSHA256':sha(self.here/'source-transcription.json'),'officialPDFSHA256':PDF_SHA,'sourceItemCount':len(self.records),'uniqueSourceIdCount':len(self.records),'ordinaryWordCount':expected_words,'printedRoleLineCount':expected_roles,'actualPrintedPages':list(self.pages),'actualPDFPages':list(self.pages.values()),'noWebsiteAlignmentClaim':True,'files':{f:sha(self.here/f) for f in files}}
        (self.here/'freeze-manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'sourceItems':len(self.records),'sourceSHA256':m['sourceTranscriptionSHA256'],'freezeSHA256':sha(self.here/'freeze-manifest.json')},ensure_ascii=False))
