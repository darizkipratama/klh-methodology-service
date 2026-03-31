import metadataRepository from '../repositories/metadata.repository.js';
import MetadataConfig from '../models/metadataConfig.model.js';

class MetadataService {
  async createMetadata(data) {
    // Check if key already exists
    const existing = await metadataRepository.findByKey(data.key);
    if (existing) {
      throw new Error(`Metadata with key '${data.key}' already exists.`);
    }

    if (data.dataType === 'SELECT' && (!data.options || data.options.length === 0)) {
        throw new Error(`Options array is required when dataType is SELECT`);
    }

    return await metadataRepository.create(data);
  }

  // Digunakan oleh Internal (Bisa melihat semua, termasuk yg tidak aktif)
  async getAllMetadata(includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: true };
    return await metadataRepository.findAll(filter);
  }

  async getMetadataById(id) {
    const metadata = await metadataRepository.findById(id);
    if (!metadata) throw new Error('Metadata not found');
    return metadata;
  }

  async updateMetadata(id, data) {
    // Check if key is being updated to an existing one
    if (data.key) {
      const existing = await metadataRepository.findByKey(data.key);
      if (existing && existing._id.toString() !== id) {
        throw new Error(`Metadata with key '${data.key}' already exists.`);
      }
    }

    if (data.dataType === 'SELECT' && (!data.options || data.options.length === 0)) {
        throw new Error(`Options array is required when dataType is SELECT`);
    }

    const updated = await metadataRepository.updateById(id, data);
    if (!updated) throw new Error('Metadata not found');
    
    return updated;
  }

  async deleteMetadata(id) {
    const deleted = await metadataRepository.deleteById(id);
    if (!deleted) throw new Error('Metadata not found');
    return deleted;
  }

  // Reorder metadata utility using bulkWrite
  async reorderMetadata(orderedIds) {
    // orderedIds will be an array of ObjectIds in the expected new order
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: index },
      },
    }));

    
    await MetadataConfig.bulkWrite(bulkOps);
    
    return this.getAllMetadata(true);
  }
}

export default new MetadataService();
