// ============================================
// Interview Session Data Model — v3 (MongoDB + Intelligence)
// ============================================

// ─── Enums & Literal Types ───

export type Role = 'Frontend Developer' | 'Backend Developer' | 'Fullstack Developer' | 'Custom';
export type ExperienceLevel = 'Junior' | 'Mid' | 'Senior';
export type SessionStatus = 'CREATED' | 'IN_PROGRESS' | 'COMPLETED';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';
export type InterviewMode = 'text' | 'voice' | 'hybrid';
export type QuestionType = 'initial' | 'followup';
export type HireRecommendation = 'Yes' | 'Maybe' | 'No';
export type HireBand = 'Strong Hire' | 'Hire' | 'Borderline' | 'No Hire';
export type FollowUpIntent = 'CLARIFY_TECHNICAL' | 'PROBE_DEPTH' | 'SCENARIO_BASED' | 'ESCALATE_DIFFICULTY';

// ─── Voice Metadata ───

export interface VoiceMetadata {
    durationSeconds: number;
    fillerWordCount: number;
    pauseCount: number;
    wordsPerMinute: number;
}

// ─── Answer Info ───

export interface AnswerInfo {
    text: string;
    voiceMeta?: VoiceMetadata;
    answeredAt: string;
}

// ─── Evaluation ───

export interface Evaluation {
    technicalScore: number;
    depthScore: number;
    clarityScore: number;
    problemSolvingScore: number;
    communicationScore: number;
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    majorTechnicalErrors?: string[];
}

// ─── Question Entry ───

export interface QuestionEntry {
    questionId: string;
    questionText: string;
    topic: string;
    difficulty: Difficulty;
    type: QuestionType;
    generatedFromWeakness?: string;
    answer: AnswerInfo | null;
    evaluation: Evaluation | null;
}

// ─── Aggregated Scores ───

export interface AggregatedScores {
    averageTechnical: number;
    averageDepth: number;
    averageClarity: number;
    averageProblemSolving: number;
    averageCommunication: number;
    overallAverage: number;
    strongestDimension: string;
    weakestDimension: string;
}

// ─── Weakness Tracker ───

export interface WeaknessTracker {
    technicalWeakCount: number;
    depthWeakCount: number;
    clarityWeakCount: number;
    problemSolvingWeakCount: number;
    communicationWeakCount: number;
}

// ─── Interview Session ───

export interface InterviewSession {
    sessionId: string;
    userId?: string;
    role: Role | string;
    experienceLevel: ExperienceLevel;
    mode: InterviewMode;
    status: SessionStatus;
    questions: QuestionEntry[];
    totalQuestions: number;
    currentQuestionIndex: number;
    aggregatedScores: AggregatedScores | null;
    weaknessTracker: WeaknessTracker;
    topicScores: Record<string, number[]>;
    finalReport: FinalReport | null;
    promptVersion: string;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
}

// ─── Final Report ───

export interface FinalReport {
    averageScore: number;
    strongestAreas: string[];
    weakestAreas: string[];
    confidenceLevel: ConfidenceLevel;
    hireRecommendation: HireRecommendation;
    hireBand: HireBand;
    improvementRoadmap: string[];
    nextPreparationFocus: string[];
}

// ─── AI Response Types ───

export interface GeneratedQuestion {
    question: string;
    difficulty: Difficulty;
    topic: string;
}

export interface FollowUpQuestion {
    question: string;
    focusArea: string; // Keep for backward compatibility, mapped to 'topic'
    topic: string;
    difficulty: Difficulty;
    intent: FollowUpIntent;
}
