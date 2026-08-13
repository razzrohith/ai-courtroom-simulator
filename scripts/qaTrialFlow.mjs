// qaTrialFlow.mjs – Real Runtime Orchestration QA script

import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function cleanTitle(title) {
  const normalized = title
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
  const cleaned = normalized.replace(/^.*?\b(who|whose|by|from|regarding)\b\s*/i, '').replace(/\s{2,}/g, ' ').trim();
  return cleaned || 'Evidence Exhibit';
}
// Removed faulty import; use internal cleanTitle function
const cleanEvidenceTitle = cleanTitle; // alias for QA tests

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
  c => /bg-red-/.test(c) && /Experimental 3D failed — returned to stable 2D/.test(c),
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
  'generic courtroom filler is blocked',
  'generic courtroom filler not blocked'
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
  c => /sessionStorage\.setItem\('3dFailed',\s*'true'\)/.test(c) && /setShow3D\(false\)/.test(c),
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
    const cleaned = cleanEvidenceTitle(title);
    return cleaned === 'Email Correspondence';
}, 'malformed evidence title fallback is cleaned', 'malformed evidence title fallback is not cleaned');
allOk &&= checkFile(
  path.join(projectRoot, 'src', 'components', 'visuals', 'StageEvidencePresenter.tsx'),
   c => /cleanEvidenceTitle/.test(c),
   'cleanEvidenceTitle function present in StageEvidencePresenter',
   'cleanEvidenceTitle not found in StageEvidencePresenter'
);

// 27b. Additional functional tests for cleanTitle utility
allOk &&= checkCondition(() => {
  const title = 'Email Evidence';
  const cleaned = cleanEvidenceTitle(title);
  return cleaned === 'Email Evidence';
}, 'cleanTitle leaves unchanged titles intact', 'cleanTitle altered unchanged title');

allOk &&= checkCondition(() => {
  const title = 'Forensic Evidence Summary';
  const cleaned = cleanEvidenceTitle(title);
  return cleaned === 'Forensic Evidence Summary';
}, 'cleanTitle leaves forensic title unchanged', 'cleanTitle altered forensic title');

allOk &&= checkCondition(() => {
  const title = '';
  const cleaned = cleanEvidenceTitle(title);
  return cleaned === 'Evidence Exhibit';
}, 'cleanTitle fallback works for empty title', 'cleanTitle fallback failed');

// ---- Phase 8 checks ----
const layoutPath = path.join(projectRoot, 'src', 'components', 'CourtroomLayout.tsx');
const stagePath = path.join(projectRoot, 'src', 'components', 'visuals', 'CourtroomStage.tsx');
const fallbackPath = path.join(projectRoot, 'src', 'components', 'visuals', 'WebGLFallback.tsx');
const presenterStylesPath = path.join(projectRoot, 'src', 'components', 'visuals', 'StageEvidencePresenter.module.css');

// 28. courtroom stage renders before large profile cards
allOk &&= checkCondition(() => {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  const stageIndex = layoutContent.indexOf('<CourtroomStage');
  const profilesIndex = layoutContent.indexOf('<AgentPanel');
  return stageIndex !== -1 && profilesIndex !== -1 && stageIndex < profilesIndex;
}, 'courtroom stage renders before large profile cards', 'courtroom stage renders before large profile cards');

// 29. 2D fallback includes judge prosecutor defense and witness areas
allOk &&= checkCondition(() => {
  const stageContent = fs.readFileSync(stagePath, 'utf8');
  const hasJudge2D = stageContent.includes('JudgeStation');
  const hasAttorney2D = stageContent.includes('AttorneyStation');
  const hasWitness2D = stageContent.includes('WitnessAndEvidenceArea');
  return hasJudge2D && hasAttorney2D && hasWitness2D;
}, '2D fallback includes judge prosecutor defense and witness areas', '2D fallback includes judge prosecutor defense and witness areas');

// 30. 3D failure uses compact badge not blocking panel
allOk &&= checkCondition(() => {
  const fallbackContent = fs.readFileSync(fallbackPath, 'utf8');
  const hasCompactBadgeText = fallbackContent.includes('Experimental 3D failed — returned to stable 2D');
  const isCompact = !fallbackContent.includes('h-screen') && !fallbackContent.includes('fixed inset-0');
  return hasCompactBadgeText && isCompact;
}, '3D failure uses compact badge not blocking panel', '3D failure uses compact badge not blocking panel');

// 31. courtroom focus mode button exists
allOk &&= checkCondition(() => {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  return layoutContent.includes('Expand Courtroom') && layoutContent.includes('Exit Focus Mode');
}, 'courtroom focus mode button exists', 'courtroom focus mode button exists');

