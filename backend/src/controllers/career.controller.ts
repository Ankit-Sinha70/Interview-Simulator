import { Request, Response, NextFunction } from 'express';
import * as careerService from '../services/career.service';
import { User } from '../models/user.model';

/**
 * GET /api/career/dashboard
 * Retrieves the career development dashboard report for the user.
 */
export async function getCareerDashboardData(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const report = await careerService.getOrCreateCareerReport(userId);
        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error: any) {
        console.error('[careerController.getCareerDashboardData Error]', error);
        next(error);
    }
}

/**
 * POST /api/career/refresh
 * Forces recalculation of the user's career readiness and coaching insights (Pro only).
 */
export async function recalculateCareerDashboardData(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        if (user.planType !== 'PRO') {
            return res.status(403).json({
                success: false,
                error: 'Manual AI Coach recalculation is a Pro-only feature'
            });
        }

        const report = await careerService.refreshCareerReport(userId);
        res.status(200).json({
            success: true,
            message: 'Career report recalculated successfully',
            data: report
        });
    } catch (error: any) {
        console.error('[careerController.recalculateCareerDashboardData Error]', error);
        res.status(400).json({ success: false, error: error.message || 'Failed to refresh assessment' });
    }
}
