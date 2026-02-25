import { Request, Response, NextFunction } from 'express';
import * as interviewService from '../services/interview.service';
import { generateFinalReport } from '../services/report.service';

/**
 * POST /api/interview/start
 */
export async function startInterview(req: Request, res: Response, next: NextFunction) {
    try {
        const { role, experienceLevel, mode } = req.body;
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const result = await interviewService.startInterview(userId, role, experienceLevel, mode);

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
        const { sessionId, attentionStats } = req.body;
        const report = await generateFinalReport(sessionId, attentionStats);

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

/**
 * POST /api/interview/:sessionId/warning-shown
 */
export async function markWarningShown(req: Request, res: Response, next: NextFunction) {
    try {
        const sessionId = req.params.sessionId as string;
        await interviewService.markWarningAsShown(sessionId);

        res.status(200).json({
            success: true,
            data: { message: 'Warning marked as shown' },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/interview/active
 */
export async function getActiveSession(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const result = await interviewService.getActiveSession(userId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/interview/abandon
 */
export async function abandonSession(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({ success: false, error: 'sessionId is required' });
        }

        const result = await interviewService.abandonSession(sessionId, userId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
}
