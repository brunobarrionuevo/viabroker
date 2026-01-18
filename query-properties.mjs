import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config();

async function main() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true }
  });
  
  const db = drizzle(connection);
  
  // Query all properties
  const [properties] = await connection.execute('SELECT id, code, title, companyId, status FROM properties');
  console.log('All properties:', JSON.stringify(properties, null, 2));
  
  // Query users
  const [users] = await connection.execute('SELECT id, email, companyId FROM users WHERE companyId IS NOT NULL');
  console.log('Users with company:', JSON.stringify(users, null, 2));
  
  // Query companies
  const [companies] = await connection.execute('SELECT id, name FROM companies');
  console.log('Companies:', JSON.stringify(companies, null, 2));
  
  await connection.end();
}

main().catch(console.error);
