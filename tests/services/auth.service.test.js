import mongoose from 'mongoose';
import authService from '../../src/services/auth.service.js';
import dbSetup from '../setup/db.setup.js';
import { verifyToken } from '../../src/utils/jwt.util.js';

// Supaya proses.env.JWT_SECRET terbaca buat generate token, kita mock ke global env
process.env.JWT_SECRET = 'test-secret';

beforeAll(async () => {
  await dbSetup.connect();
});

afterEach(async () => {
  await dbSetup.clearDatabase();
});

afterAll(async () => {
  await dbSetup.closeDatabase();
});

describe('Auth Service', () => {
  describe('registerUser()', () => {
    it('should register a new PUBLISHER successfully', async () => {
      const userData = {
        username: 'publisher_johndoe',
        email: 'johndoe@example.com',
        companyName: 'PT. Doe Enterprises',
        password: 'securePassword123'
      };

      const user = await authService.registerUser(userData);

      expect(user).toHaveProperty('_id');
      expect(user.email).toBe(userData.email);
      expect(user.username).toBe(userData.username);
      expect(user.companyName).toBe(userData.companyName);
      expect(user.role).toBe('PUBLISHER');
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        username: 'user_one',
        email: 'duplicate@test.com',
        password: 'pass'
      };

      // Create first user
      await authService.registerUser(userData);

      // Attempt to register again with same email
      await expect(
        authService.registerUser({ ...userData, username: 'user_two' })
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('loginUser()', () => {
    beforeEach(async () => {
      // Setup test user before each test in this suite
      await authService.registerUser({
        username: 'alice_internal',
        email: 'alice@klh.test.com',
        password: 'alicePassword_123',
        role: 'INTERNAL'
      });
    });

    it('should login successfully and return JWT and user info', async () => {
      const result = await authService.loginUser('alice@klh.test.com', 'alicePassword_123');

      expect(result).toHaveProperty('token');
      expect(result.user).toHaveProperty('_id');
      expect(result.user.email).toBe('alice@klh.test.com');
      expect(result.user.role).toBe('INTERNAL');

      // Verify the token content
      const decoded = verifyToken(result.token);
      expect(decoded.id.toString()).toBe(result.user._id.toString());
      expect(decoded.role).toBe('INTERNAL');
    });

    it('should throw error for invalid email', async () => {
      await expect(
        authService.loginUser('wrong@email.com', 'alicePassword_123')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      await expect(
        authService.loginUser('alice@klh.test.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error if user is deactivated', async () => {
       // Manual deactivate directly through models or repository usually, 
       // but we can use the db logic directly
       const User = require('../../src/models/user.model');
       await User.findOneAndUpdate({ email: 'alice@klh.test.com' }, { isActive: false });

       await expect(
         authService.loginUser('alice@klh.test.com', 'alicePassword_123')
       ).rejects.toThrow('User account is deactivated');
    });
  });
});
