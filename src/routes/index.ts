import { Router } from 'express';
import healthRouter from './health';
import projectsRouter from './projects';
import imagesRouter from './images';
import annotationsRouter from './annotations';
import authRouter from './auth';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/projects', requireAuth, projectsRouter);
router.use('/images', requireAuth, imagesRouter);
router.use('/annotations', requireAuth, annotationsRouter);

export default router;
