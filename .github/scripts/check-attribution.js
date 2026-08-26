#!/usr/bin/env node
/**
 * Every published page carries the attribution line, and the repository
 * carries its licence.
 *
 * Under CC BY-SA 4.0 the attribution travels with the work, so a page that
 * gets copied out of here on its own should still say where it came from.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ATTRIBUTION = 'Built by 72 Knots. Method by';
// CLA.md and CONTRIBUTING.md are shared verbatim across all three repositories
// and carry the line already; they are checked, not exempt.
const EXEMPT = new Set([]);

const failures = [];

if (!existsSync('LICENSE')) failures.push('LICENSE is missing');

function markdownFiles(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) markdownFiles(full, found);
    else if (entry.name.endsWith('.md')) found.push(full);
  }
  return found;
}

const files = markdownFiles('.');
for (const file of files) {
  if (EXEMPT.has(path.basename(file))) continue;
  if (!readFileSync(file, 'utf8').includes(ATTRIBUTION)) {
    failures.push(`${file} is missing the attribution line`);
  }
}

if (failures.length > 0) {
  console.error('\nAttribution check failed:\n');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log(`${files.length} markdown file(s) carry the attribution line; LICENSE present.`);
