const mongoose = require('mongoose');

async function connectDb(uri) {
  if (!uri) {
    throw new Error('MONGODB_URI is required (MongoDB Atlas connection string)');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = { connectDb };
