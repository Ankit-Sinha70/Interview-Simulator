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
    breakdown: {
        technicalMatch: number;
        experienceMatch: number;
        projectRelevance: number;
        communicationPrediction: number;
    };
    hiringReadiness: {
        readinessScore: number;
        readyFor: string[];
        needsImprovementBefore: string[];
        reasoning: string[];
    };
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

Compare the details and execute these steps:
1. Identify matching keywords/skills, gaps (missing requirements or skills in candidate's profile), and calculate an overall match score out of 100 ("score").
2. Calculate score breakdowns (out of 100):
   - "technicalMatch": compatibility of technical skills
   - "experienceMatch": how well their years of experience aligns with the role demands
   - "projectRelevance": alignment of their projects to the JD duties
   - "communicationPrediction": a predicted score on how well they communicate based on project descriptions and role history
3. Calculate an overall "readinessScore" (out of 100) indicating if they are ready for real-world interviews.
4. List target experience levels they are suitable for ("readyFor", e.g. ["Junior Frontend Developer", "Mid-Level Frontend Developer"]).
5. List target experience levels they need practice/improvement before attempting ("needsImprovementBefore", e.g. ["Senior Frontend Developer"]).
6. Provide a list of short bullet explanations in "reasoning" explaining why they got these scores (identifying highlights and gaps).
7. Provide 3-4 actionable bullet suggestions to optimize their profile/resume for this specific JD.

Return STRICTLY JSON. Do not include markdown formatting or explanation. 
Your response must match this schema exactly:
{
  "score": 85,
  "breakdown": {
    "technicalMatch": 88,
    "experienceMatch": 80,
    "projectRelevance": 85,
    "communicationPrediction": 75
  },
  "hiringReadiness": {
    "readinessScore": 82,
    "readyFor": ["Mid-Level Frontend Developer"],
    "needsImprovementBefore": ["Senior Frontend Developer"],
    "reasoning": [
      "Strong React and TypeScript foundations listed in resume.",
      "Lacks mentioned experience with cloud deployment or AWS.",
      "GraphQL and testing frameworks are not listed on profile."
    ]
  },
  "matchedSkills": ["React", "TypeScript", "Node.js"],
  "missingSkills": ["Docker", "Kubernetes", "AWS", "GraphQL"],
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
            breakdown: result.breakdown || {
                technicalMatch: 50,
                experienceMatch: 50,
                projectRelevance: 50,
                communicationPrediction: 50
            },
            hiringReadiness: result.hiringReadiness || {
                readinessScore: 50,
                readyFor: [],
                needsImprovementBefore: [],
                reasoning: []
            },
            matchedSkills: Array.isArray(result.matchedSkills) ? result.matchedSkills : [],
            missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : [],
            suggestions: Array.isArray(result.suggestions) ? result.suggestions : []
        };
    } catch (error) {
        console.error('[ATSEngine] Failed to evaluate ATS matching score:', error);
        return {
            score: 0,
            breakdown: {
                technicalMatch: 0,
                experienceMatch: 0,
                projectRelevance: 0,
                communicationPrediction: 0
            },
            hiringReadiness: {
                readinessScore: 0,
                readyFor: [],
                needsImprovementBefore: [],
                reasoning: ['Failed to evaluate. Please try again.']
            },
            matchedSkills: [],
            missingSkills: [],
            suggestions: ['Failed to run ATS evaluation. Please try again.']
        };
    }
}
