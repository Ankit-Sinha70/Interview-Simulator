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
    experienceLevel: string;
    interviewStyle?: string;
    companyStyle?: string;
    mode: 'text' | 'voice' | 'hybrid';
    useResume?: boolean;
}

import { User } from '../context/AuthContext';

export interface GeneratedQuestion {
    question: string;
    difficulty: 'easy' | 'medium' | 'hard';
    levelScore?: number;
    topic: string;
    whyAsked?: string;
    source?: string;
    relatedContext?: string | null;
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
    idealAnswer?: string;
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

export interface SkillValidation {
    skill: string;
    performanceScore: number;
    insight: string;
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
    
    // Resume-Based & Advanced Analytics
    resumeAlignmentScore?: number;
    strongResumeSkills?: string[];
    improvementResumeSkills?: string[];
    skillValidationMatrix?: SkillValidation[];
    projectUnderstandingScore?: number;
    interviewReadinessScore?: number;
    recommendedLearningPath?: string[];
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

export async function uploadResume(formData: FormData): Promise<{ message: string; url?: string }> {
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/users/resume`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData,
    });

    if (!res.ok) {
        let errorMessage = `API Request failed: ${res.status} ${res.statusText}`;
        try {
            const errorJson = await res.json();
            errorMessage = errorJson.error?.message || errorMessage;
        } catch (e) {
            console.error('[API] uploadResume error:', e);
        }
        throw new Error(errorMessage);
    }

    const json: ApiResponse<{ message: string; url?: string }> = await res.json();
    return json.data;
}

export async function updateResumeData(data: {
    role?: string;
    experienceYears?: string;
    skills?: string[];
    technologies?: string[];
    projects?: Array<{ name: string; description: string; techStack: string[] }>;
    experience?: Array<{ role: string; company: string; duration: string; responsibilities: string[] }>;
}): Promise<any> {
    const token = localStorage.getItem('token');
    return apiCall<any>('/users/resume-data', {
        method: 'PUT',
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
    attentionStats?: AttentionStats,
): Promise<AnswerResponse> {
    const token = localStorage.getItem('token');
    return apiCall<AnswerResponse>('/interview/answer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId, answer, voiceMeta, attentionStats }),
    });
}

export async function getHint(sessionId: string, partialAnswer: string): Promise<{ hint: string | null }> {
    const token = localStorage.getItem('token');
    return apiCall<{ hint: string | null }>('/interview/hint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId, partialAnswer }),
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

export interface InterviewSession {
    _id: string;
    userId: string;
    questions: Array<{
        questionText: string;
        topic: string;
        difficulty: 'easy' | 'medium' | 'hard';
        answer?: string;
        evaluation?: Evaluation;
    }>;
    status: 'READY' | 'COMPLETED' | 'TIME_EXPIRED' | 'MAX_QUESTIONS_REACHED' | 'ABANDONED';
    finalReport?: FinalReport;
    endsAt?: string;
    hasShownFiveMinWarning?: boolean;
    maxQuestions?: number;
    aggregatedScores?: AggregatedScores;
}

export async function getSession(sessionId: string): Promise<InterviewSession> {
    const token = localStorage.getItem('token');
    return apiCall<InterviewSession>(`/interview/${sessionId}`, {
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

export async function verifySubscription(sessionId: string): Promise<{ success: boolean }> {
    const token = localStorage.getItem('token');
    return apiCall<{ success: boolean }>('/subscription/verify-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId }),
    });
}

export interface UserAnalyticsSummary {
    readinessScore: number;
    totalInterviews: number;
    improvementTrend: number;
    topSkills: string[];
    weakestSkills: string[];
    [key: string]: any;
}

export async function getUserAnalytics(userId: string): Promise<UserAnalyticsSummary> {
    const token = localStorage.getItem('token');
    return apiCall<UserAnalyticsSummary>(`/analytics/user/${userId}`, {
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

export async function syncSubscription(): Promise<{ success: boolean; planType: string }> {
    const token = localStorage.getItem('token');
    return apiCall<{ success: boolean; planType: string }>('/subscription/sync', {
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

export async function abandonSession(sessionId: string): Promise<{ success: boolean }> {
    const token = localStorage.getItem('token');
    return apiCall<{ success: boolean }>('/interview/abandon', {
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
    status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'REFUNDED';
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    daysRemaining: number | null;
    totalDays: number | null;
    cancelAtPeriodEnd: boolean;
    hasStripeId?: boolean;
    billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY' | null;
    refunded?: boolean;
    refundDate?: string;
    subscriptionStartDate?: string;
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

// ─── Refund ───

export interface RefundEligibility {
    eligible: boolean;
    reason?: string;
    daysSincePurchase?: number;
    interviewsUsed?: number;
}

export async function checkRefundEligibility(): Promise<RefundEligibility> {
    const token = localStorage.getItem('token');
    return apiCall<RefundEligibility>('/subscription/refund-eligibility', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export async function requestRefund(reason?: string): Promise<{ success: boolean; refundAmount?: number; message: string }> {
    const token = localStorage.getItem('token');
    return apiCall<{ success: boolean; refundAmount?: number; message: string }>('/subscription/request-refund', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason }),
    });
}

export interface ISubscriptionPlan {
    _id: string;
    billingCycle: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';
    stripePriceId: string;
    price: number;
    durationMonths: number;
    discountPercent: number;
    isActive: boolean;
}

export async function getSubscriptionPlans(): Promise<ISubscriptionPlan[]> {
    return apiCall<ISubscriptionPlan[]>('/plans', {
        method: 'GET'
    });
}

export async function resumeSubscription(): Promise<{ success: boolean; status: string }> {
    const token = localStorage.getItem('token');
    return apiCall<{ success: boolean; status: string }>('/subscription/resume', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
}

export async function createCheckoutSession(billingCycle: string): Promise<{ url: string }> {
    const token = localStorage.getItem('token');
    return apiCall<{ url: string }>('/subscription/create-checkout-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ billingCycle }),
    });
}

// ==========================================
// 8. USER PROFILE API
// ==========================================

export const uploadProfilePicture = async (base64Image: string): Promise<User> => {
    const token = localStorage.getItem('token');
    const res = await apiCall<{ data: User }>('/users/profile-picture', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profilePicture: base64Image }),
    });
    return res.data;
};

export const updateProfile = async (name: string): Promise<User> => {
    const token = localStorage.getItem('token');
    const res = await apiCall<{ data: User }>('/users/update-profile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name }),
    });
    return res.data;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem('token');
    return apiCall<{ success: boolean; message: string }>('/users/change-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
    });
};

// ─── Welcome Offer ───

export interface WelcomeOfferStatus {
    showOffer: boolean;
    expiresAt: string | null;
    savings: number | null;
}

export async function getWelcomeOfferStatus(): Promise<WelcomeOfferStatus> {
    const token = localStorage.getItem('token');
    return apiCall<WelcomeOfferStatus>('/users/welcome-offer-status', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export async function dismissWelcomeOffer(): Promise<{ success: boolean }> {
    const token = localStorage.getItem('token');
    return apiCall<{ success: boolean }>('/users/dismiss-welcome-offer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
}

// ─── Goals & Streaks ───

export interface InterviewGoal {
    title: string;
    targetDays: number;
    startDate: string;
    targetInterviews: number;
}

export interface UserGoalData {
    interviewGoal?: InterviewGoal;
    currentStreak: number;
    longestStreak: number;
    lastInterviewDate?: string;
    completedInterviews: number;
}

export async function getUserGoal(): Promise<UserGoalData> {
    const token = localStorage.getItem('token');
    const res = await apiCall<{ data: UserGoalData }>('/users/goal', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.data;
}

export async function setUserGoal(title: string, targetInterviews: number, targetDays: number): Promise<InterviewGoal> {
    const token = localStorage.getItem('token');
    const res = await apiCall<{ data: InterviewGoal }>('/users/goal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, targetInterviews, targetDays })
    });
    return res.data;
}

// ─── Phase 2 APIs ───

export interface GitHubProfile {
    username: string;
    repos: { name: string; description?: string; language?: string; stars?: number }[];
    summary?: string;
    analyzedAt?: string;
}

export interface ATSEvalData {
    targetJobDescription: {
        title?: string;
        company?: string;
        rawText: string;
    };
    atsScore: {
        score: number;
        matchedSkills: string[];
        missingSkills: string[];
        suggestions: string[];
        updatedAt: string;
    };
}

export async function importLinkedIn(rawText?: string, file?: File): Promise<{ success: boolean; data: any }> {
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/phase2/linkedin-import`;
    
    let body: any;
    let headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
    };

