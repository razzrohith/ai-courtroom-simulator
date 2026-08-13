/**
 * Engine unit tests — Phase 25.
 * Covers the deterministic trial engine: verdicts, jury math, objection and
 * motion rulings, player objections, case packs, and achievements.
 */

import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  generateDynamicVerdict,
  ruleOnObjection,
  ruleOnMotion,
  recordPlayerObjection,
} from '../orchestration/courtControllerAsync';
import type { CourtState, Evidence, MotionEvent, ObjectionEvent } from '../types/courtroom';
import { CASE_PACKS } from '../data/casePacks';
import { getUnlockedAchievements, ACHIEVEMENTS } from '../utils/achievements';

function customCaseState(): CourtState {
  const state = createInitialState();
  return {
    ...state,
    isActive: true,
    case: {
      ...state.case,
      id: 'case-test',
      title: 'Alpha v. Beta: Test Dispute',
      caseType: 'Civil Dispute',
      plaintiffSide: 'Alpha',
      defenseSide: 'Beta',
      claimSummary: 'Alpha claims priority. Beta disagrees.',
      caseSource: 'custom',
    },
  };
}

function makeEvidence(id: string, by: 'prosecutor' | 'defense', status: Evidence['status']): Evidence {
  return {
    id,
    title: `Exhibit ${id}`,
    type: 'report',
    confidentiality: 'public',
    summary: 'test',
    content: 'test content',
    introducedBy: by,
    status,
  };
}

describe('generateDynamicVerdict', () => {
  it('favors the side with more admitted evidence', () => {
    const state = customCaseState();
    state.evidence = [
      makeEvidence('EXHIBITP1', 'prosecutor', 'admitted'),
      makeEvidence('EXHIBITP2', 'prosecutor', 'admitted'),
      makeEvidence('EXHIBITD1', 'defense', 'pending'),
    ];
    const verdict = generateDynamicVerdict(state);
    expect(verdict.decision).toBe('plaintiff_wins');
    expect(verdict.winnerName).toBe('Alpha');
  });

  it('favors defense when its record is stronger', () => {
    const state = customCaseState();
    state.evidence = [
      makeEvidence('EXHIBITD1', 'defense', 'admitted'),
      makeEvidence('EXHIBITD2', 'defense', 'admitted'),
    ];
    const verdict = generateDynamicVerdict(state);
    expect(verdict.decision).toBe('defense_wins');
    expect(verdict.winnerName).toBe('Beta');
  });

  it('produces five jurors with a majority matching the decision and at least one dissenter', () => {
    const state = customCaseState();
    state.evidence = [makeEvidence('EXHIBITP1', 'prosecutor', 'admitted')];
    const verdict = generateDynamicVerdict(state);
    expect(verdict.jurors).toHaveLength(5);
    const majorityVotes = verdict.jurors!.filter(j => j.vote === 'plaintiff').length;
    expect(majorityVotes).toBeGreaterThanOrEqual(3);
    expect(majorityVotes).toBeLessThan(5); // dissent exists
    verdict.jurors!.forEach(j => expect(j.reasoning.length).toBeGreaterThan(10));
  });

  it('is deterministic for the same state', () => {
    const state = customCaseState();
    state.evidence = [makeEvidence('EXHIBITP1', 'prosecutor', 'admitted')];
    const a = generateDynamicVerdict(state);
    const b = generateDynamicVerdict(state);
    expect(a.decision).toBe(b.decision);
    expect(a.jurors!.map(j => j.vote)).toEqual(b.jurors!.map(j => j.vote));
  });
});

