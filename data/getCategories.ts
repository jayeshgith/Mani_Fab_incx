import "server-only";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";

export async function getCategories() {
  await connectDB();
  return Category.find().lean();
}
