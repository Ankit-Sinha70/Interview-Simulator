import { Router } from 'express';
import * as interviewController from '../controllers/interview.controller';
import { validateStartInterview, validateSubmitAnswer, validateCompleteInterview } from '../middlewares/validation.middleware';

const router = Router();

router.post('/start', validateStartInterview, interviewController.startInterview);
router.post('/answer', validateSubmitAnswer, interviewController.submitAnswer);
router.post('/complete', validateCompleteInterview, interviewController.completeInterview);
router.get('/:sessionId', interviewController.getSession);

export default router;
