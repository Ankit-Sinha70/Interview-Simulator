import * as sessionService from './session.service';
import { generateReport } from '../ai/report.engine';
import {
    FinalReport,
    HireBand,
    AttentionStats,
} from '../models/interviewSession.model';
import {
    calculateVariance,
    getConfidenceFromVariance,
    getHireBand,
    getHireRecommendation,
    getPersonalizedRoadmap,
} from '../utils/scoreCalculator';
import { isDbConnected } from '../config/db.config';
import { AnalyticsModel } from '../schemas/analytics.schema';
// ...
export async function generateFinalReport(sessionId: string, attentionStats?: AttentionStats): Promise<FinalReport> {
    const session = await sessionService.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    // Build Q&A summary for AI
    const questionsAndEvaluations = session.questions
        .filter((q) => q.answer && q.evaluation)
        .map((q, i) => {
            const answerText = q.answer?.text || '';
            const voiceLine = q.answer?.voiceMeta
                ? ` | Voice: ${q.answer.voiceMeta.wordsPerMinute} WPM, ${q.answer.voiceMeta.fillerWordCount} fillers, ${q.answer.voiceMeta.durationSeconds}s`
                : '';
            const typeLine = q.type === 'followup' && q.generatedFromWeakness
                ? ` [Follow-up targeting: ${q.generatedFromWeakness}]`
                : '';
            return `Q${i + 1} (${q.difficulty}${typeLine}): ${q.questionText}
Answer: ${answerText}${voiceLine}
Scores: Tech=${q.evaluation!.technicalScore}, Depth=${q.evaluation!.depthScore}, Clarity=${q.evaluation!.clarityScore}, PS=${q.evaluation!.problemSolvingScore}, Comm=${q.evaluation!.communicationScore}, Overall=${q.evaluation!.overallScore}
Strengths: ${q.evaluation!.strengths.join(', ')}
Weaknesses: ${q.evaluation!.weaknesses.join(', ')}`;
        })
        .join('\n\n');

    // ─── 1. Calculate Metrics First (Pre-AI) ───
    const completedEvaluations = session.questions
        .filter((q) => q.evaluation)
        .map((q) => q.evaluation!);

    // Aggregated Scores
    const aggregatedScores = session.aggregatedScores || {
        averageTechnical: 0, averageDepth: 0, averageClarity: 0,
        averageProblemSolving: 0, averageCommunication: 0,
        overallAverage: 0, strongestDimension: 'N/A', weakestDimension: 'N/A'
    };

    // Variance & Confidence
    const overallScores = completedEvaluations.map(e => e.overallScore);
    const variance = calculateVariance(overallScores);
    const calculatedConfidence = getConfidenceFromVariance(variance, overallScores.length);

    // Hire Band
    const calculatedHireBand = getHireBand(aggregatedScores.overallAverage);

    // Weakness Frequency
    const weaknessFrequency = session.questions.reduce((acc: any, q: any) => {
        if (q.generatedFromWeakness) {
            acc[q.generatedFromWeakness] = (acc[q.generatedFromWeakness] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    // ─── Time Analysis ───
    const timeAnalysis = calculateTimeMetrics(session.questions);

    // ─── 2. Generate AI Report with Full Context ───
    const aiReport = await generateReport({
        questionsAndEvaluations,
        role: session.role,
        level: session.experienceLevel,
        aggregatedScores,
        hireBand: calculatedHireBand,
        confidenceLevel: calculatedConfidence,
        weaknessFrequency,
    });

    // ─── 3. Construct Final Report ───
    // We trust AI for summary/roadmap, but enforce our calculated metrics for consistency
    const finalReport: FinalReport = {
        averageScore: aggregatedScores.overallAverage, // Enforce calculated
        strongestAreas: aiReport.strongestAreas || [],
        weakestAreas: aiReport.weakestAreas || [],
        confidenceLevel: calculatedConfidence, // Enforce calculated
        hireRecommendation: calculatedHireBand === 'Strong Hire' || calculatedHireBand === 'Hire' ? 'Yes' : 'No', // Map from band
        hireBand: calculatedHireBand, // Enforce calculated
        improvementRoadmap: aiReport.improvementRoadmap || [],
        nextPreparationFocus: aiReport.nextPreparationFocus || getPersonalizedRoadmap(aggregatedScores.weakestDimension),
        executiveSummary: aiReport.executiveSummary, // New field from Master Prompt
        timeAnalysis,
    };

    // Save to session
    await sessionService.updateSession({
        sessionId,
        status: 'COMPLETED',
        finalReport,
        completedAt: new Date().toISOString(),
        attentionStats: attentionStats || null,
    } as any);

    // Save analytics (only if DB is connected)
    if (isDbConnected()) {
        saveAnalytics(session, finalReport, calculatedHireBand).catch(() => { });
    }

    return finalReport;
}

/**
 * Save analytics snapshot for future dashboards
 */
async function saveAnalytics(
    session: any,
    report: FinalReport,
    hireBand: HireBand,
): Promise<void> {
    try {
        // Calculate total session duration
        let totalDurationSeconds = 0;
        if (session.createdAt && session.completedAt) {
            const start = new Date(session.createdAt).getTime();
            const end = new Date(session.completedAt).getTime();
            totalDurationSeconds = Math.round((end - start) / 1000);
        }

        await AnalyticsModel.create({
            sessionId: session.sessionId,
            userId: session.userId || null,
            role: session.role,
            experienceLevel: session.experienceLevel,
            mode: session.mode,
            averageScore: report.averageScore,
            averageTechnical: session.aggregatedScores?.averageTechnical || 0,
            averageDepth: session.aggregatedScores?.averageDepth || 0,
            averageClarity: session.aggregatedScores?.averageClarity || 0,
            averageProblemSolving: session.aggregatedScores?.averageProblemSolving || 0,
            averageCommunication: session.aggregatedScores?.averageCommunication || 0,
            weakestDimension: session.aggregatedScores?.weakestDimension || 'N/A',
            strongestDimension: session.aggregatedScores?.strongestDimension || 'N/A',
            questionsCount: session.questions.length,
            averageTimePerQuestion: report.timeAnalysis?.averageTimePerQuestion || 0,
            fastestAnswerTime: report.timeAnalysis?.fastestAnswerTime || 0,
            slowestAnswerTime: report.timeAnalysis?.slowestAnswerTime || 0,
            timeEfficiencyScore: report.timeAnalysis?.timeEfficiencyScore || 0,
            totalDurationSeconds,
            focusScore: session.attentionStats?.focusScore || 0,
            distractionEvents: session.attentionStats?.distractionEvents || 0,
            focusCategory: session.attentionStats?.focusCategory || null,
            voiceConfidenceScore: null,
            hireBand,
            promptVersion: session.promptVersion,
        });
    } catch (err) {
        console.error('[Analytics] Failed to save:', (err as Error).message);
    }
}

/**
 * Calculate time-based metrics and insights
 */
function calculateTimeMetrics(questions: any[]) {
    const answeredQuestions = questions.filter(q => q.timeTakenSeconds > 0);

    if (answeredQuestions.length === 0) {
        return {
            averageTimePerQuestion: 0,
            fastestAnswerTime: 0,
            slowestAnswerTime: 0,
            timeEfficiencyScore: 0,
            charts: [],
            insights: ['Not enough data to analyze time efficiency.']
        };
    }

    const times = answeredQuestions.map(q => q.timeTakenSeconds);
    const totalTime = times.reduce((a: number, b: number) => a + b, 0);
    const avgTime = Math.round(totalTime / times.length);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    // Efficiency Score (Ideal: 30-90s)
    let efficiencyPoints = 0;
    const charts: { questionIndex: number; timeSeconds: number; score: number }[] = [];

    answeredQuestions.forEach((q, i) => {
        const t = q.timeTakenSeconds;
        if (t >= 30 && t <= 90) efficiencyPoints += 10; // Optimal
        else if (t < 20) efficiencyPoints += 2; // Rushed
        else if (t > 180) efficiencyPoints += 4; // Struggling
        else efficiencyPoints += 6; // Acceptable

        charts.push({
            questionIndex: i + 1,
            timeSeconds: t,
            score: q.evaluation?.overallScore || 0
        });
    });

    const efficiencyScore = Math.round((efficiencyPoints / (answeredQuestions.length * 10)) * 100) / 10;

    // Generate Insights
    const insights: string[] = [];
    if (avgTime < 25) insights.push('You tend to answer very quickly. Ensure you are providing enough depth.');
    if (avgTime > 120) insights.push('Your answers are quite long on average. Try to be more concise.');
    if (efficiencyScore > 8) insights.push('Your pacing is excellent. Most answers fall within the ideal 30-90s window.');

    // Check for "Rushed but Low Score"
    const rushedAndLow = answeredQuestions.filter(q => q.timeTakenSeconds < 20 && q.evaluation?.overallScore < 5);
    if (rushedAndLow.length > 0) {
        insights.push(`You rushed through ${rushedAndLow.length} questions which negatively impacted your score.`);
    }

    return {
        averageTimePerQuestion: avgTime,
        fastestAnswerTime: minTime,
        slowestAnswerTime: maxTime,
        timeEfficiencyScore: efficiencyScore,
        charts,
        insights
    };
}
