import { Request, Response, NextFunction } from 'express';

const VALID_LEVELS = ['Junior', 'Mid', 'Senior'];
const VALID_MODES = ['text', 'voice', 'hybrid'];

/**
 * Validate POST /interview/start request body
 */
export function validateStartInterview(req: Request, res: Response, next: NextFunction) {
    const { role, experienceLevel, mode } = req.body;

    if (!role || typeof role !== 'string') {
        return res.status(400).json({
            success: false,
            error: { message: 'Role is required and must be a string' },
        });
    }

    if (!experienceLevel || !VALID_LEVELS.includes(experienceLevel)) {
        return res.status(400).json({
            success: false,
            error: { message: `Experience level must be one of: ${VALID_LEVELS.join(', ')}` },
        });
    }

    // Mode is optional, defaults to 'text'
    if (mode && !VALID_MODES.includes(mode)) {
        return res.status(400).json({
            success: false,
            error: { message: `Mode must be one of: ${VALID_MODES.join(', ')}` },
        });
    }

    next();
}

/**
 * Validate POST /interview/answer request body
 */
export function validateSubmitAnswer(req: Request, res: Response, next: NextFunction) {
    const { sessionId, answer, voiceMeta } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({
            success: false,
            error: { message: 'Session ID is required' },
        });
    }

    if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: { message: 'Answer is required and must be a non-empty string' },
        });
    }

    // Validate optional voiceMeta structure
    if (voiceMeta) {
        if (typeof voiceMeta !== 'object') {
            return res.status(400).json({
                success: false,
                error: { message: 'voiceMeta must be an object' },
            });
        }

        const { durationSeconds, fillerWordCount, pauseCount, wordsPerMinute } = voiceMeta;
        if (typeof durationSeconds !== 'number' || typeof fillerWordCount !== 'number' ||
            typeof pauseCount !== 'number' || typeof wordsPerMinute !== 'number') {
            return res.status(400).json({
                success: false,
                error: { message: 'voiceMeta must include numeric fields: durationSeconds, fillerWordCount, pauseCount, wordsPerMinute' },
            });
        }
    }

    next();
}

/**
 * Validate POST /interview/complete request body
 */
export function validateCompleteInterview(req: Request, res: Response, next: NextFunction) {
    const { sessionId } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({
            success: false,
            error: { message: 'Session ID is required' },
        });
    }

    next();
}
