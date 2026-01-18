import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const DATABASE_URL = "mysql://2r489WLxLphAsPM.root:wXSMjaZTOG8wqTTC@gateway01.us-west-2.prod.aws.tidbcloud.com:4000/test?ssl={\"minVersion\":\"TLSv1.2\",\"rejectUnauthorized\":true}";

const connection = await mysql.createConnection(DATABASE_URL);

const password = "123456";
const hashedPassword = await bcrypt.hash(password, 10);

const [result] = await connection.execute(
  "UPDATE users SET password = ? WHERE email = ?",
  [hashedPassword, "brunobarrionuevo@gmail.com"]
);

console.log("Password updated:", result);

await connection.end();
