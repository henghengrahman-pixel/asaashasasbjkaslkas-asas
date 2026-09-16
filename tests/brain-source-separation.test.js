import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ai = fs.readFileSync(new URL('../src/ai.js', import.meta.url), 'utf8');
const engine = fs.readFileSync(new URL('../src/engine.js', import.meta.url), 'utf8');

test('AI prompt keeps Rules, Knowledge, and Responses as separate sources', () => {
  assert.match(ai, /AI RULES — BOT HARUS MELAKUKAN APA:/);
  assert.match(ai, /KNOWLEDGE — BOT HARUS TAHU APA:/);
  assert.match(ai, /RESPONSES — BOT HARUS MENGATAKAN APA:/);
  assert.doesNotMatch(ai, /KNOWLEDGE \/ RESPONSES:/);
});

test('runtime does not inject manual responses into knowledge', () => {
  assert.match(engine, /const knowledge=\[websiteKnowledge,promoKnowledge,importantKnowledge,manualKnowledge\]/);
  assert.match(engine, /const responseSource=\[responses,learning\]/);
  assert.match(engine, /knowledge:src\.knowledge,responses:src\.responses/);
});
