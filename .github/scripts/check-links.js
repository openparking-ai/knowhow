#!/usr/bin/env node
/**
 * Every relative link in every markdown file must resolve to a file that exists.
 *
 * A docs repository whose internal links rot is worse than one with fewer docs:
 * it teaches readers that the cross-references are not worth following.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function markdownFiles(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) markdownFiles(full, found);
    else if (entry.name.endsWith('.md')) found.push(full);
  }
  return found;
}

const broken = [];
let checked = 0;

for (const file of markdownFiles('.')) {
  const body = readFileSync(file, 'utf8');
  for (const [, target] of body.matchAll(LINK)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    checked += 1;
    const resolved = path.resolve(path.dirname(file), target.split('#')[0]);
    if (!existsSync(resolved) || !statSync(resolved).isFile()) {
      broken.push(`${file} -> ${target}`);
    }
  }
}

if (broken.length > 0) {
  console.error(`\n${broken.length} broken relative link(s):\n`);
  for (const b of broken) console.error(`  ${b}`);
  process.exit(1);
}

console.log(`${checked} relative link(s) checked, all resolve.`);
