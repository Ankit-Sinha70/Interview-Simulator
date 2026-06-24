/**
 * permissions.config.ts
 *
 * Defines who is allowed to push commits and merge PRs through the agent pipeline.
 * Values are read from backend/.env so you don't hardcode personal info.
 *
 * Required env vars in backend/.env:
 *   ALLOWED_GIT_NAME=Ankit
 *   ALLOWED_GIT_EMAIL=ar86748483@gmail.com
 *   ALLOWED_GITHUB_USERNAME=Ankit-Sinha70
 *   GITHUB_TOKEN=ghp_...
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

export const PERMISSIONS = {
  allowedGitName:       process.env.ALLOWED_GIT_NAME       || '',
  allowedGitEmail:      process.env.ALLOWED_GIT_EMAIL      || '',
  allowedGithubUsername: process.env.ALLOWED_GITHUB_USERNAME || '',
  githubToken:          process.env.GITHUB_TOKEN            || '',
};

/** Verify local git config matches the allowed committer */
export function checkGitIdentity(currentName: string, currentEmail: string): {
  allowed: boolean;
  reason?: string;
} {
  if (!PERMISSIONS.allowedGitName || !PERMISSIONS.allowedGitEmail) {
    return { allowed: false, reason: 'ALLOWED_GIT_NAME or ALLOWED_GIT_EMAIL not set in backend/.env' };
  }

  if (currentName.trim() !== PERMISSIONS.allowedGitName.trim()) {
    return {
      allowed: false,
      reason: `Git user.name "${currentName}" does not match allowed committer "${PERMISSIONS.allowedGitName}"`,
    };
  }

  if (currentEmail.trim() !== PERMISSIONS.allowedGitEmail.trim()) {
    return {
      allowed: false,
      reason: `Git user.email "${currentEmail}" does not match allowed email "${PERMISSIONS.allowedGitEmail}"`,
    };
  }

  return { allowed: true };
}

/** Verify the GitHub token owner matches the allowed GitHub username */
export async function checkGithubIdentity(tokenOwner: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  if (!PERMISSIONS.allowedGithubUsername) {
    return { allowed: false, reason: 'ALLOWED_GITHUB_USERNAME not set in backend/.env' };
  }

  if (tokenOwner.toLowerCase() !== PERMISSIONS.allowedGithubUsername.toLowerCase()) {
    return {
      allowed: false,
      reason: `GitHub token owner "${tokenOwner}" does not match allowed username "${PERMISSIONS.allowedGithubUsername}"`,
    };
  }

  return { allowed: true };
}
