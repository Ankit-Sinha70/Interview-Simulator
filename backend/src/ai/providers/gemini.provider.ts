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
                generationConfig: {
                    ...aiConfig.gemini.generationConfig,
                    responseMimeType: 'application/json',
                },
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

        // Robustly extract JSON block by finding the first and last structural braces/brackets
        const startBrace = cleaned.indexOf('{');
        const startBracket = cleaned.indexOf('[');
        let startIndex = -1;
        let endIndex = -1;

        if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
            startIndex = startBrace;
            endIndex = cleaned.lastIndexOf('}');
        } else if (startBracket !== -1) {
            startIndex = startBracket;
            endIndex = cleaned.lastIndexOf(']');
        }

        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            cleaned = cleaned.substring(startIndex, endIndex + 1);
        }

        try {
            return JSON.parse(cleaned) as T;
        } catch (error) {
            console.error('Gemini: Failed to parse response:', cleaned.substring(0, 200));
            throw new Error(`Gemini returned invalid JSON: ${(error as Error).message}`);
        }
    }
}
