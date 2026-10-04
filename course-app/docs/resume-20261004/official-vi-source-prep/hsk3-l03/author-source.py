"""Source-only author helpers. No website/runtime reads or independent acceptance."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import shutil
from PIL import Image

BASE = Path(__file__).resolve().parent
PDF = Path('/workspace/scratch/28b55072841a/upload/HSK3 (3.0).pdf')
PDF_SHA = '7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951'
LESSON = int(BASE.name[-2:])

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def write(name, data):
    if (BASE / 'freeze-manifest.json').exists():
        raise RuntimeError('Source author freeze is read-only; prepare a new revision instead.')
    (BASE / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

def state():
    p = BASE / 'source-transcription.json'
    if p.exists():
        return json.loads(p.read_text())
    return {
        'schemaVersion': 1,
        'status': 'source-only-author-transcription-in-progress',
        'author': 'native_catalogue',
        'level': 3,
        'lesson': LESSON,
        'officialPDFSHA256': PDF_SHA,
        'officialPDFBytes': PDF.stat().st_size,
        'readProof': [],
        'scope': {'originalPageBoundaryDiscoveryInProgress': True},
        'transcriptionPolicy': {
            'layoutLineWrapsJoinedWithSpaces': True,
            'printedDiacriticsAndPunctuationPreserved': True,
            'noSemanticVietnameseCorrectionsToPrintedSource': True,
            'printedPOSNotNormalisedFromKnowledge': True,
            'dialogueRoleLabelsStoredSeparatelyFromUtterance': True,
            'bodyChineseOnlyTextLinkedToActualAppendixVietnamese': True,
            'noWebsiteLinePartitionInferredForUnlabelledParagraph': True,
            'crossPagePrintedFragmentsJoinedOnce': True,
        },
        'records': [],
        'bodyChineseOnlyTexts': [],
        'otherNoPrintedVietnameseBlocks': [],
        'sourceErrataCandidates': [],
        'boundaries': {
            'websiteVietnameseRead': False,
            'websiteComparisonPerformed': False,
            'websiteProposalPrepared': False,
            'websiteVietnameseAlignmentComplete': False,
            'productionChanged': False,
            'historyOrGradingStorageChanged': False,
            'independentSourceAcceptancePerformed': False,
            'sourceOnlyChineseExamplesNotInventedAsOfficialVietnamese': True,
            'sourceItemCountIsNotWebsiteConsumerCoverage': True,
            'OCRUsed': False,
            'PDFTextLayerUsedAsAuthority': False,
        },
    }

def add_page(pdf_page, printed_page, render_path, rows, chinese_only=None, no_vi_blocks=None, note=''):
    """Rows: (section, Chinese anchor, actual printed VI, optional exact metadata)."""
    s = state()
    evidence_id = f'original-full-pdf{pdf_page:03}'
    assert not any(x['pdfPage'] == pdf_page for x in s['readProof'])
    with Image.open(render_path) as im:
        dimensions = list(im.size)
        im.verify()
    s['readProof'].append({
        'pdfPage': pdf_page,
        'printedPage': printed_page,
        'observedPrintedFooter': f'{printed_page:03}' if isinstance(printed_page, int) else printed_page,
        'authorActuallyVisuallyRead': True,
        'renderPath': str(render_path),
        'renderSHA256': sha(render_path),
        'renderBytes': Path(render_path).stat().st_size,
        'renderDimensions': dimensions,
        'evidenceId': evidence_id,
        'visualNotes': note,
    })
    for row in rows:
        section, zh, vi = row[:3]
        assert vi
        record = {
            'sourceId': f'hsk3-official-vi:l{LESSON:02}:p{printed_page:03}:{section}',
            'pdfPage': pdf_page,
            'printedPage': printed_page,
            'section': section,
            'zhAnchor': zh,
            'viPrinted': vi,
            'reviewStatus': 'author-original-visual-transcription-awaiting-independent-review',
            'evidence': [evidence_id],
        }
        if len(row) > 3:
            record.update(row[3])
        assert not any(x['sourceId'] == record['sourceId'] for x in s['records'])
        s['records'].append(record)
    for item in chinese_only or []:
        record = dict(item)
        record.update({'pdfPage': pdf_page, 'printedPage': printed_page, 'printedVietnameseInBody': False, 'evidence': [evidence_id]})
        s['bodyChineseOnlyTexts'].append(record)
    if no_vi_blocks:
        s['otherNoPrintedVietnameseBlocks'].append({'pdfPage': pdf_page, 'printedPage': printed_page, 'blocks': no_vi_blocks, 'evidence': [evidence_id]})
    write('source-transcription.json', s)
    return len(s['records'])

def word(n, zh, py, pos, vi):
    return (f'word-{n:02}', zh, vi, {'printedNumber': n, 'printedPinyin': py, 'printedPOSRaw': pos, 'posPrinted': pos is not None, 'sourceWordKind': 'ordinary-numbered-word'})

def body_line(text, ordinal, zh, speaker=None, kind='role-dialogue-line'):
    return {'bodySourceId': f'hsk3-official-body:l{LESSON:02}:text{text}:line{ordinal:02}', 'printedTextNumber': text, 'printedDialogueOrdinal': ordinal, 'printedRoleZh': speaker, 'zhPrinted': zh, 'sourceBodyKind': kind, 'appendixSourceIds': []}

def snapshot_source_pages():
    """Capture byte-provenance and keep original renders in the source folder."""
    s = state()
    (BASE / 'evidence').mkdir(exist_ok=True)
    pages = []
    for item in s['readProof']:
        original = Path(item['renderPath'])
        target = BASE / 'evidence' / f"pdf{item['pdfPage']:03}-p{item['printedPage']:03}.png"
        shutil.copyfile(original, target)
        assert sha(target) == item['renderSHA256']
        entry = dict(item)
        entry['path'] = str(target.relative_to(BASE))
        entry['sourcePDFSHA256'] = PDF_SHA
        pages.append(entry)
    write('source-page-evidence.json', {'schemaVersion': 1, 'author': 'native_catalogue', 'sourcePDFSHA256': PDF_SHA, 'evidenceOrigin': 'fresh-original-PDF-CropBox-render', 'pages': pages, 'independentSourceAcceptancePerformed': False})
