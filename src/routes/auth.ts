import { Router } from 'express';
import { signup, login } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { LoginBody, SignupBody } from '../validation/auth';

const router = Router();

router.post('/signup', validate({ body: SignupBody }), signup);
router.post('/login', validate({ body: LoginBody }), login);

export default router;
