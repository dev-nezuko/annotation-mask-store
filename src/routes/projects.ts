import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createProject, getProjectById, getProjectStats } from '../controllers/projectController';
import { createImagesForProject } from '../controllers/imageController';
import { validate } from '../middleware/validate';
import { CreateImagesBody, CreateProjectBody } from '../validation/requests';

const router = Router();

router.post('/', validate({ body: CreateProjectBody }), asyncHandler(createProject));
router.get('/:id', asyncHandler(getProjectById));
router.get('/:id/stats', asyncHandler(getProjectStats));
router.post('/:projectId/images', validate({ body: CreateImagesBody }), asyncHandler(createImagesForProject));

export default router;
