const express = require('express');
const authRoutes = require('./auth.routes');

const userRoutes = require('./user.routes');
const metadataRoutes = require('./metadata.routes');
const submissionRoutes = require('./submission.routes');

const router = express.Router();

// Mount routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/metadata', metadataRoutes);
router.use('/submissions', submissionRoutes);

module.exports = router;
