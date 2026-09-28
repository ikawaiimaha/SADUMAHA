import test from 'node:test';
import assert from 'node:assert/strict';
import { readDraft, isText } from '../src/hooks/useLocalDraft';

test('draft recovery rejects malformed, incompatible and wrong-shaped records', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    for (const raw of ['broken', '{"version":2,"value":"old"}', '{"version":1,"value":true}', 'null']) {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => raw } });
      assert.equal(readDraft('draft', 'fallback', isText), 'fallback');
    }
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => '{"version":1,"value":"مسودة"}' } });
    assert.equal(readDraft('draft', '', isText), 'مسودة');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('storage blocked'); } });
    assert.equal(readDraft('draft', 'fallback', isText), 'fallback');
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
