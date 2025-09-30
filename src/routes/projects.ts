import { Router } from 'express';
import { createProject, getProjectById, getProjectStats } from '../controllers/projectController';
import { createImagesForProject } from '../controllers/imageController';
import { validate } from '../middleware/validate';
import { CreateImagesBody, CreateProjectBody } from '../validation/requests';

const router = Router();

router.post('/', validate({ body: CreateProjectBody }), createProject);
router.get('/:id', getProjectById);
router.get('/:id/stats', getProjectStats);
router.post('/:projectId/images', validate({ body: CreateImagesBody }), createImagesForProject);

export default router;
