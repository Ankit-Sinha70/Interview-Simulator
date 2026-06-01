import { callAI } from './provider.factory';
import { ISkillGap, IRoadmapWeek } from '../models/careerGrowth.model';

export interface CareerEngineInput {
    rolePreference?: string;
    experienceLevel?: string;
    targetJobDescription?: {
        title?: string;
        company?: string;
        rawText: string;
    };
    parsedResume?: {
        role?: string;
        experienceYears?: string;
        skills: string[];
        technologies: string[];
        projects: { name: string; description: string; techStack: string[] }[];
        experience: { role: string; company: string; duration: string; responsibilities: string[] }[];
    };
    atsScore?: {
        score: number;
        matchedSkills: string[];
        missingSkills: string[];
        suggestions: string[];
        resumeMatchScore?: number;
        githubMatchScore?: number;
        overallMatchScore?: number;
    };
    githubProfile?: {
        summary?: string;
        detectedTechnologies?: string[];
        topRepositories?: string[];
        strongestAreas?: string[];
        moderateAreas?: string[];
        weakAreas?: string[];
    };
    recentSessions: {
        role: string;
        experienceLevel: string;
        averageScore: number;
        averageTechnical: number;
        averageDepth: number;
        averageClarity: number;
        averageProblemSolving: number;
        averageCommunication: number;
        weakestDimension: string;
        strongestDimension: string;
        strongestAreas?: string[];
        weakestAreas?: string[];
        focusScore: number;
        voiceConfidenceScore?: number | null;
        date: string;
    }[];
    streaks: {
        currentStreak: number;
        longestStreak: number;
        completionRate: number;
    };
}

export interface CareerEngineResult {
    readinessScore: number;
    readinessBreakdown: {
        technical: number;
        communication: number;
        confidence: number;
        consistency: number;
    };
    roleSuitability: string;
    aiRecommendation: string;
    skillGap: ISkillGap[];
    skillGapInsight: string;
    coachMessage: string;
    coachRecommendations: string[];
    roadmap: IRoadmapWeek[];
    resumeAlignment: {
        alignmentScore: number;
        insights: string[];
        strongSkills: string[];
        improvementSkills: string[];
    };
    weakAreas: string[];
    resumeValidationScore: number;
    githubValidationScore: number;
    recruiterRecommendation: {
        recommendation: 'YES' | 'NO';
        reason: string;
        concerns: string[];
    };
}

const CAREER_ADVISOR_PROMPT = `You are a premium career development advisor, technical recruiter, and expert engineering manager.
Your task is to analyze the candidate's historical interview sessions, resume claims, target job details, and public GitHub portfolio to calculate their current hiring readiness, skill gaps, personalized roadmaps, and coaching recommendations.

USER CONTEXT:
- Role Preference: <<<ROLE_PREF>>>
- Target Job Title: <<<JD_TITLE>>> at <<<JD_COMPANY>>>
- Experience Preference: <<<EXP_PREF>>>
- Job Description Text:
<<<JD_TEXT>>>

RESUME INFO:
- Role Claimed: <<<RESUME_ROLE>>>
- Years of Experience Claimed: <<<RESUME_EXP>>>
- Claimed Skills: <<<RESUME_SKILLS>>>
- Claimed Technologies: <<<RESUME_TECH>>>

GITHUB PORTFOLIO INFO:
- Summary: <<<GITHUB_SUMMARY>>>
- Detected Technologies: <<<GITHUB_TECH>>>
- Top Repositories: <<<GITHUB_REPOS>>>
- Strongest Areas: <<<GITHUB_STRONG>>>
- Moderate Areas: <<<GITHUB_MODERATE>>>
- Weak Areas: <<<GITHUB_WEAK>>>

ATS EVALUATION SCORE: <<<ATS_SCORE>>>/100
- Matched Skills: <<<ATS_MATCHED>>>
- Missing Skills: <<<ATS_MISSING>>>

RECENT MOCK INTERVIEWS HISTORY:
<<<INTERVIEW_HISTORY>>>

CONSISTENCY STATS:
- Current Streak: <<<STREAK_CURRENT>>> days
- Longest Streak: <<<STREAK_LONGEST>>> days
- Session Completion Rate: <<<COMPLETION_RATE>>>%

TASKS TO EXECUTE:
1. Predict Hiring Readiness:
   - Calculate an overall "readinessScore" (0-100).
   - Calculate a breakdown for 4 key categories: "technical", "communication", "confidence", "consistency".
     - Technical: based on technical/problem-solving scores.
     - Communication: based on communication/clarity scores.
     - Confidence: based on voice/focus stats, eye tracking, average scores.
     - Consistency: based on streaks, completion rates, and number of interviews.
   - Provide a "roleSuitability" assessment (e.g. "Prepared for Mid-Level Frontend Developer").
   - Write a professional 2-3 sentence summary recommendation ("aiRecommendation").
2. Perform Skill Gap Analysis:
   - Match candidate performance against expected role requirements.
   - Return expected vs actual scores (candidateScore out of 10) in the "skillGap" array.
   - Write a detailed insight ("skillGapInsight") about their weakest expected skill.
3. Provide AI Career Coach feedback:
   - Write an encouraging, professional, action-oriented, and honest coach mentorship message ("coachMessage").
   - Provide 3-4 specific next action recommendations ("coachRecommendations").
4. Design a Personalized Study Roadmap:
   - Generate a 4-week weekly study plan ("roadmap") targeting their primary technical/conceptual gaps. Each week has a "topic" and 3-4 actionable "focusItems".
5. Evaluate Resume & GitHub Validation:
   - Compare claims in their resume with their actual mock interview performance scores to calculate a "resumeValidationScore" (0-100).
   - Validate if their public GitHub repositories support their resume claims and align with their performance to calculate a "githubValidationScore" (0-100).
   - Keep the existing "resumeAlignment" object containing "alignmentScore" (equal to resumeValidationScore), detailed qualitative feedback in "insights", verified "strongSkills", and skills needing work ("improvementSkills").
6. Generate a Recruiter Recommendation:
   - Provide a final hiring prediction recommendation in "recruiterRecommendation".
   - "recommendation" must be STRICTLY "YES" or "NO".
   - "reason" must be a 1-2 sentence recruiter-style justification.
   - "concerns" must list 2-3 specific technical gaps or flags (e.g. ["Limited GraphQL exposure", "No cloud experience detected"]).
7. List top recurring "weakAreas" (array of strings).

Ensure your advice is honest, constructive, and highly practical. Avoid generic statements.

Return STRICTLY JSON matching this schema exactly:
{
  "readinessScore": number,
  "readinessBreakdown": {
    "technical": number,
    "communication": number,
    "confidence": number,
    "consistency": number
  },
  "roleSuitability": "string",
  "aiRecommendation": "string",
  "skillGap": [
    { "skill": "string", "expectedScore": number, "candidateScore": number }
  ],
  "skillGapInsight": "string",
  "coachMessage": "string",
  "coachRecommendations": ["string"],
  "roadmap": [
    { "week": number, "topic": "string", "focusItems": ["string"] }
  ],
  "resumeValidationScore": number,
  "githubValidationScore": number,
  "resumeAlignment": {
    "alignmentScore": number,
    "insights": ["string"],
    "strongSkills": ["string"],
    "improvementSkills": ["string"]
  },
  "recruiterRecommendation": {
    "recommendation": "YES" | "NO",
    "reason": "string",
    "concerns": ["string"]
  },
  "weakAreas": ["string"]
}`;

