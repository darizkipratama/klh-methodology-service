import express from 'express';
import userController from '../controllers/user.controller.js';
import { protect, authorize  } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public route for searching company names
router.get('/companies', userController.getCompanies);

// Semua method di bawah ini HANYA bisa diakses oleh INTERNAL user (Tim KLH)
router.use(protect);
router.use(authorize('INTERNAL'));

// Resource: /api/v1/users
router.route('/')
  .get(userController.getUsers) // Mendapatkan all users dgn pagination & search
  .post(userController.addUser); // Tambah user baru

router.route('/:id')
  .get(userController.getUser) // Get single user details
  .put(userController.updateUser) // Update user data (username, role, dll)
  .delete(userController.deleteUser); // Hapus permanen

// Custom Feature endpoint: Activation / Deactivation  
router.route('/:id/status')
  .patch(userController.toggleStatus); 

export default router;
