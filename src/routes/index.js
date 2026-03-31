import express from 'express';
import authRoutes from './auth.routes.js';

import userRoutes from './user.routes.js';
import metadataRoutes from './metadata.routes.js';
import submissionRoutes from './submission.routes.js';

const router = express.Router();

// Mount routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/metadata', metadataRoutes);
router.use('/submissions', submissionRoutes);

export default router;
