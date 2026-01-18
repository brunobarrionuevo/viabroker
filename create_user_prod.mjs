import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Banco de produção do Render
const connectionString = 'mysql://2r489WLxLphAsPM.root:wXSMjaZTOG8wqTTC@gateway01.us-west-2.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';
const pool = mysql.createPool(connectionString);

async function main() {
  // Primeiro, verificar se o usuário já existe
  const [existingUsers] = await pool.execute(
    "SELECT id, email FROM users WHERE email = ?",
    ['busb@hotmail.com']
  );
  
  if (existingUsers.length > 0) {
    console.log('Usuário já existe:', existingUsers[0]);
    await pool.end();
    return;
  }
  
  // Hash da senha
  const passwordHash = await bcrypt.hash('123456', 12);
  
  // Gerar openId único
  const openId = 'viabroker_busb_' + Date.now();
  
  // Data de trial
  const trialStart = new Date();
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);
  
  // Primeiro criar a empresa
  const [companyResult] = await pool.execute(
    `INSERT INTO companies (name, slug, personType, email, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    ['Bruno Busb', 'bruno-busb-prod', 'fisica', 'busb@hotmail.com', true]
  );
  
  const companyId = companyResult.insertId;
  console.log('Empresa criada com ID:', companyId);
  
  // Inserir usuário
  const [result] = await pool.execute(
    `INSERT INTO users (openId, name, email, loginMethod, role, companyId, passwordHash, emailVerified, trialStartDate, trialEndDate, isTrialExpired, createdAt, updatedAt, lastSignedIn)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
    [openId, 'Bruno Busb', 'busb@hotmail.com', 'email', 'admin', companyId, passwordHash, true, trialStart, trialEnd, false]
  );
  
  console.log('Usuário criado com sucesso!');
  console.log('ID:', result.insertId);
  
  await pool.end();
}

main().catch(console.error);
