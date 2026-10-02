import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCompatibility } from '../src/services/storage/compatibility.ts';
import { dataCopy, dataStatusCopy, dataSummaryCopy, dataModuleCopy, dataLessonCopy, dataFileCopy,
  dataSourceCountCopy, dataResetCountCopy, dataDifferenceCopy, dataWarning, dataStorageIssueCopy,
  dataExerciseWarnings, dataOriginalWarning } from '../src/services/storage/copy.ts';
const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const compatibility = createCompatibility(json('../content/stage2-bank.json'), json('../content/stage3-catalog.json'), json('../content/textbook.json'));
const chinese = /\p{Script=Han}/u;
function paired(copy) {
  assert.match(copy.zh, chinese);
  assert.ok(copy.vi.trim());
  assert.notEqual(copy.zh, copy.vi);
}

test('data safety copy covers every state, summary metric and reset module in both languages', () => {
  for (const dictionary of [dataCopy, dataStatusCopy, dataSummaryCopy, dataModuleCopy]) for (const copy of Object.values(dictionary)) paired(copy);
  assert.deepEqual(Object.keys(dataSummaryCopy).sort(), Object.keys(compatibility.summary(compatibility.blank())).sort());
  assert.deepEqual(Object.keys(dataStatusCopy).sort(), ['empty', 'saved', 'saving', 'unsaved', 'conflict', 'corrupt', 'unavailable'].sort());
  for (let lesson = 1; lesson <= 15; lesson++) assert.deepEqual(dataLessonCopy(lesson), { zh: `第${lesson}课`, vi: `Bài ${lesson}` });
});

test('dynamic copy retains exact source counts, reset scope and comparison evidence', () => {
  const counts = dataSourceCountCopy(0, 17, 1287); paired(counts);
  assert.equal(counts.zh, '0 项已识别 · 17 项仅保留原始数据 · 1287 字节');
  assert.equal(counts.vi, '0 mục đã hiểu · 17 mục chỉ giữ bản gốc · 1287 byte');
  assert.ok(dataResetCountCopy(29).zh.includes('29'));
  assert.ok(dataResetCountCopy(29).vi.startsWith('29 bản ghi'));
  const difference = dataDifferenceCopy(dataSummaryCopy.homeworkSubmitted, 8, 0);
  assert.ok(difference.zh.endsWith('8 → 0')); assert.ok(difference.vi.endsWith('8 → 0'));
  const filename = '<img src=x onerror=alert(1)>旧数据.json';
  assert.ok(dataFileCopy(filename).zh.includes(filename)); assert.ok(dataFileCopy(filename, true).vi.includes(filename));
});

test('controlled diagnostics are paired without translating or discarding unfamiliar raw detail', () => {
  const original = 'Bộ nhớ đã đầy. Chưa lưu; bản nháp vẫn còn và có thể tải bản sao lưu.';
  const issue = dataStorageIssueCopy(original); paired(issue); assert.equal(issue.vi, original);
  const raw = '<script>原始诊断</script>\nUnfamiliar Error: quota(42)';
  assert.ok(dataStorageIssueCopy(raw).vi.endsWith(raw));
  assert.ok(dataOriginalWarning(raw).includes(raw));
  assert.equal(dataWarning({ zh: '中文提示', vi: 'Thông báo gốc' }), '中文提示\nThông báo gốc');
  const skipped = '3 câu không chép đè: nội dung đã sửa, nguồn chưa khớp hoặc đã có lượt học mới. Bản gốc được giữ lại.';
  const translated = dataExerciseWarnings([skipped], 3);
  assert.match(translated[0], /3 题未覆盖/); assert.ok(translated[0].endsWith(skipped));
});

test('compatibility warnings become bilingual while exact source bytes and source count evidence survive', () => {
  const raw = {
    ran_hsk1_learning_v2: readFileSync(new URL('./fixtures/migration/learning-v2.json', import.meta.url), 'utf8'),
    hsk1_lesson9_pilot_progress_v1: '  {"version":1,"bankVersion":"pilot","groups":{"words":{"draft":{"unknown":"<img src=x>"},"attempts":[]}},"words":{}}  ',
    ran_hsk1_stage3_v1_previous: 'not json <script>retained only</script>',
  };
  const before = structuredClone(raw), result = compatibility.migrate(raw, 1790812800000);
  assert.deepEqual(raw, before); assert.deepEqual(result.data.legacyRaw, raw);
  for (const warning of result.warnings) assert.match(warning, chinese);
  for (const report of result.reports) {
    assert.equal(report.bytes, new TextEncoder().encode(raw[report.key]).byteLength);
    for (const warning of report.warnings) assert.match(warning, chinese);
  }
  const pilot = result.reports.find(report => report.key === 'hsk1_lesson9_pilot_progress_v1');
  assert.equal(pilot.understood, 0); assert.equal(pilot.unsupported, 1);
  const invalid = result.reports.find(report => report.key === 'ran_hsk1_stage3_v1_previous');
  assert.equal(invalid.status, 'invalid'); assert.equal(invalid.understood, 0); assert.equal(invalid.unsupported, 1);
});

test('reset title and validation errors preserve Vietnamese contracts and add Chinese scope', () => {
  const data = compatibility.blank(), before = structuredClone(data);
  const reset = compatibility.reset(data, { module: 'homework', lesson: 10 });
  assert.match(reset.title, /重置作业 · 第10课/); assert.match(reset.title, /Đặt lại bài tập · Bài 10/);
  assert.deepEqual(data, before); assert.equal(reset.removed, 0);
  assert.throws(() => compatibility.reset(data, { module: 'homework', lesson: 16 }), error =>
    error.message.includes('重置范围无效') && error.message.includes('Phạm vi đặt lại không hợp lệ.'));
  data.reading.lessons = { 99: { visited: true } };
  assert.throws(() => compatibility.validate(data), error =>
    error.message.includes('阅读课次编号') && error.message.includes('Mã bài đọc không thuộc HSK 1.'));
});
