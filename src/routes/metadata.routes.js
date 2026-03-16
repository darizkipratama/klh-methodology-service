const express = require('express');
const metadataController = require('../controllers/metadata.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Route that BOTH Publishers & Internals can access (Forms need to know what to render)
router.get('/active', protect, metadataController.getActiveMetadata);

// ----------------------------------------------------------------------------
// ALL routes below are strictly for INTERNAL users (The Metadata Builder side)
// ----------------------------------------------------------------------------
router.use(protect);
router.use(authorize('INTERNAL'));

// Bulk order specific route must come BEFORE /:id to prevent matching 'reorder' as an ID
router.put('/reorder', metadataController.reorderMetadata);

// Standard CRUD
router.route('/')
  .post(metadataController.createMetadata)
  .get(metadataController.getAllMetadata);

router.route('/:id')
  .get(metadataController.getMetadataById)
  .put(metadataController.updateMetadata)
  .delete(metadataController.deleteMetadata);


module.exports = router;
