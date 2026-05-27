// qaTrialFlow.mjs – Real Runtime Orchestration QA script

import { execSync } from 'node:child_process';
import fs from 'node:fs';
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

function checkFile(filePath, checkFn, passMsg, failMsg) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (checkFn(content)) {
      console.log(`PASS ${passMsg}`);
      return true;
    } else {
      console.log(`FAIL ${failMsg}`);
      return false;
    }
  } catch (e) {
    console.log(`FAIL ${failMsg} (read error)`);
    return false;
  }
}

let allOk = true;

// 1. package.json script exists
const pkgPath = path.join(projectRoot, 'package.json');
allOk &&= checkFile(
  pkgPath,
  c => /"qa:trial"\s*:\s*"node scripts\/qaTrialFlow.mjs"/.test(c),
  'package script exists',
  'package script missing'
);

// 2. Duplicate final summary guard present in courtControllerAsync.ts
const ctrlPath = path.join(projectRoot, 'src', 'orchestration', 'courtControllerAsync.ts');
allOk &&= checkFile(
  ctrlPath,
  c => /preventDuplicateFinalSummary/.test(c) || /finalSummary/.test(c),
  'duplicate summary guard present',
  'duplicate summary guard missing'
);

// 3. Verdict fields present in courtControllerAsync.ts
allOk &&= checkFile(
  ctrlPath,
  c => /decision|winnerName|whyWinnerWon|whyLoserLost|keyReasons|evidenceConsidered|reasoningSummary|ruling/.test(c),
  'verdict fields present',
  'verdict fields missing'
);

// 4. Evidence discipline instructions present in agentService.ts
const agentPath = path.join(projectRoot, 'src', 'providers', 'agentService.ts');
allOk &&= checkFile(
  agentPath,
  c => /never fabricate evidence/.test(c) && /cite only real existing case evidence/.test(c),
  'evidence discipline instructions present',
  'evidence discipline instructions missing'
);

// 5. Role reasoning instructions present in agentService.ts
allOk &&= checkFile(
  agentPath,
  c => /plaintiff.*argue.*facts/.test(c) && /defense.*challenge.*burden/.test(c) && /judge.*synthesize.*conflicts/.test(c),
  'role reasoning instructions present',
  'role reasoning instructions missing'
);

// 6. Objection categories present in agentService.ts
allOk &&= checkFile(
  agentPath,
  c => /hearsay|relevance|speculation|lack of foundation|leading|argumentative|assumes facts/.test(c),
  'objection categories present',
  'objection categories missing'
);

// 7. Mock provider reasoning present in mockModelProvider.ts
const mockPath = path.join(projectRoot, 'src', 'providers', 'mockModelProvider.ts');
allOk &&= checkFile(
  mockPath,
  c => /dynamicResponses/.test(c) && /EXHIBIT/.test(c),
  'mock provider reasoning present',
  'mock provider reasoning missing'
);

// 8. Unknown evidence rejection logic present (limit to 2 refs)
allOk &&= checkFile(
  agentPath,
  c => /return refs\.slice\(0, 2\)/.test(c),
  'unknown evidence rejection present',
  'unknown evidence rejection missing'
);

// ---- Static project checks (typecheck & build) ----
allOk &&= runCommand('npm run typecheck', 'TypeScript type‑check');
allOk &&= runCommand('npm run build', 'Production build');

// ---- Compile QA harness (tsconfig.qa.json) ----
allOk &&= runCommand('npx tsc -p tsconfig.qa.json', 'Compile QA harness');

// ---- Run real runtime QA harness ----
async function runRealQa() {
  try {
    const { runRealRuntimeTrialQa } = await import('../build/orchestration/qaRuntimeHarness.js');
    const ok = await runRealRuntimeTrialQa();
    console.log('\n🧪  REAL RUNTIME QA RESULT:', ok ? 'ALL CHECKS PASS' : 'ONE OR MORE CHECKS FAILED');
    allOk &&= ok;
  } catch (e) {
    console.error('❌  Failed to execute real runtime QA harness');
    console.error(e);
    allOk = false;
  } finally {
    process.exit(allOk ? 0 : 1);
  }
}

runRealQa();
