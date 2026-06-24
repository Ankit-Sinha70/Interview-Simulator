// ─── Shared types for the multi-agent orchestration system ───────────────────

/** The decomposed plan produced by the Planner Agent */
export interface AgentPlan {
  summary: string;           // one-line summary of the request
  complexity: 'low' | 'medium' | 'high';

  // Which specialist agents are needed for this request
  needsFrontend: boolean;
  needsBackend: boolean;
  needsDatabase: boolean;
  needsQA: boolean;
  needsDocs: boolean;

  // Specific task instructions for each agent
  frontendTask: string;
  backendTask: string;
  databaseTask: string;
  qaTask: string;
  docsTask: string;

  // Files that will likely be touched (agent's prediction)
  expectedFiles: string[];
}

/** Output from a single specialist agent */
export interface AgentResult {
  agentName: string;
  status: 'success' | 'skipped' | 'error';
  output: string;      // full markdown response from the agent
  error?: string;      // if status === 'error'
  durationMs: number;
}

/** Final combined output from the orchestrator */
export interface OrchestratorResult {
  request: string;
  plan: AgentPlan;
  results: AgentResult[];
  totalDurationMs: number;
}
