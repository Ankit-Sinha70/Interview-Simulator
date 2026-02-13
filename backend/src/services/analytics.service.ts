import { AnalyticsModel } from '../schemas/analytics.schema';

export interface UserAnalyticsSummary {
    totalSessions: number;
    averageScore: number;
    highestScore: number;
    weakestDimension: string;
    strongestDimension: string;
    recentTrend: number[]; // Last 5 scores
    improvementRate: number | null; // % improvement from first to last (if > 1 session)
}

/**
 * Get aggregated analytics for a specific user
 */
export async function getUserAnalytics(userId: string): Promise<UserAnalyticsSummary> {
    const sessions = await AnalyticsModel.find({ userId }).sort({ createdAt: 1 }); // Oldest first

    if (sessions.length === 0) {
        return {
            totalSessions: 0,
            averageScore: 0,
            highestScore: 0,
            weakestDimension: 'N/A',
            strongestDimension: 'N/A',
            recentTrend: [],
            improvementRate: null,
        };
    }

    const scores = sessions.map(s => s.averageScore);
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const avgScore = totalScore / sessions.length;
    const maxScore = Math.max(...scores);

    // Calculate improvement
    let improvementRate = null;
    if (sessions.length >= 2) {
        const first = scores[0];
        const last = scores[scores.length - 1];
        if (first > 0) {
            improvementRate = Math.round(((last - first) / first) * 100);
        }
    }

    // Find most frequent weakness/strength
    const weaknesses = sessions.map(s => s.weakestDimension);
    const strengths = sessions.map(s => s.strongestDimension);

    return {
        totalSessions: sessions.length,
        averageScore: Math.round(avgScore * 100) / 100,
        highestScore: round(maxScore),
        weakestDimension: getMode(weaknesses),
        strongestDimension: getMode(strengths),
        recentTrend: scores.slice(-5), // Last 5
        improvementRate,
    };
}

/**
 * Get global system stats
 */
export async function getGlobalStats() {
    // Pipeline for global averages? Keep simple for now.
    const count = await AnalyticsModel.countDocuments();
    // Use aggregation for avg
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

// Helper to find most frequent item
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

function round(n: number) {
    return Math.round(n * 100) / 100;
}
