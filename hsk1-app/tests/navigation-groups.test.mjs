import test from 'node:test';
import assert from 'node:assert/strict';
import { NAVIGATION_GROUPS, navigationGroup } from '../src/app/navigation.ts';
import { FEATURES } from '../src/app/contracts.ts';

test('four presentation groups retain every existing route exactly once', () => {
  assert.equal(NAVIGATION_GROUPS.length, 4);
  assert.deepEqual(NAVIGATION_GROUPS.flatMap(group => group.members).sort(), [...FEATURES].sort());
  for (const feature of FEATURES) assert.ok(navigationGroup(feature).members.includes(feature));
  for (const group of NAVIGATION_GROUPS) { assert.ok(group.label.zh); assert.ok(group.label.vi); }
  assert.equal(navigationGroup('exercises').id, 'homework');
  assert.equal(navigationGroup('textbook').id, 'courses');
  assert.equal(navigationGroup('listening').id, 'courses');
});
