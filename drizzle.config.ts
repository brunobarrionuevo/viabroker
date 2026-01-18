import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Verificar se já tem parâmetros SSL na URL
const hasSSL = connectionString.includes('ssl=') || connectionString.includes('sslmode=');
const connectionStringWithSSL = hasSSL ? connectionString : connectionString + '?ssl=true';

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionStringWithSSL
  },
});
