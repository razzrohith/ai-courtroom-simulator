import type { CaseData } from '../types/courtroom';
import { loadApiKey, loadCourtroomConfig } from '../types/providers';
import { parseCaseDraftJSON } from './caseDraftParser';
import { sanitizeUserText } from './promptSafety';

/**
 * AI-assisted Case Draft Generator Utility.
 * Calls configured providers or falls back to a local deterministic generator.
 */

/**
 * Generates a structured case from the dispute description using LLMs.
 * Tries the user's active Judge provider first, then falls back to OpenRouter free demo.
 * Throws if all API calls fail.
 */
export async function fetchCaseDraftFromAI(description: string): Promise<Partial<CaseData>> {
  const sanitizedDescription = sanitizeUserText(
    description.replace(/<[^>]*>?/gm, ''), // strip HTML/tags
    300
  );

  if (!sanitizedDescription) {
    throw new Error('Description is empty.');
  }

  const config = loadCourtroomConfig();
  const judgeConfig = config.judge;
  const providerId = judgeConfig.providerId;
  const model = judgeConfig.model;
  
  const systemPrompt = `You are a legal assistant for JudgeBench, an AI courtroom simulator.
Your task is to draft a structured courtroom case based on a short description of a dispute.
You MUST respond with a single JSON object. Do not wrap it in markdown code blocks, do not add explanation, and do not add text before or after the JSON.
The JSON object must follow this exact schema:
{
  "title": "A compelling courtroom case title, e.g. 'ChatGPT v. Claude: AI Assistant Superiority Dispute'",
  "caseType": "The type of case, e.g. 'Academic Grievance', 'Transaction Dispute', or 'Technical Debate'",
  "plaintiffSide": "Name of the Plaintiff side, e.g. 'ChatGPT'",
  "defenseSide": "Name of the Defense side, e.g. 'Claude'",
  "claimSummary": "A concise summary of the dispute, claims, and counterclaims. Describe specific arguments of both sides naturally. Keep it under 3 sentences.",
  "keyFacts": [
    "Fact 1: A clear, objective key fact of the case",
    "Fact 2: Another clear, objective key fact of the case",
    "Fact 3: A third clear, objective key fact of the case"
  ],
  "evidenceItems": [
    {
      "id": "EXHIBITP1",
      "title": "Exhibit P-1: [Short Title for Plaintiff Evidence]",
      "type": "report",
      "confidentiality": "public",
      "summary": "[Brief description of what this exhibit proves/disproves for the Plaintiff]",
      "introducedBy": "prosecutor",
      "status": "pending",
      "content": "[Detailed content or report text for the exhibit]"
    },
    {
      "id": "EXHIBITD1",
      "title": "Exhibit D-1: [Short Title for Defense Evidence]",
      "type": "report",
      "confidentiality": "public",
      "summary": "[Brief description of what this exhibit proves/disproves for the Defense]",
      "introducedBy": "defense",
      "status": "pending",
      "content": "[Detailed content or report text for the exhibit]"
    }
  ]
}

Ensure the title, plaintiffSide, and defenseSide directly reflect the entities mentioned.
Make all text simple, natural, and highly specific to the user's prompt. Avoid generic boilerplate phrasing like "alternative evolutionary, architectural, or design parameters" or "the parties are locked in a dispute regarding..." unless the prompt is explicitly scientific.
Keep evidence titles simple and believable (e.g., 'Grade Rubric', 'Email Thread', 'System Performance Logs', 'Receipt').
Ensure there are exactly 3 key facts, and exactly 2 evidence items (one for prosecutor with ID EXHIBITP1 and one for defense with ID EXHIBITD1).`;

  const userPrompt = `Dispute description: "${sanitizedDescription}"`;

  const providersToTry: { id: string; model: string }[] = [];
  
  // Try the configured Judge provider if it is not mock
  if (providerId !== 'mock') {
    providersToTry.push({ id: providerId, model });
  }
  
  // Try OpenRouter Free Demo if available and not already in the list
  const hasProxy = !!import.meta.env.VITE_OPENROUTER_FREE_PROXY_URL;
  if (hasProxy && !providersToTry.some(p => p.id === 'openrouter')) {
    providersToTry.push({ id: 'openrouter', model: 'google/gemma-4-31b-it:free' });
  }

  if (providersToTry.length === 0) {
    throw new Error('No AI providers configured.');
  }

  let lastError: any = null;

  for (const provider of providersToTry) {
    try {
      let resultText = '';

      if (provider.id === 'openrouter') {
        const apiKey = loadApiKey('openrouter');
        const proxyUrl = import.meta.env.VITE_OPENROUTER_FREE_PROXY_URL;
        const openRouterMode = judgeConfig.openRouterMode || (proxyUrl ? 'demo' : 'personal');

        let url = '';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (openRouterMode === 'demo') {
          if (!proxyUrl) throw new Error('Proxy URL not configured');
          url = proxyUrl;
        } else {
          if (!apiKey) throw new Error('OpenRouter API key not configured');
          url = 'https://openrouter.ai/api/v1/chat/completions';
          headers['Authorization'] = `Bearer ${apiKey}`;
          headers['HTTP-Referer'] = window.location.origin;
          headers['X-Title'] = 'JudgeBench';
        }

        // Same resilient free-model rotation the trial runtime uses
        const draftModelChain = openRouterMode === 'demo'
          ? [provider.model, 'openai/gpt-oss-20b:free', 'nvidia/nemotron-3-super-120b-a12b:free']
          : [provider.model];

        let chainError: any = null;
        for (const draftModel of draftModelChain) {
          try {
            const response = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                model: draftModel,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt }
                ],
                temperature: 0.5,
                max_tokens: 1200,
              }),
              signal: AbortSignal.timeout(45000),
            });

            if (!response.ok) {
              const text = await response.text();
              throw new Error(`OpenRouter HTTP ${response.status}: ${text}`);
            }

            const data = await response.json();
            const message = data.choices?.[0]?.message || {};
            resultText = (message.content || '').trim() || (message.reasoning || '').trim();
            if (!resultText) throw new Error(`Empty draft completion from ${draftModel}`);
            chainError = null;
            break;
          } catch (err) {
            console.warn(`Draft attempt with ${draftModel} failed:`, err);
            chainError = err;
          }
        }
        if (chainError) throw chainError;

      } else if (provider.id === 'openai') {
        const apiKey = loadApiKey('openai');
        if (!apiKey) throw new Error('OpenAI key missing');
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: provider.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
            max_tokens: 1200
          })
        });
        
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`OpenAI HTTP ${response.status}: ${text}`);
        }
        const data = await response.json();
        resultText = data.choices?.[0]?.message?.content || '';
        
      } else if (provider.id === 'gemini') {
        const apiKey = loadApiKey('gemini');
        if (!apiKey) throw new Error('Gemini key missing');
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: `${systemPrompt}\n\nDispute description to draft case for: "${sanitizedDescription}"` }] }
            ],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 1200
            }
          })
        });
        
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Gemini HTTP ${response.status}: ${text}`);
        }
        const data = await response.json();
        resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
      } else if (provider.id === 'anthropic') {
        const apiKey = loadApiKey('anthropic');
        if (!apiKey) throw new Error('Anthropic key missing');
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: provider.model,
            messages: [{ role: 'user', content: userPrompt }],
            system: systemPrompt,
            max_tokens: 1200,
            temperature: 0.5
          })
        });
        
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Anthropic HTTP ${response.status}: ${text}`);
        }
        const data = await response.json();
        resultText = data.content?.[0]?.text || '';
        
      } else if (provider.id === 'ollama') {
        const response = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: provider.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            stream: false,
            options: { temperature: 0.5 }
          })
        });
        if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
        const data = await response.json();
        resultText = data.message?.content || '';
      } else if (provider.id === 'lmstudio' || provider.id === 'custom-openai') {
        const baseUrl = loadApiKey(provider.id as any) || 'http://localhost:1234';
        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(provider.id === 'custom-openai' ? { 'Authorization': `Bearer ${loadApiKey('custom-openai') || ''}` } : {})
          },
          body: JSON.stringify({
            model: provider.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
            max_tokens: 1200
          })
        });
        if (!response.ok) throw new Error(`Endpoint HTTP ${response.status}`);
        const data = await response.json();
        resultText = data.choices?.[0]?.message?.content || '';
      }

      if (resultText.trim()) {
        return parseCaseDraftJSON(resultText);
      }
    } catch (err) {
      console.warn(`Case generation with provider ${provider.id} failed, trying next:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('All AI providers failed.');
}

/**
 * Creates a deterministic local fallback case draft from a user's description.
 * Ensures the app does not fail silently if offline or rate-limited.
 */
export function generateFallbackCase(description: string): CaseData {
  const cleanDesc = description.trim();
  
  let plaintiff = 'Plaintiff';
  let defense = 'Defense';
  
  // Identify potential Plaintiff & Defense names by checking common split patterns
  const vsPattern = /\s+(?:vs\.?|v\.?|versus)\s+/i;
  const andPattern = /\s+(?:and|&)\s+/i;
  const debatePattern = /\s+(?:debate|debating|conflict|dispute)\s+/i;
  
  if (vsPattern.test(cleanDesc)) {
    const parts = cleanDesc.split(vsPattern);
    if (parts.length >= 2) {
      plaintiff = parts[0].trim();
      const rest = parts[1].trim();
      const verbIdx = rest.search(/\s+(?:are|is|debate|debating|fight|fighting|argue|arguing)\s+/i);
      if (verbIdx !== -1) {
        defense = rest.substring(0, verbIdx).trim();
      } else {
        defense = rest;
      }
    }
  } else if (andPattern.test(cleanDesc)) {
    const parts = cleanDesc.split(andPattern);
    if (parts.length >= 2) {
      plaintiff = parts[0].trim();
      const rest = parts[1].trim();
      const verbIdx = rest.search(/\s+(?:are|is|debate|debating|fight|fighting|argue|arguing)\s+/i);
      if (verbIdx !== -1) {
        defense = rest.substring(0, verbIdx).trim();
      } else {
        defense = rest;
      }
    }
  } else if (debatePattern.test(cleanDesc)) {
    const parts = cleanDesc.split(debatePattern);
    if (parts.length >= 2) {
      plaintiff = parts[0].trim();
      defense = parts[1].trim();
    }
  }
  
  // Clean names of symbols
  plaintiff = plaintiff.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
  defense = defense.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
  
  // Truncate if too long
  if (plaintiff.length > 25) plaintiff = plaintiff.substring(0, 25);
  if (defense.length > 25) defense = defense.substring(0, 25);

  // Capitalize first letter helper
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  plaintiff = capitalize(plaintiff);
  defense = capitalize(defense);

  if (!plaintiff || plaintiff.toLowerCase() === 'plaintiff') {
    plaintiff = 'Plaintiff Team';
  }
  if (!defense || defense.toLowerCase() === 'defense' || defense.toLowerCase() === 'defendant') {
    defense = 'Defense Team';
  }

  // Detect context keywords to construct specific, human-like summaries, facts, and evidence
  const textLower = cleanDesc.toLowerCase();
  const isTech = textLower.includes('ai') || textLower.includes('software') || textLower.includes('chatgpt') || textLower.includes('claude') || textLower.includes('code') || textLower.includes('system') || textLower.includes('technology');
  const isEdu = textLower.includes('student') || textLower.includes('university') || textLower.includes('school') || textLower.includes('grade') || textLower.includes('exam') || textLower.includes('course') || textLower.includes('professor');
  const isComm = textLower.includes('buyer') || textLower.includes('seller') || textLower.includes('purchase') || textLower.includes('money') || textLower.includes('refund') || textLower.includes('contract') || textLower.includes('car') || textLower.includes('rent') || textLower.includes('price');

  let title = '';
  let caseType = '';
  let claimSummary = '';
  let keyFacts: string[] = [];
  let evidenceItems: any[] = [];

  if (isEdu) {
    title = `${plaintiff} v. ${defense}: Grading Grievance`;
    caseType = 'Academic Grievance';
    claimSummary = `Plaintiff ${plaintiff} claims they were graded unfairly or that institutional policy was violated during their academic evaluation. Defendant ${defense} maintains the grading was conducted objectively under standard university guidelines.`;
    keyFacts = [
      `The dispute relates to coursework or exams described in: "${cleanDesc}".`,
      `${plaintiff} submitted the required work according to the syllabus guidelines.`,
      `${defense} applied official university criteria to determine the final mark.`
    ];
    evidenceItems = [
      {
        id: 'EXHIBITP1',
        exhibitNumber: 'Exhibit P-1',
        title: `${plaintiff} Graded Coursework`,
        type: 'document' as const,
        confidentiality: 'public' as const,
        summary: `The submitted coursework with written feedback or a copy of the syllabus.`,
        content: `Syllabus policies and student submission files.`,
        introducedBy: 'prosecutor' as const,
        status: 'pending' as const
      },
      {
        id: 'EXHIBITD1',
        exhibitNumber: 'Exhibit D-1',
        title: `${defense} Grading Rubric`,
        type: 'report' as const,
        confidentiality: 'public' as const,
        summary: `The official department grading guidelines and scoring sheet.`,
        content: `Grading key and evaluator comments.`,
        introducedBy: 'defense' as const,
        status: 'pending' as const
      }
    ];
  } else if (isComm) {
    title = `${plaintiff} v. ${defense}: Transaction Dispute`;
    caseType = 'Commercial Arbitration';
    claimSummary = `Plaintiff ${plaintiff} claims that ${defense} failed to deliver goods or services matching their description or payment. Defendant ${defense} denies the claim, asserting they completed their end of the agreement.`;
    keyFacts = [
      `The parties engaged in a purchase or contract: "${cleanDesc}".`,
      `Plaintiff ${plaintiff} processed the payment and expected delivery.`,
      `Defendant ${defense} claims the transaction was finalized according to terms.`
    ];
    evidenceItems = [
      {
        id: 'EXHIBITP1',
        exhibitNumber: 'Exhibit P-1',
        title: `${plaintiff} Purchase Receipt`,
        type: 'document' as const,
        confidentiality: 'public' as const,
        summary: `Receipt or transaction details demonstrating payment.`,
        content: `Receipt and order confirmation.`,
        introducedBy: 'prosecutor' as const,
        status: 'pending' as const
      },
      {
        id: 'EXHIBITD1',
        exhibitNumber: 'Exhibit D-1',
        title: `${defense} Delivery Receipt`,
        type: 'document' as const,
        confidentiality: 'public' as const,
        summary: `Shipment log or confirmation showing delivery.`,
        content: `Delivery record and logistics timestamp.`,
        introducedBy: 'defense' as const,
        status: 'pending' as const
      }
    ];
  } else if (isTech) {
    title = `${plaintiff} v. ${defense}: Capability Debate`;
    caseType = 'Technical Arbitration';
    claimSummary = `Plaintiff ${plaintiff} claims superior speed, efficiency, and intelligence for specific tasks. Defendant ${defense} argues its system output is more thorough and provides better overall results.`;
    keyFacts = [
      `The dispute involves comparing capabilities under the description: "${cleanDesc}".`,
      `Plaintiff ${plaintiff} presents benchmark metrics claiming a speed or accuracy edge.`,
      `Defendant ${defense} highlights test cases showing high contextual understanding.`
    ];
    evidenceItems = [
      {
        id: 'EXHIBITP1',
        exhibitNumber: 'Exhibit P-1',
        title: `${plaintiff} Benchmark Report`,
        type: 'report' as const,
        confidentiality: 'public' as const,
        summary: `Benchmark scores and execution log.`,
        content: `System test logs.`,
        introducedBy: 'prosecutor' as const,
        status: 'pending' as const
      },
      {
        id: 'EXHIBITD1',
        exhibitNumber: 'Exhibit D-1',
        title: `${defense} Output Evaluation`,
        type: 'report' as const,
        confidentiality: 'public' as const,
        summary: `Detailed response evaluations showing correct formatting and accuracy.`,
        content: `Evaluation logs.`,
        introducedBy: 'defense' as const,
        status: 'pending' as const
      }
    ];
  } else {
    // General civil dispute
    title = `${plaintiff} v. ${defense}: Civil Dispute`;
    caseType = 'Civil Dispute';
    claimSummary = `Plaintiff ${plaintiff} claims that ${defense} did not meet expectations or caused an issue regarding "${cleanDesc}". Defendant ${defense} disputes this, claiming they acted properly and are not at fault.`;
    keyFacts = [
      `A dispute arose regarding: "${cleanDesc}".`,
      `Plaintiff ${plaintiff} states they suffered a loss or inconvenience.`,
      `Defendant ${defense} contends they met all reasonable standards.`
    ];
    evidenceItems = [
      {
        id: 'EXHIBITP1',
        exhibitNumber: 'Exhibit P-1',
        title: `${plaintiff} Chat Log`,
        type: 'document' as const,
        confidentiality: 'public' as const,
        summary: `Communications showing the initial request and grievance.`,
        content: `Chat and email logs from Plaintiff.`,
        introducedBy: 'prosecutor' as const,
        status: 'pending' as const
      },
      {
        id: 'EXHIBITD1',
        exhibitNumber: 'Exhibit D-1',
        title: `${defense} Email Correspondence`,
        type: 'document' as const,
        confidentiality: 'public' as const,
        summary: `Record of responses illustrating the defense's position.`,
        content: `Communications and answers from Defendant.`,
        introducedBy: 'defense' as const,
        status: 'pending' as const
      }
    ];
  }

  return {
    id: `case-fallback-${Date.now()}`,
    title,
    caseType,
    plaintiffSide: plaintiff,
    defenseSide: defense,
    claimSummary,
    keyFacts,
    evidenceItems,
    legalQuestions: [
      `Whether ${plaintiff} provides superior performance for the claims asserted.`,
      `Whether ${defense} offers advantages that override the plaintiff's assertions.`
    ],
    caseSource: 'custom',
    schemaVersion: 2
  };
}
