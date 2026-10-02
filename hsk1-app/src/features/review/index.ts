import type { FeatureModule } from '../../app/contracts.ts';
import { mountVocabulary } from '../vocabulary/view.ts';
export const mount: FeatureModule['mount'] = (host, context) => mountVocabulary(host, context, 'review');
