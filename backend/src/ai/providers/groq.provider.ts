import { IAIProvider } from '../ai.types';

/**
 * Groq AI Provider (Stub)
 * Ready for future groq-sdk integration.
 *
 * To activate:
 *   1. npm install groq-sdk
 *   2. Set GROQ_API_KEY in .env
 *   3. Set AI_PROVIDER=groq in .env
 *   4. Implement callAI using Groq's ChatCompletion API
 */
export class GroqProvider implements IAIProvider {
    readonly name = 'groq';

    async callAI<T>(prompt: string): Promise<T> {
        // TODO: Implement with groq-sdk
        // const Groq = require('groq-sdk');
        // const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
        // const completion = await client.chat.completions.create({
        //     model: 'llama-3.3-70b-versatile',
        //     messages: [{ role: 'user', content: prompt }],
        //     response_format: { type: 'json_object' },
        // });
        // return JSON.parse(completion.choices[0].message.content) as T;

        throw new Error('GroqProvider is not yet implemented. Install groq-sdk and complete the integration.');
    }
}