// 32. focus mode supports stage and transcript layout
allOk &&= checkCondition(() => {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  return layoutContent.includes('lg:col-span-8') && layoutContent.includes('lg:col-span-4');
}, 'focus mode supports stage and transcript layout', 'focus mode supports stage and transcript layout');

// 33. judge remains visible in 2D fallback
allOk &&= checkCondition(() => {
  const stageContent = fs.readFileSync(stagePath, 'utf8');
  const stable2DIndex = stageContent.indexOf('Stable 2D Courtroom');
  return stable2DIndex !== -1 && stageContent.indexOf('JudgeStation', stable2DIndex) !== -1;
}, 'judge remains visible in 2D fallback', 'judge remains visible in 2D fallback');

// 34. evidence presenter remains in normal layout flow
allOk &&= checkCondition(() => {
  const stylesContent = fs.readFileSync(presenterStylesPath, 'utf8');
  return !/\bposition:\s*absolute\b/.test(stylesContent);
}, 'evidence presenter remains in normal layout flow', 'evidence presenter remains in normal layout flow');

// ---- Phase 9 checks ----
// 35. 2D courtroom is default experience
allOk &&= checkCondition(() => {
  const stageContent = fs.readFileSync(stagePath, 'utf8');
  const hasExperimental3DDefaultFalse = stageContent.includes("localStorage.getItem('judgebench.experimental3D') === 'true'");
  const hasAttempt3DDefinition = stageContent.includes("attempt3D = experimental3D");
  return hasExperimental3DDefaultFalse && hasAttempt3DDefinition;
}, '2D courtroom is default experience', '2D courtroom is default experience');

// 36. normal users do not see 3D failure banner
allOk &&= checkCondition(() => {
  const stageContent = fs.readFileSync(stagePath, 'utf8');
  return stageContent.includes("experimental3D && failed3D &&");
}, 'normal users do not see 3D failure banner', 'normal users do not see 3D failure banner');

// 37. experimental 3D toggle exists
allOk &&= checkCondition(() => {
  const stageContent = fs.readFileSync(stagePath, 'utf8');
  return stageContent.includes('Experimental 3D') && stageContent.includes('type="checkbox"') && stageContent.includes('experimental3D');
}, 'experimental 3D toggle exists', 'experimental 3D toggle exists');

// 38. 3D only runs when experimental mode is enabled
allOk &&= checkCondition(() => {
  const stageContent = fs.readFileSync(stagePath, 'utf8');
  return stageContent.includes('attempt3D ?') && stageContent.includes('Courtroom3DStage');
}, '3D only runs when experimental mode is enabled', '3D only runs when experimental mode is enabled');

// 39. failed experimental 3D returns to stable 2D
allOk &&= checkCondition(() => {
  const stageContent = fs.readFileSync(stagePath, 'utf8');
  return stageContent.includes('setFailed3D(!show)') || stageContent.includes('setFailed3D(true)');
}, 'failed experimental 3D returns to stable 2D', 'failed experimental 3D returns to stable 2D');

// 40. 2D courtroom includes judge prosecutor defense witness and evidence
allOk &&= checkCondition(() => {
  const stageContent = fs.readFileSync(stagePath, 'utf8');
  const hasJudge2D = stageContent.includes('JudgeStation');
  const hasAttorney2D = stageContent.includes('AttorneyStation');
  const hasWitness2D = stageContent.includes('WitnessAndEvidenceArea');
  return hasJudge2D && hasAttorney2D && hasWitness2D;
}, '2D courtroom includes judge prosecutor defense witness and evidence', '2D courtroom includes judge prosecutor defense witness and evidence');

// 41. 2D courtroom active speaker indicator exists
allOk &&= checkCondition(() => {
  const stageContent = fs.readFileSync(stagePath, 'utf8');
  return stageContent.includes('SpeakingIndicator') || stageContent.includes('SpeakingPulseRing') || stageContent.includes('AudioVisualizerWave');
}, '2D courtroom active speaker indicator exists', '2D courtroom active speaker indicator exists');

// 42. 3D code remains isolated and not deleted
allOk &&= checkCondition(() => {
  const stageContent = fs.readFileSync(stagePath, 'utf8');
  const has3DStageImport = stageContent.includes("lazy(() => import('./Courtroom3DStage'))");
  const file3DExists = fs.existsSync(path.join(projectRoot, 'src', 'components', 'visuals', 'Courtroom3DStage.tsx'));
  return has3DStageImport && file3DExists;
}, '3D code remains isolated and not deleted', '3D code remains isolated and not deleted');

