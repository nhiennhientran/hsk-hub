import gzip
import hashlib
import importlib.util
import io
import json
import tarfile
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / 'tools/final-quality-20261006/materialize-precision-review.py'
spec = importlib.util.spec_from_file_location('materialize', SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
sha = lambda body: hashlib.sha256(body).hexdigest()


class RecordedAuditRecovery(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.raw = b'{"rawText":"\\u4e00","expectedTextPromptUsed":false}\n'
        self.name = 'course-app/docs/final-quality-20261006/audit/raw.json'
        self.archive(self.name)
        self.report = {'status': 'accepted-complete-source-frame-review', 'completeCoverage': True,
                       'acceptedSourceFrameGates': [{} for _ in range(2539)]}
        report_bytes = (json.dumps(self.report) + '\n').encode()
        compressed = gzip.compress(report_bytes, mtime=0)
        self.write('report.json.gz', compressed)
        self.write('course-app/content/audio-precision-authority-20261006.json',
                   json.dumps({'independentReportSHA256': sha(report_bytes)}).encode())
        self.request = {'precisionIndependentReportFile': 'report.json',
                        'precisionIndependentReportCompressedFile': 'report.json.gz',
                        'precisionIndependentReportCompressedSHA256': sha(compressed)}
        self.seal_request()

    def write(self, name, body):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(body)

    def archive(self, member):
        output = io.BytesIO()
        with tarfile.open(fileobj=output, mode='w:gz') as archive:
            info = tarfile.TarInfo(member)
            info.size = len(self.raw)
            archive.addfile(info, io.BytesIO(self.raw))
        body = output.getvalue()
        halfway = len(body) // 2
        parts = []
        for n, data in enumerate([body[:halfway], body[halfway:]]):
            name = f'archive.part{n}'
            self.write(name, data)
            parts.append({'file': name, 'bytes': len(data), 'sha256': sha(data)})
        self.inventory = {'schemaVersion': 1, 'status': 'final-accepted-audit-bytes',
                          'archives': [{'parts': parts, 'bytes': len(body), 'sha256': sha(body),
                                        'files': [{'path': self.name, 'bytes': len(self.raw), 'sha256': sha(self.raw)}]}]}

    def seal_request(self):
        body = json.dumps(self.inventory).encode()
        self.write('audit-inventory.json', body)
        self.request.update(precisionAuditInventoryFile='audit-inventory.json', precisionAuditInventorySHA256=sha(body))
        self.write('request.json', json.dumps(self.request).encode())

    def test_exact_original_report_and_split_audit_bytes_are_restored_idempotently(self):
        result = module.restore(self.root, 'request.json')
        self.assertEqual(result['auditFiles'], 1)
        self.assertEqual((self.root / self.name).read_bytes(), self.raw)
        self.assertEqual(json.loads((self.root / 'report.json').read_bytes()), self.report)
        self.assertEqual(module.restore(self.root, 'request.json'), result)

    def test_tampered_part_is_rejected_before_report_is_written(self):
        self.write('archive.part1', b'changed')
        with self.assertRaisesRegex(ValueError, 'archive part differs'):
            module.restore(self.root, 'request.json')
        self.assertFalse((self.root / 'report.json').exists())

    def test_unlisted_archive_member_cannot_escape_the_root(self):
        self.archive('../outside.json')
        self.seal_request()
        with self.assertRaisesRegex(ValueError, 'unsafe final audit member'):
            module.restore(self.root, 'request.json')

    def test_changed_existing_audit_file_is_rejected(self):
        self.write(self.name, b'changed source evidence')
        with self.assertRaisesRegex(ValueError, 'different actual bytes'):
            module.restore(self.root, 'request.json')

    def test_wrong_member_sha_does_not_silently_accept_recorded_archive(self):
        self.inventory['archives'][0]['files'][0]['sha256'] = '0' * 64
        self.seal_request()
        with self.assertRaisesRegex(ValueError, 'member SHA differs'):
            module.restore(self.root, 'request.json')

    def test_partial_checkpoint_is_not_a_final_audit_inventory(self):
        self.inventory['status'] = 'partial-evidence-recovery-checkpoint'
        self.seal_request()
        with self.assertRaisesRegex(ValueError, 'partial checkpoint'):
            module.restore(self.root, 'request.json')


if __name__ == '__main__':
    unittest.main()
