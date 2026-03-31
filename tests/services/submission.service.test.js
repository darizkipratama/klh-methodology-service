import mongoose from 'mongoose';
import submissionService from '../../src/services/submission.service.js';
import openKmService from '../../src/services/openkm.service.js'; // We will mock this
import User from '../../src/models/user.model.js';
import Submission from '../../src/models/submission.model.js';
import dbSetup from '../setup/db.setup.js';

// Mock out the OpenKM integration so it doesn't try to make real HTTP calls
jest.mock('../../src/services/openkm.service', () => {
    return {
        uploadDocument: jest.fn().mockResolvedValue({
            uuid: 'mock-openkm-uuid-1234',
            path: '/okm:root/MockFolder/testdoc.pdf',
        }),
        publishDocument: jest.fn().mockResolvedValue(true)
    };
});

// Setup mock users
let publisherA, publisherB, internalAdmin;

beforeAll(async () => {
  await dbSetup.connect();

  // Create Users for isolation testing
  publisherA = await User.create({
      username: 'pub_a',
      companyName: 'Company A',
      email: 'a@mail.com',
      passwordHash: 'hash',
      role: 'PUBLISHER'
  });

  publisherB = await User.create({
    username: 'pub_b',
    companyName: 'Company B',
    email: 'b@mail.com',
    passwordHash: 'hash',
    role: 'PUBLISHER'
  });

  internalAdmin = await User.create({
    username: 'admin',
    email: 'admin@mail.com',
    passwordHash: 'hash',
    role: 'INTERNAL'
  });

});

afterEach(async () => {
  // Clear only Submissions collection, keep Users intact for speed
  await Submission.deleteMany();
  jest.clearAllMocks();
});

afterAll(async () => {
  await dbSetup.closeDatabase();
});

describe('Submission Service', () => {
  
  describe('uploadSubmission()', () => {
    it('should create new submission with metadata and mocked OpenKM upload', async () => {
      const mockFile = { originalname: 'doc1.pdf', buffer: Buffer.from('hello') };
      const reqBody = {
          title: 'Metodologi Hijau',
          description: 'Testing pengajuan pertama',
          submissionType: 'NEW',
          dynamicField_1: 'Value 1',
          dynamicField_2: 'Value 2'
      };

      const result = await submissionService.uploadSubmission(
          { id: publisherA._id.toString(), role: 'PUBLISHER' },
          mockFile,
          reqBody
      );

      // Asserts DB
      expect(result).toHaveProperty('_id');
      expect(result.publisherId.toString()).toBe(publisherA._id.toString());
      expect(result.submissionType).toBe('NEW');
      expect(result.internalReviewStatus).toBe('SUBMITTED');
      
      // Asserts OpenKM Mock behavior
      expect(result.openKmDocumentId).toBe('mock-openkm-uuid-1234');
      expect(result.openKmPublishStatus).toBe('UNPUBLISHED');
      expect(openKmService.uploadDocument).toHaveBeenCalledTimes(1);

      // Asserts dynamic metadata saving
      expect(result.metadata.get('dynamicField_1')).toBe('Value 1');
      expect(result.metadata.get('dynamicField_2')).toBe('Value 2');
    });

    it('should throw error if type is REVISION without parent ID', async () => {
        const reqBody = { title: 'Rev 1', submissionType: 'REVISION' };

        await expect(
            submissionService.uploadSubmission({ id: publisherA._id, role: 'PUBLISHER' }, null, reqBody)
        ).rejects.toThrow('Revision submission requires a parent submission ID');
    });
  });

  describe('getSubmissions() & getSubmissionById()', () => {
      let docPubA, docPubB;

      beforeEach(async () => {
         // Create raw submissons in DB
         docPubA = await Submission.create({
            title: 'Doc A',
            publisherId: publisherA._id,
            submissionType: 'NEW'
         });
         docPubB = await Submission.create({
            title: 'Doc B',
            publisherId: publisherB._id,
            submissionType: 'NEW'
         });
      });

      it('Publisher should only see their own submissions in list', async () => {
          const result = await submissionService.getSubmissions(
              { page: 1, limit: 10 }, 
              { id: publisherA._id.toString(), role: 'PUBLISHER' } 
          );

          expect(result.pagination.total).toBe(1);
          expect(result.submissions[0].title).toBe('Doc A');
      });

      it('Internal admins should see all submissions', async () => {
        const result = await submissionService.getSubmissions(
            { page: 1, limit: 10 }, 
            { id: internalAdmin._id.toString(), role: 'INTERNAL' } 
        );

        expect(result.pagination.total).toBe(2);
      });

      it('Publisher should get forbidden error when reading another users submission ID', async () => {
         await expect(
             submissionService.getSubmissionById(docPubA._id, { id: publisherB._id.toString(), role: 'PUBLISHER' })
         ).rejects.toThrow('Not authorized to access this submission');
      });
  });

  describe('Review Process', () => {
      let activeDoc;

      beforeEach(async () => {
        activeDoc = await Submission.create({
           title: 'Doc to Review',
           publisherId: publisherA._id,
           submissionType: 'NEW',
           internalReviewStatus: 'SUBMITTED',
           openKmDocumentId: 'uuid-to-publish'
        });
      });

      it('should add comment and automatically transition SUBMITTED to UNDER_REVIEW', async () => {
          const updated = await submissionService.addReviewComment(
              activeDoc._id, 
              internalAdmin._id.toString(), 
              'This is a valid test comment'
          );

          expect(updated.comments).toHaveLength(1);
          expect(updated.comments[0].comment).toBe('This is a valid test comment');
          expect(updated.internalReviewStatus).toBe('UNDER_REVIEW');
          expect(updated.reviewerId._id.toString()).toBe(internalAdmin._id.toString());
      });

      it('should change status to APPROVED and trigger OpenKM publish API', async () => {
          const updated = await submissionService.updateInternalStatus(
              activeDoc._id,
              'APPROVED',
              { id: internalAdmin._id.toString(), role: 'INTERNAL' }
          );

          expect(updated.internalReviewStatus).toBe('APPROVED');
          expect(updated.openKmPublishStatus).toBe('PUBLISHED');
          expect(openKmService.publishDocument).toHaveBeenCalledWith('uuid-to-publish');
          expect(openKmService.publishDocument).toHaveBeenCalledTimes(1);
      });

      it('should not call publishDocument twice if status is already PUBLISHED', async () => {
         // Manually force it to published first
         activeDoc.openKmPublishStatus = 'PUBLISHED';
         await activeDoc.save();

         await submissionService.updateInternalStatus(
            activeDoc._id, 'APPROVED', { id: internalAdmin._id }
         );

         expect(openKmService.publishDocument).toHaveBeenCalledTimes(0);
      });

  });

});
