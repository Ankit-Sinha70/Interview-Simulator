import { Request, Response, NextFunction } from 'express';
import * as interviewService from '../services/interview.service';
import * as reportService from '../services/report.service';

/**
 * POST /api/interview/start
 * Start a new interview session
 */
export async function startInterview(req: Request, res: Response, next: NextFunction) {
    try {
        const { role, experienceLevel, mode } = req.body;
        const result = await interviewService.startInterview(role, experienceLevel, mode);

        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/interview/answer
 * Submit an answer for the current question
 */
export async function submitAnswer(req: Request, res: Response, next: NextFunction) {
    try {
        const { sessionId, answer, voiceMeta } = req.body;
        const result = await interviewService.processAnswer(sessionId, answer, voiceMeta);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/interview/complete
 * Complete the interview and generate final report
 */
export async function completeInterview(req: Request, res: Response, next: NextFunction) {
    try {
        const { sessionId } = req.body;
        const report = await reportService.generateFinalReport(sessionId);

        res.status(200).json({
            success: true,
            data: report,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/interview/:sessionId
 * Get session info
 */
export async function getSession(req: Request, res: Response, next: NextFunction) {
    try {
        const sessionId = req.params.sessionId as string;
        const session = interviewService.getSessionInfo(sessionId);

        res.status(200).json({
            success: true,
            data: session,
        });
    } catch (error) {
        next(error);
    }
}