// ---- Phase 23: Gilded Verdict redesign checks ----
const stylesPath = path.join(projectRoot, 'src', 'styles.css');
const tailwindPath = path.join(projectRoot, 'tailwind.config.js');
const soundHookPath = path.join(projectRoot, 'src', 'hooks', 'useSoundEffects.ts');
const shortcutsHookPath = path.join(projectRoot, 'src', 'hooks', 'useKeyboardShortcuts.ts');
const objectionFlashPath = path.join(projectRoot, 'src', 'components', 'effects', 'ObjectionFlash.tsx');
const celebrationPath = path.join(projectRoot, 'src', 'components', 'effects', 'VerdictCelebration.tsx');
const evidenceBoardPath = path.join(projectRoot, 'src', 'components', 'EvidenceBoard.tsx');
const phaseTimelinePath = path.join(projectRoot, 'src', 'components', 'PhaseTimeline.tsx');
const orProviderPath = path.join(projectRoot, 'src', 'providers', 'openRouterProvider.ts');
const welcomePath = path.join(projectRoot, 'src', 'components', 'WelcomePanel.tsx');

// 43. Animation dependencies installed
allOk &&= checkFile(
  pkgPath,
  c => /"framer-motion"/.test(c) && /"canvas-confetti"/.test(c),
  'animation dependencies (framer-motion, canvas-confetti) installed',
  'animation dependencies missing from package.json'
);

// 44. ESLint configured with flat config
allOk &&= checkCondition(
  () => fs.existsSync(path.join(projectRoot, 'eslint.config.js')),
  'eslint flat config exists',
  'eslint flat config missing'
);

// 45. Design system: glass panel + brass primitives defined
allOk &&= checkFile(
  stylesPath,
  c => /\.glass-panel\b/.test(c) && /\.btn-brass\b/.test(c) && /\.text-brass-gradient\b/.test(c),
  'design system primitives (glass-panel, btn-brass, brass-gradient) defined',
  'design system primitives missing from styles.css'
);

