import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Add SSL parameters directly to connection string for TiDB compatibility
const connectionStringWithSSL = connectionString + '?ssl={"rejectUnauthorized":true}';

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionStringWithSSL
  },
});
