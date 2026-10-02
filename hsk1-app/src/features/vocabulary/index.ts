import type { FeatureModule } from '../../app/contracts.ts';
import { mountVocabulary } from './view.ts';
export const mount: FeatureModule['mount'] = (host, context) => mountVocabulary(host, context, 'vocabulary');
