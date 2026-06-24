import express, { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { getLeaderboardController } from '../controllers/leaderboard.controller';

const leaderboardRouter: Router = express.Router();

/**
 * GET /api/leaderboard
 */
leaderboardRouter.get('/', authenticateToken, getLeaderboardController);

export default leaderboardRouter;
