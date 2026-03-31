import userService from '../services/user.service.js';

class UserController {
  // @desc    Get all users (with pagination & search)
  // @route   GET /api/v1/users
  // @access  Private/Internal
  async getUsers(req, res, next) {
    try {
      const result = await userService.getAllUsers(req.query);
      res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Search companies by name
  // @route   GET /api/v1/users/companies
  // @access  Public
  async getCompanies(req, res, next) {
    try {
      const { q } = req.query;
      const companies = await userService.searchCompanies(q);
      res.status(200).json({
        success: true,
        data: companies,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get user by ID
  // @route   GET /api/v1/users/:id
  // @access  Private/Internal
  async getUser(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // @desc    Update user details
  // @route   PUT /api/v1/users/:id
  // @access  Private/Internal
  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
       if (error.message === 'User not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // @desc    Activate / Deactivate a user
  // @route   PATCH /api/v1/users/:id/status
  // @access  Private/Internal
  async toggleStatus(req, res, next) {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
      }

      const user = await userService.toggleUserActivation(req.params.id, isActive);
      res.status(200).json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: user,
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // @desc    Delete user
  // @route   DELETE /api/v1/users/:id
  // @access  Private/Internal
  async deleteUser(req, res, next) {
    try {
      await userService.deleteUser(req.params.id);
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
        if (error.message === 'User not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }
}

export default new UserController();
