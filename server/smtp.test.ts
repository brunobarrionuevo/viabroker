import { describe, it, expect } from "vitest";
import nodemailer from "nodemailer";

describe("SMTP Configuration", () => {
  it("should verify SMTP connection with provided credentials", async () => {
    // Verifica se as variáveis de ambiente estão configuradas
    expect(process.env.SMTP_HOST).toBeDefined();
    expect(process.env.SMTP_PORT).toBeDefined();
    expect(process.env.SMTP_USER).toBeDefined();
    expect(process.env.SMTP_PASS).toBeDefined();

    // Cria o transporter com as credenciais
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verifica a conexão SMTP
    const verifyResult = await transporter.verify();
    expect(verifyResult).toBe(true);
  }, 30000); // Timeout de 30 segundos para conexão SMTP
});
