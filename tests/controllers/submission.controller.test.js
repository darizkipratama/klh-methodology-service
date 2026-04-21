import { jest } from '@jest/globals';
import submissionController from '../../src/controllers/submission.controller.js';
import submissionService from '../../src/services/submission.service.js';

describe('Submission Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user123', role: 'PUBLISHER' },
      file: undefined
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.restoreAllMocks();
  });

  describe('createSubmission', () => {
    it('should return 400 if file is missing', async () => {
      req.body = { title: 'Test Title' };
      await submissionController.createSubmission(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Document file is required' });
    });

    it('should return 400 if title is missing', async () => {
      req.file = { originalname: 'test.pdf' };
      await submissionController.createSubmission(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Title is required' });
    });

    it('should return 201 and uploaded submission data', async () => {
      req.file = { originalname: 'test.pdf' };
      req.body = { title: 'Test Title' };
      
      const mockSubmissionData = { _id: 'sub123', title: 'Test Title', status: 'SUBMITTED' };
      const spy = jest.spyOn(submissionService, 'uploadSubmission').mockResolvedValue(mockSubmissionData);

      await submissionController.createSubmission(req, res, next);

      expect(spy).toHaveBeenCalledWith(req.user, req.file, req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Submission uploaded successfully, awaiting review',
        data: mockSubmissionData
      });
    });

    it('should return 400 if error is missing parent ID for revision', async () => {
      req.file = { originalname: 'test.pdf' };
      req.body = { title: 'Test Title' };
      jest.spyOn(submissionService, 'uploadSubmission').mockRejectedValue(new Error('Revision submission requires a parent submission ID'));

      await submissionController.createSubmission(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Revision submission requires a parent submission ID' });
    });
  });

  describe('getSubmissions', () => {
    it('should return 200 with submissions and pagination', async () => {
      const mockResult = {
        submissions: [{ _id: 'sub1' }, { _id: 'sub2' }],
        pagination: { total: 2, page: 1, limit: 10, totalPages: 1 }
      };
      
      const spy = jest.spyOn(submissionService, 'getSubmissions').mockResolvedValue(mockResult);

      await submissionController.getSubmissions(req, res, next);

      expect(spy).toHaveBeenCalledWith(req.query, req.user);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.submissions,
        pagination: mockResult.pagination
      });
    });
  });

  describe('getSubmission', () => {
    it('should return 200 and submission data via ID', async () => {
      req.params.id = 'sub123';
      const mockSubmission = { _id: 'sub123', title: 'Doc' };
      const spy = jest.spyOn(submissionService, 'getSubmissionById').mockResolvedValue(mockSubmission);

      await submissionController.getSubmission(req, res, next);

      expect(spy).toHaveBeenCalledWith('sub123', req.user);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockSubmission });
    });

    it('should return 403 on Not authorized', async () => {
      req.params.id = 'sub123';
      jest.spyOn(submissionService, 'getSubmissionById').mockRejectedValue(new Error('Not authorized to access this submission'));

      await submissionController.getSubmission(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('should return 404 on Submission not found', async () => {
      req.params.id = 'sub123';
      jest.spyOn(submissionService, 'getSubmissionById').mockRejectedValue(new Error('Submission not found'));

      await submissionController.getSubmission(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe('addComment', () => {
    it('should return 200 and update submission on success', async () => {
      req.params.id = 'sub123';
      req.body = { comment: 'Test comment' };
      const mockUpdated = { _id: 'sub123', comments: [] };
      const spy = jest.spyOn(submissionService, 'addReviewComment').mockResolvedValue(mockUpdated);

      await submissionController.addComment(req, res, next);

      expect(spy).toHaveBeenCalledWith('sub123', req.user.id, 'Test comment');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Comment added', data: mockUpdated });
    });

    it('should return 404 on Submission not found', async () => {
      req.params.id = 'sub123';
      req.body = { comment: 'test' };
      jest.spyOn(submissionService, 'addReviewComment').mockRejectedValue(new Error('Submission not found'));

      await submissionController.addComment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateStatus', () => {
    it('should return 400 if status is missing', async () => {
      req.params.id = 'sub123';
      await submissionController.updateStatus(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Status property is required' });
    });

    it('should return 200 and update status', async () => {
      req.params.id = 'sub123';
      req.body = { status: 'APPROVED' };
      const mockUpdated = { _id: 'sub123', internalReviewStatus: 'APPROVED' };
      const spy = jest.spyOn(submissionService, 'updateInternalStatus').mockResolvedValue(mockUpdated);

      await submissionController.updateStatus(req, res, next);

      expect(spy).toHaveBeenCalledWith('sub123', 'APPROVED', req.user);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        message: 'Submission status updated to APPROVED', 
        data: mockUpdated 
      });
    });

    it('should return 404 on Submission not found', async () => {
      req.params.id = 'sub123';
      req.body = { status: 'APPROVED' };
      jest.spyOn(submissionService, 'updateInternalStatus').mockRejectedValue(new Error('Submission not found'));

      await submissionController.updateStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('addPublicComment', () => {
    it('should return 200 and add public comment', async () => {
      req.params.id = 'sub123';
      req.body = { commenterName: 'John', comment: 'Looks good' };
      const mockUpdated = { _id: 'sub123', publicComments: [] };
      const spy = jest.spyOn(submissionService, 'addPublicComment').mockResolvedValue(mockUpdated);

      await submissionController.addPublicComment(req, res, next);

      expect(spy).toHaveBeenCalledWith('sub123', 'John', 'Looks good');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        message: 'Public comment added successfully', 
        data: mockUpdated 
      });
    });

    it('should return 403 on public comments not enabled', async () => {
      req.params.id = 'sub123';
      req.body = { commenterName: 'John', comment: 'test' };
      jest.spyOn(submissionService, 'addPublicComment').mockRejectedValue(new Error('Public comments are not enabled for this submission at this time'));

      await submissionController.addPublicComment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deletePublicComment', () => {
    it('should return 200 and delete public comment', async () => {
      req.params.id = 'sub123';
      req.params.commentId = 'com123';
      const mockUpdated = { _id: 'sub123' };
      const spy = jest.spyOn(submissionService, 'deletePublicComment').mockResolvedValue(mockUpdated);

      await submissionController.deletePublicComment(req, res, next);

      expect(spy).toHaveBeenCalledWith('sub123', 'com123', req.user);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        message: 'Public comment deleted successfully', 
        data: mockUpdated 
      });
    });

    it('should return 403 if Not authorized', async () => {
      req.params.id = 'sub123';
      req.params.commentId = 'com123';
      jest.spyOn(submissionService, 'deletePublicComment').mockRejectedValue(new Error('Not authorized to delete public comments'));

      await submissionController.deletePublicComment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
