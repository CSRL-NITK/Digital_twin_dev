import { Router } from 'express';
import { login, logout, me, register, checkUsername, listUsers, deleteUser, updateUserRole } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Middleware: admin only
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.post('/register', register);
router.get('/check-username', checkUsername);

// Admin: user management
router.get('/users', requireAuth, requireAdmin, listUsers);
router.delete('/users/:id', requireAuth, requireAdmin, deleteUser);
router.patch('/users/:id/role', requireAuth, requireAdmin, updateUserRole);

export default router;
