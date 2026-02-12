import { IAIProvider } from '../ai.types';

/**
 * OpenAI Provider (Stub)
 * Ready for future openai SDK integration.
 *
 * To activate:
 *   1. npm install openai
 *   2. Set OPENAI_API_KEY in .env
 *   3. Set AI_PROVIDER=openai in .env
 *   4. Implement callAI using OpenAI's ChatCompletion API
 */
export class OpenAIProvider implements IAIProvider {
    readonly name = 'openai';

    async callAI<T>(prompt: string): Promise<T> {
        // TODO: Implement with openai SDK
        // const OpenAI = require('openai');
        // const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        // const completion = await client.chat.completions.create({
        //     model: 'gpt-4o',
        //     messages: [{ role: 'user', content: prompt }],
        //     response_format: { type: 'json_object' },
        // });
        // return JSON.parse(completion.choices[0].message.content) as T;

        throw new Error('OpenAIProvider is not yet implemented. Install openai and complete the integration.');
    }
}
