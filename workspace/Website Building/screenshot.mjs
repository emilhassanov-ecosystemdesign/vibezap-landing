#!/usr/bin/env node
/**
 * Auto-incrementing screenshot wrapper.
 * Saves to ./temporary screenshots/screenshot-N.png (never overwrites).
 *
 * Usage:
 *   node screenshot.mjs <url> [label] [--device=mobile|tablet|desktop] [--full]
 *
 * Examples:
 *   node screenshot.mjs http://localhost:3000                    → desktop screenshot
 *   node screenshot.mjs http://localhost:3000 homepage           → desktop, labeled
 *   node screenshot.mjs http://localhost:3000 --device=mobile    → mobile screenshot
 *   node screenshot.mjs http://localhost:3000 nav --device=tablet --full
 */

import { readdirSync, existsSync, mkdirSync } from 'fs';
import { execFileSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotsDir = join(__dirname, 'temporary screenshots');
const screenshotSh = '/config/workspace/screenshot.sh';

if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

const rawArgs = process.argv.slice(2);
const flags = rawArgs.filter(a => a.startsWith('--'));
const positional = rawArgs.filter(a => !a.startsWith('--'));

const url = positional[0];
const label = positional[1];

if (!url) {
  console.log('Usage: node screenshot.mjs <url> [label] [--device=mobile|tablet|desktop] [--full]');
  process.exit(1);
}

// Find next number
const existing = readdirSync(screenshotsDir)
  .filter(f => /^screenshot-\d+/.test(f))
  .map(f => parseInt(f.match(/^screenshot-(\d+)/)[1]))
  .sort((a, b) => a - b);
const next = (existing.length > 0 ? existing[existing.length - 1] : 0) + 1;

const filename = label
  ? `screenshot-${next}-${label}.png`
  : `screenshot-${next}.png`;
const outputPath = join(screenshotsDir, filename);

try {
  execFileSync(screenshotSh, [url, outputPath, ...flags], { stdio: 'inherit' });
  console.log(`\nSaved: temporary screenshots/${filename}`);
} catch (err) {
  process.exit(1);
}
