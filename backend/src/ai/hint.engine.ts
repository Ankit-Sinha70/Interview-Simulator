import { getHintPrompt, HintContext } from '../constants/prompts/hint.prompt';
import { callAI } from './provider.factory';

export async function generateHint(params: HintContext): Promise<string | null> {
    const prompt = getHintPrompt(params);

    try {
        const parsed = await callAI<{ hint: string | null }>(prompt);
        return parsed.hint || null;
    } catch (error) {
        console.error('Failed to generate hint:', error);
        return null; // Fail gracefully, don't crash the UI for a hint
    }
}
