import * as authService from '../../services/authService';

describe('Auth Service - Unit Tests', () => {
  describe('Password Hashing', () => {
    it('should hash password securely', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toEqual(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should compare password correctly', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);

      const isValid = await authService.comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);

      const isValid = await authService.comparePassword('wrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token', () => {
    it('should generate valid token', () => {
      const user = { id: 'user-123', email: 'test@example.com', role: 'buyer' };
      const token = authService.generateToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should verify token correctly', () => {
      const user = { id: 'user-123', email: 'test@example.com', role: 'buyer' };
      const token = authService.generateToken(user);

      const verified = authService.verifyToken(token);
      expect(verified.id).toEqual(user.id);
      expect(verified.email).toEqual(user.email);
      expect(verified.role).toEqual(user.role);
    });

    it('should reject invalid token', () => {
      expect(() => {
        authService.verifyToken('invalid-token');
      }).toThrow();
    });
  });
});
