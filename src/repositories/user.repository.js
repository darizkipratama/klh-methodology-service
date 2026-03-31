import User from '../models/user.model.js';

class UserRepository {
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async findById(id) {
    return await User.findById(id).select('-passwordHash');
  }

  async findAll(filter = {}) {
    return await User.find(filter).select('-passwordHash');
  }

  async findAllPaginated(filter = {}, options = { skip: 0, limit: 10 }) {
    const data = await User.find(filter)
      .select('-passwordHash')
      .skip(options.skip)
      .limit(options.limit)
      .sort({ createdAt: -1 });
      
    const total = await User.countDocuments(filter);
    
    return { data, total };
  }

  async findDistinctCompanies(searchQuery = '') {
    const filter = { companyName: { $ne: null, $regex: searchQuery, $options: 'i' } };
    return await User.distinct('companyName', filter);
  }

  async updateById(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-passwordHash');
  }

  async deleteById(id) {
    return await User.findByIdAndDelete(id);
  }
}

export default new UserRepository();
