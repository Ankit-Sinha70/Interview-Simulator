import { callAI } from './provider.factory';

export interface ATSEvaluationInput {
    resume?: {
        role?: string;
        experienceYears?: string;
        skills: string[];
        technologies: string[];
        projects: { name: string; description: string; techStack: string[] }[];
    };
    githubProfile?: {
        summary?: string;
        detectedTechnologies?: string[];
        topRepositories?: string[];
        strongestAreas?: string[];
        moderateAreas?: string[];
        weakAreas?: string[];
    };
    jobDescription: string;
}

export interface ATSEvaluationResult {
    score: number;
    resumeMatchScore: number;
    githubMatchScore: number;
    overallMatchScore: number;
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
    candidateStrengths: string[];
    potentialRiskAreas: string[];
    githubValidationScore: number;
    suggestions: string[];
}

const ATS_EVALUATOR_PROMPT = `You are an expert Applicant Tracking System (ATS) algorithm and technical recruiter.
Evaluate the candidate's profile against the target Job Description (JD).

CANDIDATE RESUME PROFILE:
- Role Claimed: <<<ROLE>>>
- Experience: <<<EXPERIENCE>>>
- Skills: <<<SKILLS>>>
- Technologies: <<<TECH>>>
- Projects: <<<PROJECTS>>>

CANDIDATE GITHUB PROFILE:
- Summary: <<<GITHUB_SUMMARY>>>
- Detected Tech: <<<GITHUB_TECH>>>
- Strongest Areas: <<<GITHUB_STRONG>>>
- Moderate Areas: <<<GITHUB_MODERATE>>>
- Weakest Areas: <<<GITHUB_WEAK>>>

TARGET JOB DESCRIPTION:
<<<JD>>>

Compare the details and execute these steps:
1. Identify matching keywords/skills and calculate "resumeMatchScore" (0-100) representing how well their resume matches the JD requirements.
2. Calculate "githubMatchScore" (0-100) representing how well their public GitHub activities/repositories align with the JD requirements.
3. Calculate "overallMatchScore" (0-100) (as well as the main "score" key) as a weighted blend of Resume and GitHub alignment against the JD.
4. Calculate "githubValidationScore" (0-100) representing the alignment between the Resume claims and the GitHub repositories evidence. (e.g. if resume claims "Advanced React Developer" and github has "multiple React projects", score is high. If resume claims "Cloud Engineer" but github has "no cloud-related projects", score is low).
5. Calculate score breakdowns (0-100):
   - "technicalMatch": compatibility of technical skills
   - "experienceMatch": how well their years of experience aligns with the role demands
   - "projectRelevance": alignment of their projects to the JD duties
   - "communicationPrediction": a predicted score on how well they communicate based on project descriptions and role history
6. Calculate an overall "readinessScore" (0-100) indicating if they are ready for real-world interviews.
7. List target experience levels they are suitable for ("readyFor").
8. List target experience levels they need practice/improvement before attempting ("needsImprovementBefore").
9. List candidate's key strengths ("candidateStrengths") and missing skills ("missingSkills") based on the JD.
10. Identify potential danger/risk areas ("potentialRiskAreas" e.g., ["No cloud deployment experience found", "Limited testing exposure"]).
11. Provide 3-4 actionable suggestions to optimize their profile/resume for this specific JD.

Return STRICTLY JSON. Do not include markdown formatting or explanation. 
Your response must match this schema exactly:
{
  "score": 81,
  "resumeMatchScore": 84,
  "githubMatchScore": 78,
  "overallMatchScore": 81,
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
  "candidateStrengths": ["React", "Next.js", "TypeScript"],
  "potentialRiskAreas": ["No cloud deployment experience found", "Limited testing exposure"],
  "githubValidationScore": 85,
  "suggestions": [
    "Highlight experience with Docker containerization in your project descriptions.",
    "Add cloud architecture examples to demonstrate familiarity with AWS services.",
    "Specifically mention RESTful API design standards in your skills section."
  ]
}`;

export async function evaluateATS(input: ATSEvaluationInput): Promise<ATSEvaluationResult> {
    try {
        const resume = input.resume || { role: '', experienceYears: '', skills: [], technologies: [], projects: [] };
        const github = input.githubProfile || { summary: '', detectedTechnologies: [], strongestAreas: [], moderateAreas: [], weakAreas: [] };
        
        let prompt = ATS_EVALUATOR_PROMPT
            .replace('<<<ROLE>>>', resume.role || 'Not specified')
            .replace('<<<EXPERIENCE>>>', resume.experienceYears || 'Not specified')
            .replace('<<<SKILLS>>>', JSON.stringify(resume.skills))
            .replace('<<<TECH>>>', JSON.stringify(resume.technologies))
            .replace('<<<PROJECTS>>>', JSON.stringify(resume.projects))
            .replace('<<<GITHUB_SUMMARY>>>', github.summary || 'Not provided')
            .replace('<<<GITHUB_TECH>>>', JSON.stringify(github.detectedTechnologies || []))
            .replace('<<<GITHUB_STRONG>>>', JSON.stringify(github.strongestAreas || []))
            .replace('<<<GITHUB_MODERATE>>>', JSON.stringify(github.moderateAreas || []))
            .replace('<<<GITHUB_WEAK>>>', JSON.stringify(github.weakAreas || []))
            .replace('<<<JD>>>', input.jobDescription);

        const result = await callAI<ATSEvaluationResult>(prompt);
        const overallScore = typeof result.score === 'number' ? result.score : 50;
        
        return {
            score: overallScore,
            resumeMatchScore: typeof result.resumeMatchScore === 'number' ? result.resumeMatchScore : overallScore,
            githubMatchScore: typeof result.githubMatchScore === 'number' ? result.githubMatchScore : overallScore,
            overallMatchScore: typeof result.overallMatchScore === 'number' ? result.overallMatchScore : overallScore,
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
            candidateStrengths: Array.isArray(result.candidateStrengths) ? result.candidateStrengths : [],
            potentialRiskAreas: Array.isArray(result.potentialRiskAreas) ? result.potentialRiskAreas : [],
            githubValidationScore: typeof result.githubValidationScore === 'number' ? result.githubValidationScore : 50,
            suggestions: Array.isArray(result.suggestions) ? result.suggestions : []
        };
    } catch (error) {
        console.error('[ATSEngine] Failed to evaluate ATS matching score:', error);
        return {
            score: 0,
            resumeMatchScore: 0,
            githubMatchScore: 0,
            overallMatchScore: 0,
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
            candidateStrengths: [],
            potentialRiskAreas: [],
            githubValidationScore: 0,
            suggestions: ['Failed to run ATS evaluation. Please try again.']
        };
    }
}
