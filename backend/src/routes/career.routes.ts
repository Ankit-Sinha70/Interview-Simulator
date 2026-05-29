import { Router } from 'express';
import * as careerController from '../controllers/career.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// All career endpoints require authentication
router.use(authenticateToken);

router.get('/dashboard', careerController.getCareerDashboardData);
router.post('/refresh', careerController.recalculateCareerDashboardData);

export default router;
