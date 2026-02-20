import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

router.get('/user/:userId', analyticsController.getUserAnalytics);
router.get('/summary/:userId', analyticsController.getAnalyticsSummary);
router.get('/global', analyticsController.getGlobalStats);

export default router;
