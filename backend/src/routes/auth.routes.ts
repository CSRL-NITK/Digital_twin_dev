import { Router } from 'express';
import { login, logout, me, register, checkUsername } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.post('/register', register);
router.get('/check-username', checkUsername);

export default router;
