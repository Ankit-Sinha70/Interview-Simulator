/**
 * pr-reviewer-auto.ts
 *
 * Fully automated PR reviewer that:
 *  1. Fetches the PR diff from GitHub
 *  2. Runs an AI code review using the Groq/Gemini agent
 *  3. Posts the review as a PR comment
 *  4. Approves + merges if review passes, or requests changes if it fails
 *
 * Can also be run standalone:
 *   ts-node orchestrator/pr-reviewer-auto.ts --pr 42
 */

import 'cross-fetch/polyfill';
import { execSync } from 'child_process';
import { callAgentText } from './agent.runner';
import {
  getGithubUser, mergePullRequest, getPRDiff,
  postPRComment, submitPRReview, getRepoInfo,
} from './github-agent';
import { PERMISSIONS, checkGithubIdentity } from './permissions.config';
import { PROJECT_CONTEXT } from '../project.context';

export interface ReviewResult {
  decision: 'APPROVE' | 'REQUEST_CHANGES' | 'ERROR';
  summary: string;
  merged?: boolean;
}

const REVIEWER_SYSTEM_PROMPT = `
You are a senior code reviewer for the Interview Simulator project.

${PROJECT_CONTEXT}

Review the provided git diff and produce a structured code review.

## Output format (follow exactly)

DECISION: APPROVE or REQUEST_CHANGES

## 🔴 Critical Issues
(Must fix before merge. Bugs, security holes, crashes. List "None" if clean.)

## 🟡 Warnings
(Should fix soon. Performance issues, missing error handling, anti-patterns.)

## 🟢 Suggestions
(Nice to have. Naming, architecture, minor improvements.)

## ✅ What looks good

## 📋 Verdict
One paragraph explaining the decision.

## Rules
- APPROVE only if there are zero Critical Issues
- REQUEST_CHANGES if any Critical Issue exists
- Be specific: quote file names and line content from the diff
- Flag: unhandled async errors, missing auth middleware, hardcoded secrets, missing TS types
- Flag: missing loading/error states in React components
- Flag: any AI engine calls without error handling
`;

export async function reviewAndMergePR(
  projectRoot: string,
  prNumber: number,
  featureRequest: string,
  autoMerge: boolean = true,
): Promise<ReviewResult> {
  console.log(`\n🔍 PR Reviewer Agent — reviewing PR #${prNumber}\n`);

  if (!PERMISSIONS.githubToken) {
    return { decision: 'ERROR', summary: 'GITHUB_TOKEN not set in backend/.env' };
  }

  // ── Permission check ───────────────────────────────────────────────────────
  let tokenOwner = '';
  try {
    tokenOwner = await getGithubUser();
    const check = await checkGithubIdentity(tokenOwner);
    if (!check.allowed) {
      console.error(`  🚫 ${check.reason}`);
      return { decision: 'ERROR', summary: check.reason! };
    }
    console.log(`  ✅ Reviewer identity verified (@${tokenOwner})`);
  } catch (err: any) {
    return { decision: 'ERROR', summary: `GitHub authentication failed: ${err.message}` };
  }

  const { owner, repo } = getRepoInfo(projectRoot);

  // ── Fetch PR diff ──────────────────────────────────────────────────────────
  let diff = '';
  try {
    diff = await getPRDiff(owner, repo, prNumber);
    console.log(`  📄 Fetched diff (${diff.length} chars)`);
  } catch (err: any) {
    return { decision: 'ERROR', summary: `Failed to fetch PR diff: ${err.message}` };
  }

  const trimmedDiff = diff.length > 12000 ? diff.slice(0, 12000) + '\n...(diff truncated)' : diff;

  // ── AI Review ─────────────────────────────────────────────────────────────
  console.log('  🧠 Running AI code review...');
  const reviewPrompt = `
Review this Pull Request for the Interview Simulator project.

PR #${prNumber} — Feature: ${featureRequest}

\`\`\`diff
${trimmedDiff}
\`\`\`

Produce a structured review following your instructions exactly.
Start with: DECISION: APPROVE or DECISION: REQUEST_CHANGES
`;

  let reviewText = '';
  try {
    reviewText = await callAgentText(REVIEWER_SYSTEM_PROMPT, reviewPrompt);
  } catch (err: any) {
    return { decision: 'ERROR', summary: `AI review failed: ${err.message}` };
  }

  // ── Parse decision ─────────────────────────────────────────────────────────
  const decisionMatch = reviewText.match(/DECISION:\s*(APPROVE|REQUEST_CHANGES)/i);
  const decision = (decisionMatch?.[1]?.toUpperCase() as 'APPROVE' | 'REQUEST_CHANGES') ?? 'REQUEST_CHANGES';
  console.log(`\n  ${decision === 'APPROVE' ? '✅' : '❌'} Review decision: ${decision}`);

  // ── Post comment on PR ────────────────────────────────────────────────────
  try {
    const commentBody = `## 🤖 Agent Code Review\n\n${reviewText}\n\n---\n_Decision: **${decision}**_`;
    await postPRComment(owner, repo, prNumber, commentBody);
    console.log('  💬 Review comment posted');
  } catch (err: any) {
    console.warn(`  ⚠️  Could not post comment: ${err.message}`);
  }

  // ── Submit formal GitHub review ───────────────────────────────────────────
  try {
    await submitPRReview(owner, repo, prNumber, decision,
      decision === 'APPROVE'
        ? '✅ Agent review passed. No critical issues found.'
        : '❌ Critical issues found. Please address before merging.',
    );
    console.log(`  📋 GitHub review submitted: ${decision}`);
  } catch (err: any) {
    console.warn(`  ⚠️  Could not submit GitHub review: ${err.message}`);
  }

  // ── Auto-merge if approved ─────────────────────────────────────────────────
  let merged = false;
  if (decision === 'APPROVE' && autoMerge) {
    const mergeResult = await mergePullRequest(projectRoot, prNumber, featureRequest);
    merged = mergeResult.success;
    if (!mergeResult.success) console.error(`  ❌ Merge failed: ${mergeResult.reason}`);
  } else if (decision === 'REQUEST_CHANGES') {
    console.log('  ⛔ Changes requested — fix issues and re-run reviewer.');
  }

  return { decision, summary: reviewText, merged };
}

// ── Standalone CLI usage ──────────────────────────────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  const prIdx = args.indexOf('--pr');
  const noMerge = args.includes('--no-merge');

  if (prIdx === -1 || !args[prIdx + 1]) {
    console.error('Usage: ts-node orchestrator/pr-reviewer-auto.ts --pr <number> [--no-merge]');
    process.exit(1);
  }

  const prNumber = parseInt(args[prIdx + 1], 10);
  const projectRoot = require('path').resolve(__dirname, '../..');

  require('dotenv').config({ path: require('path').join(projectRoot, 'backend/.env') });

  reviewAndMergePR(projectRoot, prNumber, 'manual review', !noMerge)
    .then(result => {
      console.log(`\n📊 Final decision: ${result.decision}`);
      if (result.merged) console.log('✅ PR merged successfully!');
      process.exit(result.decision === 'ERROR' ? 1 : 0);
    })
    .catch(err => {
      console.error('❌ Reviewer failed:', err);
      process.exit(1);
    });
}