    if (file) {
        const formData = new FormData();
        formData.append('file', file);
        body = formData;
    } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({ rawText });
    }

    const res = await fetch(url, {
        method: 'POST',
        headers,
        body
    });

    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to import LinkedIn profile');
    }
    return res.json();
}

export async function analyzeGitHub(username: string): Promise<GitHubProfile> {
    const token = localStorage.getItem('token');
    return apiCall<GitHubProfile>('/phase2/github-analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username })
    });
}

export async function evaluateATS(jobDescription: string, title?: string, company?: string): Promise<ATSEvalData> {
    const token = localStorage.getItem('token');
    return apiCall<ATSEvalData>('/phase2/ats-evaluate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobDescription, title, company })
    });
}

// ─── Career Dashboard APIs ───

export interface CareerDashboardData {
    userId: string;
    readinessScore: number;
    readinessBreakdown: {
        technical: number;
        communication: number;
        confidence: number;
        consistency: number;
    };
    roleSuitability: string;
    aiRecommendation: string;
    skillGap: {
        skill: string;
        expectedScore: number;
        candidateScore: number;
    }[];
    skillGapInsight: string;
    coachMessage: string;
    coachRecommendations: string[];
    roadmap: {
        week: number;
        topic: string;
        focusItems: string[];
    }[];
    resumeAlignment: {
        alignmentScore: number;
        insights: string[];
        strongSkills: string[];
        improvementSkills: string[];
    };
    weakAreas: string[];
    progressHistory: {
        date: string;
        readiness: number;
        technical: number;
        communication: number;
        confidence: number;
    }[];
    updatedAt: string;
}

export async function getCareerDashboard(): Promise<CareerDashboardData> {
    const token = localStorage.getItem('token');
    const res = await apiCall<{ success: boolean; data: CareerDashboardData }>('/career/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.data;
}

export async function refreshCareerDashboard(): Promise<CareerDashboardData> {
    const token = localStorage.getItem('token');
    const res = await apiCall<{ success: boolean; data: CareerDashboardData }>('/career/refresh', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.data;
}