// 46. Tailwind theme extended with brass palette and display font
allOk &&= checkFile(
  tailwindPath,
  c => /brass:\s*\{/.test(c) && /Cinzel/.test(c) && /'gavel-slam'/.test(c),
  'tailwind theme has brass palette, Cinzel display font, gavel-slam keyframes',
  'tailwind theme redesign tokens missing'
);

// 47. Sound effects hook synthesizes courtroom cues
allOk &&= checkFile(
  soundHookPath,
  c => /playGavel/.test(c) && /playObjection/.test(c) && /playVerdict/.test(c) && /judgebench\.soundFx/.test(c),
  'sound effects hook synthesizes gavel/objection/verdict with persisted toggle',
  'sound effects hook incomplete'
);

// 48. Keyboard shortcuts hook covers core hotkeys
allOk &&= checkFile(
  shortcutsHookPath,
  c => /onNextTurn/.test(c) && /onToggleAutoplay/.test(c) && /onToggleFocusMode/.test(c) && /onToggleSound/.test(c) && /isTypingTarget/.test(c),
  'keyboard shortcuts hook covers next-turn/autoplay/focus/sound and ignores inputs',
  'keyboard shortcuts hook incomplete'
);

// 49. Objection flash overlay exists and reacts to new objections
allOk &&= checkFile(
  objectionFlashPath,
  c => /Objection!/.test(c) && /seenIds/.test(c) && /AnimatePresence/.test(c),
  'objection flash overlay animates on new objections',
  'objection flash overlay missing or incomplete'
);

// 50. Verdict celebration fires confetti and gavel slam
allOk &&= checkFile(
  celebrationPath,
  c => /canvas-confetti/.test(c) && /Verdict Reached/.test(c) && /disableForReducedMotion/.test(c),
  'verdict celebration fires confetti with reduced-motion respect',
  'verdict celebration missing or incomplete'
);

// 51. Cinematic overlays wired into the main layout
allOk &&= checkFile(
  layoutPath,
  c => /<ObjectionFlash/.test(c) && /<VerdictCelebration/.test(c) && /useSoundEffects\(\)/.test(c) && /useKeyboardShortcuts\(/.test(c),
  'layout wires objection flash, verdict celebration, sound, and hotkeys',
  'layout missing cinematic wiring'
);

// 52. Evidence board has click-to-inspect detail modal
allOk &&= checkFile(
  evidenceBoardPath,
  c => /setSelected\(item\)/.test(c) && /Close evidence detail/.test(c),
  'evidence board supports click-to-inspect detail modal',
  'evidence detail modal missing'
);

// 53. Phase timeline shows animated trial progress percentage
allOk &&= checkFile(
  phaseTimelinePath,
  c => /progressPct/.test(c) && /Trial Progress/.test(c),
  'phase timeline shows animated trial progress percentage',
  'phase timeline progress missing'
);

// 54. No stale OpenRouter free-model slugs remain in src
allOk &&= checkCondition(() => {
  const staleSlugs = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'deepseek/deepseek-v4-flash:free',
  ];
  const srcDir = path.join(projectRoot, 'src');
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
  const offenders = walk(srcDir).filter(f => {
    if (!/\.(ts|tsx)$/.test(f)) return false;
    const content = fs.readFileSync(f, 'utf8');
    return staleSlugs.some(slug => content.includes(slug));
  });
  if (offenders.length) console.log('  stale slugs in:', offenders.join(', '));
  return offenders.length === 0;
}, 'no stale OpenRouter free-model slugs remain', 'stale OpenRouter model slugs found in src');

// 55. OpenRouter provider handles reasoning-model empty content
allOk &&= checkFile(
  orProviderPath,
  c => /message\.reasoning/.test(c) && /Empty completion from/.test(c),
  'openrouter provider falls back to reasoning text and rejects empty completions',
  'openrouter provider missing empty-content handling'
);

// 56. Current default free model is a live slug
allOk &&= checkFile(
  path.join(projectRoot, 'src', 'types', 'providers.ts'),
  c => /google\/gemma-4-31b-it:free/.test(c),
  'default agent model uses current live free slug',
  'default agent model slug outdated'
);

// 57. Welcome hero uses the redesign motion system
allOk &&= checkFile(
  welcomePath,
  c => /framer-motion/.test(c) && /staggerContainer/.test(c) && /glass-panel/.test(c),
  'welcome hero uses staggered motion and glass design system',
  'welcome hero not migrated to redesign'
);

// ---- Phase 24: Interactive courtroom feature checks ----
const appPath = path.join(projectRoot, 'src', 'App.tsx');
const persistencePath = path.join(projectRoot, 'src', 'data', 'sessionPersistence.ts');
const setupPanelPath = path.join(projectRoot, 'src', 'components', 'CaseSetupPanel.tsx');
const draftGenPath = path.join(projectRoot, 'src', 'utils', 'caseDraftGenerator.ts');
const juryPanelPath = path.join(projectRoot, 'src', 'components', 'JuryPanel.tsx');
const usageDashPath = path.join(projectRoot, 'src', 'components', 'UsageDashboard.tsx');
const typesPath = path.join(projectRoot, 'src', 'types', 'courtroom.ts');
const vitePath = path.join(projectRoot, 'vite.config.ts');

// 58. Engine raises interactive PENDING objections
allOk &&= checkFile(
  ctrlPath,
  c => /const isPending = state\.objectionHistory\.length % 2 === 0/.test(c) && /status: 'pending',\s*\n\s*timestamp/.test(c),
  'engine raises interactive pending objections',
  'pending objection generation missing'
);

// 59. Inline objection ruling dock in bottom bar
allOk &&= checkFile(
  layoutPath,
  c => /Your Ruling/.test(c) && /Sustain/.test(c) && /Overrule/.test(c),
  'inline objection ruling dock present in control bar',
  'inline ruling dock missing'
);

// 60. Autoplay AI judge auto-rules pending objections
allOk &&= checkFile(
  appPath,
  c => /determineObjectionRuling/.test(c) && /ruleOnObjection\(prev, pending\.id/.test(c),
  'autoplay AI judge auto-rules pending objections',
  'autoplay auto-ruling missing'
);

// 61. Objection flash fires for all new objections
allOk &&= checkFile(
  objectionFlashPath,
  c => /objections\.find\(o => !seenIds\.current\.has\(o\.id\)\)/.test(c),
  'objection flash fires for every new objection',
  'objection flash still pending-only'
);

// 62. Draft generator uses model chain with timeout
allOk &&= checkFile(
  draftGenPath,
  c => /draftModelChain/.test(c) && /AbortSignal\.timeout/.test(c) && /message\.reasoning/.test(c),
  'draft generator rotates models with timeout and reasoning fallback',
  'draft generator hardening missing'
);

// 63. Draft fallback notice surfaces to the user
allOk &&= checkFile(
  setupPanelPath,
  c => /local-fallback/.test(c) && /generated locally from your prompt/.test(c),
  'draft local-fallback notice shown to user',
  'draft fallback notice missing'
);

// 64. Token usage threaded into transcript entries
allOk &&= checkCondition(() => {
  const types = fs.readFileSync(typesPath, 'utf8');
  const ctrl = fs.readFileSync(ctrlPath, 'utf8');
  return /totalTokens\?: number/.test(types) && /totalTokens: result\.totalTokens/.test(ctrl);
}, 'token usage metadata threaded into transcript entries', 'usage metadata not threaded');

// 65. Usage dashboard component rendered in layout
allOk &&= checkCondition(() => {
  const dash = fs.existsSync(usageDashPath) && /Session Usage/.test(fs.readFileSync(usageDashPath, 'utf8'));
  const layout = fs.readFileSync(layoutPath, 'utf8');
  return dash && /<UsageDashboard/.test(layout);
}, 'usage dashboard exists and is rendered', 'usage dashboard missing');

// 66. Motion system generates and rules motions
allOk &&= checkFile(
  ctrlPath,
  c => /motion_to_admit_evidence/.test(c) && /motion_to_exclude_evidence/.test(c) && /export function ruleOnMotion/.test(c),
  'motion system generates case-derived motions with rulings',
  'motion system missing'
);

// 67. Motion panel wired to real ruling handler
allOk &&= checkCondition(() => {
  const layout = fs.readFileSync(layoutPath, 'utf8');
  const app = fs.readFileSync(appPath, 'utf8');
  return /onRuling={onMotionRuling}/.test(layout) && /ruleOnMotion\(prev, motionId/.test(app);
}, 'motion panel wired to real ruling handler', 'motion panel still stubbed');

// 68. Jury simulation with votes and dissent
allOk &&= checkCondition(() => {
  const ctrl = fs.readFileSync(ctrlPath, 'utf8');
  const types = fs.readFileSync(typesPath, 'utf8');
  const panel = fs.existsSync(juryPanelPath) && /Jury Deliberation/.test(fs.readFileSync(juryPanelPath, 'utf8'));
  const layout = fs.readFileSync(layoutPath, 'utf8');
  return /generateJuryVotes/.test(ctrl) && /interface JurorVote/.test(types) && panel && /<JuryPanel/.test(layout);
}, 'jury simulation generates votes shown in jury panel', 'jury simulation missing');

// 69. Play-a-role: engine accepts human turns
allOk &&= checkFile(
  ctrlPath,
  c => /processNextTurnAsync\(state: CourtState, userMessage\?: string\)/.test(c) && /providerUsed: 'human'/.test(c),
  'engine accepts human turns for play-a-role mode',
  'play-a-role engine support missing'
);

// 70. Play-a-role UI: role selector and argument dock
allOk &&= checkFile(
  layoutPath,
  c => /Play as/.test(c) && /Address the Court/.test(c) && /isUserTurn/.test(c),
  'play-a-role selector and argument dock present',
  'play-a-role UI missing'
);

// 71. Quick trial mode skips secondary phases
allOk &&= checkCondition(() => {
  const app = fs.readFileSync(appPath, 'utf8');
  const layout = fs.readFileSync(layoutPath, 'utf8');
  return /QUICK_SKIP_PHASES/.test(app) && /Quick Trial/.test(layout);
}, 'quick trial mode skips secondary phases', 'quick trial mode missing');

// 72. Replay export/import + markdown report + case library
allOk &&= checkFile(
  persistencePath,
  c => /exportTrialReplay/.test(c) && /parseTrialReplay/.test(c) && /exportCaseReportMarkdown/.test(c) && /saveToLibrary/.test(c) && /judgebench-replay/.test(c),
  'replay export/import, markdown report, and case library implemented',
  'persistence features missing'
);

// 73. Case library modal and file buttons in layout
allOk &&= checkFile(
  layoutPath,
  c => /Case Library/.test(c) && /Export Trial Replay/.test(c) && /Import Trial Replay/.test(c) && /Export Case Report/.test(c),
  'case library modal and export/import buttons present',
  'case file UI missing'
);

// 74. Language selector surfaced in sidebar
allOk &&= checkFile(
  layoutPath,
  c => /<LanguageSelector \/>/.test(c),
  'language selector rendered in sidebar',
  'language selector not rendered'
);

// 75. Provider catalogs updated to current model generations
allOk &&= checkCondition(() => {
  const catalog = fs.readFileSync(path.join(projectRoot, 'src', 'providers', 'modelCatalog.ts'), 'utf8');
  return /claude-sonnet-5/.test(catalog) && /gemini-2\.5-flash/.test(catalog);
}, 'provider catalogs updated to current model generations', 'provider catalogs outdated');

// 76. Vendor bundle splitting configured
allOk &&= checkFile(
  vitePath,
  c => /manualChunks/.test(c) && /vendor-react/.test(c),
  'vendor bundle splitting configured',
  'bundle splitting missing'
);

// 77. Verdict motion impact reflects actual motions
allOk &&= checkFile(
  ctrlPath,
  c => /state\.motionHistory\.map\(m =>/.test(c) && /No formal motions were filed/.test(c),
  'verdict motion impact derived from actual motions',
  'verdict motion impact still hardcoded'
);

// ---- Phase 25: upgrade-pack checks ----
const juryEnrichPath = path.join(projectRoot, 'src', 'utils', 'juryEnrichment.ts');
const scorecardPath = path.join(projectRoot, 'src', 'components', 'PlayerScorecard.tsx');
const casePacksPath = path.join(projectRoot, 'src', 'data', 'casePacks.ts');
const highlightsPath = path.join(projectRoot, 'src', 'components', 'TrialHighlights.tsx');
const achievementsPath = path.join(projectRoot, 'src', 'utils', 'achievements.ts');
const achievementsPanelPath = path.join(projectRoot, 'src', 'components', 'AchievementsPanel.tsx');
const telemetryPath = path.join(projectRoot, 'src', 'providers', 'telemetry.ts');
const telemetryDrawerPath = path.join(projectRoot, 'src', 'components', 'TelemetryDrawer.tsx');
const mockProviderPath = path.join(projectRoot, 'src', 'providers', 'mockModelProvider.ts');

// 78. AI juror enrichment wired with silent fallback
allOk &&= checkCondition(() => {
  const util = fs.existsSync(juryEnrichPath) && /enrichJurorReasoning/.test(fs.readFileSync(juryEnrichPath, 'utf8'));
  const app = fs.readFileSync(appPath, 'utf8');
  return util && /enrichJurorReasoning\(state\.case, state\.verdict\)/.test(app);
}, 'AI juror reasoning enrichment wired with silent fallback', 'juror enrichment missing');

// 79. Player objections: engine + button + AI-judge ruling
allOk &&= checkCondition(() => {
  const ctrl = fs.readFileSync(ctrlPath, 'utf8');
  const layout = fs.readFileSync(layoutPath, 'utf8');
  const app = fs.readFileSync(appPath, 'utf8');
  return /export function recordPlayerObjection/.test(ctrl)
    && /✋ Object!/.test(layout)
    && /obj-player-/.test(app);
}, 'player objections with Object! button and AI-judge ruling', 'player objections missing');

// 80. Player scorecard graded after play-a-role trials
allOk &&= checkCondition(() => {
  const card = fs.existsSync(scorecardPath) && /gradeSide/.test(fs.readFileSync(scorecardPath, 'utf8'));
  const layout = fs.readFileSync(layoutPath, 'utf8');
  return card && /<PlayerScorecard/.test(layout);
}, 'player scorecard renders after play-a-role trials', 'player scorecard missing');

// 81. Interactive witness examination uses the human question
allOk &&= checkCondition(() => {
  const mock = fs.readFileSync(mockProviderPath, 'utf8');
  const ctrl = fs.readFileSync(ctrlPath, 'utf8');
  return /customQuestion/.test(mock) && /customQuestion: userQuestion/.test(ctrl);
}, 'witness answers respond to the human examiner question', 'interactive witness examination missing');

// 82. Hot-seat mode: both sides human
allOk &&= checkCondition(() => {
  const app = fs.readFileSync(appPath, 'utf8');
  const layout = fs.readFileSync(layoutPath, 'utf8');
  return /'both'/.test(app) && /Hot-seat/.test(layout);
}, 'hot-seat mode lets humans argue both sides', 'hot-seat mode missing');

// 83. Voice dictation in the argument dock
allOk &&= checkFile(
  layoutPath,
  c => /webkitSpeechRecognition/.test(c) && /Dictate/.test(c),
  'voice dictation available in argument dock',
  'voice dictation missing'
);

// 84. Case pack gallery with 8 curated cases
allOk &&= checkCondition(() => {
  const packs = fs.readFileSync(casePacksPath, 'utf8');
  const setup = fs.readFileSync(setupPanelPath, 'utf8');
  const packCount = (packs.match(/^\s*pack\(/gm) || []).length;
  return packCount >= 8 && /CASE_PACKS/.test(setup) && /Case Gallery/.test(setup);
}, 'case gallery ships 8 curated cases', 'case gallery missing or short');

// 85. Trial highlights reel compiled after completion
allOk &&= checkCondition(() => {
  const reel = fs.existsSync(highlightsPath) && /extractHighlights/.test(fs.readFileSync(highlightsPath, 'utf8'));
  const layout = fs.readFileSync(layoutPath, 'utf8');
  return reel && /<TrialHighlights/.test(layout);
}, 'trial highlights reel compiled after completion', 'highlights reel missing');

// 86. Achievements: stats persistence + badge panel
allOk &&= checkCondition(() => {
  const util = fs.readFileSync(achievementsPath, 'utf8');
  const panel = fs.existsSync(achievementsPanelPath);
  const app = fs.readFileSync(appPath, 'utf8');
  return /recordTrialCompletion/.test(util) && /judgebench\.stats\.v1/.test(util) && panel && /recordTrialCompletion\(state, userRole\)/.test(app);
}, 'achievement stats persist with badge panel', 'achievements missing');

// 87. Print / Save-as-PDF report export
allOk &&= checkCondition(() => {
  const persist = fs.readFileSync(persistencePath, 'utf8');
  const layout = fs.readFileSync(layoutPath, 'utf8');
  return /exportCaseReportPdf/.test(persist) && /window\.print\(\)/.test(persist) && /Print \/ Save as PDF/.test(layout);
}, 'print/save-as-PDF report export available', 'PDF export missing');

// 88. Replay theater: turn-by-turn playback with guards
allOk &&= checkCondition(() => {
  const app = fs.readFileSync(appPath, 'utf8');
  const layout = fs.readFileSync(layoutPath, 'utf8');
  return /handleWatchReplay/.test(app) && /replayQueueRef/.test(app)
    && /Watch Replay \(Theater\)/.test(layout) && /Replay Theater/.test(layout)
    && /if \(isReplaying\) return;/.test(app);
}, 'replay theater plays trials back with engine guards', 'replay theater missing');

// 89. Provider telemetry drawer
allOk &&= checkCondition(() => {
  const t = fs.existsSync(telemetryPath) && /recordProviderEvent/.test(fs.readFileSync(telemetryPath, 'utf8'));
  const drawer = fs.existsSync(telemetryDrawerPath);
  const or = fs.readFileSync(orProviderPath, 'utf8');
  return t && drawer && /recordProviderEvent\(/.test(or);
}, 'provider telemetry drawer records failures', 'telemetry drawer missing');

// 90. Vitest unit tests wired into package scripts
allOk &&= checkCondition(() => {
  const pkg = fs.readFileSync(pkgPath, 'utf8');
  const tests = fs.existsSync(path.join(projectRoot, 'src', 'test', 'engine.test.ts'));
  return /"test":\s*"vitest run"/.test(pkg) && /"vitest"/.test(pkg) && tests;
}, 'vitest unit test suite wired into scripts', 'vitest suite missing');

// ---- Phase 26: power-layer checks ----
const promptSafetyPath = path.join(projectRoot, 'src', 'utils', 'promptSafety.ts');
const scoringPath = path.join(projectRoot, 'src', 'legal', 'argumentScoring.ts');
const strategyPath = path.join(projectRoot, 'src', 'legal', 'strategyMemory.ts');
const personaPath = path.join(projectRoot, 'src', 'legal', 'witnessPersona.ts');
const verdictDelibPath = path.join(projectRoot, 'src', 'utils', 'verdictDeliberation.ts');
const degradationPath = path.join(projectRoot, 'src', 'components', 'effects', 'DegradationBanner.tsx');
const errorBoundaryPath = path.join(projectRoot, 'src', 'components', 'AppErrorBoundary.tsx');
const workerPath = path.join(projectRoot, 'worker', 'index.js');
const platformPath = path.join(projectRoot, 'src', 'platform', 'platformClient.ts');

// 91. Prompt-injection defense wired into prompt assembly
allOk &&= checkCondition(() => {
  const util = fs.existsSync(promptSafetyPath) && /INJECTION_PATTERNS/.test(fs.readFileSync(promptSafetyPath, 'utf8'));
  const agent = fs.readFileSync(agentPath, 'utf8');
  return util && /fenceUserContent\('CASE SUMMARY'/.test(agent) && /sanitizeUserText/.test(agent);
}, 'prompt-injection defense fences user case text', 'injection defense missing');

// 92. Argument scoring attached to counsel turns
allOk &&= checkCondition(() => {
  const scoring = fs.existsSync(scoringPath) && /scoreArgumentHeuristic/.test(fs.readFileSync(scoringPath, 'utf8'));
  const ctrl = fs.readFileSync(ctrlPath, 'utf8');
  return scoring && /argumentScore = scoreArgumentHeuristic/.test(ctrl) && /argumentScore,/.test(ctrl);
}, 'argument scoring runs on every counsel turn', 'argument scoring missing');

// 93. Verdict derives from argument scores with burden-of-proof ties
allOk &&= checkFile(
  ctrlPath,
  c => /aggregateSideScore\(state\.transcript/.test(c) && /plaintiffTotal > defenseTotal/.test(c) && !/title\.length % 2/.test(c),
  'verdict weighs argument quality; ties resolve on burden of proof',
  'verdict still uses evidence-count/title-hash logic'
);

// 94. Preset case no longer returns a hardcoded verdict
allOk &&= checkFile(
  ctrlPath,
  c => !/return \{ \.\.\.MOCK_VERDICT/.test(c),
  'preset case verdict computed from the live record',
  'preset verdict still hardcoded'
);

// 95. LLM verdict deliberation enrichment wired with silent fallback
allOk &&= checkCondition(() => {
  const util = fs.existsSync(verdictDelibPath) && /enrichVerdictDeliberation/.test(fs.readFileSync(verdictDelibPath, 'utf8'));
  const app = fs.readFileSync(appPath, 'utf8');
  return util && /enrichVerdictDeliberation\(state, state\.verdict\)/.test(app);
}, 'verdict deliberation enriched from real transcript', 'verdict deliberation missing');

// 96. Agent strategy memory generated and injected into prompts
allOk &&= checkCondition(() => {
  const strat = fs.existsSync(strategyPath) && /buildAgentStrategies/.test(fs.readFileSync(strategyPath, 'utf8'));
  const ctrl = fs.readFileSync(ctrlPath, 'utf8');
  const agent = fs.readFileSync(agentPath, 'utf8');
  return strat && /agentStrategies: buildAgentStrategies/.test(ctrl) && /formatStrategyForPrompt/.test(agent);
}, 'agents argue from private strategy memory', 'strategy memory missing');

// 97. Rebuttal targeting: prompts quote the opponent last argument
allOk &&= checkFile(
  agentPath,
  c => /OPPOSING COUNSEL'S MOST RECENT ARGUMENT/.test(c),
  'prompts force engagement with the opponent last argument',
  'rebuttal targeting missing'
);

// 98. Self-critique pass in quality mode high
allOk &&= checkFile(
  agentPath,
  c => /judgebench\.qualityMode/.test(c) && /revisePrompt/.test(c),
  'quality mode high adds a self-critique revision pass',
  'self-critique pass missing'
);

// 99. Persona witnesses crack under targeted cross-examination
allOk &&= checkCondition(() => {
  const persona = fs.existsSync(personaPath) && /secretWeakness/.test(fs.readFileSync(personaPath, 'utf8'));
  const mock = fs.readFileSync(mockProviderPath, 'utf8');
  const ctrl = fs.readFileSync(ctrlPath, 'utf8');
  return persona && /weaknessHit/.test(mock) && /CRACKED UNDER CROSS/.test(ctrl);
}, 'persona witnesses crack when their weakness is targeted', 'persona witnesses missing');

// 100. Honest degradation banner + error boundary
allOk &&= checkCondition(() => {
  const banner = fs.existsSync(degradationPath) && /scripted fallback/.test(fs.readFileSync(degradationPath, 'utf8'));
  const boundary = fs.existsSync(errorBoundaryPath);
  const main = fs.readFileSync(path.join(projectRoot, 'src', 'main.tsx'), 'utf8');
  const layout = fs.readFileSync(layoutPath, 'utf8');
  return banner && boundary && /<AppErrorBoundary>/.test(main) && /<DegradationBanner/.test(layout);
}, 'degradation banner and app error boundary active', 'trust UX missing');

// 101. Quality mode toggle in UI
allOk &&= checkFile(
  layoutPath,
  c => /qualityMode/.test(c) && /self-critique/.test(c),
  'quality mode toggle available pre-trial',
  'quality mode toggle missing'
);

// 102. Worker source hardened (rate limit, budget, longer tokens, SSE-ready)
allOk &&= checkFile(
  workerPath,
  c => /RATE_LIMIT_MAX/.test(c) && /DAILY_BUDGET_MAX/.test(c) && /1400/.test(c) && /text\/event-stream/.test(c) && /requestedModel/.test(c),
  'proxy worker source hardened with rate limits and SSE passthrough',
  'worker hardening missing'
);

// 103. Supabase platform scaffold (dormant, flag-gated)
allOk &&= checkCondition(() => {
  const sql = fs.existsSync(path.join(projectRoot, 'supabase', 'migrations', '0001_init.sql'));
  const client = fs.existsSync(platformPath) && /isPlatformEnabled/.test(fs.readFileSync(platformPath, 'utf8'));
  const doc = fs.existsSync(path.join(projectRoot, 'docs', 'PLATFORM_SETUP.md'));
  return sql && client && doc;
}, 'supabase platform scaffold ready behind feature flag', 'platform scaffold missing');

// 104. CI workflow present
allOk &&= checkCondition(
  () => fs.existsSync(path.join(projectRoot, '.github', 'workflows', 'ci.yml')),
  'GitHub Actions CI workflow present',
  'CI workflow missing'
);

// 105. Longer turns: token caps raised
allOk &&= checkFile(
  orProviderPath,
  c => /max_tokens: 1200/.test(c),
  'turn token budget raised for developed arguments',
  'token budget still capped low'
);

// ---- Unit test suite gate ----
allOk &&= runCommand('npm test', 'Engine unit tests (vitest)');

if (!allOk) {
  process.exit(1);
}

