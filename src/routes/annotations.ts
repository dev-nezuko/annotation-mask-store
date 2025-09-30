import { Router } from 'express';
import { createAnnotation, getAnnotationById, getAnnotationRank, queryAnnotations } from '../controllers/annotationController';
import { validate } from '../middleware/validate';
import { AnnotationQuery, CreateAnnotationBody } from '../validation/requests';

const router = Router();

router.post('/', validate({ body: CreateAnnotationBody }), createAnnotation);
router.get('/', validate({ query: AnnotationQuery }), queryAnnotations);
router.get('/:id', getAnnotationById);
router.get('/:id/rank', getAnnotationRank);

export default router;
