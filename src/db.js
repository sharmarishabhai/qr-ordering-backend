import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vegpuffco";
  const dbName = process.env.DB_NAME || undefined;
  await mongoose.connect(uri, { ...(dbName ? { dbName } : {}), serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}
