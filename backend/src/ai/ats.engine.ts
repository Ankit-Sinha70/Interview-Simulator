import { callAI } from './provider.factory';

export interface ATSEvaluationInput {
    resume?: {
        role?: string;
        experienceYears?: string;
        skills: string[];
        technologies: string[];
        projects: { name: string; description: string; techStack: string[] }[];
    };
    githubSummary?: string;
    jobDescription: string;
}

export interface ATSEvaluationResult {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    suggestions: string[];
}

const ATS_EVALUATOR_PROMPT = `You are an expert Applicant Tracking System (ATS) algorithm and technical recruiter.
Evaluate the candidate's profile against the target Job Description (JD).

CANDIDATE PROFILE:
- Role Claimed: <<<ROLE>>>
- Experience: <<<EXPERIENCE>>>
- Skills: <<<SKILLS>>>
- Technologies: <<<TECH>>>
- Projects: <<<PROJECTS>>>
- GitHub Summary: <<<GITHUB>>>

TARGET JOB DESCRIPTION:
<<<JD>>>

Compare the details, identify matching keywords/skills, gaps (missing requirements or skills in candidate's profile), and calculate a match score out of 100.
Also, provide 3-4 actionable bullet suggestions to optimize their profile/resume for this specific JD.

Return STRICTLY JSON. Do not include markdown formatting or explanation. 
Your response must match this schema exactly:
{
  "score": 85,
  "matchedSkills": ["React", "TypeScript", "Node.js"],
  "missingSkills": ["Docker", "Kubernetes", "AWS CloudFormation"],
  "suggestions": [
    "Highlight experience with Docker containerization in your project descriptions.",
    "Add cloud architecture examples to demonstrate familiarity with AWS services.",
    "Specifically mention RESTful API design standards in your skills section."
  ]
}`;

export async function evaluateATS(input: ATSEvaluationInput): Promise<ATSEvaluationResult> {
    try {
        const resume = input.resume || { role: '', experienceYears: '', skills: [], technologies: [], projects: [] };
        
        let prompt = ATS_EVALUATOR_PROMPT
            .replace('<<<ROLE>>>', resume.role || 'Not specified')
            .replace('<<<EXPERIENCE>>>', resume.experienceYears || 'Not specified')
            .replace('<<<SKILLS>>>', JSON.stringify(resume.skills))
            .replace('<<<TECH>>>', JSON.stringify(resume.technologies))
            .replace('<<<PROJECTS>>>', JSON.stringify(resume.projects))
            .replace('<<<GITHUB>>>', input.githubSummary || 'Not provided')
            .replace('<<<JD>>>', input.jobDescription);

        const result = await callAI<ATSEvaluationResult>(prompt);
        return {
            score: typeof result.score === 'number' ? result.score : 50,
            matchedSkills: Array.isArray(result.matchedSkills) ? result.matchedSkills : [],
            missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : [],
            suggestions: Array.isArray(result.suggestions) ? result.suggestions : []
        };
    } catch (error) {
        console.error('[ATSEngine] Failed to evaluate ATS matching score:', error);
        return {
            score: 0,
            matchedSkills: [],
            missingSkills: [],
            suggestions: ['Failed to run ATS evaluation. Please try again.']
        };
    }
}
