import Groq from 'groq-sdk';
import { IAIProvider } from '../ai.types';
import Groq from 'groq-sdk';
import { aiConfig } from '../../config/ai.config';

export class GroqProvider implements IAIProvider {
    readonly name = 'groq';
    private client: Groq;

    constructor() {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is not set in environment variables');
        }
        this.client = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });
    }

    async callAI<T>(prompt: string): Promise<T> {
        try {
            const completion = await this.client.chat.completions.create({
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                model: aiConfig.groq.model || 'llama-3.3-70b-versatile',
                temperature: 0.3,
                max_tokens: 2048,
                response_format: { type: 'json_object' },
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) {
                throw new Error('Empty response from Groq');
            }

            return this.cleanAndParseJSON<T>(content);
        } catch (error: any) {
            console.error('[Groq] API Error:', error);
            throw new Error(`Groq AI Request Failed: ${error.message}`);
        }
    }

    private cleanAndParseJSON<T>(content: string): T {
        // 1. Remove markdown code blocks if present
        let clean = content.replace(/```json\n?/g, '').replace(/```/g, '');

        // 2. Trim whitespace
        clean = clean.trim();

        try {
            return JSON.parse(clean) as T;
        } catch (e) {
            console.error('[Groq] JSON Parse Error. Content:', content);
            throw new Error('Failed to parse AI response as JSON');
        }
    }
}
