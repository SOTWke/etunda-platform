import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { User } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthPayload {
  id: string;
  email: string;
  role: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (user: AuthPayload): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): AuthPayload => {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
};

export const registerUser = async (email: string, password: string, role: string = 'buyer'): Promise<User> => {
  // Check if user with this email already exists
  const existingUser = await query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existingUser.rows.length > 0) {
    throw new Error('EMAIL_EXISTS');
  }

  const hashedPassword = await hashPassword(password);
  const result = await query(
    `INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at, updated_at`,
    [email, hashedPassword, role]
  );
  return result.rows[0];
};

export const loginUser = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  const result = await query(`SELECT * FROM users WHERE email = $1`, [email]);

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];
  const isValid = await comparePassword(password, user.password);

  if (!isValid) {
    throw new Error('Invalid password');
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

export const getUserById = async (id: string): Promise<User> => {
  const result = await query(`SELECT id, email, role, created_at, updated_at FROM users WHERE id = $1`, [id]);

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
};
