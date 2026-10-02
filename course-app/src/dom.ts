import type {Copy} from './types.ts';
export function el<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string|Copy,className?:string):HTMLElementTagNameMap[K]{const node=document.createElement(tag);if(typeof text==='string')node.textContent=text;else if(text){const zh=document.createElement('span'),vi=document.createElement('span');zh.lang='zh';vi.lang='vi';zh.textContent=text.zh;vi.textContent=text.vi;node.append(zh,vi);node.classList.add('bi')}if(className)node.classList.add(...className.split(' '));return node}
export function button(text:string|Copy,action:()=>void|Promise<void>,className?:string):HTMLButtonElement{const b=el('button',text,className);b.type='button';b.addEventListener('click',()=>{void action()});return b}
export function link(text:string|Copy,url:string,className?:string):HTMLAnchorElement{const a=el('a',text,className);a.href=url;return a}
export function sourceNote(page:number,supplemental=false):HTMLElement{return el('small',{zh:`教材第${page}页${supplemental?' · 配套编写':''}`,vi:`SGK trang ${page}${supplemental?' · Nội dung bổ trợ':''}`},'source-note')}
export function download(name:string,contents:string):void{const url=URL.createObjectURL(new Blob([contents],{type:'application/json'}));const a=link(name,url);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)}
export const copy=(zh:string,vi:string):Copy=>({zh,vi});
