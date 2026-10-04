import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pairDescription} from '../src/services/source-activities/summary.ts';
import {primaryData,sourceData} from './source-pair-fixture.mjs';
import {blankSourceData} from '../src/services/source-activities/state.ts';

test('student backup summary retains every count and empty-record warning without implementation jargon',()=>{
  const before={primary:primaryData(),source:sourceData()},after={primary:primaryData(),source:blankSourceData()};
  after.primary.reading.modules={'4':{modules:['practice'],updatedAt:1791093600000}};
  const message=pairDescription(before,after);
  assert.match(message.zh,/学习记录和教材练习记录/);
  assert.match(message.zh,/教材学习 0→1课/);
  assert.match(message.zh,/旧作业 0→0课/);
  assert.match(message.zh,/新版作业 1→1课/);
  assert.match(message.zh,/教材练习记录 1→0组/);
  assert.match(message.zh,/已提交记录 1→0次/);
  assert.match(message.zh,/若备份中某类记录为空，导入后会清空这一类/);
  assert.match(message.zh,/可恢复本次替换前的两类记录/);
  assert.match(message.zh,/旧版原始记录不变/);
  assert.match(message.vi,/dữ liệu học tập và dữ liệu luyện tập theo giáo trình HSK1/i);
  assert.match(message.vi,/Nếu một loại dữ liệu trong bản sao lưu trống, nhập tệp sẽ xóa loại đó/);
  assert.doesNotMatch(message.zh+'\n'+message.vi,/两个域|双域|原域|快照|原子事务|写锁|legacy|30-v1|hai miền|khóa ghi|ảnh chụp/i);
});

test('backup explanations retain uncertainty and preserve-only semantics in Chinese and Vietnamese',()=>{
  const panel=fs.readFileSync(new URL('../src/features/source-activities/pair-panel.ts',import.meta.url),'utf8');
  const unified=fs.readFileSync(new URL('../../course-app/src/backup-view.ts',import.meta.url),'utf8');
  for(const text of [panel,unified]){
    assert.match(text,/当前教材练习记录全部保留/);
    assert.match(text,/giữ nguyên toàn bộ dữ liệu luyện tập hiện tại/);
    assert.match(text,/不要把它当作完整备份导入/);
    assert.match(text,/không nhập.*bản sao lưu đầy đủ/);
    assert.doesNotMatch(text,/跨键原子事务|两域|两个域|双域|单域|一致快照|安全写锁|legacy键|hai miền|khóa ghi|ảnh chụp/i);
  }
  assert.match(panel,/还不能确认操作是否全部完成/);
  assert.match(panel,/Chưa xác nhận được thao tác đã hoàn tất/);
  assert.match(panel,/另一窗口修改了记录/);
  assert.match(panel,/cửa sổ khác/);
  assert.match(panel,/不要清除浏览器数据/);
  assert.match(panel,/không xóa dữ liệu trình duyệt/);
  assert.match(panel,/之后新增的记录可能被替换/);
  assert.match(panel,/dữ liệu được thêm sau đó có thể bị thay/);
});
