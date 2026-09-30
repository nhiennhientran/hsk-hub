'use strict';
const normal=s=>String(s).normalize('NFKC').replace(/[\s，。！？,.!?；;：:、"“”‘’]/gu,'');
function solveSort(q){
 for(const answer of q.answers){const goal=normal(answer);const search=(rest,left,order)=>{if(!left.length)return rest===''?order:null;for(const i of left){const token=normal(q.tokens[i]);if(rest.startsWith(token)){const r=search(rest.slice(token.length),left.filter(x=>x!==i),[...order,i]);if(r)return r;}}return null;};const r=search(goal,q.tokens.map((_,i)=>i),[]);if(r)return r;}
 throw new Error(`No token arrangement yields the reviewed answer for ${q.id}`);
}
function wrongSort(q){const sorted=solveSort(q),answers=q.answers.map(normal);for(let i=0;i<sorted.length;i++)for(let j=i+1;j<sorted.length;j++){const r=[...sorted];[r[i],r[j]]=[r[j],r[i]];if(!answers.includes(normal(r.map(k=>q.tokens[k]).join(''))))return r;}throw new Error(`No distinct wrong order for ${q.id}`);}
module.exports={normal,solveSort,wrongSort};
