-- Criar corretor de demonstração Bruno Barrionuevo
-- Data: 2026-01-16

-- 1. Inserir usuário
INSERT INTO users (
  id, openId, name, email, role, createdAt, updatedAt
) VALUES (
  1, 
  'demo-bruno-barrionuevo', 
  'Bruno Barrionuevo', 
  'brunobarrionuevo@gmail.com', 
  'admin', 
  NOW(), 
  NOW()
);

-- 2. Inserir empresa/imobiliária
INSERT INTO companies (
  id, 
  name, 
  slug,
  email, 
  phone, 
  city, 
  state,
  createdAt, 
  updatedAt
) VALUES (
  1, 
  'Bruno Barrionuevo Imóveis', 
  'bruno-barrionuevo-imoveis',
  'brunobarrionuevo@gmail.com', 
  '+55 (82) 99941-0111', 
  'Maceió', 
  'AL',
  NOW(), 
  NOW()
);

-- Atualizar usuário para vincular à empresa
UPDATE users SET companyId = 1 WHERE id = 1;

-- 3. Inserir configurações do site
INSERT INTO site_settings (
  id,
  companyId,
  siteTitle,
  siteDescription,
  customDomain,
  domainVerified,
  primaryColor,
  secondaryColor,
  heroTitle,
  heroSubtitle,
  createdAt,
  updatedAt
) VALUES (
  1,
  1,
  'Bruno Barrionuevo Imóveis',
  'Encontre o imóvel dos seus sonhos em Maceió',
  'viabroker.app',
  TRUE,
  '#3B82F6',
  '#8B5CF6',
  'Encontre o Imóvel dos Seus Sonhos',
  'Imóveis de qualidade em Maceió e região',
  NOW(),
  NOW()
);

-- 4. Inserir plano básico
INSERT INTO plans (
  id,
  name,
  slug,
  description,
  price,
  maxProperties,
  maxUsers,
  createdAt,
  updatedAt
) VALUES (
  1,
  'Plano Demo',
  'demo',
  'Plano de demonstração com recursos ilimitados',
  0.00,
  999999,
  999999,
  NOW(),
  NOW()
);

-- 5. Inserir assinatura ativa
INSERT INTO subscriptions (
  id,
  companyId,
  planId,
  status,
  currentPeriodStart,
  currentPeriodEnd,
  createdAt,
  updatedAt
) VALUES (
  1,
  1,
  1,
  'active',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 1 YEAR),
  NOW(),
  NOW()
);