export async function generateCareerAssessment(input: CareerEngineInput): Promise<CareerEngineResult> {
    try {
        const historyText = input.recentSessions.length > 0 
            ? input.recentSessions.map((s, idx) => `Session ${idx + 1}:
- Role: ${s.role} (${s.experienceLevel})
- Date: ${s.date}
- Overall Score: ${s.averageScore}/10
- Technical: ${s.averageTechnical}/10, Problem Solving: ${s.averageProblemSolving}/10
- Communication: ${s.averageCommunication}/10, Clarity: ${s.averageClarity}/10, Depth: ${s.averageDepth}/10
- Weakest Area: ${s.weakestDimension}, Strongest Area: ${s.strongestDimension}
- Semantic Strengths: ${s.strongestAreas ? s.strongestAreas.join(', ') : 'None'}
- Semantic Weaknesses: ${s.weakestAreas ? s.weakestAreas.join(', ') : 'None'}
- Focus Score: ${s.focusScore}/100
- Voice Confidence: ${s.voiceConfidenceScore ?? 'N/A'}`).join('\n\n')
            : 'No interview sessions completed yet.';

        const resume = input.parsedResume || { role: '', experienceYears: '', skills: [], technologies: [] };
        const github = input.githubProfile || { summary: '', detectedTechnologies: [], topRepositories: [], strongestAreas: [], moderateAreas: [], weakAreas: [] };

        let prompt = CAREER_ADVISOR_PROMPT
            .replace('<<<ROLE_PREF>>>', input.rolePreference || 'Not specified')
            .replace('<<<JD_TITLE>>>', input.targetJobDescription?.title || 'Not specified')
            .replace('<<<JD_COMPANY>>>', input.targetJobDescription?.company || 'Not specified')
            .replace('<<<EXP_PREF>>>', input.experienceLevel || 'Not specified')
            .replace('<<<JD_TEXT>>>', input.targetJobDescription?.rawText || 'Not specified')
            .replace('<<<RESUME_ROLE>>>', resume.role || 'Not specified')
            .replace('<<<RESUME_EXP>>>', resume.experienceYears || 'Not specified')
            .replace('<<<RESUME_SKILLS>>>', JSON.stringify(resume.skills))
            .replace('<<<RESUME_TECH>>>', JSON.stringify(resume.technologies))
            .replace('<<<GITHUB_SUMMARY>>>', github.summary || 'Not provided')
            .replace('<<<GITHUB_TECH>>>', JSON.stringify(github.detectedTechnologies || []))
            .replace('<<<GITHUB_REPOS>>>', JSON.stringify(github.topRepositories || []))
            .replace('<<<GITHUB_STRONG>>>', JSON.stringify(github.strongestAreas || []))
            .replace('<<<GITHUB_MODERATE>>>', JSON.stringify(github.moderateAreas || []))
            .replace('<<<GITHUB_WEAK>>>', JSON.stringify(github.weakAreas || []))
            .replace('<<<ATS_SCORE>>>', input.atsScore?.score !== undefined ? String(input.atsScore.score) : 'N/A')
            .replace('<<<ATS_MATCHED>>>', JSON.stringify(input.atsScore?.matchedSkills || []))
            .replace('<<<ATS_MISSING>>>', JSON.stringify(input.atsScore?.missingSkills || []))
            .replace('<<<INTERVIEW_HISTORY>>>', historyText)
            .replace('<<<STREAK_CURRENT>>>', String(input.streaks.currentStreak))
            .replace('<<<STREAK_LONGEST>>>', String(input.streaks.longestStreak))
            .replace('<<<COMPLETION_RATE>>>', String(input.streaks.completionRate));

        const result = await callAI<CareerEngineResult>(prompt);
        return result;
    } catch (error: any) {
        console.error('[CareerEngine] Failed to generate career assessment:', error);
        throw error;
    }
}
