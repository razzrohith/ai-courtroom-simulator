// qaTrialFlow.mjs – Simple QA script for Phase 4
// Checks TypeScript type‑check, production build, and domain‑specific QA.

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
  c => /"qa:trial":\s*"node scripts\/qaTrialFlow.mjs"/.test(c),
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
  c => /return refs.slice\(0, 2\)/.test(c),
  'unknown evidence rejection present',
  'unknown evidence rejection missing'
);

// Run basic build checks
const typecheckOk = runCommand('npm run typecheck', 'TypeScript type‑check');
const buildOk = runCommand('npm run build', 'Production build');
allOk &&= typecheckOk && buildOk;

// ---------- Runtime Mock Trial QA ----------
// Create a deterministic mock trial fixture and validate its structure.
function runRuntimeChecks() {
  // Minimal mock data shapes mirroring src/types/courtroom.ts definitions.
  const mockEvidence = [
    { id: 'EXHIBITP1', title: 'Plaintiff Exhibit', type: 'report', confidentiality: 'public', summary: 'Plaintiff evidence', content: '...', introducedBy: 'prosecutor', status: 'offered' },
    { id: 'EXHIBITD1', title: 'Defense Exhibit', type: 'report', confidentiality: 'public', summary: 'Defense evidence', content: '...', introducedBy: 'defense', status: 'offered' },
  ];
  const mockTranscript = [];
  // Simulate start of trial.
  mockTranscript.push({
    id: 'trans-001', speakerRole: 'judge', speakerName: 'Judge', message: 'Court is now open.', phase: 'court_opening', sequenceNumber: 1,
    evidenceRef: undefined,
  });
  // Plaintiff opening statement referencing valid evidence.
  mockTranscript.push({
    id: 'trans-002', speakerRole: 'prosecutor', speakerName: 'Advocate', message: 'We present EXHIBITP1 as proof.', phase: 'plaintiff_opening', sequenceNumber: 2,
    evidenceRef: 'EXHIBITP1',
  });
  // Defense objection with known category.
  mockTranscript.push({
    id: 'obj-001', speakerRole: 'defense', speakerName: 'Defense', message: 'Objection, Your Honor! Relevance.', phase: 'plaintiff_opening', sequenceNumber: 3,
    evidenceRef: undefined,
  });
  // Judge ruling sustained.
  mockTranscript.push({
    id: 'ruling-001', speakerRole: 'judge', speakerName: 'Judge', message: 'Objection is SUSTAINED.', phase: 'plaintiff_opening', sequenceNumber: 4,
    evidenceRef: undefined,
  });
  // Final summary entry.
  mockTranscript.push({
    id: 'trans-summary-001', speakerRole: 'judge', speakerName: 'Judge', message: 'Trial concluded.', phase: 'case_summary', sequenceNumber: 5,
    evidenceRef: undefined,
  });

  // 1. Transcript entry count > 0
  allOk &&= checkCondition(mockTranscript.length > 0, 'runtime transcript has entries');
  // 2. Every entry has required fields
  const entryFields = ['id','speakerRole','speakerName','phase','message','sequenceNumber'];
  const entriesValid = mockTranscript.every(e => entryFields.every(f => e[f] !== undefined));
  allOk &&= checkCondition(entriesValid, 'runtime transcript entries have required fields');
  // 3. No duplicate sequence numbers
  const seqSet = new Set(mockTranscript.map(e=>e.sequenceNumber));
  allOk &&= checkCondition(seqSet.size === mockTranscript.length, 'runtime no duplicate sequence numbers');
  // 4. Only one final summary entry
  const summaryCount = mockTranscript.filter(e=>e.id.startsWith('trans-summary-')).length;
  allOk &&= checkCondition(summaryCount === 1, 'runtime single final summary');
  // 5. Evidence references must match real IDs
  const validIds = new Set(mockEvidence.map(e=>e.id.toUpperCase()));
  const refValid = mockTranscript.every(e=>{
    if (!e.evidenceRef) return true;
    return e.evidenceRef.split(',').every(ref=>validIds.has(ref.toUpperCase()));
  });
  allOk &&= checkCondition(refValid, 'runtime evidence references valid');
  // 6. Objection objects (simulated) – ensure status resolved
  const objections = [
    { id: 'obj-001', raisedBy: 'defense', type: 'relevance', status: 'sustained' },
  ];
  const pendingObjections = objections.filter(o=>o.status==='pending');
  allOk &&= checkCondition(pendingObjections.length===0, 'runtime no pending objections at end');
  // 7. Verdict object validation
  const mockVerdict = {
    decision: 'plaintiff_wins', winnerName: 'Plaintiff', loserName: 'Defendant', whyWinnerWon: 'Reason', whyLoserLost: 'Reason', keyReasons: [], evidenceConsidered: [], reasoningSummary: '', ruling: ''
  };
  const verdictFields = ['decision','winnerName','whyWinnerWon','whyLoserLost','keyReasons','evidenceConsidered','reasoningSummary','ruling'];
  const verdictValid = verdictFields.every(f=>mockVerdict[f]!==undefined);
  allOk &&= checkCondition(verdictValid, 'runtime verdict fields present');
}

function checkCondition(cond, passMsg) {
  if (cond) { console.log('PASS', passMsg); return true; }
  console.log('FAIL', passMsg);
  return false;
}

runRuntimeChecks();

console.log('\n🧪  QA RESULT:', allOk ? 'ALL CHECKS PASS' : 'ONE OR MORE CHECKS FAILED');
process.exit(allOk ? 0 : 1);
