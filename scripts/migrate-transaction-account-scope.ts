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
const LEGACY_SOCIETY_SCOPES = ["family"];
const CANONICAL_SCOPE = "society";

async function run() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is required to run this migration.");
  }

  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
  const transactions = mongoose.connection.collection("transactions");

  const beforeCount = await transactions.countDocuments({
    accountScope: { $in: LEGACY_SOCIETY_SCOPES },
  });

  const result = await transactions.updateMany(
    { accountScope: { $in: LEGACY_SOCIETY_SCOPES } },
    { $set: { accountScope: CANONICAL_SCOPE } },
  );

  const afterCount = await transactions.countDocuments({
    accountScope: { $in: LEGACY_SOCIETY_SCOPES },
  });

  console.log(`Database: ${DB_NAME}`);
  console.log(`Legacy docs before: ${beforeCount}`);
  console.log(`Matched: ${result.matchedCount}`);
  console.log(`Modified: ${result.modifiedCount}`);
  console.log(`Legacy docs remaining: ${afterCount}`);
}

run()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
