import {test} from '@playwright/test';
// Preserve the existing behavioral definitions; select the supported history
// scope in the config instead of rewriting assertions or creating substitutes.
// Apply the existing explicit test-session authorization to every page in this
// context, including the second tab used by the retained conflict test.
// This verifies history/backup behavior under that session, not password entry.
test.beforeEach(async ({context}) => context.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1')));
import '../../resume-20261004/flow-compat-review/homework-all-lessons.candidate.spec.ts';
import '../../resume-20261004/flow-compat-review/durable-attempts.candidate.spec.ts';
import '../../resume-20261004/flow-compat-review/shared-practice-listening.candidate.spec.ts';
import '../../../tests/browser/safety.spec.ts';
import '../../../tests/unified/unified.spec.ts';
