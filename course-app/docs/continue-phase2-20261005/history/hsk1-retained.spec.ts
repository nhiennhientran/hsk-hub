// Every imported definition and this config use HSK1's installed Playwright.
import '../../../../hsk1-app/tests/browser/storage.spec.ts';
import '../../../../hsk1-app/tests/browser/homework30.spec.ts';
// The existing explicit-session variant isolates backup restoration from the
// unavailable password fixture; its original assertion remains unchanged.
import '../../resume-20261004/flow-compat-review/hsk1-fresh-backup.retained.ts';
