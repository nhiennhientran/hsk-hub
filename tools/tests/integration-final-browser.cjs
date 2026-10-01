'use strict';
// Expand the immutable, accepted integration suite rather than fork its recovery tests.
// Every original scenario remains. The expanded executable is retained with CI evidence.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
require('node:child_process').execFileSync(process.execPath,[path.join(__dirname,'integration-router-preflight.cjs')],{stdio:'inherit',env:process.env});
const original=fs.readFileSync(path.join(__dirname,'integration-step1-browser.cjs'),'utf8');
assert.equal(crypto.createHash('sha256').update(original).digest('hex'),'a8e73e22be9af13b35b7c4700489e0e39bf7617609e536c80711353e852a2329','Frozen regression harness changed: review it before expanding');
let source=original;
function replace(from,to,count=1){assert.equal(source.split(from).length-1,count,'Unexpected test expansion: '+from);source=source.split(from).join(to);}
replace("name:'integration-step1'","name:'integration-final'");
replace('`stage4-1-${BROWSER}-${s}`','`integration-final-${BROWSER}-${s}`');
replace('},20*60*1000);','},30*60*1000);');
replace('for(let l=1;l<=8;l++)await check','for(let l=1;l<=15;l++)await check',2);
replace('160 unique tasks','300 unique tasks');
replace('.size,160);','.size,300);');
replace('report.media.length,40','report.media.length,75');
replace('.overall.firstCorrect,32','.overall.firstCorrect,60');
replace('/160\\/300.*8\\/15/','/300\\/300.*15\\/15/');
replace('/160\\/300/','/300\\/300/');
replace('.homework.submitted,120','.homework.submitted,225');
replace('.overall.answered,40','.overall.answered,75');
const gate=" await check('No uncaught application errors or failed same-origin resources'";
replace(gate," await require('./integration-final-extra.cjs')({assert,fs,path,check,page,newContext,open,homeworkReady,saved,state,order,choose,sort,submit,part,screenshot,backup,importBackup,delay,play,BASE,OUT,file,E1,E2,E3,BANK,C,report});\n"+gate);
const output=path.join(__dirname,'integration-final.generated.cjs');fs.writeFileSync(output,source);
const evidence=path.join(__dirname,'results');fs.mkdirSync(evidence,{recursive:true});
fs.writeFileSync(path.join(evidence,`integration-final-${process.env.HSK_BROWSER||'chromium'}-executed.cjs`),source);
require(output);
