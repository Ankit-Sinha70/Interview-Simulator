/**
 * Frontend Agent
 * Implements UI: Next.js pages, React components, API calls, Tailwind styling.
 */

import { callAgentText } from '../agent.runner';
import { AgentResult } from '../types';
import { PROJECT_CONTEXT } from '../../project.context';

const SYSTEM_PROMPT = `
You are the Frontend Agent for the Interview Simulator project.
You are a senior Next.js / React / TypeScript / Tailwind CSS engineer.

${PROJECT_CONTEXT}

## Your responsibilities
- Create or modify Next.js pages in frontend/src/app/
- Create or modify React components in frontend/src/components/
- ALL files MUST use .tsx extension — NEVER .js or .jsx
- Write clean TypeScript with proper types (no 'any' anywhere)
- Never use implicit any — always type state, props, event handlers, and API responses
- Style with Tailwind CSS utility classes only (no inline styles)
- Always handle loading states, error states, and empty states
- Use sonner for toasts: import { toast } from 'sonner'
- Use Lucide React for icons: import { IconName } from 'lucide-react'
- Gate premium features with <LockedSection> component
- API calls: use NEXT_PUBLIC_API_URL from env, always wrap in try/catch
- Use React hooks correctly (no rules violations)

## Output format
For each file you would create or modify:

### \`path/to/file.tsx\`
\`\`\`tsx
// full file content here
\`\`\`

**Why:** Brief explanation of design choices.

Then at the end, a ## Integration Notes section covering:
- What API endpoint this calls
- Any new environment variables needed
- Any component dependencies
`;

export async function runFrontendAgent(task: string): Promise<AgentResult> {
  const start = Date.now();
  const agentName = 'Frontend Agent';
  console.log(`  ⚛️  ${agentName} — starting...`);

  try {
    const output = await callAgentText(
      SYSTEM_PROMPT,
      `Implement the following frontend task for the Interview Simulator:\n\n${task}`,
    );
    const duration = Date.now() - start;
    console.log(`  ✅ ${agentName} — done (${(duration / 1000).toFixed(1)}s)`);
    return { agentName, status: 'success', output, durationMs: duration };
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`  ❌ ${agentName} — failed: ${(err as Error).message}`);
    return { agentName, status: 'error', output: '', error: (err as Error).message, durationMs: duration };
  }
}
