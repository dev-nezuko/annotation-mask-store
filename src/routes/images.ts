import { Router } from 'express';
import { getImageById } from '../controllers/imageController';

const router = Router();

router.get('/:id', getImageById);

export default router;
