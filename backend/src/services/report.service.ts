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

    // Generate AI report
    const aiReport = await generateReport({
        questionsAndEvaluations,
        role: session.role,
        level: session.experienceLevel,
    });

    // ─── Enrich with calculated metrics ───
    const overallScores = session.questions
        .filter((q) => q.evaluation)
        .map((q) => q.evaluation!.overallScore);

    const variance = calculateVariance(overallScores);
    const calculatedConfidence = getConfidenceFromVariance(variance, overallScores.length);
    const calculatedHireBand = getHireBand(aiReport.averageScore);
    const calculatedHireRec = getHireRecommendation(aiReport.averageScore);

    // Use calculated values as fallback/override for consistency
    const finalReport: FinalReport = {
        averageScore: aiReport.averageScore,
        strongestAreas: aiReport.strongestAreas || [],
        weakestAreas: aiReport.weakestAreas || [],
        confidenceLevel: calculatedConfidence,
        hireRecommendation: calculatedHireRec,
        hireBand: calculatedHireBand,
        improvementRoadmap: aiReport.improvementRoadmap || [],
        nextPreparationFocus: aiReport.nextPreparationFocus ||
            getPersonalizedRoadmap(session.aggregatedScores?.weakestDimension || 'Technical Accuracy'),
    };

    // Save to session in DB
    await sessionService.updateSession({
        sessionId,
        status: 'COMPLETED',
        finalReport,
        completedAt: new Date().toISOString(),
    } as any);

    // Save analytics record (fire and forget)
    saveAnalytics(session, finalReport, calculatedHireBand).catch(() => { });

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
            averageTimePerQuestion: 0, // Can be computed from voice meta later
            voiceConfidenceScore: null, // Future enhancement
            hireBand,
            promptVersion: session.promptVersion,
        });
    } catch (err) {
        console.error('[Analytics] Failed to save:', (err as Error).message);
    }
}
