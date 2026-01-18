import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Remover parâmetros SSL existentes para evitar conflitos
let cleanUrl = connectionString;
// Remover parâmetros ssl existentes
cleanUrl = cleanUrl.replace(/[?&]ssl=[^&]*/gi, '');
cleanUrl = cleanUrl.replace(/[?&]sslmode=[^&]*/gi, '');
// Limpar ? ou & soltos no final
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
