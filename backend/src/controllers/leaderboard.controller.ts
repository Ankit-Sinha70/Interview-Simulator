import { Request, Response, NextFunction } from 'express';
import { getLeaderboard } from '../services/leaderboard.service';

export const getLeaderboardController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const leaderboard = await getLeaderboard();
        res.json({ success: true, data: leaderboard });
    } catch (error) {
        next(error);
    }
};
