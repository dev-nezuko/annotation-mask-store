import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { signup, login } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { LoginBody, SignupBody } from '../validation/auth';

const router = Router();

router.post('/signup', validate({ body: SignupBody }), asyncHandler(signup));
router.post('/login', validate({ body: LoginBody }), asyncHandler(login));

export default router;
