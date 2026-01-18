import mysql from 'mysql2/promise';

const DATABASE_URL = "mysql://2r489WLxLphAsPM.root:wXSMjaZTOG8wqTTC@gateway01.us-west-2.prod.aws.tidbcloud.com:4000/test?ssl={\"minVersion\":\"TLSv1.2\",\"rejectUnauthorized\":true}";

async function getVerificationToken() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    const [rows] = await connection.execute(
      'SELECT verification_token FROM users WHERE email = ?',
      ['teste.ia@manus.test']
    );
    
    console.log('Token:', rows[0]?.verification_token);
  } finally {
    await connection.end();
  }
}

getVerificationToken().catch(console.error);
