import { AnalyticsModel } from '../schemas/analytics.schema';

export interface UserAnalyticsSummary {
    totalSessions: number;
    overallAverage: number;
    highestScore: number;
    weakestDimension: string;
    strongestDimension: string;
    averageTechnical: number;
    averageDepth: number;
    averageClarity: number;
    averageProblemSolving: number;
    averageCommunication: number;
    sessions: {
        overallScore: number;
        date: Date;
        role: string;
    }[];
    improvementRate: number | null;
}

/**
 * Get aggregated analytics for a specific user
 */
export async function getUserAnalytics(userId: string): Promise<UserAnalyticsSummary> {
    const sessions = await AnalyticsModel.find({ userId }).sort({ createdAt: 1 }); // Oldest first

    if (sessions.length === 0) {
        return {
            totalSessions: 0,
            overallAverage: 0,
            highestScore: 0,
            weakestDimension: 'N/A',
            strongestDimension: 'N/A',
            averageTechnical: 0,
            averageDepth: 0,
            averageClarity: 0,
            averageProblemSolving: 0,
            averageCommunication: 0,
            sessions: [],
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

    // Aggregated Skill Averages
    const avgTech = sessions.reduce((acc, s) => acc + (s.averageTechnical || 0), 0) / sessions.length;
    const avgDepth = sessions.reduce((acc, s) => acc + (s.averageDepth || 0), 0) / sessions.length;
    const avgClarity = sessions.reduce((acc, s) => acc + (s.averageClarity || 0), 0) / sessions.length;
    const avgPS = sessions.reduce((acc, s) => acc + (s.averageProblemSolving || 0), 0) / sessions.length;
    const avgComm = sessions.reduce((acc, s) => acc + (s.averageCommunication || 0), 0) / sessions.length;

    return {
        totalSessions: sessions.length,
        overallAverage: round(avgScore),
        highestScore: round(maxScore),
        weakestDimension: getMode(weaknesses),
        strongestDimension: getMode(strengths),
        averageTechnical: round(avgTech),
        averageDepth: round(avgDepth),
        averageClarity: round(avgClarity),
        averageProblemSolving: round(avgPS),
        averageCommunication: round(avgComm),
        sessions: sessions.map(s => ({
            overallScore: s.averageScore,
            date: s.createdAt,
            role: s.role
        })),
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
