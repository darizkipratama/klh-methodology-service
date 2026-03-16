const submissionService = require('../services/submission.service');

class SubmissionController {
  
  // @desc    Submit new document with metadata
  // @route   POST /api/v1/submissions
  // @access  Private (Publisher & Internal)
  async createSubmission(req, res, next) {
    try {
      // req.file didapatkan dari middleware multer di route
      // req.body berisi teks/dropdown (metadata)
      const file = req.file; 
      
      if (!file) {
         return res.status(400).json({ success: false, message: 'Document file is required' });
      }
      if (!req.body.title) {
        return res.status(400).json({ success: false, message: 'Title is required' });
      }

      const submission = await submissionService.uploadSubmission(req.user, file, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Submission uploaded successfully, awaiting review',
        data: submission,
      });
    } catch (error) {
      if (error.message.includes('requires a parent')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // @desc    Get all submissions (Paginated & Filtered based on Role)
  // @route   GET /api/v1/submissions
  // @access  Private
  async getSubmissions(req, res, next) {
    try {
      const result = await submissionService.getSubmissions(req.query, req.user);
      res.status(200).json({
        success: true,
        data: result.submissions,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get submission details
  // @route   GET /api/v1/submissions/:id
  // @access  Private
  async getSubmission(req, res, next) {
     try {
      const submission = await submissionService.getSubmissionById(req.params.id, req.user);
      res.status(200).json({
        success: true,
        data: submission,
      });
    } catch (error) {
       if (error.message.includes('Not authorized')) {
         return res.status(403).json({ success: false, message: error.message });
       }
       if (error.message === 'Submission not found') {
         return res.status(404).json({ success: false, message: error.message });
       }
      next(error);
    }
  }

  // @desc    Add review comment to a submission
  // @route   POST /api/v1/submissions/:id/comments
  // @access  Private
  async addComment(req, res, next) {
     try {
       const { comment } = req.body;
       const submission = await submissionService.addReviewComment(req.params.id, req.user.id, comment);
       res.status(200).json({
         success: true,
         message: 'Comment added',
         data: submission
       });
     } catch (error) {
       if (error.message === 'Submission not found') {
         return res.status(404).json({ success: false, message: error.message });
       }
       next(error);
     }
  }

  // @desc    Update Internal Review Status (+ Auto Publish to OpenKM if Approved)
  // @route   PATCH /api/v1/submissions/:id/status
  // @access  Private/Internal
  async updateStatus(req, res, next) {
      try {
        const { status } = req.body;
        // VALID STATUSES: 'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED'
        
        if (!status) {
           return res.status(400).json({ success: false, message: 'Status property is required' });
        }

        const submission = await submissionService.updateInternalStatus(req.params.id, status, req.user);
        res.status(200).json({
          success: true,
          message: `Submission status updated to ${status}`,
          data: submission
        });

      } catch (error) {
        if (error.message === 'Submission not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
      }
  }

}

module.exports = new SubmissionController();
