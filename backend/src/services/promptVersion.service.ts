import { PromptVersionModel } from '../schemas/promptVersion.schema';
import { isDbConnected } from '../config/db.config';
import { getQuestionPrompt } from '../constants/prompts/question.prompt';
import { getEvaluationPrompt } from '../constants/prompts/evaluation.prompt';
import { getFollowUpPrompt } from '../constants/prompts/followup.prompt';
import { getReportPrompt } from '../constants/prompts/report.prompt';

const CURRENT_VERSION = 'v1.0';

/**
 * Seed prompt versions on first boot (only if DB connected)
 */
export async function seedPromptVersions(): Promise<void> {
    if (!isDbConnected()) {
        console.log('[Prompts] Skipping seed — no DB connection (in-memory mode)');
        return;
    }

    const existing = await PromptVersionModel.findOne({ version: CURRENT_VERSION });
    if (existing) {
        console.log(`[Prompts] Version ${CURRENT_VERSION} already exists`);
        return;
    }

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
            role: '{{role}}',
            experienceLevel: '{{level}}' as any,
            previousQuestion: '{{previousQuestion}}',
            previousTopic: '{{previousTopic}}',
            previousDifficulty: '{{previousDifficulty}}' as any,
            technicalScore: '{{technicalScore}}' as any,
            depthScore: '{{depthScore}}' as any,
            clarityScore: '{{clarityScore}}' as any,
            problemSolvingScore: '{{problemSolvingScore}}' as any,
            communicationScore: '{{communicationScore}}' as any,
            weaknesses: ['{{weaknesses}}'],
            followUpIntent: '{{followUpIntent}}' as any,
            targetDifficulty: '{{targetDifficulty}}' as any,
            questionHistory: ['{{questionHistory}}'],
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
    if (!isDbConnected()) return null;
    const v = version || CURRENT_VERSION;
    return PromptVersionModel.findOne({ version: v });
}
