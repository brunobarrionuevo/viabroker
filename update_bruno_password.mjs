import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Banco de produção do Render
const connectionString = 'mysql://2r489WLxLphAsPM.root:wXSMjaZTOG8wqTTC@gateway01.us-west-2.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';
const pool = mysql.createPool(connectionString);

async function main() {
  const password = '123456';
  const passwordHash = await bcrypt.hash(password, 10);
  
  console.log('Novo hash da senha:', passwordHash);
  
  // Atualizar senha
  await pool.execute(
    "UPDATE users SET passwordHash = ? WHERE email = ?",
    [passwordHash, 'brunobarrionuevo@gmail.com']
  );
  
  console.log('Senha atualizada com sucesso!');
  
  await pool.end();
}

main().catch(console.error);
