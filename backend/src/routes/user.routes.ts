import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

router.get('/me', userController.getMe);
router.put('/update-profile', userController.updateProfile);
router.post('/change-password', userController.changePassword);
router.post('/profile-picture', userController.uploadProfilePicture);
router.get('/welcome-offer-status', userController.getWelcomeOfferStatus);
router.post('/dismiss-welcome-offer', userController.dismissWelcomeOffer);

export default router;
