import mysql from 'mysql2/promise';

// Banco de produção do Render
const connectionString = 'mysql://2r489WLxLphAsPM.root:wXSMjaZTOG8wqTTC@gateway01.us-west-2.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';
const pool = mysql.createPool(connectionString);

async function main() {
  // Buscar usuário por email
  const [users] = await pool.execute(
    "SELECT id, email, name, companyId FROM users WHERE email = ?",
    ['brunobarrionuevo@gmail.com']
  );
  
  if (users.length === 0) {
    console.log('Usuário não encontrado');
    await pool.end();
    return;
  }
  
  const user = users[0];
  console.log('Usuário:', user);
  
  // Buscar empresa do usuário
  const [companies] = await pool.execute(
    "SELECT id, name, slug, partnerCode FROM companies WHERE id = ?",
    [user.companyId]
  );
  
  if (companies.length === 0) {
    console.log('Empresa não encontrada');
    await pool.end();
    return;
  }
  
  const company = companies[0];
  console.log('Empresa:', company);
  console.log('Partner Code:', company.partnerCode);
  
  await pool.end();
}

main().catch(console.error);
