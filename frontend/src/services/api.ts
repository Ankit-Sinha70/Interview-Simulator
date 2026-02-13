const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── Types ───

export interface VoiceMetadata {
    durationSeconds: number;
    fillerWordCount: number;
    pauseCount: number;
    wordsPerMinute: number;
}

export interface StartInterviewRequest {
    role: string;
    experienceLevel: 'Junior' | 'Mid' | 'Senior';
    mode?: 'text' | 'voice' | 'hybrid';
}

export interface GeneratedQuestion {
    question: string;
    difficulty: 'easy' | 'medium' | 'hard';
    topic: string;
}

export interface StartInterviewResponse {
    sessionId: string;
    question: GeneratedQuestion;
}

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
}

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

export interface AnswerResponse {
    evaluation: Evaluation;
    nextQuestion: GeneratedQuestion;
    scoringSummary: AggregatedScores;
    questionNumber: number;
}

export interface FinalReport {
    averageScore: number;
    strongestAreas: string[];
    weakestAreas: string[];
    confidenceLevel: 'High' | 'Medium' | 'Low';
    hireRecommendation: 'Yes' | 'Maybe' | 'No';
    hireBand: 'Strong Hire' | 'Hire' | 'Borderline' | 'No Hire';
    improvementRoadmap: string[];
    nextPreparationFocus: string[];
}

// ─── API Client ───

interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: { message: string };
}

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });

    if (!res.ok) {
        let errorMessage = `API Request failed: ${res.status} ${res.statusText}`;
        try {
            const errorJson = await res.json();
            errorMessage = errorJson.error?.message || errorMessage;
        } catch (e) {
            const text = await res.text();
            console.error(`[API] Non-JSON error response from ${url}:`, text.slice(0, 500));
        }
        throw new Error(errorMessage);
    }

    const json: ApiResponse<T> = await res.json();

    if (!json.success) {
        throw new Error(json.error?.message || 'API request failed');
    }

    return json.data;
}

export async function startInterview(data: StartInterviewRequest): Promise<StartInterviewResponse> {
    return apiCall<StartInterviewResponse>('/interview/start', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function submitAnswer(
    sessionId: string,
    answer: string,
    voiceMeta?: VoiceMetadata,
): Promise<AnswerResponse> {
    return apiCall<AnswerResponse>('/interview/answer', {
        method: 'POST',
        body: JSON.stringify({ sessionId, answer, voiceMeta }),
    });
}

export async function completeInterview(sessionId: string): Promise<FinalReport> {
    return apiCall<FinalReport>('/interview/complete', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
    });
}

export async function getSession(sessionId: string): Promise<any> {
    return apiCall<any>(`/interview/${sessionId}`);
}
