import { Request, Response, NextFunction } from 'express';

/**
 * Global error handling middleware
 */
export function errorMiddleware(err: Error, req: Request, res: Response, _next: NextFunction) {
    console.error('[Error]', err.message);
    console.error(err.stack);

    const statusCode = (err as any).statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
}
