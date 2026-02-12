import { callAI } from './provider.factory';
import { getReportPrompt } from '../constants/prompts/report.prompt';
import { FinalReport } from '../models/interviewSession.model';

/**
 * Generate a final interview report using AI
 */
export async function generateReport(params: {
    questionsAndEvaluations: string;
    role: string;
    level: string;
}): Promise<FinalReport> {
    const prompt = getReportPrompt(params);
    const result = await callAI<FinalReport>(prompt);

    if (!result.averageScore || !result.strongestAreas || !result.weakestAreas ||
        !result.confidenceLevel || !result.improvementRoadmap) {
        throw new Error('AI returned incomplete report data');
    }

    return result;
}
