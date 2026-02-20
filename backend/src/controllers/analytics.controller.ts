import { Request, Response } from 'express';
import * as analyticsService from '../services/analytics.service';

export const getUserAnalytics = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId as string;
        const data = await analyticsService.getUserAnalytics(userId);
        res.status(200).json({
            success: true,
            data
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

export const getAnalyticsSummary = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId as string;
        const data = await analyticsService.getAnalyticsSummary(userId);
        res.status(200).json({
            success: true,
            data
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

export const getGlobalStats = async (req: Request, res: Response) => {
    try {
        const data = await analyticsService.getGlobalStats();
        res.status(200).json({
            success: true,
            data
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};
