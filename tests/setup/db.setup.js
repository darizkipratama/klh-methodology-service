const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Start memory server and connect wrapper
module.exports.connect = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
};

// Disconnect and close memory server
module.exports.closeDatabase = async () => {
  if (mongoose.connection) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

// Clear all data inside collections
module.exports.clearDatabase = async () => {
  if (mongoose.connection) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
  }
};
