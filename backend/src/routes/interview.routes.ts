import { Router } from 'express';
import * as interviewController from '../controllers/interview.controller';
import { validateStartInterview, validateSubmitAnswer, validateCompleteInterview } from '../middlewares/validation.middleware';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/start', authenticateToken, validateStartInterview, interviewController.startInterview);
router.post('/answer', authenticateToken, validateSubmitAnswer, interviewController.submitAnswer);
router.post('/complete', authenticateToken, validateCompleteInterview, interviewController.completeInterview);
router.get('/:sessionId', authenticateToken, interviewController.getSession);

export default router;
