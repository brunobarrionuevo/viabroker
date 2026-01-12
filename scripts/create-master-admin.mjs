import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

// Credenciais do admin master inicial
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Brokvia@2024"; // Altere esta senha após o primeiro login
const ADMIN_EMAIL = "admin@brokvia.com";

async function createMasterAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  try {
    // Verificar se já existe um admin
    const [existing] = await connection.execute(
      "SELECT id FROM master_admins WHERE username = ?",
      [ADMIN_USERNAME]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      console.log("⚠️  Usuário admin já existe!");
      console.log("   Username: admin");
      console.log("   Se esqueceu a senha, delete o registro e execute novamente.");
      return;
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Inserir admin
    await connection.execute(
      `INSERT INTO master_admins (username, passwordHash, email, name, role, isActive, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [ADMIN_USERNAME, passwordHash, ADMIN_EMAIL, "Administrador", "super_admin", true]
    );

    console.log("✅ Administrador master criado com sucesso!");
    console.log("");
    console.log("   ╔════════════════════════════════════════╗");
    console.log("   ║     CREDENCIAIS DO ADMIN MASTER        ║");
    console.log("   ╠════════════════════════════════════════╣");
    console.log("   ║  URL:      /master                     ║");
    console.log("   ║  Usuário:  admin                       ║");
    console.log("   ║  Senha:    Brokvia@2024                ║");
    console.log("   ╚════════════════════════════════════════╝");
    console.log("");
    console.log("⚠️  IMPORTANTE: Altere a senha após o primeiro login!");

  } catch (error) {
    console.error("❌ Erro ao criar admin:", error.message);
  } finally {
    await connection.end();
  }
}

createMasterAdmin();
