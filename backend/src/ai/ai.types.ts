// ============================================
// AI Provider Interface — All providers implement this
// ============================================

/**
 * Generic interface for AI providers.
 * Each method receives a prompt string and returns parsed JSON.
 * The engines build the prompts; the provider just sends them.
 */
export interface IAIProvider {
    readonly name: string;

    /**
     * Send a prompt to the AI and get a parsed JSON response
     */
    callAI<T>(prompt: string): Promise<T>;
}
