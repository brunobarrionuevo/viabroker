import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = mysql.createPool(connectionString);

async function main() {
  // Hash da senha
  const passwordHash = await bcrypt.hash('123456', 12);
  
  // Gerar openId único
  const openId = 'viabroker_busb_' + Date.now();
  
  // Data de trial
  const trialStart = new Date();
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);
  
  // Inserir usuário
  const [result] = await pool.execute(
    `INSERT INTO users (openId, name, email, loginMethod, role, companyId, passwordHash, emailVerified, trialStartDate, trialEndDate, isTrialExpired, createdAt, updatedAt, lastSignedIn)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
    [openId, 'Bruno Busb', 'busb@hotmail.com', 'email', 'admin', 150001, passwordHash, true, trialStart, trialEnd, false]
  );
  
  console.log('Usuário criado com sucesso!');
  console.log('ID:', result.insertId);
  
  await pool.end();
}

main().catch(console.error);
