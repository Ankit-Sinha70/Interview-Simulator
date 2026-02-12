import dotenv from 'dotenv';
dotenv.config();

export type AIProviderName = 'gemini' | 'groq' | 'openai';

export const aiConfig = {
    provider: (process.env.AI_PROVIDER || 'gemini') as AIProviderName,

    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 2048,
        },
    },

    groq: {
        apiKey: process.env.GROQ_API_KEY || '',
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    },

    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4o',
    },
};
