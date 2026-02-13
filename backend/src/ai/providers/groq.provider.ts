import Groq from 'groq-sdk';
import { IAIProvider } from '../ai.types';
import { aiConfig } from '../../config/ai.config';

/**
 * Groq AI Provider
 * Uses Llama 3 models via Groq's high-speed API.
 */
export class GroqProvider implements IAIProvider {
    readonly name = 'groq';
    private client: Groq;

    constructor() {
        if (!aiConfig.groq.apiKey) {
            console.warn('[Groq] Warning: GROQ_API_KEY is missing. Provider will fail if called.');
        }
        this.client = new Groq({
            apiKey: aiConfig.groq.apiKey || 'dummy_key', // prevent crash on startup, fail on call
        });
    }

    async callAI<T>(prompt: string): Promise<T> {
        if (!aiConfig.groq.apiKey) {
            throw new Error('GROQ_API_KEY is not configured.');
        }

        try {
            const completion = await this.client.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant that outputs strictly valid JSON.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                model: aiConfig.groq.model,
                response_format: { type: 'json_object' },
                temperature: 0.7,
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) {
                throw new Error('Empty response from Groq');
            }

            return JSON.parse(content) as T;
        } catch (error: any) {
            console.error('[Groq] API Error:', error);
            throw new Error(`Groq AI Request Failed: ${error.message}`);
        }
    }
}
