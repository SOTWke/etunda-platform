import { Request, Response } from 'express';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role = 'buyer' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await authService.registerUser(email, password, role);
    const token = authService.generateToken({ id: user.id, email: user.email, role: user.role });

    res.status(201).json({ user, token });
  } catch (error: any) {
    // Handle duplicate email with user-friendly message
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    }
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { user, token } = await authService.loginUser(email, password);
    res.json({ user, token });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await authService.getUserById(userId);
    res.json({ user });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};
