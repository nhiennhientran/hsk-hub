import {registerHooks} from 'node:module';

// The existing unit suite explicitly exercises the frozen baseline and its
// synthetic revisions. The real active registry is checked without this loader
// by verify-official-vi-adoption.mjs and by the built application browser suite.
registerHooks({load(url, context, nextLoad) {
  if (url.endsWith('/hsk1-app/content/official-vi-registry.json')) {
    return {format: 'json', source: '{"schemaVersion":1,"active":null}', shortCircuit: true};
  }
  return nextLoad(url, context);
}});
