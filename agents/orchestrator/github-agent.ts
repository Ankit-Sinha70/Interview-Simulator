/**
 * github-agent.ts
 *
 * Creates and merges GitHub Pull Requests using direct GitHub REST API calls.
 * No Octokit dependency — works on any Node.js version.
 */

import 'cross-fetch/polyfill';
import { execSync } from 'child_process';
import { PERMISSIONS, checkGithubIdentity } from './permissions.config';

export interface PRResult {
  success: boolean;
  prNumber?: number;
  prUrl?: string;
  reason?: string;
}

export interface MergeResult {
  success: boolean;
  mergeCommitSha?: string;
  reason?: string;
}

// ─── GitHub API helper ────────────────────────────────────────────────────────
async function ghRequest<T = any>(
  method: string,
  endpoint: string,
  body?: object,
  acceptHeader?: string,
): Promise<{ ok: boolean; status: number; data: T }> {
  const url = `https://api.github.com${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${PERMISSIONS.githubToken}`,
      Accept: acceptHeader || 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any;
  const text = await res.text();
  try { data = JSON.parse(text); } catch { data = text; }

  return { ok: res.ok, status: res.status, data };
}

/** Parse owner/repo from git remote URL */
function getRepoInfo(projectRoot: string): { owner: string; repo: string } {
  const remoteUrl = execSync('git remote get-url origin', {
    cwd: projectRoot, encoding: 'utf-8',
  }).trim();
  const match = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?$/);
  if (!match) throw new Error(`Cannot parse GitHub owner/repo from: ${remoteUrl}`);
  return { owner: match[1], repo: match[2] };
}

/** Verify GitHub token and return the authenticated username */
export async function getGithubUser(): Promise<string> {
  const { ok, data } = await ghRequest('GET', '/user');
  if (!ok) throw new Error(`GitHub auth failed: ${data?.message || 'unknown error'}`);
  return data.login as string;
}

/** Create a Pull Request */
export async function createPullRequest(
  projectRoot: string,
  branchName: string,
  featureRequest: string,
  agentSummary: string,
): Promise<PRResult> {
  console.log('\n🐙 GitHub Agent — creating Pull Request\n');

  if (!PERMISSIONS.githubToken) {
    return { success: false, reason: 'GITHUB_TOKEN not set in backend/.env' };
  }

  // Permission check
  let tokenOwner = '';
  try {
    tokenOwner = await getGithubUser();
    console.log(`  👤 GitHub identity: @${tokenOwner}`);
  } catch (err: any) {
    return { success: false, reason: `GitHub auth failed: ${err.message}` };
  }

  const githubCheck = await checkGithubIdentity(tokenOwner);
  if (!githubCheck.allowed) {
    console.error(`  🚫 ${githubCheck.reason}`);
    return { success: false, reason: githubCheck.reason };
  }
  console.log('  ✅ GitHub identity verified');

  const { owner, repo } = getRepoInfo(projectRoot);

  const prBody = [
    `## 🤖 Agent-Generated Feature`,
    '',
    `**Request:** ${featureRequest}`,
    '',
    `## What was built`,
    agentSummary,
    '',
    `## Checklist`,
    '- [ ] TypeScript checks pass',
    '- [ ] Code reviewed by PR Reviewer Agent',
    '- [ ] Manually tested in dev environment',
    '',
    `---`,
    `_This PR was created automatically by the Interview Simulator Agent Orchestrator._`,
  ].join('\n');

  const { ok, data } = await ghRequest('POST', `/repos/${owner}/${repo}/pulls`, {
    title: `feat: ${featureRequest}`,
    head: branchName,
    base: 'main',
    body: prBody,
    draft: false,
  });

  if (!ok) {
    return { success: false, reason: `Failed to create PR: ${data?.message || JSON.stringify(data)}` };
  }

  console.log(`  ✅ PR #${data.number} created: ${data.html_url}`);
  return { success: true, prNumber: data.number, prUrl: data.html_url };
}

/** Merge an open Pull Request */
export async function mergePullRequest(
  projectRoot: string,
  prNumber: number,
  featureRequest: string,
): Promise<MergeResult> {
  console.log(`\n  🔀 Merging PR #${prNumber}...`);

  if (!PERMISSIONS.githubToken) {
    return { success: false, reason: 'GITHUB_TOKEN not set' };
  }

  const { owner, repo } = getRepoInfo(projectRoot);

  // Check PR is open and mergeable
  const { ok: getOk, data: pr } = await ghRequest('GET', `/repos/${owner}/${repo}/pulls/${prNumber}`);
  if (!getOk) return { success: false, reason: `Could not fetch PR: ${pr?.message}` };
  if (pr.state !== 'open') return { success: false, reason: `PR #${prNumber} is already ${pr.state}` };
  if (pr.mergeable === false) return { success: false, reason: `PR #${prNumber} has merge conflicts` };

  const { ok, data } = await ghRequest('PUT', `/repos/${owner}/${repo}/pulls/${prNumber}/merge`, {
    commit_title: `feat: ${featureRequest} (#${prNumber})`,
    commit_message: 'Merged by PR Reviewer Agent after successful review.',
    merge_method: 'squash',
  });

  if (!ok) {
    return { success: false, reason: `Merge failed: ${data?.message || JSON.stringify(data)}` };
  }

  console.log(`  ✅ Merged! Commit: ${data.sha}`);
  return { success: true, mergeCommitSha: data.sha };
}

/** Fetch the raw diff of a PR */
export async function getPRDiff(owner: string, repo: string, prNumber: number): Promise<string> {
  const { data } = await ghRequest('GET', `/repos/${owner}/${repo}/pulls/${prNumber}`, undefined, 'application/vnd.github.v3.diff');
  return typeof data === 'string' ? data : JSON.stringify(data);
}

/** Post a comment on a PR */
export async function postPRComment(owner: string, repo: string, prNumber: number, body: string): Promise<void> {
  await ghRequest('POST', `/repos/${owner}/${repo}/issues/${prNumber}/comments`, { body });
}

/** Submit a formal GitHub review (APPROVE or REQUEST_CHANGES) */
export async function submitPRReview(
  owner: string,
  repo: string,
  prNumber: number,
  event: 'APPROVE' | 'REQUEST_CHANGES',
  body: string,
): Promise<void> {
  await ghRequest('POST', `/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, { event, body });
}

export { getRepoInfo };
