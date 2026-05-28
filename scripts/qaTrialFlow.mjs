// qaTrialFlow.mjs – Phase 8 QA checks
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const layoutPath = path.join(projectRoot, 'src', 'components', 'CourtroomLayout.tsx');
const stagePath = path.join(projectRoot, 'src', 'components', 'visuals', 'CourtroomStage.tsx');
const fallbackPath = path.join(projectRoot, 'src', 'components', 'visuals', 'WebGLFallback.tsx');
const presenterStylesPath = path.join(projectRoot, 'src', 'components', 'visuals', 'StageEvidencePresenter.module.css');

let allOk = true;

// 1. courtroom stage renders before large profile cards
const layoutContent = fs.readFileSync(layoutPath, 'utf8');
const stageIndex = layoutContent.indexOf('<CourtroomStage');
const profilesIndex = layoutContent.indexOf('<AgentPanel');
const check1 = stageIndex !== -1 && profilesIndex !== -1 && stageIndex < profilesIndex;
if (check1) {
  console.log('PASS courtroom stage renders before large profile cards');
} else {
  console.error('FAIL courtroom stage renders before large profile cards');
  allOk = false;
}

// 2. 2D fallback includes judge prosecutor defense and witness areas
const stageContent = fs.readFileSync(stagePath, 'utf8');
const hasJudge2D = stageContent.includes('JudgeStation');
const hasAttorney2D = stageContent.includes('AttorneyStation');
const hasWitness2D = stageContent.includes('WitnessAndEvidenceArea');
const check2 = hasJudge2D && hasAttorney2D && hasWitness2D;
if (check2) {
  console.log('PASS 2D fallback includes judge prosecutor defense and witness areas');
} else {
  console.error('FAIL 2D fallback includes judge prosecutor defense and witness areas');
  allOk = false;
}

// 3. 3D failure uses compact badge not blocking panel
const fallbackContent = fs.readFileSync(fallbackPath, 'utf8');
const hasCompactBadgeText = fallbackContent.includes('3D unavailable — using stable 2D courtroom');
const isCompact = !fallbackContent.includes('h-screen') && !fallbackContent.includes('fixed inset-0');
const check3 = hasCompactBadgeText && isCompact;
if (check3) {
  console.log('PASS 3D failure uses compact badge not blocking panel');
} else {
  console.error('FAIL 3D failure uses compact badge not blocking panel');
  allOk = false;
}

// 4. courtroom focus mode button exists
const hasFocusModeButton = layoutContent.includes('Expand Courtroom') && layoutContent.includes('Exit Focus Mode');
const check4 = hasFocusModeButton;
if (check4) {
  console.log('PASS courtroom focus mode button exists');
} else {
  console.error('FAIL courtroom focus mode button exists');
  allOk = false;
}

// 5. focus mode supports stage and transcript layout
const hasStageTranscriptLayout = layoutContent.includes('lg:col-span-8') && layoutContent.includes('lg:col-span-4');
const check5 = hasStageTranscriptLayout;
if (check5) {
  console.log('PASS focus mode supports stage and transcript layout');
} else {
  console.error('FAIL focus mode supports stage and transcript layout');
  allOk = false;
}

// 6. judge remains visible in 2D fallback
const stable2DIndex = stageContent.indexOf('/* Stable 2D Courtroom fallback layout */');
const judgeInStable2D = stable2DIndex !== -1 && stageContent.indexOf('JudgeStation', stable2DIndex) !== -1;
const check6 = judgeInStable2D;
if (check6) {
  console.log('PASS judge remains visible in 2D fallback');
} else {
  console.error('FAIL judge remains visible in 2D fallback');
  allOk = false;
}

// 7. evidence presenter remains in normal layout flow
const stylesContent = fs.readFileSync(presenterStylesPath, 'utf8');
const noAbsoluteInStyles = !/\bposition:\s*absolute\b/.test(stylesContent);
const check7 = noAbsoluteInStyles;
if (check7) {
  console.log('PASS evidence presenter remains in normal layout flow');
} else {
  console.error('FAIL evidence presenter remains in normal layout flow');
  allOk = false;
}

if (!allOk) {
  process.exit(1);
}
