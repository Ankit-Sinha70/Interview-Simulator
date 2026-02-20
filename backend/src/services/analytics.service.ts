import { AnalyticsModel } from '../schemas/analytics.schema';

// ─── Response Types ───

export interface AnalyticsSummary {
    // Readiness
    readinessScore: number;
    trend: 'Improving' | 'Declining' | 'Stable';
    knowledgeAverage: number;
    timeEfficiency: number;
    focusAverage: number;
    consistencyScore: number;

    // Totals
    totalSessions: number;
    highestScore: number;
    overallAverage: number;
    improvementRate: number | null;

    // Skill Breakdown
    skills: {
        technical: number;
        depth: number;
        clarity: number;
        problemSolving: number;
        communication: number;
    };
    strongestDimension: string;
    weakestDimension: string;

    // Performance Trend
    performanceTrend: {
        session: string;
        score: number;
        date: string;
        role: string;
    }[];

    // Time Analytics
    timeStats: {
        avgTimePerQuestion: number;
        fastestAnswer: number;
        slowestAnswer: number;
        efficiencyScore: number;
        perSession: { session: string; avgTime: number; score: number }[];
    };

    // Focus Analytics
    focusStats: {
        avgFocusScore: number;
        avgDistractions: number;
        focusGrade: 'Green' | 'Yellow' | 'Red';
        focusTrend: { session: string; focusScore: number; date: string }[];
    };

    // Weakness Insights
    weaknessInsights: {
        recurringWeakDimension: string;
        recurringWeakCount: number;
        lowScoreQuestionCount: number;
        suggestedFocus: string;
    };

    // Interview History
    interviews: {
        date: string;
        role: string;
        score: number;
        questionsCount: number;
        timeMinutes: number;
        focusScore: number;
        status: string;
        sessionId: string;
    }[];
}

/**
 * Get comprehensive analytics summary for a user
 */
