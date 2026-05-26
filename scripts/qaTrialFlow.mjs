// qaTrialFlow.mjs - Simple QA script for Phase 4
// Checks TypeScript type-check and production build.

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function runCommand(command, description) {
  console.log(`\n▶️  ${description}`);
  try {
    const out = execSync(command, { cwd: projectRoot, stdio: 'pipe', encoding: 'utf8' });
    console.log(out.trim());
    return true;
  } catch (e) {
    console.error(`❌  ${description} failed`);
    console.error(e.stdout?.toString() ?? e.message);
    return false;
  }
}

const typecheckOk = runCommand('npm run typecheck', 'TypeScript type‑check');
const buildOk = runCommand('npm run build', 'Production build');

const allOk = typecheckOk && buildOk;
console.log('\n🧪  QA RESULT:', allOk ? 'ALL CHECKS PASS' : 'ONE OR MORE CHECKS FAILED');
process.exit(allOk ? 0 : 1);
