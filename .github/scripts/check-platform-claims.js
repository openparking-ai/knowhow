#!/usr/bin/env node
/**
 * The pages that describe the platform say what the platform's code does.
 *
 * A page that states a property the code does not have is worse than one that
 * says nothing: the reader relies on it. So this reads a platform checkout and
 * checks two things against it:
 *
 *   - every repository path a page names in backticks (scripts/, src/, test/,
 *     migrations/, docs/) exists in the platform;
 *   - every tenant-owned table the platform leaves ENABLE without FORCE is
 *     named on each page that talks about FORCE. The list is read twice, from
 *     the migrations and from NOT_FORCED_BY_DESIGN in the platform's
 *     test/tenant-tables.js, and the two must agree before either is used.
 *
 * The platform is another repository, so CI here cannot run this. Run it by
 * hand against a checkout of the platform:
 *
 *   node .github/scripts/check-platform-claims.js <platform checkout>
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const PAGES = ['docs/architecture.md', 'docs/multi-tenancy-and-rls.md'];

const platform = process.argv[2];
if (!platform || !existsSync(path.join(platform, 'migrations'))) {
  console.error('usage: check-platform-claims.js <platform checkout>');
  process.exit(2);
}

const failures = [];

/** Tables that are ENABLE but not FORCE once every migration has run. */
function notForcedByMigrations() {
  const enabled = new Set();
  const forced = new Set();
  const dir = path.join(platform, 'migrations');
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.sql')).sort()) {
    // Comments quote these statements while explaining them; only SQL counts.
    const sql = readFileSync(path.join(dir, name), 'utf8').replace(/--.*$/gm, '');
    const statements = /ALTER\s+TABLE\s+(\w+)\s+(ENABLE|DISABLE|FORCE|NO\s+FORCE)\s+ROW\s+LEVEL\s+SECURITY/gi;
    for (const [, table, verb] of sql.matchAll(statements)) {
      const v = verb.toUpperCase().replace(/\s+/g, ' ');
      if (v === 'ENABLE') enabled.add(table);
      else if (v === 'DISABLE') enabled.delete(table);
      else if (v === 'FORCE') forced.add(table);
      else forced.delete(table);
    }
  }
  return [...enabled].filter((t) => !forced.has(t)).sort();
}

/** The platform's own list, which its coverage test holds exact against the schema. */
function notForcedByDesign() {
  const source = readFileSync(path.join(platform, 'test', 'tenant-tables.js'), 'utf8');
  const match = source.match(/export const NOT_FORCED_BY_DESIGN = \[([^\]]*)\]/);
  if (!match) return null;
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
}

const fromMigrations = notForcedByMigrations();
const fromDesign = notForcedByDesign();

// The control: if the two readings disagree, or either finds nothing, the
// check below would be measuring the parser rather than the pages.
if (!fromDesign) {
  failures.push('could not read NOT_FORCED_BY_DESIGN from test/tenant-tables.js');
} else if (fromMigrations.length === 0 || fromMigrations.join() !== fromDesign.join()) {
  failures.push(
    `the platform disagrees with itself: migrations leave [${fromMigrations.join(', ')}] unforced, ` +
      `NOT_FORCED_BY_DESIGN says [${fromDesign.join(', ')}]`,
  );
}

const PATH = /`((?:scripts|src|test|migrations|docs)\/[A-Za-z0-9_./-]+)`/g;

for (const page of PAGES) {
  const body = readFileSync(page, 'utf8');

  for (const [, named] of body.matchAll(PATH)) {
    const resolved = path.join(platform, named);
    if (!existsSync(resolved) || !statSync(resolved).isFile()) {
      failures.push(`${page} names ${named}, which the platform does not have`);
    }
  }

  if (/\bFORCE\b|\bforced\b/i.test(body)) {
    for (const table of fromMigrations) {
      if (!new RegExp(`\\b${table}\\b`).test(body)) {
        failures.push(`${page} talks about FORCE but does not name ${table}, which the platform does not force`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error('\nPlatform claims check failed:\n');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log(
  `${PAGES.length} page(s) match the platform: every named path exists, and the ` +
    `${fromMigrations.length} unforced table(s) (${fromMigrations.join(', ')}) are named.`,
);
