#!/usr/bin/env python3
"""Bounded durability fixtures; no synthetic complete-coverage success fixture."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from audit_reference_graph import (AuditGraph,HISTORICAL,META_ROLE,POLICY_FIELDS,sha,
                                  FEATURE_INDEX_GENERATOR_SHA, FEATURE_INDEX_GENERATOR,
                                  FEATURE_INDEX_OWNER)


class DurabilityFixtures(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.old_sha = next(iter(HISTORICAL))
        self.old_path,self.kind = HISTORICAL[self.old_sha]
        self.proposal = {'file':self.old_path,'sha256':self.old_sha,'id':'old',
                         'sourceSampleRange16k':[100,200],'cropPCM_SHA256':'a'*64,
                         'productionApproved':False,'foregroundBoundaryClassified':False}
        self.owner = {'historical':self.proposal}
        self.owner_ref = self.write('owner.json',self.owner)
        groups = []
        for expected,(path,kind) in HISTORICAL.items():
            entries = []
            if expected == self.old_sha:
                entries = [{'ownerJSON':'owner.json','ownerJSONActualSHA256':self.owner_ref['sha256'],
                            'jsonPointer':'/historical/sha256','recordedPath':path,'recordedSHA256':expected,
                            'status':'historical-bytes-unavailable','role':META_ROLE,'metadataKind':kind}]
            groups.append({'recordedPath':path,'recordedSHA256':expected,'status':'historical-bytes-unavailable',
                           'role':META_ROLE,'metadataKind':kind,'ownerReferences':entries})
        self.policy = {'exactHistoricalSHAClassificationCount':len(HISTORICAL),'classifications':groups}
        self.policy_ref = self.write('classification.json',self.policy)
        self.report = {'ownerEvidence':self.owner_ref,POLICY_FIELDS[0]:self.policy_ref}
        self.write('report.json',self.report)

    def tearDown(self):
        self.temp.cleanup()

    def write(self,path,obj):
        p=self.root/path;p.parent.mkdir(parents=True,exist_ok=True)
        b=(json.dumps(obj,sort_keys=True)+'\n').encode();p.write_bytes(b)
        return {'file':path,'sha256':sha(b)}

    def graph(self):
        return AuditGraph(self.root,'report.json').run()

    def replace_owner(self,obj):
        self.report['ownerEvidence']=self.write('owner.json',obj)
        self.write('report.json',self.report)

    def feature_index_policy(self):
        # Use genuine immutable observation bytes for this bounded fixture.
        # The fixture creates no complete-coverage acceptance report.
        project=Path(__file__).resolve().parents[3]
        paths=[FEATURE_INDEX_OWNER[0],
               'course-app/docs/final-quality-20261006/audio-review/final-accepted2539-fresh-source-audit/historical-observation85-actual-feature-recheck-v1.json']
        for name in paths:
            path=self.root/name;path.parent.mkdir(parents=True,exist_ok=True)
            path.write_bytes((project/name).read_bytes())
        recheck=paths[1]
        entry=dict(zip(('ownerJSON','ownerJSONActualSHA256','jsonPointer','recordedPath','recordedSHA256'),FEATURE_INDEX_OWNER))
        entry.update(status='historical-bytes-unavailable',role=META_ROLE,
                     metadataKind=FEATURE_INDEX_GENERATOR[1])
        self.policy['classifications'].append({
            'recordedPath':FEATURE_INDEX_GENERATOR[0],
            'recordedSHA256':FEATURE_INDEX_GENERATOR_SHA,
            'status':'historical-bytes-unavailable','role':META_ROLE,
            'metadataKind':FEATURE_INDEX_GENERATOR[1],'ownerReferences':[entry]})
        self.policy['exactHistoricalSHAClassificationCount']=8
        self.policy['historicalFeatureIndexReproductionEvidence']={
            'file':recheck,'sha256':sha((self.root/recheck).read_bytes())}
        self.update_feature_policy()

    def update_feature_policy(self):
        self.report[POLICY_FIELDS[0]]=self.write('classification.json',self.policy)
        self.write('report.json',self.report)

    def test_exact_single_feature_index_metadata_positive(self):
        self.feature_index_policy()
        graph=AuditGraph(self.root,'report.json')
        self.assertTrue(graph.classify(*FEATURE_INDEX_OWNER,{}))
        self.assertEqual(len(graph.classified),1)
        self.assertFalse(next(iter(graph.classified.values()))['historicalBytesRestored'])

    def test_feature_index_changed_owner_rejected(self):
        self.feature_index_policy()
        self.policy['classifications'][-1]['ownerReferences'][0]['ownerJSONActualSHA256']='a'*64
        self.update_feature_policy()
        with self.assertRaisesRegex(ValueError,'single exact authorized owner'):AuditGraph(self.root,'report.json')

    def test_feature_index_changed_pointer_rejected(self):
        self.feature_index_policy()
        self.policy['classifications'][-1]['ownerReferences'][0]['jsonPointer']='/rawSHA256'
        self.update_feature_policy()
        with self.assertRaisesRegex(ValueError,'single exact authorized owner'):AuditGraph(self.root,'report.json')

    def test_feature_index_additional_owner_rejected(self):
        self.feature_index_policy()
        entries=self.policy['classifications'][-1]['ownerReferences']
        entries.append(copy.deepcopy(entries[0]))
        self.update_feature_policy()
        with self.assertRaises(ValueError):AuditGraph(self.root,'report.json')

    def test_feature_index_cannot_hide_native_raw(self):
        self.feature_index_policy()
        graph=AuditGraph(self.root,'report.json')
        with self.assertRaises(ValueError):
            graph.retain('native-raw.json',FEATURE_INDEX_GENERATOR_SHA,
                         owner=FEATURE_INDEX_OWNER[0],owner_sha=FEATURE_INDEX_OWNER[1],
                         pointer=FEATURE_INDEX_OWNER[2],node={})

    def test_feature_index_actual_recomputation_required(self):
        self.feature_index_policy()
        reference=self.policy['historicalFeatureIndexReproductionEvidence']
        data=json.loads((self.root/reference['file']).read_text())
        data['checks']=data['checks'][:20]
        self.policy['historicalFeatureIndexReproductionEvidence']=self.write(reference['file'],data)
        self.update_feature_policy()
        with self.assertRaisesRegex(ValueError,'all actual 85 observations'):AuditGraph(self.root,'report.json')

    def test_feature_index_cannot_claim_restored_old_code(self):
        self.feature_index_policy()
        reference=self.policy['historicalFeatureIndexReproductionEvidence']
        data=json.loads((self.root/reference['file']).read_text())
        data['oldProducerBytesRecovered']=True
        self.policy['historicalFeatureIndexReproductionEvidence']=self.write(reference['file'],data)
        self.update_feature_policy()
        with self.assertRaisesRegex(ValueError,'all actual 85 observations'):AuditGraph(self.root,'report.json')

    def test_exact_unselected_metadata_positive(self):
        r=self.graph();self.assertEqual(len(r['historicalMetadataExclusions']),1)
        self.assertFalse(r['historicalMetadataExclusions'][0]['historicalBytesRestored'])
        self.assertEqual(r['errors'],[])
        self.assertFalse(r['completeCoverage'])

    def test_changed_owner_bytes_rejected(self):
        self.replace_owner(dict(self.owner,extra=True))
        with self.assertRaises(ValueError):self.graph()

    def test_changed_pointer_rejected(self):
        changed={'moved':self.proposal};reference=self.write('owner.json',changed)
        # Even a correctly pinned new owner byte identity cannot move the scope.
        self.policy['classifications'][0]['ownerReferences'][0]['ownerJSONActualSHA256']=reference['sha256']
        self.report[POLICY_FIELDS[0]]=self.write('classification.json',self.policy)
        self.report['ownerEvidence']=reference;self.write('report.json',self.report)
        with self.assertRaises(ValueError):self.graph()

    def test_same_sha_cannot_hide_raw_path(self):
        entry=self.policy['classifications'][0]['ownerReferences'][0]
        entry['recordedPath']='actual-native-raw.json'
        self.report[POLICY_FIELDS[0]]=self.write('classification.json',self.policy)
        self.write('report.json',self.report)
        with self.assertRaises(ValueError):self.graph()

    def test_missing_current_raw_rejected(self):
        self.report['rawEvidence']={'file':'actual-native-raw.json','sha256':'b'*64}
        self.write('report.json',self.report)
        with self.assertRaises(ValueError):self.graph()

    def test_missing_typed_original_source_rejected(self):
        self.report['sourceTrack']='real-original.mp3';self.report['sourceSHA256']='d'*64
        self.write('report.json',self.report)
        with self.assertRaises(ValueError):self.graph()

    def test_changed_current_selected_plot_rejected(self):
        (self.root/'selected.png').write_bytes(b'changed actual plot')
        self.report['physicalEvidence']={'file':'selected.png','sha256':sha(b'original selected plot')}
        self.write('report.json',self.report)
        with self.assertRaises(ValueError):self.graph()

    def test_selected_old_plot_cannot_be_metadata(self):
        self.report['acceptedSourceFrameGates']=[{'id':'old','sourceSampleRange16k':[100,200],'cropPCM_SHA256':'a'*64}]
        self.write('report.json',self.report)
        with self.assertRaisesRegex(ValueError,'selected current physical plot'):self.graph()

    def test_current_selected_plot_missing_rejected(self):
        self.report['acceptedSourceFrameGates']=[{'id':'now','sourceSampleRange16k':[300,400],'cropPCM_SHA256':'b'*64,
            'physicalPlot':{'file':'current-selected.png','sha256':'c'*64}}]
        self.write('report.json',self.report)
        with self.assertRaises(ValueError):self.graph()

    def test_actual_immutable_multiple_versions_positive(self):
        mapping=[]
        for i,body in enumerate((b'actual original version one',b'actual original version two')):
            h=sha(body);name=f'preserved/{h}-producer.py';p=self.root/name;p.parent.mkdir(exist_ok=True);p.write_bytes(body)
            mapping.append({'originalPath':'producer.py','expectedSHA256':h,'actualSHA256':h,
                            'retainedFile':name,'status':'exact-original-bytes-preserved'})
        self.report[POLICY_FIELDS[1]]=self.write('versions.json',{'mapping':mapping})
        self.report['twoVersions']=[{'file':'producer.py','sha256':row['expectedSHA256']} for row in mapping]
        self.write('report.json',self.report)
        r=self.graph();self.assertEqual(len(r['immutableVersionResolutions']),2)

    def test_changed_immutable_bytes_rejected(self):
        h=sha(b'actual original');(self.root/'retained.py').write_bytes(b'changed')
        self.report[POLICY_FIELDS[1]]=self.write('versions.json',{'mapping':[{'originalPath':'producer.py','expectedSHA256':h,
           'actualSHA256':h,'retainedFile':'retained.py','status':'exact-original-bytes-preserved'}]})
        self.write('report.json',self.report)
        with self.assertRaises(ValueError):self.graph()

    def test_raw_hidden_as_model_metadata_rejected(self):
        self.report['modelFiles']=[{'file':'actual-native-raw.json','sha256':'b'*64,'bytes':10}]
        self.write('report.json',self.report)
        with self.assertRaises(ValueError):self.graph()

    def test_pinned_remote_model_metadata_positive(self):
        self.report.update(modelRepository='Systran/faster-whisper-small',
                           modelRevision='536b0662742c02347bc0e980a01041f333bce120',
                           modelFiles=[{'file':'model.bin','sha256':'e'*64,'bytes':483546902}])
        self.write('report.json',self.report)
        r=self.graph();self.assertEqual(len(r['remoteModelMetadataReferences']),1)

    def test_actual_internal_parent_path_positive(self):
        ref=self.write('review/peer/raw.json',{'raw':'actual immutable original evidence'})
        (self.root/'review/decisions').mkdir()
        self.report['internalActualEvidence']={**ref,'file':'review/decisions/../peer/raw.json'}
        self.write('report.json',self.report)
        graph=AuditGraph(self.root,'report.json');r=graph.run()
        retained=[x for x in graph.files.values() if x['recordedPath']=='review/decisions/../peer/raw.json']
        self.assertEqual(len(retained),1)
        self.assertEqual(retained[0]['file'],'review/peer/raw.json')
        self.assertEqual(retained[0]['sha256'],ref['sha256'])

    def test_parent_path_actual_repository_escape_rejected(self):
        self.report['outsideEvidence']={'file':'../outside-actual-raw.json','sha256':'a'*64}
        self.write('report.json',self.report)
        with self.assertRaisesRegex(ValueError,'leaves recorded repository'):self.graph()

    def test_partial_pack_creates_no_output(self):
        spec=importlib.util.spec_from_file_location('pack_final_audit',Path(__file__).with_name('pack-final-audit.py'))
        m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
        with self.assertRaisesRegex(ValueError,'partial review'):
            m.pack(self.root,'report.json','never-created-output')
        self.assertFalse((self.root/'never-created-output').exists())


if __name__=='__main__':unittest.main(verbosity=2)
