import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, AlertTriangle, Zap, Building2, Crown } from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 49.90,
    description: "Ideal para corretores autônomos",
    icon: Zap,
    color: "blue",
    features: [
      "Até 20 imóveis",
      "1 usuário",
      "Site personalizado",
      "CRM de leads",
      "Agenda de compromissos",
      "Suporte por email",
    ],
    notIncluded: [
      "Integração com portais",
      "Geração de IA",
      "Domínio personalizado",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    price: 99.90,
    description: "Para imobiliárias em crescimento",
    icon: Building2,
    color: "green",
    popular: true,
    features: [
      "Até 100 imóveis",
      "5 usuários",
      "Site personalizado",
      "CRM de leads",
      "Agenda de compromissos",
      "Integração com portais",
      "XML para VivaReal/ZAP/OLX",
      "Suporte prioritário",
    ],
    notIncluded: [
      "Geração de IA",
      "Domínio personalizado",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 199.90,
    description: "Para grandes imobiliárias",
    icon: Crown,
    color: "purple",
    features: [
      "Imóveis ilimitados",
      "Usuários ilimitados",
      "Site personalizado",
      "CRM de leads",
      "Agenda de compromissos",
      "Integração com portais",
      "XML para VivaReal/ZAP/OLX",
      "Geração de descrições com IA",
      "Domínio personalizado",
      "Suporte 24/7",
      "Gerente de conta dedicado",
    ],
    notIncluded: [],
  },
];

export default function Plans() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  const { data: trialStatus } = trpc.customAuth.getTrialStatus.useQuery();
  
  const checkoutMutation = trpc.stripe.createCheckout.useMutation({
    onSuccess: (data) => {
      // Abrir checkout em nova aba
      window.open(data.url, "_blank");
      toast.info("Você será redirecionado para o checkout seguro do Stripe");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    checkoutMutation.mutate({ planId, billingCycle: "monthly" });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/">
            <div className="inline-flex items-center gap-2 mb-6">
              <img src="/brokvia-logo.png" alt="Brokvia" className="h-10 w-10" />
              <span className="text-2xl font-bold text-blue-900">Brokvia</span>
            </div>
          </Link>
          
          {trialStatus?.isTrialExpired && !trialStatus?.hasActiveSubscription && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 max-w-xl mx-auto">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Seu período de teste expirou</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Escolha um plano para continuar usando a plataforma. Seus dados estão seguros!
              </p>
            </div>
          )}
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha o plano ideal para você
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Todos os planos incluem site personalizado, CRM de leads e agenda de compromissos.
            Cancele quando quiser.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;
            
            return (
              <Card 
                key={plan.id}
                className={`relative ${isPopular ? "border-2 border-green-500 shadow-xl" : "border shadow-lg"}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-500 text-white px-4 py-1">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className={`w-12 h-12 rounded-full bg-${plan.color}-100 flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`h-6 w-6 text-${plan.color}-600`} />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-gray-600">/mês</span>
                  </div>
                  
                  <ul className="space-y-3 text-left mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 opacity-50">
                        <span className="h-5 w-5 flex-shrink-0 mt-0.5 text-center">—</span>
                        <span className="text-gray-500 line-through">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button
                    className={`w-full ${isPopular ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={checkoutMutation.isPending && selectedPlan === plan.id}
                  >
                    {checkoutMutation.isPending && selectedPlan === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      `Assinar ${plan.name}`
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ / Trust Badges */}
        <div className="text-center">
          <div className="inline-flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Pagamento seguro via Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Cancele a qualquer momento</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Suporte em português</span>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        {trialStatus?.isTrialActive && (
          <div className="text-center mt-8">
            <Link href="/dashboard">
              <Button variant="outline">
                Voltar para o Dashboard (ainda tenho {trialStatus.daysLeft} dias de teste)
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
