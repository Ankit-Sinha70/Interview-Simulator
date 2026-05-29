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
}

const CAREER_ADVISOR_PROMPT = `You are a premium career development advisor and expert engineering manager.
Your task is to analyze the candidate's historical interview sessions, their resume claims, their target job details, and calculate their current hiring readiness, skill gaps, personalized roadmaps, and coaching recommendations.

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
   - Provide a "roleSuitability" assessment (e.g. "Prepared for Mid-Level Frontend Developer", "Almost ready for Senior", or "Need fundamental practice").
   - Write a professional 2-3 sentence summary recommendation ("aiRecommendation").
2. Perform Skill Gap Analysis:
   - Match candidate performance against expected role requirements. Define expected skills based on the target role/job description (e.g., if Frontend: "React", "TypeScript", "State Management", "Performance Optimization"; if Backend: "Node.js", "Databases", "APIs", "System Design", etc.).
   - Return expected vs actual scores (candidateScore out of 10) in the "skillGap" array.
   - Write a detailed insight ("skillGapInsight") about their weakest expected skill and how to improve it.
3. Provide AI Career Coach feedback:
   - Write an encouraging, professional, action-oriented, and honest coach mentorship message ("coachMessage") based on their last 5 sessions.
   - Provide 3-4 specific next action recommendations ("coachRecommendations").
4. Design a Personalized Study Roadmap:
   - Generate a 4-week weekly study plan ("roadmap") targeting their primary technical/conceptual gaps. Each week has a "topic" and 3-4 actionable "focusItems".
5. Evaluate Resume Alignment:
   - Compare claims in their resume with their mock interview performance scores.
   - Provide a "resumeAlignmentScore" (0-100), detailed qualitative feedback in "insights", a list of verified "strongSkills", and a list of skills needing work ("improvementSkills").
6. List top recurring "weakAreas" (array of strings, e.g. ["System Design", "Database Optimization", "Communication Clarity"]).

Ensure your advice is honest, constructive, and highly practical. Avoid generic motivational statements.

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
  "resumeAlignment": {
    "alignmentScore": number,
    "insights": ["string"],
    "strongSkills": ["string"],
    "improvementSkills": ["string"]
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
- Focus Score: ${s.focusScore}/100
- Voice Confidence: ${s.voiceConfidenceScore ?? 'N/A'}`).join('\n\n')
            : 'No interview sessions completed yet.';

        const resume = input.parsedResume || { role: '', experienceYears: '', skills: [], technologies: [] };

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
