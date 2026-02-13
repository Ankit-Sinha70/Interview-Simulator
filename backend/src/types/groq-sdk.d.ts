declare module 'groq-sdk' {
    export class Groq {
        constructor(config: { apiKey: string });
        chat: {
            completions: {
                create(params: {
                    messages: Array<{ role: string; content: string }>;
                    model: string;
                    temperature?: number;
                    max_tokens?: number;
                    response_format?: { type: string };
                }): Promise<{
                    choices: Array<{
                        message: {
                            content: string;
                        };
                    }>;
                }>;
            };
        };
    }
    export default Groq;
}
