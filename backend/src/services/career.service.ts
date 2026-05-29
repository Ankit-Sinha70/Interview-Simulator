import { User } from '../models/user.model';
import { CareerGrowth, ICareerGrowthDoc } from '../models/careerGrowth.model';
import { AnalyticsModel } from '../schemas/analytics.schema';
import { InterviewSessionModel } from '../schemas/interviewSession.schema';
import { generateCareerAssessment } from '../ai/career.engine';

/**
 * Retrieve user's career development report, creating it if missing or forceRefresh is true.
 */
export async function getOrCreateCareerReport(userId: string, forceRefresh = false): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    let report = await CareerGrowth.findOne({ userId });

    const timeSinceLastUpdate = report ? Date.now() - report.updatedAt.getTime() : Infinity;
    // Auto-refresh if report is older than 24 hours, or manual refresh requested
    const shouldRefresh = !report || forceRefresh || timeSinceLastUpdate > 24 * 60 * 60 * 1000;

    if (shouldRefresh) {
        report = await refreshCareerReport(userId);
    }

    // Gate content if user is on FREE tier
    const isFree = user.planType === 'FREE';
    if (isFree && report) {
        return getRedactedReport(report);
    }

    return report;
}

/**
 * Recalculates and caches the Career Growth report by analyzing user profile, history, and AI metrics.
 */
export async function refreshCareerReport(userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // 1. Fetch recent sessions (last 5 completed interviews)
    const dbSessions = await AnalyticsModel.find({ userId, questionsCount: { $gte: 5 } })
        .sort({ createdAt: -1 })
        .limit(5);

    const recentSessions = dbSessions.map(s => ({
        role: s.role,
        experienceLevel: s.experienceLevel,
        averageScore: s.averageScore,
        averageTechnical: s.averageTechnical,
        averageDepth: s.averageDepth,
        averageClarity: s.averageClarity,
        averageProblemSolving: s.averageProblemSolving,
        averageCommunication: s.averageCommunication,
        weakestDimension: s.weakestDimension,
        strongestDimension: s.strongestDimension,
        focusScore: s.focusScore,
        voiceConfidenceScore: s.voiceConfidenceScore,
        date: s.createdAt.toISOString()
    })).reverse(); // Oldest first for context chronological order

    // 2. Fetch session statistics for consistency score
    const allSessions = await InterviewSessionModel.find(
        { userId, status: { $in: ['COMPLETED', 'ABANDONED', 'TIME_EXPIRED', 'MAX_QUESTIONS_REACHED'] } },
        { status: 1 }
    ).lean();

    const completed = allSessions.filter(s => s.status === 'COMPLETED' || s.status === 'MAX_QUESTIONS_REACHED').length;
    const total = allSessions.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 100;

    // 3. Trigger AI assessment
    const aiAssessment = await generateCareerAssessment({
        rolePreference: user.rolePreference,
        experienceLevel: user.experienceLevel,
        targetJobDescription: user.targetJobDescription,
        parsedResume: user.parsedResume,
        atsScore: user.atsScore,
        recentSessions,
        streaks: {
            currentStreak: user.currentStreak || 0,
            longestStreak: user.longestStreak || 0,
            completionRate
        }
    });

    // 4. Construct progress trend history points
    const progressHistory = dbSessions.map((s, idx) => {
        // Calculate intermediate readiness proxy
        const techScore = (s.averageTechnical + s.averageProblemSolving) / 2;
        const commScore = (s.averageCommunication + s.averageClarity) / 2;
        const confScore = (s.focusScore / 10 + (s.voiceConfidenceScore || 7.5)) / 2;
        const readiness = Math.round((techScore * 40 + commScore * 30 + confScore * 30));

        return {
            date: s.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            readiness: Math.min(100, Math.max(0, readiness)),
            technical: Math.round(techScore * 10),
            communication: Math.round(commScore * 10),
            confidence: Math.round(confScore * 10)
        };
    }).reverse(); // Sort chronological

    // 5. Update or Create document
    let report = await CareerGrowth.findOne({ userId });
    if (!report) {
        report = new CareerGrowth({ userId });
    }

    report.readinessScore = aiAssessment.readinessScore;
    report.readinessBreakdown = aiAssessment.readinessBreakdown;
    report.roleSuitability = aiAssessment.roleSuitability;
    report.aiRecommendation = aiAssessment.aiRecommendation;
    report.skillGap = aiAssessment.skillGap;
    report.skillGapInsight = aiAssessment.skillGapInsight;
    report.coachMessage = aiAssessment.coachMessage;
    report.coachRecommendations = aiAssessment.coachRecommendations;
    report.roadmap = aiAssessment.roadmap;
    report.resumeAlignment = aiAssessment.resumeAlignment;
    report.weakAreas = aiAssessment.weakAreas;
    report.progressHistory = progressHistory;

    await report.save();
    return report;
}

/**
 * Returns a redacted version of the report with limited fields for Free users.
 */
function getRedactedReport(report: ICareerGrowthDoc) {
    const obj = report.toObject ? report.toObject() : report;
    return {
        ...obj,
        skillGap: [
            { skill: 'React', expectedScore: 9, candidateScore: 7.5 },
            { skill: 'TypeScript', expectedScore: 8.5, candidateScore: 7 },
            { skill: 'State Management', expectedScore: 8, candidateScore: 6.5 }
        ], // limited sample gap
        skillGapInsight: 'Upgrade to Pro to identify all role-specific skill gaps and receive AI-guided analysis.',
        coachMessage: 'Upgrade to Pro to unlock your personal AI Career Coach for guidance, weakness summaries, and action steps.',
        coachRecommendations: [],
        roadmap: [],
        resumeAlignment: {
            alignmentScore: 0,
            insights: ['Upgrade to Pro to review alignment between your resume claims and interview performance.'],
            strongSkills: [],
            improvementSkills: []
        },
        weakAreas: report.weakAreas.slice(0, 1) // Only show top 1 weakness
    };
}