export async function getAnalyticsSummary(userId: string): Promise<AnalyticsSummary> {
    const sessions = await AnalyticsModel.find({ userId }).sort({ createdAt: 1 });

    if (sessions.length === 0) {
        return getEmptySummary();
    }

    const n = sessions.length;

    // ── Skill Averages ──
    const avgTech = avg(sessions.map(s => s.averageTechnical || 0));
    const avgDepth = avg(sessions.map(s => s.averageDepth || 0));
    const avgClarity = avg(sessions.map(s => s.averageClarity || 0));
    const avgPS = avg(sessions.map(s => s.averageProblemSolving || 0));
    const avgComm = avg(sessions.map(s => s.averageCommunication || 0));

    // ── Overall ──
    const scores = sessions.map(s => s.averageScore);
    const overallAvg = avg(scores);
    const highestScore = Math.max(...scores);

    // ── Improvement Rate ──
    let improvementRate: number | null = null;
    if (n >= 2 && scores[0] > 0) {
        improvementRate = Math.round(((scores[n - 1] - scores[0]) / scores[0]) * 100);
    }

    // ── Trend ──
    let trend: 'Improving' | 'Declining' | 'Stable' = 'Stable';
    if (n >= 3) {
        const recentHalf = scores.slice(Math.floor(n / 2));
        const earlierHalf = scores.slice(0, Math.floor(n / 2));
        const recentAvg = avg(recentHalf);
        const earlierAvg = avg(earlierHalf);
        if (recentAvg > earlierAvg + 0.3) trend = 'Improving';
        else if (recentAvg < earlierAvg - 0.3) trend = 'Declining';
    }

    // ── Strongest / Weakest Dimensions ──
    const weaknesses = sessions.map(s => s.weakestDimension);
    const strengths = sessions.map(s => s.strongestDimension);
    const strongestDimension = getMode(strengths);
    const weakestDimension = getMode(weaknesses);

    // ── Time Stats ──
    const avgTimePerQuestion = avg(sessions.map(s => s.averageTimePerQuestion || 0));
    const allFastest = sessions.filter(s => s.fastestAnswerTime > 0).map(s => s.fastestAnswerTime);
    const allSlowest = sessions.filter(s => s.slowestAnswerTime > 0).map(s => s.slowestAnswerTime);
    const fastestAnswer = allFastest.length > 0 ? Math.min(...allFastest) : 0;
    const slowestAnswer = allSlowest.length > 0 ? Math.max(...allSlowest) : 0;
    const efficiencyScore = avg(sessions.map(s => s.timeEfficiencyScore || 0));

    const timePerSession = sessions.map((s, i) => ({
        session: `S${i + 1}`,
        avgTime: round(s.averageTimePerQuestion || 0),
        score: round(s.averageScore),
    }));

    // ── Focus Stats ──
    const focusScores = sessions.map(s => s.focusScore || 0);
    const avgFocusScore = avg(focusScores);
    const avgDistractions = avg(sessions.map(s => s.distractionEvents || 0));
    let focusGrade: 'Green' | 'Yellow' | 'Red' = 'Green';
    if (avgFocusScore < 50) focusGrade = 'Red';
    else if (avgFocusScore < 75) focusGrade = 'Yellow';

    const focusTrend = sessions.map((s, i) => ({
        session: `S${i + 1}`,
        focusScore: round(s.focusScore || 0),
        date: s.createdAt.toISOString(),
    }));

    // ── Weakness Insights ──
    const weakDimensionCounts: Record<string, number> = {};
    for (const w of weaknesses) {
        if (w && w !== 'N/A') {
            weakDimensionCounts[w] = (weakDimensionCounts[w] || 0) + 1;
        }
    }
    const recurringWeakDimension = weakestDimension;
    const recurringWeakCount = weakDimensionCounts[recurringWeakDimension] || 0;

    // Count sessions with low overall scores (< 5 out of 10)
    const lowScoreQuestionCount = sessions.filter(s => s.averageScore < 5).length;

    // Suggested focus
    const suggestedFocus = getSuggestedFocus(weakestDimension);

    // ── Readiness Score (0-100) ──
    // knowledgeAvg (0-10) -> normalize to 0-100
    const knowledgeNorm = (overallAvg / 10) * 100;
    // timeEfficiency (0-10) -> normalize to 0-100
    const timeEffNorm = (efficiencyScore / 10) * 100;
    // focusAvg already 0-100
    const focusNorm = avgFocusScore;
    // Consistency: inverse of coefficient of variation
    const stdDev = Math.sqrt(
        scores.reduce((sum, s) => sum + Math.pow(s - overallAvg, 2), 0) / n
    );
    const cv = overallAvg > 0 ? stdDev / overallAvg : 1;
    const consistencyNorm = Math.max(0, Math.min(100, (1 - cv) * 100));

    const readinessScore = round(
        knowledgeNorm * 0.4 +
        timeEffNorm * 0.2 +
        focusNorm * 0.2 +
        consistencyNorm * 0.2
    );

    // ── Performance Trend ──
    const performanceTrend = sessions.map((s, i) => ({
        session: `S${i + 1}`,
        score: round(s.averageScore),
        date: s.createdAt.toISOString(),
        role: s.role,
    }));

    // ── Interview History ──
    const interviews = sessions.map(s => ({
        date: s.createdAt.toISOString(),
        role: s.role,
        score: round(s.averageScore),
        questionsCount: s.questionsCount,
        timeMinutes: Math.round((s.totalDurationSeconds || 0) / 60),
        focusScore: round(s.focusScore || 0),
        status: s.hireBand || 'N/A',
        sessionId: s.sessionId,
    })).reverse(); // Most recent first

    return {
        readinessScore: Math.min(100, Math.max(0, readinessScore)),
        trend,
        knowledgeAverage: round(overallAvg),
        timeEfficiency: round(efficiencyScore),
        focusAverage: round(avgFocusScore),
        consistencyScore: round(consistencyNorm / 10), // back to 0-10 for display
        totalSessions: n,
        highestScore: round(highestScore),
        overallAverage: round(overallAvg),
        improvementRate,
        skills: {
            technical: round(avgTech),
            depth: round(avgDepth),
            clarity: round(avgClarity),
            problemSolving: round(avgPS),
            communication: round(avgComm),
        },
        strongestDimension,
        weakestDimension,
        performanceTrend,
        timeStats: {
            avgTimePerQuestion: round(avgTimePerQuestion),
            fastestAnswer: round(fastestAnswer),
            slowestAnswer: round(slowestAnswer),
            efficiencyScore: round(efficiencyScore),
            perSession: timePerSession,
        },
        focusStats: {
            avgFocusScore: round(avgFocusScore),
            avgDistractions: round(avgDistractions),
            focusGrade,
            focusTrend,
        },
        weaknessInsights: {
            recurringWeakDimension,
            recurringWeakCount,
            lowScoreQuestionCount,
            suggestedFocus,
        },
        interviews,
    };
}

