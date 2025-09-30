import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createProject, getProjectById, getProjectStats } from '../controllers/projectController';
import { createImagesForProject } from '../controllers/imageController';

const router = Router();

router.post('/', asyncHandler(createProject));
router.get('/:id', asyncHandler(getProjectById));
router.get('/:id/stats', asyncHandler(getProjectStats));
router.post('/:projectId/images', asyncHandler(createImagesForProject));

export default router;
