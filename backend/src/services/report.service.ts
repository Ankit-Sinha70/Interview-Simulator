import { InterviewSession, FinalReport } from '../models/interviewSession.model';
import * as sessionService from './session.service';
import { generateReport } from '../ai/report.engine';

/**
 * Generate a final interview report
 */
export async function generateFinalReport(sessionId: string): Promise<FinalReport> {
    const session = sessionService.getSession(sessionId);
    if (!session) {
        throw new Error('Session not found');
    }

    // Build the questions & evaluations summary for the AI prompt
    const questionsAndEvaluations = session.questions
        .filter((q) => q.answer !== null && q.evaluation !== null)
        .map((q, index) => {
            const e = q.evaluation!;
            const a = q.answer!;
            const voiceInfo = a.voiceMeta
                ? `\nVoice: ${a.voiceMeta.wordsPerMinute} WPM, ${a.voiceMeta.fillerWordCount} filler words, ${a.voiceMeta.durationSeconds}s`
                : '';

            return `
Question ${index + 1} [${q.type}]: ${q.questionText}
Topic: ${q.topic} | Difficulty: ${q.difficulty}${q.generatedFromWeakness ? ` | Probing: ${q.generatedFromWeakness}` : ''}
Answer: ${a.text}${voiceInfo}
Scores: Technical=${e.technicalScore}, Depth=${e.depthScore}, Clarity=${e.clarityScore}, ProblemSolving=${e.problemSolvingScore}, Communication=${e.communicationScore}, Overall=${e.overallScore}
Strengths: ${e.strengths.join(', ')}
Weaknesses: ${e.weaknesses.join(', ')}
`;
        })
        .join('\n---\n');

    const report = await generateReport({
        questionsAndEvaluations,
        role: session.role,
        level: session.experienceLevel,
    });

    // Mark session as completed
    session.status = 'COMPLETED';
    session.completedAt = new Date().toISOString();
    sessionService.updateSession(session);

    return report;
}
