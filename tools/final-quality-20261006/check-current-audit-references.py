"""Read-only traversal of current accepted decisions; never creates final coverage."""
import hashlib,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
SHA=lambda b:hashlib.sha256(b).hexdigest()
def main():
 cp=ROOT/'course-app/docs/final-quality-20261006/audio-review/accepted-file-checkpoint-20261006.json';body=cp.read_bytes();snapshot=json.loads(body);pinned={};visited=set();errors=[];json_files=0
 def retain(name,expected):
  nonlocal json_files
  path=pathlib.Path(name);path=path.resolve() if path.is_absolute() else (ROOT/path).resolve()
  try:rel=path.relative_to(ROOT).as_posix()
  except ValueError:errors.append({'file':name,'error':'outside-recorded-repository'});return
  if rel in pinned:
   if pinned[rel]!=expected:errors.append({'file':rel,'error':'conflicting-referenced-byte-identities','expected':expected,'prior':pinned[rel]})
   return
  pinned[rel]=expected
  if not path.is_file():errors.append({'file':rel,'error':'referenced-file-missing'});return
  content=path.read_bytes()
  if SHA(content)!=expected:errors.append({'file':rel,'error':'referenced-byte-SHA-differs','expected':expected,'actual':SHA(content)});return
  if path.suffix=='.json' and rel not in visited:
   visited.add(rel);json_files+=1;visit(json.loads(content))
 def visit(value):
  if isinstance(value,list):
   for v in value:visit(v)
  elif isinstance(value,dict):
   if isinstance(value.get('file'),str) and isinstance(value.get('sha256'),str):retain(value['file'],value['sha256'])
   for key,name in value.items():
    if isinstance(name,str) and key.endswith('File'):
     prefix=key[:-4];digest=value.get(prefix+'SHA256',value.get(key+'SHA256'))
     if isinstance(digest,str) and len(digest)==64:retain(name,digest)
   for v in value.values():visit(v)
 visit(snapshot['acceptedSourceFrameGateFileReferences'])
 result={'schemaVersion':1,'status':'read-only-partial-accepted-audit-traversal','acceptedUniqueIdsAtSnapshot':snapshot['acceptedUniqueIds'],'acceptedCheckpointSHA256':SHA(body),'actualPinnedFiles':len(pinned),'actualTraversedJSONFiles':json_files,'errors':errors,'completeCoverage':False,'noDecisionsCreated':True}
 out=ROOT/'course-app/docs/final-quality-20261006/audio-review/current-accepted-audit-reference-diagnostic.json';out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='errors'}));print('actual reference errors',len(errors));print(json.dumps(errors[:30],indent=2))
if __name__=='__main__':main()
