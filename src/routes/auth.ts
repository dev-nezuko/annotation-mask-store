import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { signup, login } from '../controllers/authController';

const router = Router();

router.post('/signup', asyncHandler(signup));
router.post('/login', asyncHandler(login));

export default router;
