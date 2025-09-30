import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createAnnotation, getAnnotationById, getAnnotationRank, queryAnnotations } from '../controllers/annotationController';
import { validate } from '../middleware/validate';
import { AnnotationQuery, CreateAnnotationBody } from '../validation/requests';

const router = Router();

router.post('/', validate({ body: CreateAnnotationBody }), asyncHandler(createAnnotation));
router.get('/', validate({ query: AnnotationQuery }), asyncHandler(queryAnnotations));
router.get('/:id', asyncHandler(getAnnotationById));
router.get('/:id/rank', asyncHandler(getAnnotationRank));

export default router;
