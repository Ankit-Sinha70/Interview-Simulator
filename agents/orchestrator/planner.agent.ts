/**
 * Planner Agent
 *
 * The brain of the system. Receives the raw user request and decomposes it
 * into a structured plan: which specialist agents are needed, what each one
 * should do, and what files will likely be touched.
 *
 * Returns a strict JSON plan (AgentPlan) consumed by the orchestrator.
 */

import { callAgentJSON } from './agent.runner';
import { AgentPlan } from './types';
import { PROJECT_CONTEXT } from '../project.context';

const PLANNER_PROMPT = (request: string) => `
${PROJECT_CONTEXT}

You are the Planner Agent for the Interview Simulator project.
Your job is to analyze a user request and decompose it into specific tasks
for each specialist agent.

## User Request
"${request}"

## Your job
Analyze the request and return a JSON object with this exact shape:

{
  "summary": "One-line summary of what is being built",
  "complexity": "low | medium | high",
  "needsFrontend": true/false,
  "needsBackend": true/false,
  "needsDatabase": true/false,
  "needsQA": true/false,
  "needsDocs": true/false,
  "frontendTask": "Detailed instructions for the Frontend Agent. Include: which pages/components to create or modify, expected props, UI behavior, API endpoints to call, loading/error states needed. Empty string if not needed.",
  "backendTask": "Detailed instructions for the Backend Agent. Include: route method + path, controller name, service logic, business rules, middleware needed, response shape. Empty string if not needed.",
  "databaseTask": "Detailed instructions for the Database Agent. Include: model name, new fields or schema changes, indexes, relationships, validation rules. Empty string if not needed.",
  "qaTask": "Detailed instructions for the QA Agent. Include: test scenarios, edge cases, error cases, and integration points to verify.",
  "docsTask": "Detailed instructions for the Documentation Agent. Include: what to document (API, component, schema), doc format needed.",
  "expectedFiles": ["list", "of", "file", "paths", "that", "will", "be", "created", "or", "modified"]
}

## Rules
- Be very specific in each task description — the agent has no other context
- Include file paths in each task where relevant (follow project conventions)
- If a feature is purely frontend (e.g. dark mode toggle), set needsBackend/needsDatabase to false
- QA agent always runs unless complexity is 'low'
- Docs agent always runs
- Expected files should follow the project's directory structure
`;

export async function runPlannerAgent(request: string): Promise<AgentPlan> {
  console.log('🧠 Planner Agent — analyzing request...');
  const plan = await callAgentJSON<AgentPlan>(PLANNER_PROMPT(request));
  console.log(`   ✅ Plan ready | complexity: ${plan.complexity} | agents: ${[
    plan.needsFrontend  && 'Frontend',
    plan.needsBackend   && 'Backend',
    plan.needsDatabase  && 'Database',
    plan.needsQA        && 'QA',
    plan.needsDocs      && 'Docs',
  ].filter(Boolean).join(', ')}`);
  return plan;
}
