import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Banco de produção do Render
const connectionString = 'mysql://2r489WLxLphAsPM.root:wXSMjaZTOG8wqTTC@gateway01.us-west-2.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';
const pool = mysql.createPool(connectionString);

async function main() {
  // Hash da senha
  const passwordHash = await bcrypt.hash('123456', 12);
  
  console.log('Hash gerado:', passwordHash);
  
  // Atualizar a senha do usuário
  const [result] = await pool.execute(
    `UPDATE users SET passwordHash = ?, emailVerified = true WHERE email = ?`,
    [passwordHash, 'busb@hotmail.com']
  );
  
  console.log('Senha atualizada!');
  console.log('Linhas afetadas:', result.affectedRows);
  
  // Verificar o usuário
  const [users] = await pool.execute(
    "SELECT id, email, passwordHash, emailVerified, companyId FROM users WHERE email = ?",
    ['busb@hotmail.com']
  );
  
  console.log('Usuário:', users[0]);
  
  await pool.end();
}

main().catch(console.error);
