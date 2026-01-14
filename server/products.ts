// Definição dos planos de assinatura da Viabroker
// Os preços são em centavos (BRL)

export interface ViabrokerProduct {
  id: string;
  name: string;
  description: string;
  priceMonthly: number; // em centavos
  priceYearly: number; // em centavos (com desconto)
  features: string[];
  limits: {
    maxProperties: number; // -1 = ilimitado
    maxUsers: number; // -1 = ilimitado
    maxPhotosPerProperty: number;
  };
  hasAI: boolean;
  hasWhatsappIntegration: boolean;
  hasPortalIntegration: boolean;
  hasCustomDomain: boolean;
  hasPrioritySupport: boolean;
}

export const BROKVIA_PLANS: ViabrokerProduct[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Ideal para corretores autônomos que estão começando",
    priceMonthly: 4990, // R$ 49,90
    priceYearly: 47900, // R$ 479,00 (20% desconto)
    features: [
      "Até 20 imóveis",
      "1 usuário",
      "Site personalizado",
      "CRM básico",
      "Suporte por email",
    ],
    limits: {
      maxProperties: 20,
      maxUsers: 1,
      maxPhotosPerProperty: 10,
    },
    hasAI: false,
    hasWhatsappIntegration: false,
    hasPortalIntegration: false,
    hasCustomDomain: false,
    hasPrioritySupport: false,
  },
  {
    id: "plus",
    name: "Plus",
    description: "Para corretores que querem crescer e se destacar",
    priceMonthly: 9990, // R$ 99,90
    priceYearly: 95900, // R$ 959,00 (20% desconto)
    features: [
      "Até 100 imóveis",
      "3 usuários",
      "Site personalizado",
      "CRM completo",
      "Integração WhatsApp",
      "Geração de descrições com IA",
      "Integração com portais",
      "Suporte prioritário",
    ],
    limits: {
      maxProperties: 100,
      maxUsers: 3,
      maxPhotosPerProperty: 20,
    },
    hasAI: true,
    hasWhatsappIntegration: true,
    hasPortalIntegration: true,
    hasCustomDomain: false,
    hasPrioritySupport: true,
  },
  {
    id: "premium",
    name: "Premium",
    description: "Solução completa para imobiliárias e equipes",
    priceMonthly: 19990, // R$ 199,90
    priceYearly: 191900, // R$ 1.919,00 (20% desconto)
    features: [
      "Imóveis ilimitados",
      "Usuários ilimitados",
      "Site personalizado",
      "CRM completo",
      "Integração WhatsApp",
      "Geração de descrições com IA",
      "Integração com portais",
      "Domínio personalizado",
      "Suporte prioritário 24/7",
      "Relatórios avançados",
    ],
    limits: {
      maxProperties: -1,
      maxUsers: -1,
      maxPhotosPerProperty: 30,
    },
    hasAI: true,
    hasWhatsappIntegration: true,
    hasPortalIntegration: true,
    hasCustomDomain: true,
    hasPrioritySupport: true,
  },
];

export function getPlanById(planId: string): ViabrokerProduct | undefined {
  return BROKVIA_PLANS.find(plan => plan.id === planId);
}

export function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(priceInCents / 100);
}
