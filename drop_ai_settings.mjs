import mysql from 'mysql2/promise';

const DATABASE_URL = "mysql://2r489WLxLphAsPM.root:wXSMjaZTOG8wqTTC@gateway01.us-west-2.prod.aws.tidbcloud.com:4000/test?ssl={\"minVersion\":\"TLSv1.2\",\"rejectUnauthorized\":true}";

async function dropAISettings() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    await connection.execute('DROP TABLE IF EXISTS ai_settings');
    console.log('✅ Tabela ai_settings removida com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao remover tabela:', error.message);
  } finally {
    await connection.end();
  }
}

dropAISettings();
