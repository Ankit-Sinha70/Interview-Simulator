import Groq from 'groq-sdk';
import { IAIProvider } from '../ai.types';
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
        let clean = content.trim();

        // Robustly extract JSON block by finding the first and last structural braces/brackets
        const startBrace = clean.indexOf('{');
        const startBracket = clean.indexOf('[');
        let startIndex = -1;
        let endIndex = -1;

        if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
            startIndex = startBrace;
            endIndex = clean.lastIndexOf('}');
        } else if (startBracket !== -1) {
            startIndex = startBracket;
            endIndex = clean.lastIndexOf(']');
        }

        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            clean = clean.substring(startIndex, endIndex + 1);
        }

        try {
            return JSON.parse(clean) as T;
        } catch (e) {
            console.error('[Groq] JSON Parse Error. Content:', content);
            throw new Error('Failed to parse AI response as JSON');
        }
    }
}
