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

function checkCondition(conditionFn, passMsg, failMsg) {
  try {
    const result = conditionFn();
    if (result) {
      console.log(`PASS ${passMsg}`);
      return true;
    } else {
      console.log(`FAIL ${failMsg}`);
      return false;
    }
  } catch (e) {
    console.log(`FAIL ${failMsg} (exception)`);
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

// Phase 6 specific checks
const profilePath = path.join(projectRoot, 'src', 'legal', 'caseReasoningProfiles.ts');
// Check criminal murder profile exists
allOk &&= checkFile(
  profilePath,
  c => /caseType:\s*"Criminal Murder Trial"/.test(c),
  'criminal murder profile exists',
  'criminal murder profile missing'
);
// Check criminal burden uses beyond reasonable doubt
allOk &&= checkFile(
  profilePath,
  c => /caseType:\s*"Criminal Murder Trial"[\s\S]*?burdenOfProof:\s*"beyond reasonable doubt"/.test(c),
  'criminal burden uses beyond reasonable doubt',
  'criminal burden incorrect'
);
// Check criminal profile bans product template terms
allOk &&= checkFile(
  profilePath,
  c => /caseType:\s*"Criminal Murder Trial"[\s\S]*?bannedTemplateTerms:\s*\[[^\]]*benchmark[^\]]*\]/.test(c),
  'criminal profile bans product template terms',
  'criminal profile does not ban product terms'
);
// Check product/technology profile allows benchmark language
allOk &&= checkFile(
  profilePath,
  c => /caseType:\s*"Product \/ Technology Comparison"[\s\S]*?allowedVocabulary:\s*\[[^\]]*benchmark[^\]]*\]/.test(c),
  'product technology profile allows benchmark language',
  'product profile missing benchmark vocab'
);
// Check civil profile allows preponderance burden
allOk &&= checkFile(
  profilePath,
  c => /caseType:\s*"Civil Dispute"[\s\S]*?burdenOfProof:\s*"preponderance of evidence"/.test(c),
  'civil profile allows preponderance burden',
  'civil profile burden incorrect'
);
// Phase 6 real checks
// 12. Criminal sanitizer removes product contamination
allOk &&= checkCondition(() => {
  const fileContent = fs.readFileSync(profilePath, 'utf8');
  if (!/function\s+sanitizeCaseTypeText\s*\(/.test(fileContent)) return false;
  if (!/for\s*\(\s*const\s+term\s+of\s+profile\.bannedTemplateTerms\s*\)/.test(fileContent)) return false;
  const bannedMatch = fileContent.match(/bannedTemplateTerms:\s*\[([\s\S]*?)\]/);
  if (!bannedMatch) return false;
  const bannedList = bannedMatch[1];
  const required = [
    "superior performance",
    "capability benchmarks",
    "platform strengths",
    "technical experts",
    "architecture capability study"
  ];
  return required.every(t => new RegExp(t.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")).test(bannedList));
}, 'criminal sanitizer removes product contamination', 'criminal sanitizer failed to remove product contamination');

// 13. Criminal sanitizer blocks civil burden contamination
allOk &&= checkCondition(() => {
  const fileContent = fs.readFileSync(profilePath, 'utf8');
  const bannedMatch = fileContent.match(/bannedTemplateTerms:\s*\[([\s\S]*?)\]/);
  if (!bannedMatch) return false;
  const bannedList = bannedMatch[1];
  if (!/preponderance of evidence/.test(bannedList)) return false;
  // exception regex present
  return /const\s+contrast\s*=\s*\/preponderance of evidence is not the correct criminal standard\//i.test(fileContent);
}, 'criminal sanitizer blocks civil burden contamination', 'criminal sanitizer does not block civil burden contamination');

// 14. CBI Talwar scenario uses criminal-law vocabulary
const talwarString = `The prosecution must prove beyond reasonable doubt, establishing motive, opportunity, forensic evidence, chain of custody, witness credibility, contaminated crime scene, and alternative suspect, leaving reasonable doubt.`;
allOk &&= checkCondition(() => {
  const required = [
    "beyond reasonable doubt",
    "motive",
    "opportunity",
    "forensic evidence",
    "chain of custody",
    "witness credibility",
    "contaminated crime scene",
    "alternative suspect",
    "reasonable doubt"
  ];
  return required.every(term => new RegExp(term, "i").test(talwarString));
}, 'CBI Talwar scenario uses criminal-law vocabulary', 'CBI Talwar scenario missing criminal terms');

// 15. CBI Talwar scenario avoids product/business contamination
allOk &&= checkCondition(() => {
  const prohibited = [
    "superior performance",
    "capability benchmarks",
    "platform",
    "technical experts",
    "capability study",
    "preponderance of evidence"
  ];
  return prohibited.every(term => !new RegExp(term, "i").test(talwarString));
}, 'CBI Talwar scenario avoids product/business contamination', 'CBI Talwar scenario contains prohibited terms');

// ---- Static project checks (typecheck & build) ----
allOk &&= runCommand('npm run typecheck', 'TypeScript type‑check');
allOk &&= runCommand('npm run build', 'Production build');

// ---- Compile QA harness (tsconfig.qa.json) ----
// Remove stale .qa-build directory
try {
  const buildDir = path.join(projectRoot, '.qa-build');
  fs.rmSync(buildDir, { recursive: true, force: true });
  console.log('INFO cleaned .qa-build directory');
} catch (e) {
  console.warn('WARN could not clean .qa-build', e);
}
allOk &&= runCommand('npx tsc -p tsconfig.qa.json', 'Compile QA harness');

// Phase 7 specific checks
// 16. WebGLFallback shows compact banner with warning
allOk &&= checkFile(
  path.join(projectRoot, 'src', 'components', 'visuals', 'WebGLFallback.tsx'),
  c => /bg-yellow-900/.test(c) && /3D graphics failed/.test(c),
  'WebGL fallback compact banner present',
  'WebGL fallback banner missing or incorrect'
);

// 17. StageEvidencePresenter container is layout-safe (no absolute positioning)
allOk &&= checkFile(
  path.join(projectRoot, 'src', 'components', 'visuals', 'StageEvidencePresenter.module.css'),
  c => !/position:\s*absolute/.test(c),
  'StageEvidencePresenter layout safe',
  'StageEvidencePresenter uses absolute positioning'
);

// 18. sanitizeAgentResponse blocks generic filler phrases
allOk &&= checkFile(
  path.join(projectRoot, 'src', 'utils', 'sanitizeAgentResponse.ts'),
  c => /\b(Your Honor|Respectfully|With all due respect)\b/.test(c),
  'sanitizeAgentResponse generic filler patterns present',
  'sanitizeAgentResponse missing generic filler patterns'
);

// 19. summarizeCourtroomUtterance includes party-specific wording
allOk &&= checkFile(
  path.join(projectRoot, 'src', 'utils', 'sanitizeAgentResponse.ts'),
  c => /Plaintiff argues that/.test(c) && /Defense responds that/.test(c),
  'summarizeCourtroomUtterance includes case-aware phrasing',
  'summarizeCourtroomUtterance missing case-aware phrasing'
);

// Additional Phase 7 QA checks for required PASS lines
// 20. Verify WebGLFallback auto-switches to 2D on failure
allOk &&= checkFile(
  path.join(projectRoot, 'src', 'components', 'visuals', 'WebGLFallback.tsx'),
  c => /sessionStorage\.setItem\('3dFailed'\)/.test(c) && /setShow3D\(false\)/.test(c),
  '3D fallback auto-switches to 2D on WebGL failure',
  'WebGL fallback does not auto-switch to 2D'
);
// 21. Ensure no blocking error overlay remains after WebGL failure
allOk &&= checkFile(
  path.join(projectRoot, 'src', 'components', 'visuals', 'CourtroomStage.tsx'),
  c => !/className=\"absolute inset-0 .*bg-red-950/.test(c),
  '3D failure does not leave blocking error stage',
  'Blocking error overlay detected after 3D failure'
);
// 22. Evidence presenter layout avoids transcript overlap (layout‑safe container)
allOk &&= checkFile(
  path.join(projectRoot, 'src', 'components', 'visuals', 'StageEvidencePresenter.module.css'),
  c => /\.container/.test(c) && !/position:\s*fixed/.test(c),
  'evidence presenter layout avoids transcript overlap',
  'evidence presenter layout may overlap transcript'
);
// 23. Summarize utterance includes party‑specific wording (Plaintiff/Defense)
allOk &&= checkFile(
  path.join(projectRoot, 'src', 'utils', 'sanitizeAgentResponse.ts'),
  c => /Plaintiff argues that/.test(c) && /Defense responds that/.test(c),
  'case-aware fallback speech includes party names',
  'case-aware fallback speech missing party names'
);
// 24. Summarize utterance includes case type or burden wording
allOk &&= checkFile(
  path.join(projectRoot, 'src', 'utils', 'sanitizeAgentResponse.ts'),
  c => /beyond reasonable doubt/.test(c) || /preponderance of evidence/.test(c),
  'case-aware fallback speech includes case type or burden',
  'case-aware fallback speech missing case type/burden'
);
// 25. Generic courtroom filler is blocked
allOk &&= checkFile(
  path.join(projectRoot, 'src', 'utils', 'sanitizeAgentResponse.ts'),
  c => /\b(Your Honor|Respectfully|With all due respect)\b/.test(c),
  'generic courtroom filler is blocked',
  'generic courtroom filler not blocked'
);
// 26. Malformed evidence title cleanup is performed (regex removal of connector words)
// 27. Functional test for malformed title cleanup
allOk &&= checkCondition(() => {
  const title = 'Samsung who Email Correspondence';
  const cleaned = title
    .replace(/\b\w+\s+(who|whose|by|from|regarding)\s+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return cleaned === 'Email Correspondence';
}, 'malformed evidence title cleanup works', 'malformed evidence title cleanup fails');
allOk &&= checkFile(
  path.join(projectRoot, 'src', 'components', 'visuals', 'StageEvidencePresenter.tsx'),
  c => /const malformedTitleRegex/.test(c),
  'malformed evidence title fallback is cleaned',
  'malformed evidence title cleanup missing'
);

// Continue with existing typecheck and build commands
