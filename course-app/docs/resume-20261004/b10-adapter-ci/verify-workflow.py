"""Read-only workflow structure checks; this is not execution evidence."""
from pathlib import Path
import hashlib
import json
import yaml

repo = Path(__file__).resolve().parents[4]
path = repo / '.github/workflows/hsk-official-vi-adapter-checkpoint.yml'
raw = path.read_bytes()
# BaseLoader preserves GitHub's literal `on` key instead of YAML1.1 bool coercion.
w = yaml.load(raw, Loader=yaml.BaseLoader)
assert set(w['on']) == {'push', 'workflow_dispatch'}
assert w['on']['push']['branches'] == ['work/hsk-b10-adapter-ci-20261004']
assert w['permissions'] == {'contents': 'read'}
assert set(w['jobs']) == {'adapters'}
job = w['jobs']['adapters']
assert job['strategy']['matrix'] == {'browser': ['chromium', 'webkit']}
assert job['strategy']['fail-fast'] == 'false'
assert job['env']['HSK_ADAPTER_CI_BROWSER'] == '${{ matrix.browser }}'
steps = job['steps']
assert sum(s.get('uses', '').startswith('actions/checkout@') for s in steps) == 1
assert next(s for s in steps if s.get('uses') == 'actions/checkout@v4')['with']['fetch-depth'] == '0'
assert next(s for s in steps if s.get('uses') == 'actions/setup-node@v4')['with']['node-version'] == '24.19.0'
runs = '\n'.join(s.get('run', '') for s in steps)
assert runs.count('npm ci --prefix ') == 2
assert 'npm ci --prefix course-app' in runs and 'npm ci --prefix hsk1-app' in runs
assert 'playwright install --with-deps ${{ matrix.browser }}' in runs
assert 'hsk1-app/node_modules/.bin/playwright test --config=course-app/docs/resume-20261004/b10-adapter-ci/playwright.hsk1.ci.config.ts --project=${{ matrix.browser }}' in runs
assert 'course-app/node_modules/.bin/playwright test --config=course-app/docs/resume-20261004/b10-adapter-ci/playwright.hsk23.ci.config.ts --project=${{ matrix.browser }}' in runs
assert '--list' not in runs
assert not any(forbidden in runs.lower() for forbidden in ['git push', 'gh pr merge', 'deploy-pages', 'git checkout main'])
assert next(s for s in steps if s.get('name') == 'Reject skips, retries, errors and source/build drift')['if'] == 'always()'
upload = next(s for s in steps if s.get('uses') == 'actions/upload-artifact@v4')
assert upload['if'] == 'always()' and upload['with']['include-hidden-files'] == 'true'
assert upload['with']['if-no-files-found'] == 'error'
for required in ['.repro-output/b10-adapter-ci/${{ matrix.browser }}/', 'dist/index.html', 'assets/**/*.js', 'assets/**/*.css', 'assets/**/*.json', 'hsk1-app/dist/*.html']:
    assert required in upload['with']['path']
report = {'schemaVersion': 1, 'status': 'static-workflow-structure-accepted-not-executed',
          'workflow': str(path.relative_to(repo)), 'workflowSHA256': hashlib.sha256(raw).hexdigest(),
          'triggerBranch': w['on']['push']['branches'][0], 'expandedJobs': 2,
          'expectedNativePerJob': {'hsk1': 3, 'hsk23': 8}, 'expectedNativeTotal': 22,
          'nativeExecuted': 0, 'publicationAuthorized': False, 'deployed': False}
print(json.dumps(report, ensure_ascii=False, indent=2))
