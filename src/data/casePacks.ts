/**
 * casePacks — Phase 25: curated preset case gallery.
 * Eight ready-to-run disputes across debate styles. All fictional and
 * educational; caseSource 'custom' so the dynamic engine (facts, witnesses,
 * verdict) treats them like generated cases.
 */

import type { CaseData, Evidence } from '../types/courtroom';

export interface CasePack {
  id: string;
  emoji: string;
  tagline: string;
  category: string;
  caseData: CaseData;
}

function exhibit(id: string, title: string, summary: string, by: 'prosecutor' | 'defense'): Evidence {
  return {
    id,
    title,
    type: 'report',
    confidentiality: 'public',
    summary,
    content: summary,
    introducedBy: by,
    status: 'pending',
  };
}

function pack(
  id: string,
  emoji: string,
  category: string,
  tagline: string,
  title: string,
  caseType: string,
  plaintiffSide: string,
  defenseSide: string,
  claimSummary: string,
  keyFacts: string[],
  exhibits: [string, string],
): CasePack {
  return {
    id,
    emoji,
    tagline,
    category,
    caseData: {
      id: `case-pack-${id}`,
      title,
      caseType,
      plaintiffSide,
      defenseSide,
      claimSummary,
      keyFacts,
      evidenceItems: [
        exhibit('EXHIBITP1', `Exhibit P-1: ${exhibits[0]}`, `Documentation supporting ${plaintiffSide}'s central claim.`, 'prosecutor'),
        exhibit('EXHIBITD1', `Exhibit D-1: ${exhibits[1]}`, `Documentation supporting ${defenseSide}'s defense.`, 'defense'),
      ],
      legalQuestions: [],
      caseSource: 'custom',
      schemaVersion: 2,
    },
  };
}

export const CASE_PACKS: CasePack[] = [
  pack(
    'coffee-tea', '☕', 'Lifestyle Debate', 'The beverage battle of the century',
    'Coffee v. Tea: The Morning Ritual Dispute', 'Consumer Preference Debate',
    'Coffee', 'Tea',
    'Coffee claims it is the superior morning beverage on productivity and cultural dominance. Tea counters with health benefits, variety, and a longer heritage.',
    ['Global coffee consumption exceeds 2 billion cups daily.', 'Tea is the second-most consumed beverage on Earth after water.', 'Caffeine content and health impacts differ significantly between the two.'],
    ['Global Productivity Consumption Report', 'Longitudinal Health & Heritage Study'],
  ),
  pack(
    'ai-homework', '🤖', 'Education Ethics', 'Should AI help with homework?',
    'Students United v. Ministry of Examinations', 'Academic Policy Dispute',
    'Students United', 'Ministry of Examinations',
    'Students argue AI assistance for homework is a legitimate learning tool that mirrors real-world work. The Ministry argues it undermines assessment integrity and skill formation.',
    ['A national survey found 68% of students have used AI for assignments.', 'Assessment scores diverge sharply between supervised and unsupervised work.', 'Employers increasingly expect AI-tool fluency from graduates.'],
    ['Learning Outcomes With AI Assistance Survey', 'Assessment Integrity Audit'],
  ),
  pack(
    'cats-dogs', '🐾', 'Classic Showdown', 'The ultimate companion animal case',
    'Cats v. Dogs: Best Household Companion', 'Companion Suitability Dispute',
    'Cats', 'Dogs',
    'Cats claim superiority as low-maintenance, independent companions ideal for modern life. Dogs counter with loyalty, trainability, and proven health benefits for owners.',
    ['Cats require significantly less daily care time than dogs.', 'Dog ownership correlates with increased daily exercise for owners.', 'Both species show measurable stress-reduction effects on humans.'],
    ['Urban Companion Care-Time Analysis', 'Canine Loyalty & Owner Health Study'],
  ),
  pack(
    'remote-office', '🏢', 'Workplace Debate', 'Where does the best work happen?',
    'Remote Workers Guild v. Office Culture Alliance', 'Workplace Policy Dispute',
    'Remote Workers Guild', 'Office Culture Alliance',
    'The Guild claims remote work delivers higher productivity and wellbeing. The Alliance argues in-person collaboration drives innovation, mentorship, and culture.',
    ['Commute elimination returns 50+ minutes daily to remote workers.', 'Patent filings historically cluster around dense in-person research hubs.', 'Hybrid arrangements now dominate knowledge-work employment.'],
    ['Distributed Productivity Metrics Report', 'Innovation Density & Collaboration Study'],
  ),
  pack(
    'pineapple-pizza', '🍍', 'Culinary Controversy', 'The most divisive topping on trial',
    'Pineapple v. The Pizza Purists', 'Culinary Tradition Dispute',
    'Pineapple Topping Coalition', 'Neapolitan Purity Society',
    'The Coalition claims sweet-savory contrast is a legitimate culinary evolution enjoyed by millions. The Society argues it violates the fundamental principles of pizza tradition.',
    ['Hawaiian pizza was invented in Canada in 1962 and sells globally.', 'Traditional Neapolitan certification excludes non-canonical toppings.', 'Taste-preference surveys split nearly 50/50 across regions.'],
    ['Global Topping Sales & Preference Data', 'Certified Neapolitan Tradition Charter'],
  ),
  pack(
    'ebooks-print', '📚', 'Reader Rights', 'The format of the future on trial',
    'E-Books v. Print Books: The Reading Experience', 'Media Format Dispute',
    'E-Book Federation', 'Print Preservation League',
    'The Federation claims digital reading wins on access, portability, and sustainability. The League argues print delivers deeper comprehension, ownership, and permanence.',
    ['One e-reader can hold thousands of titles at marginal cost.', 'Studies show modest comprehension advantages for print reading.', 'Used print books require no battery, DRM, or platform.'],
    ['Digital Access & Sustainability Report', 'Reading Comprehension Meta-Analysis'],
  ),
  pack(
    'early-night', '🌙', 'Chronotype Clash', 'Larks and owls settle it in court',
    'Early Risers v. Night Owls: Peak Human Schedule', 'Lifestyle Science Dispute',
    'Early Risers Assembly', 'Night Owls Collective',
    'Early Risers claim morning schedules align with biology, productivity, and society. Night Owls argue chronotype is genetic and forcing owls into lark schedules harms performance.',
    ['Chronotype has a substantial documented genetic component.', 'Standard business hours structurally favor morning-oriented people.', 'Shift-work research shows misaligned schedules impair cognition.'],
    ['Circadian Alignment Productivity Study', 'Chronotype Genetics & Performance Review'],
  ),
  pack(
    'mountains-beaches', '🏔️', 'Travel Tribunal', 'The holiday destination verdict',
    'Mountains v. Beaches: The Perfect Getaway', 'Travel Preference Dispute',
    'Mountain Expedition Union', 'Coastal Leisure Board',
    'The Union claims mountain travel offers superior adventure, air quality, and views. The Board counters that beaches deliver unmatched relaxation, accessibility, and universal appeal.',
    ['Alpine tourism shows the fastest growth in adventure travel.', 'Beach destinations remain the most-booked holiday category worldwide.', 'Both environments show documented mental-health benefits.'],
    ['Adventure Tourism Growth Report', 'Global Holiday Booking & Wellness Data'],
  ),
];