describe('ruleOnObjection', () => {
  function stateWithPendingObjection(): { state: CourtState; objection: ObjectionEvent } {
    const state = customCaseState();
    const objection: ObjectionEvent = {
      id: 'obj-1',
      raisedBy: 'defense',
      type: 'hearsay',
      targetEvidence: 'EXHIBITP1',
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
    state.objectionHistory = [objection];
    state.evidence = [makeEvidence('EXHIBITP1', 'prosecutor', 'offered')];
    return { state, objection };
  }

  it('sustaining marks the objection and disputes the evidence', () => {
    const { state, objection } = stateWithPendingObjection();
    const next = ruleOnObjection(state, objection.id, true, objection.targetEvidence);
    expect(next.objectionHistory[0].status).toBe('sustained');
    expect(next.evidence[0].status).toBe('disputed');
    expect(next.transcript.some(t => t.message.includes('SUSTAINED'))).toBe(true);
  });

  it('overruling admits the evidence', () => {
    const { state, objection } = stateWithPendingObjection();
    const next = ruleOnObjection(state, objection.id, false, objection.targetEvidence);
    expect(next.objectionHistory[0].status).toBe('overruled');
    expect(next.evidence[0].status).toBe('admitted');
  });
});

describe('ruleOnMotion', () => {
  function stateWithPendingMotion(): { state: CourtState; motion: MotionEvent } {
    const state = customCaseState();
    const motion: MotionEvent = {
      id: 'mot-1',
      motionType: 'motion_to_exclude_evidence',
      raisedBy: 'defense',
      reason: 'test',
      targetEvidence: 'EXHIBITP1',
      status: 'pending',
      phase: 'motion_hearing',
    };
    state.motionHistory = [motion];
    state.evidence = [makeEvidence('EXHIBITP1', 'prosecutor', 'offered')];
    return { state, motion };
  }

  it('granting an exclusion motion excludes the evidence', () => {
    const { state, motion } = stateWithPendingMotion();
    const next = ruleOnMotion(state, motion.id, true);
    expect(next.motionHistory[0].status).toBe('granted');
    expect(next.evidence[0].status).toBe('excluded');
    expect(next.transcript.some(t => t.message.includes('GRANTED'))).toBe(true);
  });

  it('denying leaves evidence untouched', () => {
    const { state, motion } = stateWithPendingMotion();
    const next = ruleOnMotion(state, motion.id, false);
    expect(next.motionHistory[0].status).toBe('denied');
    expect(next.evidence[0].status).toBe('offered');
  });

  it('ignores rulings on unknown or already-resolved motions', () => {
    const { state } = stateWithPendingMotion();
    expect(ruleOnMotion(state, 'nope', true)).toBe(state);
  });
});

describe('recordPlayerObjection', () => {
  it('creates a pending objection with a transcript outburst', () => {
    const state = customCaseState();
    const next = recordPlayerObjection(state, 'prosecutor', 'relevance');
    expect(next.objectionHistory).toHaveLength(1);
    expect(next.objectionHistory[0].status).toBe('pending');
    expect(next.objectionHistory[0].id.startsWith('obj-player-')).toBe(true);
    expect(next.transcript[next.transcript.length - 1].providerUsed).toBe('human');
  });

  it('refuses while another objection is pending', () => {
    const state = customCaseState();
    const first = recordPlayerObjection(state, 'prosecutor', 'relevance');
    const second = recordPlayerObjection(first, 'prosecutor', 'hearsay');
    expect(second).toBe(first);
  });
});

describe('case packs', () => {
  it('ships 8 complete, startable cases', () => {
    expect(CASE_PACKS).toHaveLength(8);
    for (const pack of CASE_PACKS) {
      const c = pack.caseData;
      expect(c.title.trim()).not.toBe('');
      expect(c.caseType.trim()).not.toBe('');
      expect(c.plaintiffSide.trim()).not.toBe('');
      expect(c.defenseSide.trim()).not.toBe('');
      expect(c.claimSummary.trim()).not.toBe('');
      expect(c.keyFacts.length).toBeGreaterThanOrEqual(3);
      expect(c.evidenceItems).toHaveLength(2);
      expect(c.evidenceItems[0].id).toBe('EXHIBITP1');
      expect(c.evidenceItems[1].id).toBe('EXHIBITD1');
      expect(c.id.startsWith('case-pack-')).toBe(true);
    }
  });

  it('uses unique pack ids', () => {
    const ids = CASE_PACKS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('achievements', () => {
  it('unlocks nothing on zero stats', () => {
    const unlocked = getUnlockedAchievements({
      trialsCompleted: 0,
      winsAsProsecutor: 0,
      winsAsDefense: 0,
      playerObjections: 0,
      playerObjectionsSustained: 0,
      argumentsDelivered: 0,
      casesFromGallery: 0,
    });
    expect(unlocked).toHaveLength(0);
  });

  it('unlocks progressive badges as stats grow', () => {
    const unlocked = getUnlockedAchievements({
      trialsCompleted: 5,
      winsAsProsecutor: 1,
      winsAsDefense: 0,
      playerObjections: 2,
      playerObjectionsSustained: 1,
      argumentsDelivered: 10,
      casesFromGallery: 3,
    });
    const ids = unlocked.map(a => a.id);
    expect(ids).toContain('first-gavel');
    expect(ids).toContain('court-regular');
    expect(ids).toContain('peoples-counsel');
    expect(ids).toContain('objection-sustained');
    expect(ids).toContain('silver-tongue');
    expect(ids).toContain('case-collector');
    expect(ids).not.toContain('marathon-litigator');
    expect(ids).not.toContain('shield-of-justice');
  });

  it('every achievement is reachable', () => {
    const maxStats = {
      trialsCompleted: 100,
      winsAsProsecutor: 10,
      winsAsDefense: 10,
      playerObjections: 50,
      playerObjectionsSustained: 20,
      argumentsDelivered: 100,
      casesFromGallery: 10,
    };
    expect(getUnlockedAchievements(maxStats)).toHaveLength(ACHIEVEMENTS.length);
  });
});
