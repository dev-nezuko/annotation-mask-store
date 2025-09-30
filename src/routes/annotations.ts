import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createAnnotation, getAnnotationById, getAnnotationRank, queryAnnotations } from '../controllers/annotationController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, asyncHandler(createAnnotation));
router.get('/', asyncHandler(queryAnnotations));
router.get('/:id', asyncHandler(getAnnotationById));
router.get('/:id/rank', asyncHandler(getAnnotationRank));

export default router;
