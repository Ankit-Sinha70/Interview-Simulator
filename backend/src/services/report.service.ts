import * as sessionService from './session.service';
import { generateReport } from '../ai/report.engine';
import {
    FinalReport,
    HireBand,
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

/**
 * Complete an interview and generate the final enriched report
 */
export async function generateFinalReport(sessionId: string): Promise<FinalReport> {
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
    const weaknessFrequency = session.questions.reduce((acc, q) => {
        if (q.generatedFromWeakness) {
            acc[q.generatedFromWeakness] = (acc[q.generatedFromWeakness] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

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
        executiveSummary: aiReport.executiveSummary // New field from Master Prompt
    };

    // Save to session
    await sessionService.updateSession({
        sessionId,
        status: 'COMPLETED',
        finalReport,
        completedAt: new Date().toISOString(),
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
        await AnalyticsModel.create({
            sessionId: session.sessionId,
            userId: session.userId || null,
            role: session.role,
            experienceLevel: session.experienceLevel,
            mode: session.mode,
            averageScore: report.averageScore,
            weakestDimension: session.aggregatedScores?.weakestDimension || 'N/A',
            strongestDimension: session.aggregatedScores?.strongestDimension || 'N/A',
            questionsCount: session.questions.length,
            averageTimePerQuestion: 0,
            voiceConfidenceScore: null,
            hireBand,
            promptVersion: session.promptVersion,
        });
    } catch (err) {
        console.error('[Analytics] Failed to save:', (err as Error).message);
    }
}
