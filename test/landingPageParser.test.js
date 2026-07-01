import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCardsForSection, countCards } from '../src/landingPageParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.resolve(__dirname, '../index.html');

const html = await readFile(htmlPath, 'utf8');

const activeCards = extractCardsForSection(html, 'Active Activation Boundary');
const archivedCards = extractCardsForSection(html, 'Archived / Retained');

test('active section card count matches current activation boundary', () => {
  assert.equal(activeCards.length, 23);
});

test('archived section card count matches active retention policy', () => {
  assert.equal(archivedCards.length, 3);
});

test('active cards include explicit audit state for ship-now and pages-live pathways', () => {
  assert.ok(activeCards.some((card) => card.name === 'organvm-i-theoria.github.io' && card.auditState === 'ship-now'));
  assert.ok(activeCards.some((card) => card.name === 'radix-recursiva-solve-coagula-redi' && card.auditState === 'repo-indexed'));
  assert.ok(activeCards.some((card) => card.name === 'cognitive-archaelogy-tribunal' && card.auditState === 'pages-live'));
});

test('all parsed repo cards include required fields', () => {
  [...activeCards, ...archivedCards].forEach((card) => {
    assert.ok(card.url.startsWith('https://'));
    assert.ok(card.name.length > 0);
    assert.ok(card.description.length > 0);
  });
});

test('state-level counts stay consistent', () => {
  assert.equal(countCards(activeCards, 'ship-now'), 2);
  assert.equal(countCards(activeCards, 'repo-indexed'), 6);
  assert.ok(countCards(archivedCards) > 0);
});
