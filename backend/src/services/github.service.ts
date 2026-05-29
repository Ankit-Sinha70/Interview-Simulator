import axios from 'axios';
import { callAI } from '../ai/provider.factory';

export interface GitHubRepo {
    name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    updated_at: string;
}

export async function fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
    try {
        const response = await axios.get(`https://api.github.com/users/${username}/repos?per_page=30&sort=updated`, {
            headers: {
                'User-Agent': 'Interview-Simulator-App',
                'Accept': 'application/vnd.github.v3+json',
            }
        });
        return response.data.map((repo: any) => ({
            name: repo.name,
            description: repo.description,
            language: repo.language,
            stargazers_count: repo.stargazers_count,
            updated_at: repo.updated_at
        }));
    } catch (err: any) {
        console.error(`[GitHubService] Error fetching repos for ${username}:`, err.message);
        throw new Error(err.response?.data?.message || 'Failed to fetch GitHub profile');
    }
}

export async function generateGitHubSummary(repos: GitHubRepo[]): Promise<string> {
    if (repos.length === 0) return 'No public repositories found.';
    
    const repoInfo = repos.map(r => 
        `- ${r.name} (${r.language || 'Unknown'}): ${r.description || 'No description'} (${r.stargazers_count} stars)`
    ).join('\n');

    const prompt = `You are an expert technical recruiter. Analyze the following candidate's GitHub repositories and provide a 2-3 sentence professional summary of their active technical skills, frameworks, and project focus. Return STRICTLY a JSON object with a single key "summary":

GITHUB REPOSITORIES:
${repoInfo}

Example Response Format:
{
  "summary": "The candidate shows strong activity in TypeScript and Next.js, with key projects focusing on AI simulators and backend REST APIs. Their repositories exhibit a clean architecture approach and custom tooling development."
}`;

    try {
        interface SummaryRes {
            summary: string;
        }
        const res = await callAI<SummaryRes>(prompt);
        return res.summary || 'Analyzed public repositories.';
    } catch (err) {
        console.error('[GitHubService] Failed to generate summary:', err);
        return 'Analyzed public repositories.';
    }
}
