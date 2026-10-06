#!/usr/bin/env python3
"""Read-only typed byte traversal; partial snapshots never create final coverage."""
import argparse
import json
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'course-app/tools/final-quality-20261006'))
from audit_reference_graph import AuditGraph,POLICY_FIELDS


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo-root',type=Path,default=ROOT)
    parser.add_argument('--report',default='course-app/docs/final-quality-20261006/audio-review/accepted-file-checkpoint-20261006.json')
    parser.add_argument('--output',help='Optional diagnostic JSON, not an acceptance decision')
    parser.add_argument('--classifications',nargs=2,metavar=('FILE','SHA256'))
    parser.add_argument('--versions',nargs=2,metavar=('FILE','SHA256'))
    parser.add_argument('--fresh-report',nargs=2,metavar=('FILE','SHA256'))
    args = parser.parse_args()
    policies = {key:{'file':value[0],'sha256':value[1]} for key,value in zip(POLICY_FIELDS,(args.classifications,args.versions,args.fresh_report)) if value}
    try:
        graph = AuditGraph(args.repo_root,args.report,policy_references=policies)
        result = graph.run()
        result.update(status='read-only-partial-accepted-typed-audit-traversal',acceptedUniqueIdsAtSnapshot=graph.report.get('acceptedUniqueIds'),completeCoverage=False,errors=[])
        exit_code = 0
    except Exception as error:
        result = {'schemaVersion':1,'status':'read-only-typed-audit-reference-check-failed','errors':[{'error':str(error)}],'completeCoverage':False,'noDecisionsCreated':True}
        exit_code = 1
    if args.output:
        output = (args.repo_root/args.output).resolve()
        output.relative_to(args.repo_root.resolve())
        output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    summary = {k:v for k,v in result.items() if k not in ('historicalMetadataExclusions','immutableVersionResolutions','remoteModelMetadataReferences')}
    if exit_code == 0:
        summary.update(historicalMetadataExclusionCount=len(graph.classified),immutableVersionResolutionCount=len(graph.version_resolutions),remoteModelMetadataCount=len(graph.excluded_model_metadata))
    print(json.dumps(summary,ensure_ascii=False))
    raise SystemExit(exit_code)


if __name__ == '__main__':
    main()
