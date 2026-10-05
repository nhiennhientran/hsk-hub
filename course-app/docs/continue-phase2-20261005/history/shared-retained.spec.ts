import {test} from '@playwright/test';
// Preserve the existing behavioral definitions; select the supported history
// scope in the config instead of rewriting assertions or creating substitutes.
test.beforeEach(async ({page}) => page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1')));
import '../../resume-20261004/flow-compat-review/homework-all-lessons.candidate.spec.ts';
import '../../resume-20261004/flow-compat-review/durable-attempts.candidate.spec.ts';
import '../../resume-20261004/flow-compat-review/shared-practice-listening.candidate.spec.ts';
import '../../../tests/browser/safety.spec.ts';
import '../../../tests/unified/unified.spec.ts';
