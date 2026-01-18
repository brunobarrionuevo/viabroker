import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Remover parâmetros SSL existentes da URL para evitar conflitos
let cleanUrl = connectionString;
cleanUrl = cleanUrl.replace(/[?&]ssl=[^&]*/gi, '');
cleanUrl = cleanUrl.replace(/[?&]sslmode=[^&]*/gi, '');
cleanUrl = cleanUrl.replace(/[?&]$/, '');

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: cleanUrl,
    ssl: {
      rejectUnauthorized: true
    }
  },
});
