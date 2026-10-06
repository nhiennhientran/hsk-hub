import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
/** Compare every Git blob's actual streamed bytes to the native-tested SHA-256
 * inventory. No tree/path/size agreement can substitute for byte identity. */
export async function verifyGitTree(repo,ref,inventory){
 const rows=execFileSync('git',['ls-tree','-rz',ref],{cwd:repo,encoding:'utf8',maxBuffer:16*1024*1024}).split('\0').filter(Boolean).map(row=>{
  const [meta,path]=row.split('\t'),[mode,type,sha]=meta.split(' ');assert.equal(mode,'100644','Unexpected staging file mode');assert.equal(type,'blob');return {path,sha};
 }).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
 assert.deepEqual(rows.map(row=>row.path),inventory.files.map(row=>row.path),'Git tree paths differ from tested inventory');
 const child=spawn('git',['cat-file','--batch'],{cwd:repo,stdio:['pipe','pipe','pipe']});
 let index=0,pending=Buffer.alloc(0),active=null,delimiter=false,stderr='';
 child.stderr.on('data',chunk=>{stderr=(stderr+chunk.toString()).slice(-4096);});
 await new Promise((resolve,reject)=>{
  let failed=false;const fail=error=>{if(failed)return;failed=true;child.kill();reject(error);};
  child.on('error',fail);child.stdin.on('error',fail);
  child.stdout.on('data',chunk=>{
   if(failed)return;
   try{
    const bytes=pending.length?Buffer.concat([pending,chunk]):chunk;pending=Buffer.alloc(0);let offset=0;
    while(offset<bytes.length){
     if(delimiter){assert.equal(bytes[offset++],10,'Malformed Git blob delimiter');delimiter=false;index++;continue;}
     if(!active){
      const end=bytes.indexOf(10,offset);if(end===-1){pending=bytes.subarray(offset);break;}
      assert.ok(index<rows.length,'Extra Git blob');const [sha,type,length]=bytes.subarray(offset,end).toString().split(' '),expected=inventory.files[index];
      assert.equal(sha,rows[index].sha);assert.equal(type,'blob');assert.match(length,/^\d+$/);assert.equal(Number(length),expected.bytes,'Git blob byte length differs: '+expected.path);
      active={remaining:Number(length),hash:createHash('sha256'),expected};offset=end+1;
     }
     const count=Math.min(active.remaining,bytes.length-offset);active.hash.update(bytes.subarray(offset,offset+count));active.remaining-=count;offset+=count;
     if(active.remaining===0){assert.equal(active.hash.digest('hex'),active.expected.sha256,'Git blob SHA-256 differs: '+active.expected.path);active=null;delimiter=true;}
    }
   }catch(error){fail(error);}
  });
  child.on('close',code=>{if(failed)return;try{assert.equal(code,0,'Git blob verification failed: '+stderr);assert.equal(index,rows.length,'Incomplete Git blob stream');assert.equal(pending.length,0);assert.equal(active,null);assert.equal(delimiter,false);resolve();}catch(error){reject(error);}});
  child.stdin.end(rows.map(row=>row.sha).join('\n')+'\n');
 });
 return {paths:rows.length,gitTree:execFileSync('git',['rev-parse',ref+'^{tree}'],{cwd:repo,encoding:'utf8'}).trim(),sha256Verified:true};
}