/**
 * Legacy: Get basic user analytics (kept for backward compatibility)
 */
export async function getUserAnalytics(userId: string): Promise<any> {
    const summary = await getAnalyticsSummary(userId);
    return {
        totalSessions: summary.totalSessions,
        overallAverage: summary.overallAverage,
        highestScore: summary.highestScore,
        weakestDimension: summary.weakestDimension,
        strongestDimension: summary.strongestDimension,
        averageTechnical: summary.skills.technical,
        averageDepth: summary.skills.depth,
        averageClarity: summary.skills.clarity,
        averageProblemSolving: summary.skills.problemSolving,
        averageCommunication: summary.skills.communication,
        sessions: summary.performanceTrend.map(p => ({
            overallScore: p.score,
            date: p.date,
            role: p.role,
        })),
        improvementRate: summary.improvementRate,
    };
}

/**
 * Get global system stats
 */
export async function getGlobalStats() {
    const count = await AnalyticsModel.countDocuments();
    const result = await AnalyticsModel.aggregate([
        {
            $group: {
                _id: null,
                avgScore: { $avg: '$averageScore' },
            }
        }
    ]);

    return {
        totalInterviews: count,
        globalAverageScore: result[0]?.avgScore ? Math.round(result[0].avgScore * 100) / 100 : 0,
    };
}

// ─── Helpers ───

function getEmptySummary(): AnalyticsSummary {
    return {
        readinessScore: 0,
        trend: 'Stable',
        knowledgeAverage: 0,
        timeEfficiency: 0,
        focusAverage: 0,
        consistencyScore: 0,
        totalSessions: 0,
        highestScore: 0,
        overallAverage: 0,
        improvementRate: null,
        skills: { technical: 0, depth: 0, clarity: 0, problemSolving: 0, communication: 0 },
        strongestDimension: 'N/A',
        weakestDimension: 'N/A',
        performanceTrend: [],
        timeStats: { avgTimePerQuestion: 0, fastestAnswer: 0, slowestAnswer: 0, efficiencyScore: 0, perSession: [] },
        focusStats: { avgFocusScore: 0, avgDistractions: 0, focusGrade: 'Green', focusTrend: [] },
        weaknessInsights: { recurringWeakDimension: 'N/A', recurringWeakCount: 0, lowScoreQuestionCount: 0, suggestedFocus: 'Complete more interviews to get insights.' },
        interviews: [],
    };
}

function avg(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function round(n: number): number {
    return Math.round(n * 100) / 100;
}

function getMode(arr: string[]): string {
    if (arr.length === 0) return 'N/A';
    const counts: Record<string, number> = {};
    let max = 0;
    let mode = arr[0];
    for (const item of arr) {
        if (item === 'N/A') continue;
        counts[item] = (counts[item] || 0) + 1;
        if (counts[item] > max) {
            max = counts[item];
            mode = item;
        }
    }
    return mode;
}

function getSuggestedFocus(weakDimension: string): string {
    const suggestions: Record<string, string> = {
        'Technical': 'Review core concepts, data structures, and algorithms for your target role.',
        'Depth': 'Practice explaining topics in more detail. Dive deeper into "why" and "how".',
        'Clarity': 'Structure your answers better. Use frameworks like STAR for behavioral questions.',
        'Problem Solving': 'Practice more coding challenges and system design problems.',
        'Communication': 'Work on articulating your thought process. Practice explaining concepts aloud.',
    };
    return suggestions[weakDimension] || 'Keep practicing to identify specific areas for improvement.';
}
