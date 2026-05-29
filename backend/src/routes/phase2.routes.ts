import { Router } from 'express';
import * as phase2Controller from '../controllers/phase2.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

const router = Router();

// All Phase 2 routes require authentication
router.use(authenticateToken);

router.post('/linkedin-import', upload.single('file'), phase2Controller.linkedinImport);
router.post('/github-analyze', phase2Controller.githubAnalyze);
router.post('/ats-evaluate', phase2Controller.atsEvaluate);

export default router;
