import dotenv from "dotenv";
import fs from "node:fs";
import mongoose from "mongoose";

if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
} else {
  dotenv.config();
}

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || "fabinex";

async function run() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is required to run this cleanup.");
  }

  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
  const transactions = mongoose.connection.collection("transactions");

  const transferFilter = {
    $or: [
      { category: { $in: ["Paid Money", "Money Transfer"] } },
      { description: { $regex: "^Paid to\\s", $options: "i" } },
      { description: { $regex: "^Received from\\s", $options: "i" } },
      { description: { $regex: "^Paid money:\\s", $options: "i" } },
      { description: { $regex: "^Family Money Transfer", $options: "i" } },
    ],
  };

  const beforeCount = await transactions.countDocuments(transferFilter);
  const result = await transactions.deleteMany(transferFilter);
  const afterCount = await transactions.countDocuments(transferFilter);

  console.log(`Database: ${DB_NAME}`);
  console.log(`Transfer docs before: ${beforeCount}`);
  console.log(`Deleted: ${result.deletedCount}`);
  console.log(`Transfer docs remaining: ${afterCount}`);
}

run()
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

