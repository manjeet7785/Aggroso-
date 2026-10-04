import mongoose from 'mongoose'

export async function connectDb(uri = process.env.MONGO_URI) {
  if (!uri) {
    throw new Error('MONGO_URI is required but not defined in .env')
  }

  const connection = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  })

  return connection
}