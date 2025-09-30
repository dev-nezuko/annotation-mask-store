import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createProject, getProjectById, getProjectStats } from '../controllers/projectController';
import { createImagesForProject } from '../controllers/imageController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, asyncHandler(createProject));
router.get('/:id', asyncHandler(getProjectById));
router.get('/:id/stats', asyncHandler(getProjectStats));
router.post('/:projectId/images', requireAuth, asyncHandler(createImagesForProject));

export default router;
