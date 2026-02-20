import { AnalyticsModel } from '../schemas/analytics.schema';
import { InterviewSessionModel } from '../schemas/interviewSession.schema';
import { User } from '../models/user.model';

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

    // Session Integrity
    sessionIntegrity: {
        completedSessions: number;
        abandonedSessions: number;
        abandonRate: number;
        healthStatus: 'Healthy' | 'Moderate' | 'Needs Attention';
        avgScoreBeforeAbandon: number;
        avgFocusBeforeAbandon: number;
        avgQuestionsBeforeAbandon: number;
        mostAbandonedAtQuestion: number | null;
        insights: string[];
        completionStreak: number;
    };

    // Downgrade Impact
    limitedHistory?: boolean;
}

/**
 * Get comprehensive analytics summary for a user
 */
export async function getAnalyticsSummary(userId: string): Promise<AnalyticsSummary> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    let allSessions = await AnalyticsModel.find({ userId, questionsCount: { $gte: 10 } }).sort({ createdAt: 1 });

    // Downgrade Impact: Gate history for FREE tier
    const isFree = user.planType === 'FREE';
    const isLimited = isFree && allSessions.length > 2;

    // If limited, only use the 2 most recent sessions for all metrics/trends/history
    const sessions = isLimited ? allSessions.slice(-2) : allSessions;

    // ── Session Integrity: Query InterviewSessionModel for abandon data ──
    const allUserSessionsData = await InterviewSessionModel.find(
        { userId, status: { $in: ['COMPLETED', 'ABANDONED', 'TIME_EXPIRED', 'MAX_QUESTIONS_REACHED'] } },
        { status: 1, questions: 1, aggregatedScores: 1, attentionStats: 1, createdAt: 1, role: 1 }
    ).sort({ createdAt: -1 }).lean();

    // If limited, also restrict the abandon stats to only look at recent history roughly matching the 2 sessions
    // We'll just slice to the last 5 attempts to keep the donut chart relevant to recent activity
    const allUserSessions = isLimited ? allUserSessionsData.slice(0, 5) : allUserSessionsData;

    const completedCount = allUserSessions.filter(s => s.status === 'COMPLETED' || s.status === 'MAX_QUESTIONS_REACHED').length;
    const abandonedSessions = allUserSessions.filter(s => s.status === 'ABANDONED');
    const abandonedCount = abandonedSessions.length;
    const totalCount = completedCount + abandonedCount;
    const abandonRate = totalCount > 0 ? round((abandonedCount / totalCount) * 100) : 0;

    let healthStatus: 'Healthy' | 'Moderate' | 'Needs Attention' = 'Healthy';
    if (abandonRate > 40) healthStatus = 'Needs Attention';
    else if (abandonRate > 20) healthStatus = 'Moderate';

    // Abandon correlation metrics
    const abandonQCounts = abandonedSessions.map(s => s.questions?.filter((q: any) => q.answer !== null).length || 0);
    const avgQuestionsBeforeAbandon = abandonQCounts.length > 0 ? round(avg(abandonQCounts)) : 0;

    // Most frequent abandon question number
    let mostAbandonedAtQuestion: number | null = null;
    if (abandonQCounts.length > 0) {
        const qCountMap: Record<number, number> = {};
        for (const c of abandonQCounts) {
            qCountMap[c] = (qCountMap[c] || 0) + 1;
        }
        mostAbandonedAtQuestion = Number(Object.entries(qCountMap).sort((a, b) => b[1] - a[1])[0][0]);
    }

    const abandonScores = abandonedSessions
        .map(s => s.aggregatedScores?.overallAverage)
        .filter((s): s is number => typeof s === 'number' && s > 0);
    const avgScoreBeforeAbandon = abandonScores.length > 0 ? round(avg(abandonScores)) : 0;

    const abandonFocus = abandonedSessions
        .map(s => s.attentionStats?.focusScore)
        .filter((f): f is number => typeof f === 'number' && f > 0);
    const avgFocusBeforeAbandon = abandonFocus.length > 0 ? round(avg(abandonFocus)) : 0;

    // Completion streak (consecutive completed from most recent)
    let completionStreak = 0;
    for (const s of allUserSessions) {
        if (s.status === 'COMPLETED' || s.status === 'MAX_QUESTIONS_REACHED') {
            completionStreak++;
        } else {
            break;
        }
    }

    // Generate behavioral insights
    const insights: string[] = [];
    if (abandonedCount === 0) {
        insights.push('Great discipline! You have completed every interview you started.');
    } else {
        if (mostAbandonedAtQuestion !== null) {
            insights.push(`You tend to abandon interviews around Question ${mostAbandonedAtQuestion}.`);
        }
        if (avgFocusBeforeAbandon > 0 && avgFocusBeforeAbandon < 65) {
            insights.push(`Abandoned sessions had lower focus scores (avg ${avgFocusBeforeAbandon}%). Improving focus may help you complete more interviews.`);
        }
        if (avgScoreBeforeAbandon > 0 && avgScoreBeforeAbandon < 5) {
            insights.push(`Abandoned sessions had lower scores (avg ${avgScoreBeforeAbandon}/10). Consider reviewing weaker topics before starting.`);
        }
        if (abandonRate > 30) {
            insights.push('Completing interviews gives more accurate performance insights. Try to finish each session for better analytics.');
        }
    }
    if (completionStreak >= 3) {
        insights.push(`🏅 ${completionStreak} interviews completed in a row! Keep up the streak.`);
    }

    const sessionIntegrity = {
        completedSessions: completedCount,
        abandonedSessions: abandonedCount,
        abandonRate,
        healthStatus,
        avgScoreBeforeAbandon,
        avgFocusBeforeAbandon,
        avgQuestionsBeforeAbandon,
        mostAbandonedAtQuestion,
        insights,
        completionStreak,
    };

    if (sessions.length === 0) {
        return { ...getEmptySummary(), sessionIntegrity, limitedHistory: isLimited };
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

    // ── Readiness Penalty for high abandon rate ──
    let abandonPenalty = 0;
    if (abandonRate > 30) {
        abandonPenalty = Math.min(10, (abandonRate - 30) * 0.3);
    }
    const adjustedConsistency = Math.max(0, consistencyNorm - abandonPenalty);

    const readinessScore = round(
        knowledgeNorm * 0.4 +
        timeEffNorm * 0.2 +
        focusNorm * 0.2 +
        adjustedConsistency * 0.2
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
        consistencyScore: round(adjustedConsistency / 10), // back to 0-10 for display
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
        sessionIntegrity,
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
        sessionIntegrity: {
            completedSessions: 0,
            abandonedSessions: 0,
            abandonRate: 0,
            healthStatus: 'Healthy' as const,
            avgScoreBeforeAbandon: 0,
            avgFocusBeforeAbandon: 0,
            avgQuestionsBeforeAbandon: 0,
            mostAbandonedAtQuestion: null,
            insights: [],
            completionStreak: 0,
        },
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
