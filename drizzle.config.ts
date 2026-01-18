import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Garantir que SSL está habilitado na URL para TiDB
let urlWithSSL = connectionString;
// Se não tem parâmetro ssl, adicionar
if (!urlWithSSL.includes('ssl=')) {
  const separator = urlWithSSL.includes('?') ? '&' : '?';
  urlWithSSL = urlWithSSL + separator + 'ssl=true';
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: urlWithSSL
  },
});
