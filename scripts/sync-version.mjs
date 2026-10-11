// Copies package.json's version to the files that repeat it: src/version.ts (sent in the
// User-Agent header) and jsr.json (JSR reads its own manifest, never package.json).
import { readFileSync, writeFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

writeFileSync(
  'src/version.ts',
  `/** SDK version, sent in the User-Agent header. Kept in sync with package.json. */\nexport const VERSION = '${version}';\n`,
);

const jsr = JSON.parse(readFileSync('jsr.json', 'utf8'));
writeFileSync('jsr.json', `${JSON.stringify({ ...jsr, version }, null, 2)}\n`);
