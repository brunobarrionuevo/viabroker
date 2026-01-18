import mysql from 'mysql2/promise';

const connectionString = process.env.DATABASE_URL;
// Não adicionar SSL se já existe na URL
const pool = mysql.createPool(connectionString);

async function main() {
  const [rows] = await pool.execute("SELECT id, name, slug FROM companies ORDER BY id DESC LIMIT 5");
  console.log(JSON.stringify(rows, null, 2));
  await pool.end();
}

main().catch(console.error);
