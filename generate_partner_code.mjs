import mysql from 'mysql2/promise';
import crypto from 'crypto';

// Banco de produção do Render
const connectionString = 'mysql://2r489WLxLphAsPM.root:wXSMjaZTOG8wqTTC@gateway01.us-west-2.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';
const pool = mysql.createPool(connectionString);

function generatePartnerCode(companyName) {
  // Pegar as primeiras 3 letras do nome da empresa (sem espaços)
  const cleanName = companyName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const prefix = cleanName.substring(0, 3).padEnd(3, 'X');
  
  // Gerar 6 caracteres aleatórios (letras e números)
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase().substring(0, 6);
  
  return `${prefix}${randomPart}`;
}

async function main() {
  // Buscar empresa
  const [companies] = await pool.execute(
    "SELECT id, name, slug, partnerCode FROM companies WHERE id = ?",
    [1]
  );
  
  if (companies.length === 0) {
    console.log('Empresa não encontrada');
    await pool.end();
    return;
  }
  
  const company = companies[0];
  console.log('Empresa antes:', company);
  
  // Gerar código de parceiro
  const partnerCode = generatePartnerCode(company.name);
  console.log('Novo Partner Code:', partnerCode);
  
  // Atualizar empresa
  await pool.execute(
    "UPDATE companies SET partnerCode = ? WHERE id = ?",
    [partnerCode, company.id]
  );
  
  // Verificar atualização
  const [updated] = await pool.execute(
    "SELECT id, name, slug, partnerCode FROM companies WHERE id = ?",
    [company.id]
  );
  
  console.log('Empresa depois:', updated[0]);
  
  await pool.end();
}

main().catch(console.error);
