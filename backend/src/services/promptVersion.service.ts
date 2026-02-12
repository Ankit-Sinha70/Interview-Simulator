import { PromptVersionModel } from '../schemas/promptVersion.schema';
import { getQuestionPrompt } from '../constants/prompts/question.prompt';
import { getEvaluationPrompt } from '../constants/prompts/evaluation.prompt';
import { getFollowUpPrompt } from '../constants/prompts/followup.prompt';
import { getReportPrompt } from '../constants/prompts/report.prompt';

const CURRENT_VERSION = 'v1.0';

/**
 * Seed prompt versions on first boot
 */
export async function seedPromptVersions(): Promise<void> {
    const existing = await PromptVersionModel.findOne({ version: CURRENT_VERSION });
    if (existing) {
        console.log(`[Prompts] Version ${CURRENT_VERSION} already exists`);
        return;
    }

    // Snapshot current prompt templates
    await PromptVersionModel.create({
        version: CURRENT_VERSION,
        questionPrompt: getQuestionPrompt({
            role: '{{role}}',
            level: '{{level}}',
        }),
        evaluationPrompt: getEvaluationPrompt({
            question: '{{question}}',
            answer: '{{answer}}',
            role: '{{role}}',
            level: '{{level}}',
        }),
        followupPrompt: getFollowUpPrompt({
            weaknesses: ['{{weakness}}'],
            topic: '{{topic}}',
            summary: '{{summary}}',
        }),
        reportPrompt: getReportPrompt({
            questionsAndEvaluations: '{{data}}',
            role: '{{role}}',
            level: '{{level}}',
        }),
    });

    console.log(`[Prompts] Seeded version ${CURRENT_VERSION}`);
}

/**
 * Get the current prompt version string
 */
export async function getCurrentPromptVersion(): Promise<string> {
    return CURRENT_VERSION;
}

/**
 * Get a full prompt version document
 */
export async function getPromptVersionDoc(version?: string) {
    const v = version || CURRENT_VERSION;
    return PromptVersionModel.findOne({ version: v });
}
