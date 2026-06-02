import userRepository from '../repositories/user.repository.js';
import bcrypt from 'bcryptjs';

class UserService {
  async getAllUsers(query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Filter build-up
    const filter = {};
    
    // Feature: Pencarian berdasarkan username
    if (query.username) {
      filter.username = { $regex: query.username, $options: 'i' }; // Case-insensitive partial match
    }

    // Feature: Hanya memanggil list user yang aktif (atau bisa filter aktif/non-aktif)
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    if (query.role) {
      filter.role = query.role;
    }

    if (query.userType) {
      filter.userType = query.userType;
    }

    const { data, total } = await userRepository.findAllPaginated(filter, { skip, limit });

    return {
      users: data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchCompanies(searchQuery) {
    if (!searchQuery) {
      return [];
    }
    return await userRepository.findDistinctCompanies(searchQuery);
  }

  async addUser(userData) {
    const { username, email, password, role, companyName, userType, isActive } = userData;

    if (!username || !email || !password) {
      throw new Error('Username, email, and password are required');
    }

    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      throw new Error('User with this email already exists');
    }

    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      throw new Error('User with this username already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await userRepository.create({
      username,
      email,
      companyName,
      passwordHash,
      role: role || 'PUBLISHER',
      userType,
      isActive: isActive !== undefined ? isActive : true,
    });

    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      companyName: user.companyName,
      role: user.role,
      userType: user.userType,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUser(id, updateData) {
    // If they attempt to update password through this route, handle hashing
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(updateData.password, salt);
      delete updateData.password;
    }

    const updatedUser = await userRepository.updateById(id, updateData);
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }

  // Feature: Aktivasi/Deaktivasi User (bisa menggunakan updateUser, tapi dibuat modular untuk kejelasan)
  async toggleUserActivation(id, isActiveStatus) {
    const updatedUser = await userRepository.updateById(id, { isActive: isActiveStatus });
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }

  async deleteUser(id) {
    const deletedUser = await userRepository.deleteById(id);
    if (!deletedUser) {
       throw new Error('User not found');
    }
    return deletedUser;
  }
}

export default new UserService();
