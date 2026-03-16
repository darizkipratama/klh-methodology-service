const Submission = require('../models/submission.model');

class SubmissionRepository {
  async create(data) {
    const submission = new Submission(data);
    return await submission.save();
  }

  async findById(id) {
    return await Submission.findById(id)
      .populate('publisherId', 'username email')
      .populate('comments.commenterId', 'username role');
  }

  async findAllPaginated(filter = {}, options = { skip: 0, limit: 10 }) {
    const data = await Submission.find(filter)
      .populate('publisherId', 'username email')
      .skip(options.skip)
      .limit(options.limit)
      .sort({ createdAt: -1 });
      
    const total = await Submission.countDocuments(filter);
    
    return { data, total };
  }

  async updateById(id, updateData) {
    return await Submission.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('publisherId', 'username email');
  }

  async addComment(id, commentData) {
     return await Submission.findByIdAndUpdate(
        id, 
        { $push: { comments: commentData } },
        { new: true }
     ).populate('comments.commenterId', 'username role');
  }
}

module.exports = new SubmissionRepository();
