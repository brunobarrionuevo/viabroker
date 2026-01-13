import mysql from 'mysql2/promise';

async function updateCodes() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Buscar imóveis sem código
  const [properties] = await connection.execute(
    'SELECT id, companyId FROM properties WHERE code IS NULL OR code = ""'
  );
  
  console.log(`Encontrados ${properties.length} imóveis sem código`);
  
  for (const property of properties) {
    // Contar imóveis da empresa
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM properties WHERE companyId = ? AND id <= ?',
      [property.companyId, property.id]
    );
    
    const count = countResult[0].count;
    const companyPrefix = property.companyId.toString().padStart(3, '0');
    const propertyNumber = count.toString().padStart(4, '0');
    const code = `IMV${companyPrefix}${propertyNumber}`;
    
    await connection.execute(
      'UPDATE properties SET code = ? WHERE id = ?',
      [code, property.id]
    );
    
    console.log(`Imóvel ${property.id} atualizado com código ${code}`);
  }
  
  await connection.end();
  console.log('Concluído!');
}

updateCodes().catch(console.error);
