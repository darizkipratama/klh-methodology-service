import userRepository from '../repositories/user.repository.js';
import bcrypt from 'bcryptjs';
import { generateToken  } from '../utils/jwt.util.js';

class AuthService {
  async registerUser(data) {
    const { username, email, password, role, companyName } = data;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in DB
    const user = await userRepository.create({
      username,
      email,
      companyName,
      passwordHash,
      role: role || 'PUBLISHER', // default register to Publisher (you can make ONLY internal user create Publishers later)
    });

    return {
      _id: user._id,
      username: user.username,
      companyName: user.companyName,
      email: user.email,
      role: user.role,
    };
  }

  async loginUser(email, password) {
    // 1. Find the user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // 2. Check if active
    if (!user.isActive) {
       throw new Error('User account is deactivated');
    }

    // 3. Compare passwords
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // 4. Generate JWT token
    const token = generateToken(user._id, user.role);

    return {
      token,
      user: {
        _id: user._id,
        username: user.username,
        companyName: user.companyName,
        email: user.email,
        role: user.role,
      },
    };
  }
}

export default new AuthService();
