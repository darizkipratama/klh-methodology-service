import express from 'express';
import multer from 'multer';
import submissionController from '../controllers/submission.controller.js';
import { protect, authorize  } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Define Multer Storage (memory storage since we upload directly to OpenKM)
// If you want to save locally first, change this to diskStorage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  // limits: { fileSize: 10 * 1024 * 1024 } // Optional: limit file size to 10MB
});


// Public endpoint for adding a public comment
router.post('/:id/public-comments', submissionController.addPublicComment);

// Menerapkan proteksi ke semua endpoint submission
router.use(protect);

// @GET /api/v1/submissions  (Melihat list riwayat dokumen)
//   - Publisher hanya melihat list miliknya sendiri
//   - Internal bisa melihat list semua orang
// @POST /api/v1/submissions (Mengajukan dokumen baru/revisi)
//    Pakai middleware MULTER .single('file') krn ini form-data
router.route('/')
  .get(submissionController.getSubmissions)
  .post(upload.single('file'), submissionController.createSubmission);

// @GET /api/v1/submissions/:id (Melihat detail)
router.route('/:id')
  .get(submissionController.getSubmission);

// Komentar 2 arah (Publisher bisa reply, Internal bisa komen review)
router.post('/:id/comments', submissionController.addComment);


// =================================================================
// EKSKLUSIF INTERNAL
// =================================================================

// Endpoint khusus untuk admin yang memeriksa dan merubah status approve/reject
router.patch('/:id/status', authorize('INTERNAL'), submissionController.updateStatus);

// Endpoint khusus internal user untuk menghapus public comment
router.delete('/:id/public-comments/:commentId', authorize('INTERNAL'), submissionController.deletePublicComment);

export default router;
