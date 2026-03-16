const authService = require('../services/auth.service');

class AuthController {
  async register(req, res, next) {
    try {
      // In a real app, you might want to add validation using Joi/express-validator here
      const user = await authService.registerUser(req.body);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user,
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password' });
      }

      const result = await authService.loginUser(email, password);
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message.includes('Invalid') || error.message.includes('deactivated')) {
        return res.status(401).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // To get the currently logged in user profile
  async getMe(req, res, next) {
    try {
      // req.user is set in the auth middleware
      const user = await require('../repositories/user.repository').findById(req.user.id);
      
      if (!user) {
         return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
