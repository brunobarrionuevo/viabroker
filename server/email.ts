import nodemailer from "nodemailer";
import { notifyOwner } from "./_core/notification";

const APP_NAME = "Brokvia";
// Usar a URL do ambiente ou fallback para a URL publicada
const APP_URL = process.env.VITE_APP_URL || process.env.APP_URL || "https://imobpitch-2bvimoer.manus.space";

// Configuração do transporter de email
// Em produção, configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
const getTransporter = () => {
  // Se tiver configuração SMTP, usa ela
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  // Fallback para ethereal (apenas para testes)
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "ethereal.user@ethereal.email",
      pass: "ethereal.pass",
    },
  });
};

// Template base de email
function getEmailTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo h1 { color: #1e40af; font-size: 28px; margin: 0; }
    .content { color: #374151; line-height: 1.6; }
    .button { display: inline-block; background: #1e40af; color: white !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .button:hover { background: #1e3a8a; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    .highlight { background: #f0f9ff; padding: 16px; border-radius: 8px; border-left: 4px solid #1e40af; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <h1>🏠 ${APP_NAME}</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${APP_NAME}. Todos os direitos reservados.</p>
        <p>Plataforma de Sites para Corretores e Imobiliárias</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Função auxiliar para enviar email
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    // Tenta enviar via SMTP se configurado
    if (process.env.SMTP_HOST) {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"${APP_NAME}" <${process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@brokvia.com"}>`,
        to,
        subject,
        html,
      });
      console.log(`[Email] Enviado para ${to}: ${subject}`);
      return true;
    }
    
    // Fallback: notifica o owner (você) sobre o email que deveria ser enviado
    // Isso é útil durante desenvolvimento
    await notifyOwner({
      title: `📧 Email para ${to}`,
      content: `Assunto: ${subject}\n\nEste email seria enviado em produção. Configure SMTP_HOST para habilitar envio real.`,
    });
    
    console.log(`[Email] Simulado para ${to}: ${subject} (configure SMTP para envio real)`);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar:", error);
    return false;
  }
}

// Email de confirmação de conta
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const verificationUrl = `${APP_URL}/verificar-email?token=${token}`;
  
  const content = `
    <h2>Olá, ${name}! 👋</h2>
    <p>Obrigado por se cadastrar no <strong>${APP_NAME}</strong>!</p>
    <p>Para ativar sua conta e começar a usar nossa plataforma, clique no botão abaixo:</p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="button">Confirmar meu email</a>
    </div>
    <div class="highlight">
      <strong>🎁 Você ganhou 7 dias de teste grátis!</strong><br>
      Aproveite para explorar todos os recursos da plataforma sem compromisso.
    </div>
    <p>Se você não criou esta conta, pode ignorar este email.</p>
    <p style="color: #6b7280; font-size: 13px;">
      Se o botão não funcionar, copie e cole este link no seu navegador:<br>
      <a href="${verificationUrl}" style="color: #1e40af;">${verificationUrl}</a>
    </p>
  `;

  return sendEmail(
    email,
    `Confirme seu email - ${APP_NAME}`,
    getEmailTemplate(content, `Confirme seu email - ${APP_NAME}`)
  );
}

// Email de boas-vindas após confirmação
export async function sendWelcomeEmail(
  email: string,
  name: string,
  trialEndDate: Date
): Promise<boolean> {
  const formattedDate = trialEndDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const content = `
    <h2>Bem-vindo ao ${APP_NAME}, ${name}! 🎉</h2>
    <p>Sua conta foi confirmada com sucesso!</p>
    <div class="highlight">
      <strong>📅 Seu período de teste gratuito</strong><br>
      Você tem acesso completo à plataforma até <strong>${formattedDate}</strong>.
    </div>
    <h3>O que você pode fazer agora:</h3>
    <ul>
      <li>✅ Cadastrar seus imóveis com fotos e vídeos</li>
      <li>✅ Personalizar seu site com suas cores e logo</li>
      <li>✅ Gerenciar leads e agendamentos</li>
      <li>✅ Gerar XML para portais imobiliários</li>
    </ul>
    <div style="text-align: center;">
      <a href="${APP_URL}/dashboard" class="button">Acessar meu Dashboard</a>
    </div>
    <p>Precisa de ajuda? Responda este email que teremos prazer em ajudar!</p>
  `;

  return sendEmail(
    email,
    `Bem-vindo ao ${APP_NAME}!`,
    getEmailTemplate(content, `Bem-vindo ao ${APP_NAME}!`)
  );
}

