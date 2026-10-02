import type {CourseConfig} from './types.ts';
export const configs:Readonly<Record<2|3,CourseConfig>>={
 2:{id:'hsk2-fltrp-2026',level:2,version:'2026.1',count:15,grammarCounts:Array(15).fill(3),storageKey:'ran_hsk2_fltrp_2026_v1',legacyKeys:['hsk2_ranteacher_progress_v1','hsk2_ranteacher_mastered_v1'],legacyURL:'../../hsk2.html',entry:'new-hsk2/hsk2'},
 3:{id:'hsk3-fltrp-2026',level:3,version:'2026.1',count:18,grammarCounts:[3,3,3,3,4,3,4,4,3,3,4,4,3,3,4,4,4,4],storageKey:'ran_hsk3_fltrp_2026_v1',legacyKeys:['hsk3_ranteacher_progress_v1','hsk3_ranteacher_mastered_v1'],legacyURL:'../../hsk3/',entry:'new-hsk3/hsk3'}
};
export function getConfig(level:unknown):CourseConfig{if(level!==2&&level!==3)throw new Error('Unknown course');return configs[level]}
