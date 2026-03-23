import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import multer from 'multer';

// 5MB limit for resume uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } 
});

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

router.get('/me', userController.getMe);
router.put('/update-profile', userController.updateProfile);
router.post('/change-password', userController.changePassword);
router.post('/profile-picture', userController.uploadProfilePicture);
router.get('/welcome-offer-status', userController.getWelcomeOfferStatus);
router.post('/dismiss-welcome-offer', userController.dismissWelcomeOffer);

router.get('/goal', userController.getGoal);
router.post('/goal', userController.setGoal);

router.post('/resume', upload.single('resume'), userController.uploadResume);

export default router;
