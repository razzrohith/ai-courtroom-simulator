import type { CaseData } from '../types/courtroom';
import { loadApiKey, loadCourtroomConfig } from '../types/providers';
import { parseCaseDraftJSON } from './caseDraftParser';

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
  const sanitizedDescription = description
    .replace(/<[^>]*>?/gm, '') // strip HTML/tags
    .substring(0, 300)        // limit description length
    .trim();

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
  "caseType": "The type of case, e.g. 'Intellectual Property Dispute', 'Civil Liability', or 'Philosophical Debate'",
  "plaintiffSide": "Name of the Plaintiff side, e.g. 'ChatGPT'",
  "defenseSide": "Name of the Defense side, e.g. 'Claude'",
  "claimSummary": "A concise summary of the dispute, claims, and counterclaims. Keep it under 3 sentences.",
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
Keep all text short, simple, and courtroom-ready. No long legal jargon. No real legal advice.
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
    providersToTry.push({ id: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free' });
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
        
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: provider.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
            max_tokens: 1200,
          })
        });
        
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`OpenRouter HTTP ${response.status}: ${text}`);
        }
        
        const data = await response.json();
        resultText = data.choices?.[0]?.message?.content || '';
        
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
            'anthropic-version': '2023-06-01'
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
  plaintiff = plaintiff.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();
  defense = defense.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();
  
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

  const title = `${plaintiff} v. ${defense}: Dispute of Priority & Capability`;
  const caseType = 'Civil Arbitration / Technical Dispute';
  const claimSummary = `The parties are locked in a dispute regarding "${cleanDesc}". Plaintiff ${plaintiff} asserts priority, higher performance, and superior utility. Defendant ${defense} disputes these claims, arguing its own architecture provides superior value.`;
  
  const keyFacts = [
    `The dispute arose from assertions relating to: "${cleanDesc}".`,
    `Plaintiff ${plaintiff} relies on performance metrics and user efficiency data to claim priority.`,
    `Defendant ${defense} contends that alternative evolutionary, architectural, or design parameters favor its position.`
  ];
  
  const evidenceItems = [
    {
      id: 'EXHIBITP1',
      exhibitNumber: 'Exhibit P-1',
      title: `${plaintiff} Benchmark Report`,
      type: 'report' as const,
      confidentiality: 'public' as const,
      summary: `Document showing the capabilities and arguments for ${plaintiff}.`,
      content: `Detailed capability report for ${plaintiff}.`,
      introducedBy: 'prosecutor' as const,
      status: 'pending' as const
    },
    {
      id: 'EXHIBITD1',
      exhibitNumber: 'Exhibit D-1',
      title: `${defense} Capability Study`,
      type: 'report' as const,
      confidentiality: 'public' as const,
      summary: `Research findings showing the defense side arguments and data for ${defense}.`,
      content: `Detailed capability log for ${defense}.`,
      introducedBy: 'defense' as const,
      status: 'pending' as const
    }
  ];

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
