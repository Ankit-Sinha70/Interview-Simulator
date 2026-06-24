/**
 * agent.runner.ts
 *
 * Core AI caller for all agents. Supports Groq and Gemini providers.
 * Switch with AGENT_PROVIDER env var (defaults to 'groq').
 *
 * Groq free tier is much more generous than Gemini's — recommended.
 *
 * Two modes:
 *  - callAgentJSON<T>()  → returns parsed JSON  (used by Planner)
 *  - callAgentText()     → returns markdown text (used by specialist agents)
 */

// Polyfill fetch for CommonJS / ts-node environments
import 'cross-fetch/polyfill';

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from backend/.env so agents share the same keys
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const PROVIDER = (process.env.AGENT_PROVIDER || 'groq') as 'groq' | 'gemini';

// ─── Retry helper ─────────────────────────────────────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('Too Many Requests');
      if (is429 && attempt < maxRetries) {
        const msg = err?.message || '';

        // Daily limit (TPD) — wait time will be minutes, not seconds. Fail fast.
        const isDaily = msg.includes('per day') || msg.includes('TPD');
        if (isDaily) {
          const minMatch = msg.match(/(\d+)m(\d+)s/);
          const waitMin  = minMatch ? parseInt(minMatch[1]) : '?';
          console.error(`\n  ❌ Daily token limit reached. Reset in ~${waitMin} minutes.`);
          console.error('  Options:');
          console.error('    1. Wait and retry later');
          console.error('    2. Switch provider:  set AGENT_PROVIDER=gemini');
          console.error('    3. Use a lighter model: set GROQ_MODEL=gemma2-9b-it\n');
          throw err; // don't retry — won't help
        }

        // Per-minute limit (TPM) — parse actual wait time and retry
        const secMatch = msg.match(/(\d+(?:\.\d+)?)s\b/);
        const waitSeconds = secMatch ? Math.ceil(parseFloat(secMatch[1])) + 2 : Math.pow(2, attempt) * 5;
        console.log(`  ⏳ Rate limited (TPM). Waiting ${waitSeconds}s... (attempt ${attempt}/${maxRetries})`);
        await new Promise(r => setTimeout(r, waitSeconds * 1000));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

// ─── JSON extraction helper ───────────────────────────────────────────────────
function extractJSON<T>(text: string): T {
  const cleaned = text.trim();
  const startBrace   = cleaned.indexOf('{');
  const startBracket = cleaned.indexOf('[');
  let start = -1, end = -1;

  if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
    start = startBrace;
    end   = cleaned.lastIndexOf('}');
  } else if (startBracket !== -1) {
    start = startBracket;
    end   = cleaned.lastIndexOf(']');
  }

  const json = start !== -1 && end > start ? cleaned.substring(start, end + 1) : cleaned;
  return JSON.parse(json) as T;
}

// ═════════════════════════════════════════════════════════════════════════════
// GROQ PROVIDER
// ═════════════════════════════════════════════════════════════════════════════

async function groqRequest(
  messages: Array<{ role: string; content: string }>,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not found in backend/.env');

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  });

  if (!response.ok) {
    const body = await response.text();
    const err: any = new Error(`Groq ${response.status}: ${body}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json() as any;
  return data.choices[0].message.content as string;
}

async function groqCallJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const jsonSystemPrompt = systemPrompt + '\n\nIMPORTANT: Your response must be valid JSON only. No markdown, no explanation, just the JSON object.';
  const text = await groqRequest(
    [{ role: 'system', content: jsonSystemPrompt }, { role: 'user', content: userPrompt }],
    0.3,
    2048,
  );
  return extractJSON<T>(text);
}

async function groqCallText(systemPrompt: string, userPrompt: string): Promise<string> {
  return groqRequest(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    0.7,
    4096,
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// GEMINI PROVIDER
// ═════════════════════════════════════════════════════════════════════════════

async function geminiCallJSON<T>(prompt: string): Promise<T> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not found in backend/.env');

  const model_name = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: model_name,
    generationConfig: { temperature: 0.3, maxOutputTokens: 2048, responseMimeType: 'application/json' },
  });

  const result = await model.generateContent(prompt);
  return extractJSON<T>(result.response.text());
}

async function geminiCallText(systemPrompt: string, userPrompt: string): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not found in backend/.env');

  const model_name = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: model_name,
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  });

  const result = await model.generateContent(userPrompt);
  return result.response.text();
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC API — provider-agnostic callers used by all agents
// ═════════════════════════════════════════════════════════════════════════════

console.log(`[Agents] Using provider: ${PROVIDER}`);

export async function callAgentJSON<T>(prompt: string): Promise<T> {
  return withRetry(() =>
    PROVIDER === 'groq'
      ? groqCallJSON<T>('You are a JSON-only planning agent.', prompt)
      : geminiCallJSON<T>(prompt)
  );
}

export async function callAgentText(systemPrompt: string, userPrompt: string): Promise<string> {
  return withRetry(() =>
    PROVIDER === 'groq'
      ? groqCallText(systemPrompt, userPrompt)
      : geminiCallText(systemPrompt, userPrompt)
  );
}
