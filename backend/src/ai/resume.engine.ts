import { callAI } from './provider.factory';

export interface ParsedResume {
    skills: string[];
    technologies: string[];
    projects: {
        name: string;
        description: string;
        techStack: string[];
    }[];
    experience: {
        role: string;
        company: string;
        duration: string;
        responsibilities: string[];
    }[];
}

const RESUME_PARSER_PROMPT = `You are a highly capable AI resume parser. 
Your task is to take raw text extracted from a candidate's resume and convert it into structured JSON data.

Extract the following information:
1. "skills": Array of generic skills (e.g. "Agile", "System Design", "Leadership")
2. "technologies": Array of programming languages, frameworks, or tools (e.g. "React", "Node.js", "Docker")
3. "projects": Array of notable projects. Include the name, a brief description, and the tech stack used.
4. "experience": Array of work experience. Include the job role/title, company name, duration, and bullet points of responsibilities or achievements.

RAW RESUME TEXT:
<<<RAW_TEXT>>>

Return STRICTLY JSON. Do not include markdown formatting or explanation. 
Your response must match this schema exactly:
{
  "skills": ["..."],
  "technologies": ["..."],
  "projects": [
    {
      "name": "...",
      "description": "...",
      "techStack": ["..."]
    }
  ],
  "experience": [
    {
      "role": "...",
      "company": "...",
      "duration": "...",
      "responsibilities": ["..."]
    }
  ]
}`;

export async function parseResumeText(rawText: string): Promise<ParsedResume> {
    try {
        const prompt = RESUME_PARSER_PROMPT.replace('<<<RAW_TEXT>>>', rawText);
        
        // callAI expects a JSON return if the prompt demands strict JSON.
        // It uses our standard provider factory (Gemini/Groq) which can return JSON structures safely.
        const parsed = await callAI<ParsedResume>(prompt);
        return parsed;
    } catch (error) {
        console.error('[ResumeEngine] Failed to parse resume with AI:', error);
        throw new Error('Failed to extract structured data from resume');
    }
}
