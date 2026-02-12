import { IAIProvider } from './ai.types';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { aiConfig } from '../config/ai.config';

// ─── Provider Registry ───

const providerRegistry: Record<string, new () => IAIProvider> = {
    gemini: GeminiProvider,
    groq: GroqProvider,
    openai: OpenAIProvider,
};

// ─── Singleton Instance ───

let activeProvider: IAIProvider | null = null;

/**
 * Get or create the active AI provider (singleton per process)
 */
export function getProvider(): IAIProvider {
    if (!activeProvider) {
        const providerName = aiConfig.provider;
        const ProviderClass = providerRegistry[providerName];

        if (!ProviderClass) {
            throw new Error(
                `Unknown AI provider: "${providerName}". Available: ${Object.keys(providerRegistry).join(', ')}`,
            );
        }

        activeProvider = new ProviderClass();
        console.log(`[AI] Provider initialized: ${activeProvider.name}`);
    }
    return activeProvider;
}

/**
 * Send a prompt to the active AI provider and get parsed JSON response.
 * This is the main entry point used by all engines.
 */
export async function callAI<T>(prompt: string): Promise<T> {
    const provider = getProvider();
    return provider.callAI<T>(prompt);
}

/**
 * Reset the provider (useful for switching providers at runtime or testing)
 */
export function resetProvider(): void {
    activeProvider = null;
}
