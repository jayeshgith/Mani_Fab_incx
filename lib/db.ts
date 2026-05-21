import mongoose from "mongoose";
import "@/models/Category";
import "@/models/Transaction";


const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME?.trim();

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(
      MONGODB_URI,
      MONGODB_DB_NAME ? { dbName: MONGODB_DB_NAME } : undefined,
    );
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
