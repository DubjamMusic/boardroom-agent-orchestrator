#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const card = JSON.parse(readFileSync(join(root, 'figures/quorum-keeper/seat-map.json'), 'utf8'));

if (card.figureId !== 'quorum-keeper') throw new Error('bad figureId');
const banned = card.bannedTokens || [];
const blob = JSON.stringify(card);
if (banned.some((t) => card.figureId.includes(t))) throw new Error('banned in id');
const ops = card.seats.filter((s) => s.class === 'ops');
if (ops.length < 5) throw new Error('need 5+ ops seats');

let ok = 0;
for (const s of card.seats) {
  if (!existsSync(join(root, s.path))) throw new Error('missing ' + s.path);
  ok += 1;
}
if (!card.frozen.includes('affirmAgent.ts')) throw new Error('affirm not frozen');
console.log(`ok quorum-keeper ${ok}/${card.seats.length}`);
