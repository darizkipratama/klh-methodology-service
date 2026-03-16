const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    publisherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      description: 'The external publisher who uploaded the document',
    },
    submissionType: {
      type: String,
      enum: ['NEW', 'REVISION'],
      required: true,
    },
    parentSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      description: 'Reference to the original submission if this is a REVISION',
    },
    // Dynamic metadata fields filled by the publisher based on MetadataConfig
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      description: 'Key-value pairs of dynamic metadata requested',
    },
    // OpenKM integration properties
    openKmDocumentId: {
      type: String,
      description: 'UUID representation of the document inside OpenKM',
    },
    openKmPath: {
      type: String,
      description: 'Path of the document in OpenKM node structure',
    },
    openKmPublishStatus: {
      type: String,
      enum: ['UNPUBLISHED', 'PUBLISHED'],
      default: 'UNPUBLISHED',
      description: 'Whether it is visible publicly on OpenKM',
    },
    // KMS internal approval properties
    internalReviewStatus: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED'],
      default: 'SUBMITTED',
      description: 'State of the document approval within this methodology system',
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: 'The internal user reviewing this document',
    },
    // Thread representation for reviewer/publisher communication
    comments: [
      {
        comment: {
          type: String,
          required: true,
        },
        commenterId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Submission', submissionSchema);
