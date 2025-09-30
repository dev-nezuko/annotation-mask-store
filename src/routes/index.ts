import { Router } from 'express';
import healthRouter from './health';
import projectsRouter from './projects';
import imagesRouter from './images';
import annotationsRouter from './annotations';

const router = Router();

router.use('/health', healthRouter);
router.use('/projects', projectsRouter);
router.use('/images', imagesRouter);
router.use('/annotations', annotationsRouter);

export default router;
