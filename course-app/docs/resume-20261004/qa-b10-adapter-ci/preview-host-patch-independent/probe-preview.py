"""Same-process independent reproduction of compiled Vite preview binding.

Uses each exact old/new command with the existing locally locked Vite. The HTTP
requests and subprocess lifetime are owned in one Python process. No browser,
dependency install, runtime/source write, frozen report rewrite or CI trigger.
"""
import hashlib
import http.client
import json
import os
from pathlib import Path
import shlex
import signal
import subprocess
import time

ROOT = Path(__file__).resolve().parent
APP = ROOT.parents[3]
CURRENT = APP / 'docs/resume-20261004/b10-adapter-ci/playwright.hsk23.ci.config.ts'
OLD = ROOT.parent / 'failed-37235796333/playwright.hsk23.ci.author-input.ts'
OLD_SHA = 'b5d342ecc7d66694687a53a6133092537e024cff873f3d90e7cad8f8d6a481ba'
NEW_SHA = '9a006ab3aa12ee4f16d06f7e327ffdecefefd9b806c76e2960e757188decfdd5'
OLD_COMMAND = 'npx vite preview --outDir .repro-output/b10-hsk23-adapter/dist --port 4179 --strictPort'
NEW_COMMAND = 'npx vite preview --outDir .repro-output/b10-hsk23-adapter/dist --host 127.0.0.1 --port 4179 --strictPort'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def request(host):
    conn = http.client.HTTPConnection(host, 4179, timeout=0.8)
    try:
        conn.request('GET', '/')
        response = conn.getresponse()
        body = response.read()
        return {'host': host, 'status': response.status,
                'contentType': response.getheader('Content-Type'),
                'bodyBytes': len(body), 'bodySHA256': hashlib.sha256(body).hexdigest()}
    except OSError as error:
        return {'host': host, 'status': None, 'errorType': type(error).__name__,
                'errno': error.errno, 'message': str(error)}
    finally:
        conn.close()


def probe(label, command, target_host, index_sha):
    before = {host: request(host) for host in ['127.0.0.1', '::1']}
    assert all(row['status'] is None for row in before.values()), '4179 already in use; do not reuse or terminate another server'
    log_path = ROOT / (label + '-preview.log')
    with log_path.open('w') as log:
        process = subprocess.Popen(shlex.split(command), cwd=APP,
                                   stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            deadline = time.monotonic() + 10
            ready = request(target_host)
            while ready['status'] != 200 and time.monotonic() < deadline:
                assert process.poll() is None, 'Vite exited before readiness'
                time.sleep(0.1)
                ready = request(target_host)
            actual = {host: request(host) for host in ['127.0.0.1', '::1']}
            assert actual[target_host]['status'] == 200, actual
            assert actual[target_host]['bodySHA256'] == index_sha, actual
            if label == 'default-localhost':
                assert actual['127.0.0.1']['status'] is None
                assert actual['127.0.0.1']['errorType'] == 'ConnectionRefusedError'
            else:
                assert actual['127.0.0.1']['status'] == 200
            return {'label': label, 'command': command, 'cwd': str(APP),
                    'parentPID': os.getpid(), 'serverLauncherPID': process.pid,
                    'before': before, 'actual': actual, 'logFile': log_path.name,
                    'logSHA256': sha(log_path), 'startupDeadlineSeconds': 10,
                    'compiledIndexSHA256': index_sha, 'bodyExactlyCompiledIndex': True}
        finally:
            try:
                os.killpg(process.pid, signal.SIGTERM)
                process.wait(timeout=3)
            except (ProcessLookupError, subprocess.TimeoutExpired):
                if process.poll() is None:
                    os.killpg(process.pid, signal.SIGKILL)
                    process.wait(timeout=3)


def main():
    assert sha(OLD) == OLD_SHA and sha(CURRENT) == NEW_SHA
    old = OLD.read_text()
    new = CURRENT.read_text()
    assert OLD_COMMAND in old and NEW_COMMAND in new
    assert new == old.replace(OLD_COMMAND, NEW_COMMAND)
    index = APP / '.repro-output/b10-hsk23-adapter/dist/index.html'
    assert index.is_file()
    index_sha = sha(index)
    evidence = {
        'schemaVersion': 1, 'reviewer': 'release_assembly', 'patchAuthor': 'root',
        'scope': 'compiled preview HTTP startup/binding only; no native browser cases',
        'oldConfigSHA256': OLD_SHA, 'currentConfigSHA256': NEW_SHA,
        'actualFailedRun': {'id': 37235796333, 'head': 'e0f811e47ca148ad257f19cb2867f56c71a427e4'},
        'localHEAD': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=APP, text=True).strip(),
        'lockedViteVersion': json.loads((APP / 'node_modules/vite/package.json').read_text())['version'],
        'npmLockSHA256': sha(APP / 'package-lock.json'), 'compiledIndexSHA256': index_sha,
        'sameProcessHTTP': True,
        'probes': [probe('default-localhost', OLD_COMMAND, '::1', index_sha),
                   probe('explicit-ipv4', NEW_COMMAND, '127.0.0.1', index_sha)],
        'nativeCasesExecuted': 0, 'runtimeFilesModified': False,
    }
    assert sha(CURRENT) == NEW_SHA and sha(index) == index_sha
    evidence['afterServersStopped'] = {host: request(host) for host in ['127.0.0.1', '::1']}
    assert all(row['status'] is None for row in evidence['afterServersStopped'].values())
    (ROOT / 'same-process-http-probe.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'defaultIPv4Refused': True, 'defaultIPv6HTTP': 200,
                      'explicitIPv4HTTP': 200, 'bodyExactlyCompiledIndex': True,
                      'currentConfigSHA256': NEW_SHA, 'nativeCasesExecuted': 0}))


if __name__ == '__main__':
    main()
