import { Request, Response, NextFunction } from 'express';
import * as interviewService from '../services/interview.service';
import { generateFinalReport } from '../services/report.service';

/**
 * POST /api/interview/start
 */
export async function startInterview(req: Request, res: Response, next: NextFunction) {
    try {
        const { role, experienceLevel, mode } = req.body;
        const result = await interviewService.startInterview(role, experienceLevel, mode);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/interview/answer
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
 */
export async function completeInterview(req: Request, res: Response, next: NextFunction) {
    try {
        const { sessionId } = req.body;
        const report = await generateFinalReport(sessionId);

        res.status(200).json({
            success: true,
            data: report,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/interview/session/:sessionId
 */
export async function getSession(req: Request, res: Response, next: NextFunction) {
    try {
        const sessionId = req.params.sessionId as string;
        const session = await interviewService.getSessionInfo(sessionId);

        res.status(200).json({
            success: true,
            data: session,
        });
    } catch (error) {
        next(error);
    }
}
