import { el,button,copy,download } from './dom.ts';
import type { Copy } from './types.ts';
import type { Level } from './router.ts';
import type { HSK1Pair } from '../../hsk1-app/src/services/source-activities/paired.ts';
export interface BackupProvider {
  level:Level;
  edition:string;
  status():string;
  export():string;
  original():string|null;
  preview(text:string):{
    data:unknown;
    confirm(signal:AbortSignal):Promise<{
      ok:boolean;
      code:string
    }>
  };
  paired?:{
    coordinator:HSK1Pair;
    prepare():Promise<boolean>;
    mount(host:HTMLElement,signal:AbortSignal,onApplied?:()=>void):Promise<{
      dispose():void
    }>
  };
}
const count=(v:unknown)=>v&&typeof v==='object'?Object.keys(v).length:0;
export function summarizeBackup(data:unknown,level:Level):Copy {
  if(!data||typeof data!=='object')return copy('暂无记录','Chưa có dữ liệu');
  const d=data as Record<string,unknown>;
  if(level===1){
    const r=d.reading as Record<string,unknown>|undefined;
    return copy(`HSK 1 · 教材记录 ${count(r?.modules)} · 旧版原始存档 ${count(d.legacyRaw)}`,`HSK 1 · Dữ liệu SGK ${count(r?.modules)} · Bản lưu gốc cũ ${count(d.legacyRaw)}`);
  }
  return copy(`HSK ${level} · 教材分部 ${count(d.reading)} · 作业 ${count(d.homework)} · 听力 ${count(d.listening)} · 教材练习 ${count(d.activities)}`,`HSK ${level} · Mục SGK ${count(d.reading)} · Bài tập ${count(d.homework)} · Nghe ${count(d.listening)} · Luyện tập SGK ${count(d.activities)}`);
}
/** Validation is complete for every imported course/domain before any button is mounted. */ export function prepareBackupCandidates(value:any,providers:BackupProvider[]) {
  let candidates:any[]=[];
  let schema=1;
  if(value?.app==='hsk123-unified-backup'&&[1,2].includes(value.schema)&&Array.isArray(value.courses)){
    schema=value.schema;
    candidates=value.courses;
    if(schema===2&&(!candidates.some(x=>x?.level===1)||candidates.length!==3))throw Error('完整备份缺课程 · Thiếu cấp trong bản đầy đủ');
  } else if(value?.app==='hsk1-complete-backup'&&value.schema===2){
    candidates=[{
      level:1,complete:value
    }
    ];
  } else {
    const inner=value?.current??value,provider=providers.find(p=>JSON.parse(p.export()).app===inner?.app);
    if(!provider)throw Error('无法识别课程或版本 · Không nhận diện được cấp hoặc phiên bản');
    candidates=[{
      level:provider.level,backup:inner
    }
    ];
  }
  const seen=new Set<number>();
  return candidates.map(item=>{
    if(!item||seen.has(item.level))throw Error('重复或无效课程 · Cấp học bị trùng hoặc sai');
    seen.add(item.level);
    const provider=providers.find(p=>p.level===item.level);
    if(!provider)throw Error('不支持的课程 · Cấp học không được hỗ trợ');
    if(item.edition!==undefined&&item.edition!==provider.edition)throw Error('教材版本不匹配 · Phiên bản SGK không khớp');
    let pending:ReturnType<BackupProvider['preview']>,description:Copy;
    if(item.complete||(schema===2&&item.level===1)){
      if(!provider.paired)throw Error('教材练习记录暂不可用 · Dữ liệu luyện tập theo giáo trình hiện chưa dùng được');
      const pair=provider.paired.coordinator,complete=item.complete??{
        app:'hsk1-complete-backup',schema:2,exportedAt:valueTime(value),domains:item.domains
      };
      const p=pair.previewBackup(JSON.stringify(complete));
      pending={
        data:p.primary,confirm:signal=>pair.confirm(p,signal)
      };
      description=p.description;
    } else{
      if(provider.level===1&&provider.paired?.coordinator.pending())throw Error('请先检查上次未完成的HSK1操作 · Hãy kiểm tra thao tác HSK1 dang dở trước đó');
      pending=provider.preview(JSON.stringify(item.backup));
      description=provider.level===1?copy('旧备份仅替换学习记录；没有教材练习记录，当前教材练习记录全部保留。','Bản cũ chỉ thay dữ liệu học tập; không có dữ liệu luyện tập theo giáo trình nên giữ nguyên toàn bộ dữ liệu luyện tập hiện tại.'):         copy(`将只替换HSK ${provider.level}当前版本的记录。其他级别和全部旧版原始记录保留；替换前记录可在本级进度页恢复。`,`Chỉ thay dữ liệu phiên bản hiện tại HSK ${provider.level}. Giữ nguyên cấp khác và dữ liệu gốc bản cũ; có thể khôi phục dữ liệu trước khi thay trong trang tiến độ của cấp này.`);
    }
    return {
      provider,pending,description
    };
  });
}
function valueTime(value:any):number {
  if(!Number.isSafeInteger(value.exportedAt)||value.exportedAt<=0)throw Error('Invalid backup date');
  return value.exportedAt;
}
export function openBackupPanel(providers:BackupProvider[],legacy:Record<string,string|null>,onApplied:()=>void){
  const controller=new AbortController(),dialog=el('dialog',undefined,'word-dialog backup-dialog'),body=el('div'),close=button(copy('关闭','Đóng'),()=>dialog.close());
  body.append(close);
  const title=el('h2',copy('学习记录备份','Sao lưu dữ liệu học tập'));
  title.id='unified-backup-title';
  dialog.setAttribute('aria-labelledby',title.id);
  body.append(title,el('p',copy('记录只保存在浏览器中。换设备前请下载备份；可逐级预览并恢复。','Dữ liệu chỉ lưu trong trình duyệt. Tải bản sao lưu trước khi đổi thiết bị; có thể xem trước và khôi phục từng cấp.')));
  const message=el('p');
  message.setAttribute('role','status');
  message.setAttribute('aria-live','polite');
  body.append(message);
  for(const p of providers){
    const card=el('section',undefined,'backup-course-summary');
    card.append(el('h3',`HSK ${p.level} · ${p.edition}`),el('p',summarizeBackup(JSON.parse(p.export()).data,p.level)),el('p',copy(`保存状态：${p.status()}`,`Trạng thái lưu: ${p.status()}`)));
    body.append(card);
  }
  const one=providers.find(p=>p.level===1)?.paired;
  function compatibility(){
    return {
      app:'hsk123-unified-backup',schema:1,exportedAt:Date.now(),courses:providers.map(p=>({
        level:p.level,edition:p.edition,status:p.status(),backup:JSON.parse(p.export()),unreadableOriginal:p.original()
      })),legacyReadonly:legacy
    };
  }
  body.append(button(copy('下载全部三级备份','Tải bản sao lưu cả 3 cấp'),async()=>{
    try{
      if(!one){
        download('hsk123-compatibility.json',JSON.stringify(compatibility(),null,2));
        return;
      }
      await one.prepare();
      const out=await one.coordinator.exportComplete();
      if(controller.signal.aborted)return;
      if(out.kind==='rescue'){
        download('hsk123-rescue.json',JSON.stringify({
          app:'hsk123-rescue',schema:1,consistent:false,hsk1:JSON.parse(out.text),otherCourses:providers.filter(p=>p.level!==1).map(p=>({
            level:p.level,backup:JSON.parse(p.export())
          })),legacyReadonly:legacy
        },null,2));
        message.replaceChildren(el('span',copy('只能导出救援材料，暂时无法确认记录均已完整保存。请保留此文件，不要把它当作完整备份导入；先检查上次未完成的HSK1操作和未保存的修改。','Chỉ có thể xuất dữ liệu cứu hộ; chưa xác nhận được dữ liệu đã được lưu đầy đủ. Hãy giữ tệp này, không nhập như bản sao lưu đầy đủ; hãy kiểm tra thao tác HSK1 dang dở và các thay đổi chưa lưu trước.')));
        return;
      }
      const full=compatibility();
      const source=JSON.parse(out.text);
      const courses=full.courses.map(c=>c.level===1?{
        level:c.level,edition:c.edition,status:c.status,domains:source.domains
      }:c);
      download(`hsk123-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({
        ...full,schema:2,courses
      },null,2));
      message.replaceChildren(el('span',copy('已生成三级备份，包含HSK1学习记录和教材练习记录。请保存并检查文件。','Đã tạo bản sao lưu ba cấp, gồm dữ liệu học tập và dữ liệu luyện tập theo giáo trình HSK1. Hãy lưu và kiểm tra tệp.')));
    } catch(e){
      message.textContent=String(e);
    }
  },'primary'));
  body.append(button(copy('下载旧格式三级兼容备份（不含HSK1教材练习记录）','Tải bản tương thích cũ ba cấp (không gồm dữ liệu luyện tập theo giáo trình HSK1)'),()=>download('hsk123-compatibility.json',JSON.stringify(compatibility(),null,2))));
  const label=el('label',copy('选择备份文件','Chọn tệp sao lưu')),file=el('input');
  file.type='file';
  file.accept='.json,application/json';
  file.id='unified-backup-file';
  label.htmlFor=file.id;
  const previews=el('section');
  body.append(label,file,previews);
  let readId=0,selection=new AbortController();
  file.onchange=async()=>{
    const chosen=file.files?.[0];
    if(!chosen)return;
    const id=++readId;
    selection.abort();
    selection=new AbortController();
    previews.replaceChildren();
    message.replaceChildren();
    try{
      if(chosen.size>32*1024*1024)throw Error('备份超过32MB · Tệp sao lưu vượt 32MB');
      const value=JSON.parse(await chosen.text());
      if(controller.signal.aborted||id!==readId)return;
      const hasOne=value.app==='hsk1-complete-backup'||value.app==='hsk1-modular-backup'||value.courses?.some((c:any)=>c?.level===1);
      if(hasOne&&one&&!await one.prepare())throw Error('请先完成输入，保存学习记录和教材练习记录的修改，再重选文件。 · Hãy hoàn tất nhập, lưu các thay đổi trong dữ liệu học tập và dữ liệu luyện tập theo giáo trình rồi chọn lại tệp.');
      if(controller.signal.aborted||id!==readId)return;
      const prepared=prepareBackupCandidates(value,providers);
      // No externally actionable DOM exists until the last course/domain has validated.
      const fragment=document.createDocumentFragment();
      for(const {
        provider,pending,description
      }
      of prepared){
        const panel=el('section',undefined,'backup-preview');
        panel.append(el('h3',`HSK ${provider.level} · ${provider.edition}`),el('p',summarizeBackup(pending.data,provider.level)),el('p',description));
        const cancelSignal=selection.signal;
        const confirm=button(copy(`确认恢复HSK ${provider.level}`,`Xác nhận khôi phục HSK ${provider.level}`),async()=>{
          if(confirm.disabled||cancelSignal.aborted)return;
          confirm.disabled=true;
          const outcome=await pending.confirm(cancelSignal);
          if(controller.signal.aborted||cancelSignal.aborted)return;
          if(outcome.ok){
            message.replaceChildren(el('span',copy(`HSK ${provider.level}已恢复`,`Đã khôi phục HSK ${provider.level}`)));
            panel.replaceChildren(el('p',copy('恢复完成；再次更改前请重新选择文件并预览。','Khôi phục hoàn tất; chọn lại tệp và xem trước trước khi thay đổi tiếp.')));
            onApplied();
          } else message.replaceChildren(el('span',copy('还不能确认恢复是否全部完成。请保留未保存的修改和救援材料；核对另一窗口的修改及上次未完成的操作，再重选文件和预览。','Chưa xác nhận được việc khôi phục đã hoàn tất. Hãy giữ các thay đổi chưa lưu và dữ liệu cứu hộ; kiểm tra thay đổi ở cửa sổ khác và thao tác dang dở rồi chọn lại tệp và xem trước.')));
        });
        panel.append(confirm);
        fragment.append(panel);
      }
      previews.append(fragment);
    } catch(e){
      if(id===readId){
        previews.replaceChildren();
        const detail=e instanceof Error?e.message:String(e);if(/[\u3400-\u9fff]/u.test(detail))message.textContent=detail;else message.replaceChildren(el('span',copy('这个备份目前无法导入，或记录已发生变化。请先保留救援材料，核对未保存的修改，再重选文件和预览。','Hiện chưa thể nhập bản sao lưu này hoặc dữ liệu đã thay đổi. Hãy giữ dữ liệu cứu hộ, kiểm tra các thay đổi chưa lưu rồi chọn lại tệp và xem trước.')));
      }
    }
  };
  let pairPanel:{
    dispose():void
  }
  |undefined;
  if(one)void one.mount(body,controller.signal,onApplied).then(view=>{
    pairPanel=view;
    if(controller.signal.aborted)view.dispose();
  });
  dialog.append(body);
  document.body.append(dialog);
  dialog.addEventListener('close',()=>{
    readId++;
    selection.abort();
    controller.abort();
    pairPanel?.dispose();
    dialog.remove();
  },{
    once:true
  });
  dialog.showModal();
  close.focus();
  return()=>dialog.close();
}
