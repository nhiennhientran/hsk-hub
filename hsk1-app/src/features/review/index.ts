import type { FeatureModule } from '../../app/contracts.ts';
import { mountVocabulary } from '../vocabulary/view.ts';
/** The practice doorway now opens mixed cards directly; old URLs remain valid. */
export const mount: FeatureModule['mount'] = (host, context) => mountVocabulary(host, context, 'review');
