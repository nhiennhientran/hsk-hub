import '../../app/bilingual.css';
import './source-activities.css';
import { element, button } from '../textbook/dom.ts';
import { setBilingual } from '../../app/bilingual.ts';
import type { LearningSession } from '../../services/learning/session.ts';
import { browserHSK1Pair, prepareHSK1Pair } from '../../services/source-activities/browser-pair.ts';
import { getSourceSession, SOURCE_BACKUP_ID } from '../../services/source-activities/store.ts';
import { sourceCounts,primaryCounts } from '../../services/source-activities/summary.ts';
import { blankSourceData } from '../../services/source-activities/state.ts';
import { COMPLETE_APP, type HSK1Pair } from '../../services/source-activities/paired.ts';
const copy=(zh:string,vi:string)=>({
  zh,vi
});
let panelSerial=0;
type Pending={
  data:unknown;
  confirm(signal:AbortSignal):Promise<{
    ok:boolean;
    code:string
  }>
};
export function mountPairPanel(host:HTMLElement,primary:LearningSession,signal:AbortSignal,provided?:{
  pair:HSK1Pair;
  prepare:()=>Promise<boolean>;
  download:(name:string,text:string)=>void;
  source:ReturnType<typeof getSourceSession>
},onApplied?:()=>void) {
  const serial=++panelSerial;
  const source=provided?.source??getSourceSession(), pair=provided?.pair??browserHSK1Pair(primary);
  const prepare=provided?.prepare??(()=>prepareHSK1Pair(primary));
  const panel=element('section');
  panel.className='source-pair-panel';
  panel.dataset.hsk1PairPanel='';
  panel.append(element('h3',copy('HSK1完整备份 · 学习记录与教材练习记录','Sao lưu đầy đủ HSK1 · Dữ liệu học tập và dữ liệu luyện tập theo giáo trình')),     element('p',copy('学习记录和教材练习记录分开保存。替换过程中若出现问题，请先下载救援材料，不要清除浏览器数据。','Dữ liệu học tập và dữ liệu luyện tập theo giáo trình được lưu riêng. Nếu gặp lỗi khi thay dữ liệu, hãy tải dữ liệu cứu hộ trước và không xóa dữ liệu trình duyệt.')));
  const status=element('p');
  status.setAttribute('role','status');
  panel.append(status);
  const download=provided?.download??((name:string,text:string)=>{
    const url=URL.createObjectURL(new Blob([text],{
      type:'application/json'
    }));
    const a=element('a');
    a.href=url;
    a.download=name;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  const fail=()=>setBilingual(status,pair.hasSafeLocks()?copy('还不能确认操作是否全部完成。请先保留未保存的修改并下载救援材料。若另一窗口修改了记录，或仍有未保存内容，请先核对并保存，再重选文件和预览。','Chưa xác nhận được thao tác đã hoàn tất. Hãy giữ các thay đổi chưa lưu và tải dữ liệu cứu hộ trước. Nếu dữ liệu đã đổi ở cửa sổ khác hoặc còn nội dung chưa lưu, hãy kiểm tra và lưu rồi chọn lại tệp và xem trước.'):copy('此浏览器暂时无法安全地同时替换两类记录，已停止操作。你仍可下载救援材料或旧格式备份。','Trình duyệt này hiện chưa thể thay an toàn cả hai loại dữ liệu nên thao tác đã dừng. Bạn vẫn có thể tải dữ liệu cứu hộ hoặc bản sao lưu định dạng cũ.'));
  const actions=element('div');
  actions.className='source-actions';
  actions.append(button(copy('下载HSK1完整备份','Tải bản sao lưu đầy đủ HSK1'),()=>{
    void (async()=>{
      await prepare();
      const out=await pair.exportComplete();
      download(out.kind==='complete'?'hsk1-complete.json':'hsk1-rescue.json',out.text);
      setBilingual(status,out.kind==='complete'?copy('已生成包含学习记录和教材练习记录的完整备份','Đã tạo bản sao lưu đầy đủ gồm dữ liệu học tập và dữ liệu luyện tập theo giáo trình'):copy('只能生成救援材料，暂时无法确认两类记录均已完整保存。请保留此文件，不要把它当作完整备份导入。','Chỉ có thể tạo dữ liệu cứu hộ; chưa xác nhận được cả hai loại dữ liệu đã được lưu đầy đủ. Hãy giữ tệp này; không nhập tệp này như bản sao lưu đầy đủ.'));
    })();
  },signal),     button(copy('下载旧格式兼容备份（不含教材练习记录）','Tải bản tương thích cũ (không gồm dữ liệu luyện tập theo giáo trình)'),()=>{
    download('hsk1-primary-compatibility.json',primary.store.exportBackup());
  },signal),     button(copy('下载救援材料','Tải dữ liệu cứu hộ'),()=>download('hsk1-rescue.json',JSON.stringify(pair.rescue(),null,2)),signal),     button(copy('尝试恢复未完成操作','Thử khôi phục thao tác dang dở'),()=>{
    clear();
    void pair.recover(signal).then(r=>{
      if(!r.ok)fail();
      else setBilingual(status,copy('已检查上次未完成的操作，请重新打开学习记录页面。','Đã kiểm tra thao tác dang dở trước đó; hãy mở lại trang dữ liệu học tập.'));
    });
  },signal));
  panel.append(actions);
  const preview=element('div');
  preview.className='source-pair-preview';
  preview.hidden=true;
  panel.append(preview);
  let pending:Pending|undefined,operation:AbortController|undefined,epoch=0;
  function clear(){
    epoch++;
    status.replaceChildren();
    operation?.abort();
    operation=undefined;
    pending=undefined;
    preview.replaceChildren();
    preview.hidden=true;
  }
  function show(candidate:Pending,description:ReturnType<typeof copy>){
    clear();
    pending=candidate;
    const displayEpoch=epoch;
    preview.hidden=false;
    preview.append(element('p',description),button(copy('确认所选范围','Xác nhận phạm vi đã chọn'),()=>{
      if(epoch!==displayEpoch||pending!==candidate||operation)return;
      operation=new AbortController();
      const captured=candidate,request=operation,id=epoch;
      void captured.confirm(request.signal).then(r=>{
        if(signal.aborted||request.signal.aborted||id!==epoch||operation!==request)return;
        clear();
        if(r.ok){
          setBilingual(status,copy('所选数据操作已完成','Đã hoàn tất thao tác trong phạm vi đã chọn'));
          try{
            onApplied?.();
          } catch{
            /* A UI observer cannot undo a confirmed operation. */
          }
        } else fail();
      });
    },signal),button(copy('取消','Hủy'),()=>{
      if(epoch===displayEpoch)clear();
    },signal));
  }
  const importLabel=element('label',copy('导入HSK1完整或单独备份','Nhập bản sao lưu HSK1 đầy đủ hoặc riêng từng loại'));
  const input=element('input');
  input.type='file';
  input.accept='.json,application/json';
  input.id='hsk1-pair-import-'+serial;
  input.dataset.pairImport='';
  importLabel.htmlFor=input.id;
  panel.append(importLabel,input);
  input.addEventListener('change',()=>{
    clear();
    const file=input.files?.[0],id=epoch;
    if(!file||file.size>32*1024*1024){
      fail();
      return;
    }
    void (async()=>{
      try{
        const text=await file.text();
        if(signal.aborted||id!==epoch||!await prepare())return;
        const value=JSON.parse(text);
        let candidate:Pending,description;
        if(value.app===COMPLETE_APP&&value.schema===2){
          const p=pair.previewBackup(text);
          candidate={
            data:p,confirm:s=>pair.confirm(p,s)
          };
          description=p.description;
        } else if(value.app===SOURCE_BACKUP_ID){
          const p=source.store.previewBackup(text);
          candidate={
            data:p.data,confirm:s=>source.store.confirm(p,s)
          };
          description=copy(`仅替换教材练习记录：${Object.keys(p.data.records).length}组；学习记录不变。`,`Chỉ thay dữ liệu luyện tập theo giáo trình: ${Object.keys(p.data.records).length} nhóm; giữ nguyên dữ liệu học tập.`);
        } else {
          const p=primary.store.previewBackup(text);
          candidate={
            data:p.data,confirm:s=>primary.store.confirm(p,s)
          };
          description=copy('旧备份仅替换学习记录；没有教材练习记录，当前教材练习记录全部保留。','Bản cũ chỉ thay dữ liệu học tập; không có dữ liệu luyện tập theo giáo trình nên giữ nguyên toàn bộ dữ liệu luyện tập hiện tại.');
        }
        if(signal.aborted||id!==epoch)return;
        show(candidate,description);
      } catch{
        if(!signal.aborted&&id===epoch){
          clear();
          fail();
        }
      }
    })();
  },{
    signal
  });
  const scope=element('select');
  scope.id='hsk1-reset-scope-'+serial;
  scope.dataset.pairResetScope='';
  for(const [value,label] of [['primary','学习记录 · Dữ liệu học tập'],['source','教材练习记录 · Dữ liệu luyện tập theo giáo trình'],['both','学习记录和教材练习记录 · Dữ liệu học tập và dữ liệu luyện tập theo giáo trình']]){
    const o=element('option',label);
    o.value=value;
    scope.append(o);
  }
  const scopeLabel=element('label',copy('清空范围','Phạm vi xóa'));
  scopeLabel.htmlFor=scope.id;
  panel.append(scopeLabel,scope);
  scope.addEventListener('change',clear,{
    signal
  });
  panel.append(button(copy('预览按范围清空','Xem trước xóa theo phạm vi'),()=>{
    clear();
    const id=epoch;
    void (async()=>{
      try{
        if(!await prepare()||id!==epoch||signal.aborted)return;
        if(pair.pending())throw Error('Pending recovery');
        let candidate:Pending;
        if(scope.value==='source'){
          const p=source.store.previewReplacement(blankSourceData(),'reset');
          candidate={
            data:p.data,confirm:s=>source.store.confirm(p,s)
          };
        } else{
          const data=primary.compatibility.reset(primary.store.snapshot().data,{
            module:'all',lesson:null
          }).data;
          if(scope.value==='both'){
            const p=pair.previewReset(data);
            candidate={
              data:p,confirm:s=>pair.confirm(p,s)
            };
          } else{
            const p=primary.store.previewReplacement(data,'reset');
            candidate={
              data:p.data,confirm:s=>primary.store.confirm(p,s)
            };
          }
        }
        const current=primaryCounts(primary.store.snapshot().data),activities=sourceCounts(source.store.snapshot().data);
        show(candidate,copy(`将清空所选范围：${scope.selectedOptions[0].textContent}。当前：教材学习${current.reading}课、新版作业${current.newHomeworkLessons}课；教材练习记录${activities.activities}组、已提交${activities.submissions}次。所选范围外的记录和旧版原始记录保留；可恢复清空前的记录。`,`Sẽ xóa phạm vi đã chọn: ${scope.selectedOptions[0].textContent}. Hiện có ${current.reading} bài đã học trong giáo trình, ${current.newHomeworkLessons} bài tập phiên bản mới; ${activities.activities} nhóm dữ liệu luyện tập theo giáo trình, ${activities.submissions} lần đã nộp. Giữ dữ liệu ngoài phạm vi đã chọn và bản lưu gốc cũ; có thể khôi phục dữ liệu trước khi xóa.`));
      } catch{
        fail();
      }
    })();
  },signal),button(copy('预览恢复上次同时替换前的记录','Xem trước khôi phục dữ liệu trước lần thay cả hai gần nhất'),()=>{
    clear();
    const id=epoch;
    void (async()=>{
      try{
        if(!await prepare()||id!==epoch||signal.aborted)return;
        const p=pair.previewRestore();
        show({
          data:p,confirm:s=>pair.confirm(p,s)
        },copy('恢复上次同时替换前的学习记录和教材练习记录；之后新增的记录可能被替换。'+p.description.zh,'Khôi phục dữ liệu học tập và dữ liệu luyện tập theo giáo trình trước lần thay cả hai gần nhất; dữ liệu được thêm sau đó có thể bị thay. '+p.description.vi));
      } catch{
        fail();
      }
    })();
  },signal));
  host.append(panel);
  if(pair.pending()||!pair.hasSafeLocks())fail();
  const close=()=>clear();
  signal.addEventListener('abort',close,{
    once:true
  });
  return {
    dispose(){
      clear();
      signal.removeEventListener('abort',close);
      panel.remove();
    }
  };
}
