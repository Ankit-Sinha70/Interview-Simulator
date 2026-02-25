import { callAI } from './provider.factory';
import { getReportPrompt, ReportContext } from '../constants/prompts/report.prompt';
import { FinalReport } from '../models/interviewSession.model';

/**
 * Generate a final interview report using AI
 */
export async function generateReport(context: ReportContext): Promise<FinalReport> {
    const prompt = getReportPrompt(context);
    const result = await callAI<FinalReport>(prompt);
    return result;
}
