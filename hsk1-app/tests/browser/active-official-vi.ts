import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createOfficialViRegistry, hsk1ViFields, hsk1SourceViFiles, type OfficialViRegistry} from '../../src/services/content/official-vi-revisions.ts';
import {createTextbookContent, type TextbookContent} from '../../src/services/content/textbook.ts';

const read = (file: string) => readFileSync(new URL('../../' + file, import.meta.url), 'utf8');
const json = (file: string) => JSON.parse(read(file));
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
let pending: Promise<{registry: OfficialViRegistry; content: TextbookContent}> | undefined;
export function loadActiveHsk1ForTests() {
  return pending ??= (async () => {
    const names = ['textbook', 'textbook-display-revisions', 'stage2-bank', 'stage3-catalog', 'homework30-bank', 'course-index'].map(name => `content/${name}.json`).concat(hsk1SourceViFiles);
    const values = Object.fromEntries(names.map(file => [file, json(file)]));
    const entry = json('content/official-vi-registry.json').active;
    let registry: OfficialViRegistry = {revisionId: null, project: raw => raw, snapshot: () => null, displayVersion: (_id, _component, original) => original};
    if (entry) {
      const manifestBytes = read(entry.manifestFile), reviewBytes = read(entry.reviewFile), manifest = JSON.parse(manifestBytes);
      const baselineFiles = manifest.baselineFiles.map((b: {file: string}) => ({file: b.file, sha256: sha(read(b.file))}));
      registry = await createOfficialViRegistry({manifestBytes, reviewBytes, manifestSHA256: entry.manifestSHA256, reviewSHA256: entry.reviewSHA256, reviewFile: entry.reviewFile, baselineFiles, parentDisplayRevision: values['content/textbook-display-revisions.json'].revision, fields: hsk1ViFields(values).filter(f => baselineFiles.some((b: {file: string}) => b.file === f.baselineFile))});
    }
    return {registry, content: createTextbookContent(values['content/textbook.json'], json('content/media-references.json'), values['content/stage3-catalog.json'], undefined, values['content/textbook-display-revisions.json'], registry)};
  })();
}
