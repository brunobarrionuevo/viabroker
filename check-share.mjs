import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST || 'db-mysql-nyc3-manus-do-user-18405625-0.h.db.ondigitalocean.com',
  port: parseInt(process.env.DATABASE_PORT || '25060'),
  user: process.env.DATABASE_USER || 'doadmin',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || '2bvimoergj5aebhy4vptbu',
  ssl: { rejectUnauthorized: false }
});

const [rows] = await connection.execute(`
  SELECT ps.id, ps.propertyId, ps.ownerCompanyId, ps.partnerCompanyId, ps.status, ps.isHighlight, p.title, p.isHighlight as propertyIsHighlight
  FROM propertyShares ps
  JOIN properties p ON ps.propertyId = p.id
  WHERE p.title LIKE '%Aldebaran%'
`);

console.log('Compartilhamento do imóvel Aldebaran:');
console.log(JSON.stringify(rows, null, 2));

await connection.end();
