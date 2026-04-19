import submissionRepository from '../repositories/submission.repository.js';
import openKmService from './openkm.service.js';

class SubmissionService {
  
  async uploadSubmission(user, file, bodyText) {
    const { title, description, submissionType, parentSubmissionId, ...dynamicMetadata } = bodyText;

    // 1. (Opsional) Validasi revision harus punya parent ID
    if (submissionType === 'REVISION' && !parentSubmissionId) {
      throw new Error('Revision submission requires a parent submission ID');
    }

    // 2. Upload file ke OpenKM. 
    // Parameter targetPath ditentukan secara dinamis berdasarkan submissionType.
    // NOTE: In production, kita perlu handle koneksi API fail agar tak masuk DB kl gagal
    let openKmData = {};
    const uploadPath = submissionType === 'REVISION' 
      ? '/okm:root/methodology-proposed/revision-proposed/' 
      : '/okm:root/methodology-proposed/new-proposed/';

    if (file) {
       openKmData = await openKmService.uploadDocument(file, uploadPath, title);
    }
    
    // Asumsi: openKmService.uploadDocument mereturn object berisi { uuid: '...', path: '...' }
    // Untuk pengembangan dan testing lokal sebelum server OpenKM menyala, kita buat mock UUID
    const docUuid = openKmData.uuid || `okm-mock-id-${Date.now()}`;
    const docPath = openKmData.path || `${uploadPath}${title || 'doc'}.pdf`;

    // 3. Simpan di database Mongo kita (dengan initial status UNPUBLISHED / SUBMITTED)
    const submissionData = {
      title,
      description,
      publisherId: user.id, // ID user JWT
      submissionType: submissionType || 'NEW',
      parentSubmissionId: parentSubmissionId || null,
      metadata: dynamicMetadata, // Simpan key-value dari form-data
      
      openKmDocumentId: docUuid,
      openKmPath: docPath,
      openKmPublishStatus: 'UNPUBLISHED',
      
      internalReviewStatus: 'SUBMITTED', 
    };

    return await submissionRepository.create(submissionData);
  }

  async getSubmissions(query, user) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    // Jika yg minta adalah Publisher, HANYA BISA LIHAT DOKUMEN MILIK SENDIRI
    if (user.role === 'PUBLISHER') {
      filter.publisherId = user.id;
    }

    // Filter tambahan dari query string (Bisa untuk dashboard Internal mencari berdasar status)
    if (query.internalReviewStatus) {
       filter.internalReviewStatus = query.internalReviewStatus;
    }

    const { data, total } = await submissionRepository.findAllPaginated(filter, { skip, limit });
    
    return {
      submissions: data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSubmissionById(id, user) {
    const submission = await submissionRepository.findById(id);
    if (!submission) throw new Error('Submission not found');

    // Mencegah Publisher lain melihat dokumen yg bukan miliknya
    if (user.role === 'PUBLISHER' && submission.publisherId._id.toString() !== user.id) {
       throw new Error('Not authorized to access this submission');
    }
    
    return submission;
  }

  async addReviewComment(id, commenterId, commentText) {
    // Memasukkan chat/komen review dari Internal KE Publisher
    if (!commentText) throw new Error('Comment text is required');
    
    const commentData = {
      comment: commentText,
      commenterId,
      createdAt: new Date()
    };

    const updated = await submissionRepository.addComment(id, commentData);
    if(!updated) throw new Error('Submission not found');
    
    // Jika menambah review, kita otomatis ubah status 'SUBMITTED' -> 'UNDER_REVIEW'
    if (updated.internalReviewStatus === 'SUBMITTED') {
       return await submissionRepository.updateById(id, { internalReviewStatus: 'UNDER_REVIEW', reviewerId: commenterId });
    }
    
    return updated;
  }

  async addPublicComment(id, commenterName, commentText) {
    // Add a public comment, only if the specific status is met
    if (!commentText || !commenterName) throw new Error('Comment text and commenter name are required');

    const submission = await submissionRepository.findById(id);
    if (!submission) throw new Error('Submission not found');

    if (submission.internalReviewStatus !== 'OPEN_TO_PUBLIC_COMMENT') {
      throw new Error('Public comments are not enabled for this submission at this time');
    }

    const publicCommentData = {
      comment: commentText,
      commenterName,
      createdAt: new Date()
    };

    return await submissionRepository.addPublicComment(id, publicCommentData);
  }

  async deletePublicComment(id, commentId, user) {
    // Only internal users can delete public comments
    if (user.role === 'PUBLISHER') {
      throw new Error('Not authorized to delete public comments');
    }

    const submission = await submissionRepository.findById(id);
    if (!submission) throw new Error('Submission not found');

    const updated = await submissionRepository.deletePublicComment(id, commentId);
    if (!updated) throw new Error('Submission or comment not found');

    return updated;
  }

  async updateInternalStatus(id, newStatus, user) {
    const submission = await submissionRepository.findById(id);
    if (!submission) throw new Error('Submission not found');

    // Perubahan State Approval Khusus Internal
    const updatePayload = {
      internalReviewStatus: newStatus,
      reviewerId: user.id
    };

    // Jika status diganti jadi 'APPROVED', maka PUBLISH ke openKM
    if (newStatus === 'APPROVED' && submission.openKmPublishStatus !== 'PUBLISHED') {
       // Panggil SDK OpenKM untuk ganti properties dokumen / unlock
       await openKmService.publishDocument(submission.openKmDocumentId);
       updatePayload.openKmPublishStatus = 'PUBLISHED';
    }

    return await submissionRepository.updateById(id, updatePayload);
  }
}

export default new SubmissionService();
