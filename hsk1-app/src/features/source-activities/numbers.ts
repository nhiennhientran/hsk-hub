import {sourceLesson,type NumberCell,type SourceLesson} from '../../services/source-activities/content.ts';
import {element} from '../textbook/dom.ts';
const copy=(zh:string,vi:string)=>({zh,vi});
export function numberTables(n:NonNullable<SourceLesson['numberTables']>=sourceLesson.numberTables!):HTMLElement {
  const details=element('details');details.className='source-number-tables';details.dataset.sourceNumbers='';details.append(element('summary',copy('原版数字表 · 第20–21页','Bảng số trong sách · Trang 20–21')));
  details.append(element('p',copy('按原页保留已印示例及空格。空格不是加载错误；未自动填充。','Giữ nguyên các ví dụ đã in và ô trống. Ô trống không phải lỗi tải; không tự điền thêm.')));
  function table(title:ReturnType<typeof copy>,rows:(NumberCell|null)[][],grid=false){
    const wrap=element('div');wrap.className='source-table-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',title.zh+' · '+title.vi);
    const t=element('table');t.append(element('caption',title));t.dataset.numberTable=grid?'0-99':'examples';
    const body=element('tbody');for(const row of rows){const tr=element('tr');for(const cell of row){const td=element('td');if(cell){const zh=element('span',cell.zh);zh.lang='zh';td.append(zh);if(cell.py)td.append(element('small',cell.py));if(cell.number!==undefined)td.append(element('span',String(cell.number)));if(cell.vi){const vi=element('small',cell.vi);vi.lang='vi';td.append(vi);}}else td.setAttribute('aria-label','原页空格 · Ô trống trong sách');tr.append(td);}body.append(tr);}t.append(body);wrap.append(t);return wrap;
  }
  details.append(table(copy('0–99的写法和读法','Cách viết và đọc số từ 0 đến 99'),n.grid,true));
  details.append(table(copy('“百”以上（含）、“万”以内数字的写法与读法','Cách viết và đọc số từ 100 đến dưới 10.000'),[n.higher.slice(0,3),n.higher.slice(3)]));
  details.append(element('p',copy('一般情况下，在序数词里用“二”，如“第二”；在量词前用“两”。','Thông thường, dùng “二” trong số thứ tự, như “第二”; dùng “两” trước lượng từ.')));
  details.append(table(copy('“2”的写法和读法','Cách viết và đọc số 2'),[n.two.slice(0,3),n.two.slice(3)]));return details;
}
