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
    // Parameter targetPath ditentukan secara statis misalnya /okm:root/Pengajuan, tapi bisa dinamis.
    // NOTE: In production, kita perlu handle koneksi API fail agar tak masuk DB kl gagal
    let openKmData = {};
    if (file) {
       openKmData = await openKmService.uploadDocument(file, '/okm:root/Pengajuan', title);
    }
    
    // Asumsi: openKmService.uploadDocument mereturn object berisi { uuid: '...', path: '...' }
    // Untuk pengembangan dan testing lokal sebelum server OpenKM menyala, kita buat mock UUID
    const docUuid = openKmData.uuid || `okm-mock-id-${Date.now()}`;
    const docPath = openKmData.path || `/okm:root/Pengajuan/${title || 'doc'}.pdf`;

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
