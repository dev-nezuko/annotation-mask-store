import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getImageById } from '../controllers/imageController';

const router = Router();

router.get('/:id', asyncHandler(getImageById));

export default router;
