import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from './config/db.js';
import User from './models/user.model.js';
import MetadataConfig from './models/metadataConfig.model.js';
import Submission from './models/submission.model.js';

const seed = async () => {
  try {
    await connectDB();

    // Cleanup existing data
    await Submission.deleteMany({});
    await MetadataConfig.deleteMany({});
    await User.deleteMany({});

    // Seed users
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const publisher = await User.create({
      username: 'publisher1',
      email: 'publisher1@example.com',
      companyName: 'Publisher Corp',
      passwordHash,
      role: 'PUBLISHER',
      userType: 'Swasta',
      isActive: true,
    });

    const internal = await User.create({
      username: 'internal1',
      email: 'internal1@example.com',
      companyName: 'Internal Team',
      passwordHash,
      role: 'INTERNAL',
      userType: 'Bumn',
      isActive: true,
    });

    // Seed metadata config fields
    const metadataItems = await MetadataConfig.insertMany([
      {
        key: 'author_name',
        label: 'Nama Penulis',
        dataType: 'STRING',
        isRequired: true,
        options: [],
        isActive: true,
        order: 1,
      },
      {
        key: 'publish_date',
        label: 'Tanggal Penerbitan',
        dataType: 'DATE',
        isRequired: true,
        isActive: true,
        order: 2,
      },
      {
        key: 'document_type',
        label: 'Jenis Dokumen',
        dataType: 'SELECT',
        isRequired: true,
        options: ['Policy', 'Manual', 'Report', 'Procedure'],
        isActive: true,
        order: 3,
      },
    ]);

    // Seed submission
    const submission = await Submission.create({
      title: 'Contoh Dokumen Metodologi',
      description: 'Submisi awal untuk proses metodologi',
      publisherId: publisher._id,
      submissionType: 'NEW',
      metadata: {
        author_name: 'Dari Z',
        publish_date: new Date().toISOString().split('T')[0],
        document_type: 'Policy',
      },
      openKmDocumentId: 'doc-uuid-001',
      openKmPath: '/okm:root/KLH/Doc',
      openKmPublishStatus: 'UNPUBLISHED',
      internalReviewStatus: 'DRAFT',
      reviewerId: internal._id,
      comments: [
        {
          comment: 'Initial submission created',
          commenterId: internal._id,
        },
      ],
    });

    console.log(`Seed successful! Users: ${publisher.username}, ${internal.username}.`);
    console.log(`Metadata entries created: ${metadataItems.length}. Submission ID: ${submission._id}`);

    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
};

seed();
