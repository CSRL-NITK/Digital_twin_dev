import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dt-key-2026';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Set HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email || `${user.username}@digitaltwin.io`,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, email: true, role: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({
      user: {
        ...user,
        email: user.email || `${user.username}@digitaltwin.io`
      }
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.query as { username: string };
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ available: false, message: 'Too short' });
    }
    const existing = await prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } });
    return res.status(200).json({ available: !existing });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    // Basic validation
    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    // Check username uniqueness
    const existingUsername = await prisma.user.findUnique({ where: { username: normalizedUsername } });
    if (existingUsername) {
      return res.status(409).json({ error: 'Username is already taken' });
    }

    // Check email uniqueness
    const existingEmail = await prisma.user.findFirst({ where: { email: normalizedEmail } });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const newUser = await prisma.user.create({
      data: {
        name: fullName,
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
        role: 'viewer',  // default role
      }
    });

    // Auto-login after registration
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const rawUsers = await prisma.user.findMany({
      select: { id: true, name: true, username: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const users = rawUsers.map(u => ({
      ...u,
      email: u.email || `${u.username}@digitaltwin.io`
    }));
    res.status(200).json({ users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const requesterId = (req as any).user?.userId;
    if (id === requesterId) return res.status(400).json({ error: "You cannot delete your own account" });
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    await prisma.user.delete({ where: { id } });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const role = req.body.role as string;
    const requesterId = (req as any).user?.userId;
    const allowedRoles = ['admin', 'operator', 'viewer'];
    if (!allowedRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    if (id === requesterId && role !== 'admin') return res.status(400).json({ error: "You cannot demote your own admin account" });
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, username: true, role: true },
    });
    res.status(200).json({ user: updated });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
