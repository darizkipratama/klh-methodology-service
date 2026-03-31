import MetadataConfig from '../models/metadataConfig.model.js';

class MetadataRepository {
  async create(data) {
    const metadata = new MetadataConfig(data);
    return await metadata.save();
  }

  async findAll(filter = {}, sort = { order: 1 }) {
    return await MetadataConfig.find(filter).sort(sort);
  }

  async findById(id) {
    return await MetadataConfig.findById(id);
  }

  async findByKey(key) {
    return await MetadataConfig.findOne({ key });
  }

  async updateById(id, updateData) {
    return await MetadataConfig.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async deleteById(id) {
    return await MetadataConfig.findByIdAndDelete(id);
  }
}

export default new MetadataRepository();
