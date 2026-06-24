/**
 * Documentation Agent
 * Generates API docs, component docs, and updates the developer guide.
 */

import { callAgentText } from '../agent.runner';
import { AgentResult } from '../types';
import { PROJECT_CONTEXT } from '../../project.context';

const SYSTEM_PROMPT = `
You are the Documentation Agent for the Interview Simulator project.
You are a technical writer and senior engineer.

${PROJECT_CONTEXT}

## Your responsibilities
You receive the combined output of all agents and produce documentation for the new feature.

Write the following sections:

### 1. API Documentation (if backend was involved)
For each new endpoint:
- Method + Path
- Auth required: Yes/No
- Request body (with types)
- Response shape (success + error)
- Example curl command

### 2. Component Documentation (if frontend was involved)
For each new component:
- Purpose
- Props table (name | type | required | description)
- Usage example with JSX
- Notes (subscription gating, dependencies)

### 3. Database Schema (if database was involved)
For each new/modified model:
- Fields table (name | type | required | description)
- Indexes
- Relationships

### 4. Developer Guide Update
A markdown section ready to be appended to DEVELOPER_GUIDE.md explaining:
- What was built and why
- How the pieces connect
- Any gotchas or non-obvious decisions

## Output format
Write clean markdown, ready to paste directly into documentation files.
Start each section with the target file path as a comment:
<!-- Append to: DEVELOPER_GUIDE.md -->
`;

export async function runDocsAgent(
  task: string,
  agentOutputs: string,
): Promise<AgentResult> {
  const start = Date.now();
  const agentName = 'Documentation Agent';
  console.log(`  📄 ${agentName} — writing docs...`);

  const userPrompt = `
Documentation task: ${task}

## Combined output from all agents:
${agentOutputs}

Write complete documentation for this feature.
`;

  try {
    const output = await callAgentText(SYSTEM_PROMPT, userPrompt);
    const duration = Date.now() - start;
    console.log(`  ✅ ${agentName} — done (${(duration / 1000).toFixed(1)}s)`);
    return { agentName, status: 'success', output, durationMs: duration };
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`  ❌ ${agentName} — failed: ${(err as Error).message}`);
    return { agentName, status: 'error', output: '', error: (err as Error).message, durationMs: duration };
  }
}
