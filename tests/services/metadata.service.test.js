const mongoose = require('mongoose');
const metadataService = require('../../src/services/metadata.service');
const MetadataConfig = require('../../src/models/metadataConfig.model');
const dbSetup = require('../setup/db.setup');

beforeAll(async () => {
  await dbSetup.connect();
});

afterEach(async () => {
  await dbSetup.clearDatabase();
});

afterAll(async () => {
  await dbSetup.closeDatabase();
});

describe('Metadata Service', () => {
  
  describe('createMetadata()', () => {
    it('should create a new text metadata field successfully', async () => {
      const fieldData = {
        key: 'document_title',
        label: 'Judul Dokumen',
        dataType: 'STRING',
        isRequired: true,
        order: 1
      };

      const result = await metadataService.createMetadata(fieldData);

      expect(result).toHaveProperty('_id');
      expect(result.key).toBe('document_title');
      expect(result.dataType).toBe('STRING');
      expect(result.isRequired).toBe(true);
    });

    it('should throw an error if key already exists', async () => {
      const fieldData = {
        key: 'author_name',
        label: 'Nama Penulis',
        dataType: 'STRING',
      };
      
      // Buat yang pertama
      await metadataService.createMetadata(fieldData);

      // Coba buat dengan key yang sama
      await expect(
        metadataService.createMetadata({ ...fieldData, label: 'Penulis Lain' })
      ).rejects.toThrow("Metadata with key 'author_name' already exists.");
    });

    it('should throw an error if dataType is SELECT but options are missing', async () => {
      const fieldData = {
        key: 'category',
        label: 'Kategori',
        dataType: 'SELECT',
        options: [] // Empty
      };

      await expect(
        metadataService.createMetadata(fieldData)
      ).rejects.toThrow('Options array is required when dataType is SELECT');
    });
  });

  describe('Retrieval & Filtering', () => {
    beforeEach(async () => {
      // Seed databse for test
      await metadataService.createMetadata({ key: 'field_1', label: 'Field 1', dataType: 'STRING', isActive: true });
      await metadataService.createMetadata({ key: 'field_2', label: 'Field 2', dataType: 'NUMBER', isActive: false });
      await metadataService.createMetadata({ key: 'field_3', label: 'Field 3', dataType: 'DATE', isActive: true });
    });

    it('should return only ACTIVE metadata for Publishers (includeInactive = false)', async () => {
      const activeFields = await metadataService.getAllMetadata(false);
      
      expect(activeFields).toHaveLength(2);
      expect(activeFields.some(f => f.key === 'field_2')).toBe(false); // field_2 is inactive
    });

    it('should return ALL metadata for Internal users (includeInactive = true)', async () => {
      const allFields = await metadataService.getAllMetadata(true);
      
      expect(allFields).toHaveLength(3);
    });

    it('should return metadata by valid ID', async () => {
       const allFields = await metadataService.getAllMetadata(true);
       const targetId = allFields[0]._id;

       const found = await metadataService.getMetadataById(targetId);
       expect(found.key).toBe(allFields[0].key);
    });

    it('should throw error when finding by invalid ID', async () => {
       const fakeId = new mongoose.Types.ObjectId();
       await expect(
         metadataService.getMetadataById(fakeId)
       ).rejects.toThrow('Metadata not found');
    });
  });

  describe('Update & Delete', () => {
    let existingField;

    beforeEach(async () => {
      existingField = await metadataService.createMetadata({ 
        key: 'updatable_field', 
        label: 'Original Label', 
        dataType: 'STRING', 
        isActive: true 
      });
      // Another field to test key clashing
      await metadataService.createMetadata({ 
        key: 'other_field', 
        label: 'Other', 
        dataType: 'STRING', 
      });
    });

    it('should update metadata successfully', async () => {
      const updated = await metadataService.updateMetadata(existingField._id, { label: 'Updated Label', isActive: false });
      
      expect(updated.label).toBe('Updated Label');
      expect(updated.isActive).toBe(false);
    });

    it('should prevent updating key to an already existing key of another document', async () => {
      await expect(
        metadataService.updateMetadata(existingField._id, { key: 'other_field' })
      ).rejects.toThrow("Metadata with key 'other_field' already exists.");
    });

    it('should delete metadata successfully', async () => {
       const deleted = await metadataService.deleteMetadata(existingField._id);
       expect(deleted.key).toBe('updatable_field');

       const verification = await MetadataConfig.findById(existingField._id);
       expect(verification).toBeNull();
    });
  });

  describe('reorderMetadata()', () => {
    let m1, m2, m3;

    beforeEach(async () => {
      m1 = await metadataService.createMetadata({ key: 'm1', label: '1', dataType: 'STRING', order: 0 });
      m2 = await metadataService.createMetadata({ key: 'm2', label: '2', dataType: 'STRING', order: 1 });
      m3 = await metadataService.createMetadata({ key: 'm3', label: '3', dataType: 'STRING', order: 2 });
    });

    it('should update the order of the configuration array using bulkWrite', async () => {
       // Reverse the order: m3, m2, m1
       const newOrderIds = [m3._id.toString(), m2._id.toString(), m1._id.toString()];

       const result = await metadataService.reorderMetadata(newOrderIds);

       expect(result).toHaveLength(3);
       
       // Because reorderMetadata uses sorting by 'order', let's find one by one to verify
       const foundM3 = result.find(r => r.key === 'm3');
       const foundM2 = result.find(r => r.key === 'm2');
       const foundM1 = result.find(r => r.key === 'm1');

       // Array map index order: m3=0, m2=1, m1=2
       expect(foundM3.order).toBe(0);
       expect(foundM2.order).toBe(1);
       expect(foundM1.order).toBe(2);
    });
  });

});
