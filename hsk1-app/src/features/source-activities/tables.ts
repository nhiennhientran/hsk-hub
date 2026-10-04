import {bilingualText} from '../../app/bilingual.ts';
import type {Copy,SourceTable} from '../../services/source-activities/content.ts';
import {element} from '../textbook/dom.ts';

/** Keep the printed topology; narrow screens scroll the table, not the page. */
export function sourceActivityTable(table:SourceTable,title:Copy,field:(id:string)=>HTMLElement):HTMLElement {
  const wrap=element('div');wrap.className='source-table-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',bilingualText(table.caption??title));
  const node=element('table');node.className='source-activity-table';
  if(table.caption)node.append(element('caption',table.caption));
  if(!table.headerless){const head=element('thead'),headRow=element('tr');for(const column of table.columns){const cell=element('th',column);cell.scope='col';headRow.append(cell);}head.append(headRow);node.append(head);}
  const body=element('tbody');for(const row of table.rows){const tr=element('tr');tr.dataset.sourceRow=row.id;for(const [index,cell] of row.cells.entries()){
    const td=index===0&&cell.text&&!cell.fieldId?element('th'):element('td');if(td.tagName==='TH')td.scope='row';
    if(cell.text)td.append(element('p',cell.text));if(cell.fieldId)td.append(field(cell.fieldId));tr.append(td);
  }body.append(tr);}node.append(body);wrap.append(node);return wrap;
}

export const tableFieldIds=(table:SourceTable):Set<string>=>new Set(table.rows.flatMap(row=>row.cells.flatMap(cell=>cell.fieldId?[cell.fieldId]:[])));
