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
    endsAt: string;
    maxQuestions: number;
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
    sessionEnded: boolean;
    reason?: string;
    finalReport?: FinalReport;
}

export interface TimeAnalysis {
    averageTimePerQuestion: number;
    fastestAnswerTime: number;
    slowestAnswerTime: number;
    timeEfficiencyScore: number;
    charts: { questionIndex: number; timeSeconds: number; score: number }[];
    insights: string[];
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
    timeAnalysis?: TimeAnalysis;
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

    return json.data;
}


export async function startInterview(data: StartInterviewRequest): Promise<StartInterviewResponse> {
    const token = localStorage.getItem('token');
    return apiCall<StartInterviewResponse>('/interview/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
    });
}

export async function submitAnswer(
    sessionId: string,
    answer: string,
    voiceMeta?: VoiceMetadata,
): Promise<AnswerResponse> {
    const token = localStorage.getItem('token');
    return apiCall<AnswerResponse>('/interview/answer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId, answer, voiceMeta }),
    });
}

export interface AttentionStats {
    focusScore: number;
    totalLookAwayTime: number;
    longestLookAway: number;
    distractionEvents: number;
    focusCategory: 'Excellent' | 'Good' | 'Moderate' | 'Low';
}

export async function completeInterview(sessionId: string, attentionStats?: AttentionStats): Promise<FinalReport> {
    const token = localStorage.getItem('token');
    return apiCall<FinalReport>('/interview/complete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId, attentionStats }),
    });
}

export async function getSession(sessionId: string): Promise<any> {
    const token = localStorage.getItem('token');
    return apiCall<any>(`/interview/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export async function markWarningTriggered(sessionId: string): Promise<void> {
    const token = localStorage.getItem('token');
    await apiCall<void>(`/interview/${sessionId}/warning-shown`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
    });
}

export async function verifySubscription(sessionId: string): Promise<any> {
    const token = localStorage.getItem('token');
    return apiCall<any>('/subscription/verify-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId }),
    });
}

export async function getUserAnalytics(userId: string): Promise<any> {
    const token = localStorage.getItem('token');
    return apiCall<any>(`/analytics/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export interface AnalyticsSummaryResponse {
    readinessScore: number;
    totalInterviews: number;
    // ... we don't need a perfectly deep type, just what the component uses
    limitedHistory?: boolean;
    [key: string]: any; // Allow other properties
}

export async function getAnalyticsSummary(userId: string): Promise<AnalyticsSummaryResponse> {
    const token = localStorage.getItem('token');
    return apiCall<AnalyticsSummaryResponse>(`/analytics/summary/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export async function syncSubscription(): Promise<any> {
    const token = localStorage.getItem('token');
    return apiCall<any>('/subscription/sync', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
}

// ─── Active Session Detection ───

export interface ActiveSessionResponse {
    hasActiveSession: boolean;
    sessionId?: string;
    questionCount?: number;
    maxQuestions?: number;
    endsAt?: string;
    role?: string;
    currentQuestion?: GeneratedQuestion | null;
}

export async function getActiveSession(): Promise<ActiveSessionResponse> {
    const token = localStorage.getItem('token');
    return apiCall<ActiveSessionResponse>('/interview/active', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export async function abandonSession(sessionId: string): Promise<any> {
    const token = localStorage.getItem('token');
    return apiCall<any>('/interview/abandon', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId }),
    });
}

// ─── Subscription Transparency ───

export interface SubscriptionDetails {
    planType: 'FREE' | 'PRO';
    status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    daysRemaining: number | null;
    totalDays: number | null;
    cancelAtPeriodEnd: boolean;
    hasStripeId?: boolean;
    billingCycle?: 'MONTHLY' | 'ANNUAL' | null;
    usage: {
        interviewsUsed: number;
        interviewsLimit: number | 'UNLIMITED';
    };
}

export async function getMySubscription(): Promise<SubscriptionDetails> {
    const token = localStorage.getItem('token');
    return apiCall<SubscriptionDetails>('/subscription/me', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export async function createPortalSession(): Promise<{ url: string }> {
    const token = localStorage.getItem('token');
    return apiCall<{ url: string }>('/subscription/create-portal-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
}
