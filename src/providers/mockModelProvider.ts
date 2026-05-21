/**
 * Mock Model Provider — Simulated AI responses for demo/testing
 */

import type { IModelProvider } from './modelProviderTypes';
import type { AgentRole, CourtPhase } from '../types/courtroom';

/**
 * Mock provider implementation
 * Returns pre-scripted responses based on agent role
 */
export class MockModelProvider implements IModelProvider {
  readonly id = 'mock';
  readonly name = 'Mock Provider';
  readonly status: 'mock' | 'available' | 'planned' = 'mock';

  private initialized = false;

  async initialize(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    this.initialized = true;
  }

  async generate(_prompt: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return '[Mock Response]';
  }

  async healthCheck(): Promise<boolean> {
    return this.initialized;
  }
}

// Singleton instance
export const mockProvider = new MockModelProvider();

// Simple generateResponse function for use without class
export function generateMockResponse(params: {
  role: AgentRole;
  phase: CourtPhase;
  prompt: string;
}): string {
  const { role, phase } = params;
  
  const mockResponses: Record<CourtPhase, Record<AgentRole, string>> = {
    case_setup: {
      judge: 'This court is now in session. We will proceed with the case.',
      prosecutor: 'Your Honor, we are prepared to present our case.',
      defense: 'Your Honor, the defense is ready.',
    },
    court_opening: {
      judge: 'This court is now in session. Please approach.',
      prosecutor: 'The prosecution is ready to present its opening statement.',
      defense: 'The defense is ready, Your Honor.',
    },
    plaintiff_opening: {
      judge: '',
      prosecutor: 'Good morning. This case concerns a breach of contract regarding the supply agreement between Apex Logistics and Northstar Retail.',
      defense: '',
    },
    defense_opening: {
      judge: '',
      prosecutor: '',
      defense: 'The defense will show that Northstar Retail had valid reasons for refusing payment given the delivery delays.',
    },
    evidence_presentation: {
      judge: '',
      prosecutor: 'We enter into evidence the signed supply agreement, dated January 15, 2024.',
      defense: '',
    },
    objection_ruling: {
      judge: 'The objection is overruled. The evidence is relevant.',
      prosecutor: '',
      defense: '',
    },
    cross_examination: {
      judge: '',
      prosecutor: 'Did you receive notice of the delays?',
      defense: 'Yes, but the delays were excessive.',
    },
    rebuttal: {
      judge: '',
      prosecutor: 'The defense has not provided documentation.',
      defense: '',
    },
    closing_arguments: {
      judge: '',
      prosecutor: 'We ask the court to rule in favor of the plaintiff.',
      defense: 'We ask the court to dismiss the case.',
    },
    judge_deliberation: {
      judge: 'The court will recess for deliberation.',
      prosecutor: '',
      defense: '',
    },
    verdict: {
      judge: 'After careful consideration, the court finds in favor of the defendant.',
      prosecutor: '',
      defense: '',
    },
    case_summary: {
      judge: 'This concludes the proceedings.',
      prosecutor: '',
      defense: '',
    },
  };
  
  return mockResponses[phase]?.[role] || `[${role} at ${phase}]`;
}
