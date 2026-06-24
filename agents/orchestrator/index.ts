/**
 * Multi-Agent Orchestrator
 *
 * Full pipeline:
 *   Planner → [Frontend + Backend + Database] → QA → Docs
 *   → File Writer (writes real files) → Test Runner → Git Agent → GitHub PR → PR Reviewer → Auto-merge
 *
 * Flags:
 *   --request "..."      Feature to implement (required)
 *   --output report.md   Save full output to markdown file
 *   --no-push            Skip git push / PR creation (dry run)
 *   --no-merge           Create PR but don't auto-merge
 */

import { runPlannerAgent }      from './planner.agent';
import { runFrontendAgent }     from './subagents/frontend.agent';
import { runBackendAgent }      from './subagents/backend.agent';
import { runDatabaseAgent }     from './subagents/database.agent';
import { runQAAgent }           from './subagents/qa.agent';
import { runDocsAgent }         from './subagents/docs.agent';
import { writeAgentFiles, printWriteSummary } from './file-writer';
import { runTests }             from './test-runner';
import { runFixLoop }           from './fix-agent';
import { runGitAgent }          from './git-agent';
import { createPullRequest }    from './github-agent';
import { reviewAndMergePR }     from './pr-reviewer-auto';
import { AgentResult, OrchestratorResult } from './types';
import * as fs   from 'fs';
import * as path from 'path';

// ─── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const requestIdx = args.indexOf('--request');
const outputIdx  = args.indexOf('--output');

if (requestIdx === -1 || !args[requestIdx + 1]) {
  console.error('❌ Usage: ts-node orchestrator/index.ts --request "your feature request"');
  process.exit(1);
}

// Collect all words after --request until the next -- flag.
// This handles both quoted strings and unquoted multi-word args on Windows CMD.
const requestParts: string[] = [];
for (let i = requestIdx + 1; i < args.length; i++) {
  if (args[i].startsWith('--')) break;
  requestParts.push(args[i]);
}
const userRequest = requestParts.join(' ');

// Output file is the word immediately after --output
const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;
const noPush     = args.includes('--no-push');
const noMerge    = args.includes('--no-merge');
const ROOT_DIR   = path.resolve(__dirname, '../..');

// ─── Pretty printer ───────────────────────────────────────────────────────────
function printResult(result: AgentResult) {
  const icon = result.status === 'success' ? '✅' : result.status === 'skipped' ? '⏭️' : '❌';
  const time = `${(result.durationMs / 1000).toFixed(1)}s`;

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`${icon}  ${result.agentName.toUpperCase()}  (${time})`);
  console.log('─'.repeat(70));

  if (result.status === 'success') {
    console.log(result.output);
  } else if (result.status === 'skipped') {
    console.log('   (not needed for this request)');
  } else {
    console.log(`   Error: ${result.error}`);
  }
}

