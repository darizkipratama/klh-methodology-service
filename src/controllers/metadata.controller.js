const metadataService = require('../services/metadata.service');

class MetadataController {
  
  // @desc    Create new metadata config
  // @route   POST /api/v1/metadata
  // @access  Private/Internal
  async createMetadata(req, res, next) {
    try {
      const metadata = await metadataService.createMetadata(req.body);
      res.status(201).json({
        success: true,
        message: 'Metadata field created successfully',
        data: metadata,
      });
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('required when dataType')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // @desc    Get all active metadata for Forms (Can be seen by Publishers too)
  // @route   GET /api/v1/metadata/active
  // @access  Private
  async getActiveMetadata(req, res, next) {
    try {
      const metadata = await metadataService.getAllMetadata(false);
      res.status(200).json({
        success: true,
        data: metadata,
      });
    } catch (error) {
       next(error);
    }
  }

  // @desc    Get ALL metadata including inactive (Internal view only)
  // @route   GET /api/v1/metadata
  // @access  Private/Internal
  async getAllMetadata(req, res, next) {
    try {
        const metadata = await metadataService.getAllMetadata(true);
        res.status(200).json({
          success: true,
          data: metadata,
        });
      } catch (error) {
         next(error);
      }
  }

  // @desc    Get metadata by ID
  // @route   GET /api/v1/metadata/:id
  // @access  Private/Internal
  async getMetadataById(req, res, next) {
    try {
      const metadata = await metadataService.getMetadataById(req.params.id);
      res.status(200).json({
        success: true,
        data: metadata,
      });
    } catch (error) {
       if (error.message === 'Metadata not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // @desc    Update metadata config
  // @route   PUT /api/v1/metadata/:id
  // @access  Private/Internal
  async updateMetadata(req, res, next) {
    try {
      const metadata = await metadataService.updateMetadata(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Metadata updated successfully',
        data: metadata,
      });
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('required when dataType')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (error.message === 'Metadata not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // @desc    Delete metadata field
  // @route   DELETE /api/v1/metadata/:id
  // @access  Private/Internal
  async deleteMetadata(req, res, next) {
    try {
      await metadataService.deleteMetadata(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Metadata deleted successfully',
      });
    } catch (error) {
      if (error.message === 'Metadata not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // @desc    Bulk update ordering
  // @route   PUT /api/v1/metadata/reorder
  // @access  Private/Internal
  async reorderMetadata(req, res, next) {
    try {
        const { orderedIds } = req.body; // e.g., ["id1", "id2", "id3"]
        if (!orderedIds || !Array.isArray(orderedIds)) {
            return res.status(400).json({ success: false, message: 'Array of orderedIds is required' });
        }

        const newOrder = await metadataService.reorderMetadata(orderedIds);
        res.status(200).json({
            success: true,
            message: 'Order updated successfully',
            data: newOrder
        });
    } catch (error) {
        next(error);
    }
  }
}

module.exports = new MetadataController();
