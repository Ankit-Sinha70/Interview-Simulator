import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { IAIProvider } from '../ai.types';
import { aiConfig } from '../../config/ai.config';

/**
 * Google Gemini AI Provider
 */
export class GeminiProvider implements IAIProvider {
    readonly name = 'gemini';
    private model: GenerativeModel | null = null;

    private getModel(): GenerativeModel {
        if (!this.model) {
            const apiKey = aiConfig.gemini.apiKey;
            if (!apiKey) {
                throw new Error('GEMINI_API_KEY is not set in environment variables');
            }
            const genAI = new GoogleGenerativeAI(apiKey);
            this.model = genAI.getGenerativeModel({
                model: aiConfig.gemini.model,
                generationConfig: aiConfig.gemini.generationConfig,
            });
        }
        return this.model;
    }

    async callAI<T>(prompt: string): Promise<T> {
        const model = this.getModel();
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return this.parseResponse<T>(text);
    }

    private parseResponse<T>(text: string): T {
        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.slice(7);
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.slice(3);
        }
        if (cleaned.endsWith('```')) {
            cleaned = cleaned.slice(0, -3);
        }
        cleaned = cleaned.trim();

        try {
            return JSON.parse(cleaned) as T;
        } catch (error) {
            console.error('Gemini: Failed to parse response:', cleaned.substring(0, 200));
            throw new Error(`Gemini returned invalid JSON: ${(error as Error).message}`);
        }
    }
}