// ─── Build markdown report ────────────────────────────────────────────────────
function buildReport(result: OrchestratorResult): string {
  const lines: string[] = [
    `# Agent Report`,
    ``,
    `**Request:** ${result.request}`,
    `**Complexity:** ${result.plan.complexity}`,
    `**Total time:** ${(result.totalDurationMs / 1000).toFixed(1)}s`,
    `**Summary:** ${result.plan.summary}`,
    ``,
    `## Expected files`,
    result.plan.expectedFiles.map(f => `- \`${f}\``).join('\n'),
    ``,
  ];

  for (const r of result.results) {
    const icon = r.status === 'success' ? '✅' : r.status === 'skipped' ? '⏭️' : '❌';
    lines.push(`---`);
    lines.push(`## ${icon} ${r.agentName} (${(r.durationMs / 1000).toFixed(1)}s)`);
    lines.push(``);
    if (r.status === 'success') {
      lines.push(r.output);
    } else if (r.status === 'skipped') {
      lines.push('_Not needed for this request._');
    } else {
      lines.push(`**Error:** ${r.error}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Main orchestration flow ──────────────────────────────────────────────────
async function main() {
  const totalStart = Date.now();

  console.log('\n' + '═'.repeat(70));
  console.log('🤖  MULTI-AGENT ORCHESTRATOR — Interview Simulator');
  console.log('═'.repeat(70));
  console.log(`📝  Request: "${userRequest}"`);
  console.log('═'.repeat(70) + '\n');

  // ── Step 1: Plan ─────────────────────────────────────────────────────────
  console.log('STEP 1 — Planning\n');
  const plan = await runPlannerAgent(userRequest);

  console.log(`\n📋 Plan Summary: ${plan.summary}`);
  console.log(`📁 Expected files: ${plan.expectedFiles.join(', ') || 'TBD'}\n`);

  const results: AgentResult[] = [];

  // ── Step 2: Run specialist agents in parallel ─────────────────────────────
  console.log('STEP 2 — Specialist agents (running in parallel)\n');

  const wave1Promises: Promise<AgentResult>[] = [];

  if (plan.needsFrontend) {
    wave1Promises.push(runFrontendAgent(plan.frontendTask));
  } else {
    wave1Promises.push(Promise.resolve({
      agentName: 'Frontend Agent', status: 'skipped', output: '', durationMs: 0,
    }));
  }

  if (plan.needsBackend) {
    wave1Promises.push(runBackendAgent(plan.backendTask));
  } else {
    wave1Promises.push(Promise.resolve({
      agentName: 'Backend Agent', status: 'skipped', output: '', durationMs: 0,
    }));
  }

  if (plan.needsDatabase) {
    wave1Promises.push(runDatabaseAgent(plan.databaseTask));
  } else {
    wave1Promises.push(Promise.resolve({
      agentName: 'Database Agent', status: 'skipped', output: '', durationMs: 0,
    }));
  }

  const [frontendResult, backendResult, databaseResult] = await Promise.all(wave1Promises);
  results.push(frontendResult, backendResult, databaseResult);

  // ── Step 3: QA then Docs — run sequentially to avoid TPM exhaustion ─────
  // Running both in parallel hammers the tokens/min budget simultaneously.
  // Sequential lets the TPM window partially reset between them.
  console.log('\nSTEP 3 — QA & Documentation (sequential to respect rate limits)\n');

  // Trim wave1 output to avoid sending huge context — keep first 6000 chars per agent
  const trimOutput = (s: string) => s.length > 6000 ? s.slice(0, 6000) + '\n...(truncated)' : s;

  const wave1Output = [
    frontendResult.status === 'success' ? `## Frontend Agent Output\n${trimOutput(frontendResult.output)}` : '',
    backendResult.status  === 'success' ? `## Backend Agent Output\n${trimOutput(backendResult.output)}` : '',
    databaseResult.status === 'success' ? `## Database Agent Output\n${trimOutput(databaseResult.output)}` : '',
  ].filter(Boolean).join('\n\n');

  // QA runs first
  const qaResult = plan.needsQA
    ? await runQAAgent(plan.qaTask, wave1Output)
    : { agentName: 'QA Agent', status: 'skipped' as const, output: '', durationMs: 0 };
  results.push(qaResult);

  // Brief pause to let the TPM window breathe before Docs
  if (qaResult.status === 'success') {
    console.log('  ⏸️  Pausing 5s before Documentation Agent to avoid TPM limit...');
    await new Promise(r => setTimeout(r, 5000));
  }

  // Docs runs after QA completes
  const docsResult = await runDocsAgent(plan.docsTask, wave1Output);
  results.push(docsResult);

  // ── Step 4: Print agent results ───────────────────────────────────────────
  console.log('\n' + '═'.repeat(70));
  console.log('📊  AGENT RESULTS');
  console.log('═'.repeat(70));
  for (const r of results) printResult(r);

  // ── Step 5: Write files to disk ───────────────────────────────────────────
  console.log('\n' + '═'.repeat(70));
  console.log('💾  WRITING FILES TO DISK');
  console.log('═'.repeat(70));

  const successfulOutputs = results
    .filter(r => r.status === 'success')
    .map(r => r.output);

  const writtenFiles = writeAgentFiles(successfulOutputs, ROOT_DIR);
  printWriteSummary(writtenFiles);

  // ── Step 6: Run tests → auto-fix loop ────────────────────────────────────
  console.log('\n' + '═'.repeat(70));
  console.log('🧪  TEST RUNNER');
  console.log('═'.repeat(70));

  let testResult = runTests(ROOT_DIR);

  if (!testResult.passed) {
    console.log('\n' + '═'.repeat(70));
    console.log('🔧  FIX AGENT — auto-healing TypeScript errors');
    console.log('═'.repeat(70));

    const backendErrors  = testResult.steps.find(s => s.name === 'Backend TypeScript')?.output  || '';
    const frontendErrors = testResult.steps.find(s => s.name === 'Frontend TypeScript')?.output || '';

    const fixResult = await runFixLoop(ROOT_DIR, backendErrors, frontendErrors);

    if (fixResult.fixed) {
      console.log(`\n  ✅ Fix Agent resolved all errors in ${fixResult.attempts} attempt(s)`);
      // Re-run tests to confirm
      testResult = runTests(ROOT_DIR);
    } else {
      console.log(`\n  ⚠️  Fix Agent could not resolve all errors after ${fixResult.attempts} attempt(s).`);
      console.log('  Remaining errors will be noted in the PR for manual review.\n');
    }
  }

  // ── Step 7: Git push + PR + Review (skip if --no-push or tests failed) ───
  let prNumber: number | undefined;
  let prUrl: string | undefined;

  if (noPush) {
    console.log('\n⏭️  --no-push flag set. Skipping git + GitHub steps.');
  } else if (!testResult.passed) {
    console.log('\n⏭️  Skipping git push because tests failed.');
  } else if (writtenFiles.length === 0) {
    console.log('\n⏭️  No files were written. Skipping git push.');
  } else {
    // Git: branch + commit + push
    console.log('\n' + '═'.repeat(70));
    console.log('📦  GIT PIPELINE');
    console.log('═'.repeat(70));

    const gitResult = await runGitAgent(ROOT_DIR, userRequest, writtenFiles);

    if (gitResult.success && gitResult.branchName) {
      // GitHub: create PR
      console.log('\n' + '═'.repeat(70));
      console.log('🐙  GITHUB — CREATING PR');
      console.log('═'.repeat(70));

      const agentSummary = results
        .filter(r => r.status === 'success')
        .map(r => `**${r.agentName}:** generated ${r.output.split('\n').length} lines`)
        .join('\n');

      const prResult = await createPullRequest(ROOT_DIR, gitResult.branchName, userRequest, agentSummary);

      if (prResult.success && prResult.prNumber) {
        prNumber = prResult.prNumber;
        prUrl    = prResult.prUrl;

        // PR Reviewer: review + optional auto-merge
        console.log('\n' + '═'.repeat(70));
        console.log('🔍  PR REVIEWER AGENT');
        console.log('═'.repeat(70));

        const reviewResult = await reviewAndMergePR(ROOT_DIR, prResult.prNumber, userRequest, !noMerge);

        console.log(`\n  📋 Review decision: ${reviewResult.decision}`);
        if (reviewResult.merged) {
          console.log('  ✅ PR merged into main!');
        } else if (reviewResult.decision === 'REQUEST_CHANGES') {
          console.log('  ⛔ Fix the issues flagged in the PR review, then run:');
          console.log(`     ts-node orchestrator/pr-reviewer-auto.ts --pr ${prResult.prNumber}`);
        }
      }
    }
  }

  // ── Step 8: Save report ───────────────────────────────────────────────────
  const totalDuration = Date.now() - totalStart;
  const orchestratorResult: OrchestratorResult = { request: userRequest, plan, results, totalDurationMs: totalDuration };

  if (outputFile) {
    const reportPath = path.resolve(outputFile);
    let report = buildReport(orchestratorResult);
    if (prUrl) report += `\n\n## Pull Request\n${prUrl}\n`;
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`\n\n📄 Full report saved to: ${reportPath}`);
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`✅  Pipeline complete. Total time: ${(totalDuration / 1000).toFixed(1)}s`);
  if (prUrl) console.log(`🔗  PR: ${prUrl}`);
  console.log('═'.repeat(70) + '\n');
}

main().catch((err) => {
  console.error('❌ Orchestrator failed:', err);
  process.exit(1);
});