// Email de aviso de expiração do trial
export async function sendTrialExpiringEmail(
  email: string,
  name: string,
  daysLeft: number
): Promise<boolean> {
  const content = `
    <h2>Olá, ${name}! ⏰</h2>
    <p>Seu período de teste gratuito no <strong>${APP_NAME}</strong> está acabando!</p>
    <div class="highlight">
      <strong>⚠️ Restam apenas ${daysLeft} dia${daysLeft > 1 ? "s" : ""}</strong><br>
      Após esse período, você precisará escolher um plano para continuar usando a plataforma.
    </div>
    <h3>Não perca seus dados!</h3>
    <p>Todos os seus imóveis, leads e configurações serão mantidos quando você assinar um plano.</p>
    <div style="text-align: center;">
      <a href="${APP_URL}/planos" class="button">Ver Planos e Preços</a>
    </div>
    <p>Tem dúvidas sobre qual plano escolher? Responda este email!</p>
  `;

  return sendEmail(
    email,
    `Seu teste grátis expira em ${daysLeft} dia${daysLeft > 1 ? "s" : ""} - ${APP_NAME}`,
    getEmailTemplate(content, `Seu teste expira em breve - ${APP_NAME}`)
  );
}

// Email de trial expirado
export async function sendTrialExpiredEmail(
  email: string,
  name: string
): Promise<boolean> {
  const content = `
    <h2>Olá, ${name}! 😢</h2>
    <p>Seu período de teste gratuito no <strong>${APP_NAME}</strong> expirou.</p>
    <div class="highlight">
      <strong>🔒 Sua conta está temporariamente limitada</strong><br>
      Para continuar gerenciando seus imóveis e recebendo leads, escolha um plano.
    </div>
    <h3>Seus dados estão seguros!</h3>
    <p>Não se preocupe - todos os seus imóveis, leads e configurações foram preservados. Basta assinar um plano para recuperar o acesso completo.</p>
    <div style="text-align: center;">
      <a href="${APP_URL}/planos" class="button">Escolher meu Plano</a>
    </div>
    <p>Precisa de mais tempo? Entre em contato conosco!</p>
  `;

  return sendEmail(
    email,
    `Seu teste gratuito expirou - ${APP_NAME}`,
    getEmailTemplate(content, `Teste expirado - ${APP_NAME}`)
  );
}

// Email de recuperação de senha
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const resetUrl = `${APP_URL}/redefinir-senha?token=${token}`;

  const content = `
    <h2>Olá, ${name}! 🔐</h2>
    <p>Recebemos uma solicitação para redefinir sua senha no <strong>${APP_NAME}</strong>.</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Redefinir minha senha</a>
    </div>
    <div class="highlight">
      <strong>⏰ Este link expira em 1 hora</strong><br>
      Por segurança, o link de redefinição tem validade limitada.
    </div>
    <p>Se você não solicitou a redefinição de senha, ignore este email. Sua senha atual permanecerá inalterada.</p>
    <p style="color: #6b7280; font-size: 13px;">
      Se o botão não funcionar, copie e cole este link no seu navegador:<br>
      <a href="${resetUrl}" style="color: #1e40af;">${resetUrl}</a>
    </p>
  `;

  return sendEmail(
    email,
    `Redefinir senha - ${APP_NAME}`,
    getEmailTemplate(content, `Redefinir senha - ${APP_NAME}`)
  );
}
