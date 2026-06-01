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

export interface GitHubAnalysisResult {
    summary: string;
    detectedTechnologies: string[];
    topRepositories: string[];
    strongestAreas: string[];
    moderateAreas: string[];
    weakAreas: string[];
}

export async function generateGitHubSummary(repos: GitHubRepo[]): Promise<GitHubAnalysisResult> {
    const defaultResult: GitHubAnalysisResult = {
        summary: 'No public repositories found.',
        detectedTechnologies: [],
        topRepositories: [],
        strongestAreas: [],
        moderateAreas: [],
        weakAreas: []
    };

    if (repos.length === 0) return defaultResult;
    
    const repoInfo = repos.map(r => 
        `- ${r.name} (${r.language || 'Unknown'}): ${r.description || 'No description'} (${r.stargazers_count} stars)`
    ).join('\n');

    const prompt = `You are an expert technical recruiter and engineering manager. Analyze the following candidate's GitHub repositories and provide a structured JSON profile analysis:

GITHUB REPOSITORIES:
${repoInfo}

Provide:
1. "summary": A 2-3 sentence professional summary of their active technical skills, frameworks, and project focus.
2. "detectedTechnologies": A list of technologies/languages/frameworks detected across their repositories (e.g. ["React", "TypeScript", "Node.js"]).
3. "topRepositories": Names of the most complex, popular, or active repositories (e.g. ["e-commerce-platform", "interview-simulator"]).
4. "strongestAreas": Technical domains they show high skill or high activity in (e.g. ["Frontend Development", "State Management"]).
5. "moderateAreas": Domains they show moderate skill or fewer projects in (e.g. ["Backend Development"]).
6. "weakAreas": Domains/areas required in modern full-stack setups but showing weak or no evidence in these repositories (e.g. ["Cloud Infrastructure", "CI/CD Pipelines", "Automated Testing"]).

Return STRICTLY JSON. Do not include markdown formatting or explanations. 
Your response must match this schema exactly:
{
  "summary": "string",
  "detectedTechnologies": ["string"],
  "topRepositories": ["string"],
  "strongestAreas": ["string"],
  "moderateAreas": ["string"],
  "weakAreas": ["string"]
}`;

    try {
        const res = await callAI<GitHubAnalysisResult>(prompt);
        return {
            summary: res.summary || 'Analyzed public repositories.',
            detectedTechnologies: Array.isArray(res.detectedTechnologies) ? res.detectedTechnologies : [],
            topRepositories: Array.isArray(res.topRepositories) ? res.topRepositories : [],
            strongestAreas: Array.isArray(res.strongestAreas) ? res.strongestAreas : [],
            moderateAreas: Array.isArray(res.moderateAreas) ? res.moderateAreas : [],
            weakAreas: Array.isArray(res.weakAreas) ? res.weakAreas : []
        };
    } catch (err) {
        console.error('[GitHubService] Failed to generate summary:', err);
        return defaultResult;
    }
}
