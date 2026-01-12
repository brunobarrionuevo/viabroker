import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, 
  Home as HomeIcon, 
  Users, 
  BarChart3, 
  Smartphone, 
  Zap, 
  Globe, 
  ShieldCheck,
  ArrowRight,
  Check,
  Star
} from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  const features = [
    {
      icon: Globe,
      title: "Sites Profissionais",
      description: "Modelos modernos, responsivos e otimizados para conversão de leads."
    },
    {
      icon: Users,
      title: "CRM Completo",
      description: "Gestão de leads, pipeline de vendas e acompanhamento de clientes."
    },
    {
      icon: BarChart3,
      title: "Relatórios Inteligentes",
      description: "Métricas e insights para tomar decisões baseadas em dados."
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Acesse e gerencie seu negócio de qualquer lugar."
    },
    {
      icon: Zap,
      title: "Automação com IA",
      description: "Geração automática de descrições e conteúdo para seus imóveis."
    },
    {
      icon: ShieldCheck,
      title: "Segurança Total",
      description: "Seus dados protegidos com criptografia e backups automáticos."
    },
  ];

  const plans = [
    {
      name: "Basic",
      price: "R$ 41,90",
      period: "/mês",
      description: "Para corretores autônomos",
      features: [
        "Até 50 imóveis",
        "1 usuário",
        "Site responsivo",
        "CRM básico",
        "Suporte por email"
      ],
      highlight: false
    },
    {
      name: "Plus",
      price: "R$ 97,90",
      period: "/mês",
      description: "Para pequenas imobiliárias",
      features: [
        "Até 300 imóveis",
        "5 usuários",
        "Site personalizado",
        "CRM completo",
        "IA para descrições",
        "Integração WhatsApp",
        "Suporte prioritário"
      ],
      highlight: true
    },
    {
      name: "Premium",
      price: "R$ 197,90",
      period: "/mês",
      description: "Para imobiliárias em crescimento",
      features: [
        "Imóveis ilimitados",
        "Usuários ilimitados",
        "Site white-label",
        "CRM avançado",
        "IA ilimitada",
        "Integrações premium",
        "API de acesso",
        "Suporte dedicado"
      ],
      highlight: false
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/brokvia-logo.png" alt="Brokvia" className="w-8 h-8 object-contain" />
            <span className="font-bold text-xl">Brokvia</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contato
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button asChild>
                <Link href="/dashboard">
                  Acessar Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button asChild>
                  <Link href="/cadastro">Começar Grátis</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              Plataforma #1 para Corretores
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Transforme sua imobiliária com tecnologia de ponta
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Sites profissionais, CRM inteligente e automação de marketing em uma única plataforma. 
              Potencialize suas vendas e simplifique a gestão.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/cadastro">
                  Começar Gratuitamente
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#features">Ver Recursos</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas para gerenciar seu negócio imobiliário de forma eficiente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planos para cada momento do seu negócio
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Escolha o plano ideal e comece a transformar sua imobiliária hoje
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.highlight ? 'border-primary shadow-lg scale-105' : 'border-border'}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Mais Popular
                    </span>
                  </div>
                )}
                <CardContent className="pt-8 pb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.highlight ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/cadastro">Começar Agora</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para revolucionar seu negócio?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de corretores e imobiliárias que já estão transformando 
            a forma de vender imóveis.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/cadastro">
              Criar Conta Gratuita
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/brokvia-logo.png" alt="Brokvia" className="w-8 h-8 object-contain" />
              <span className="font-bold">Brokvia</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Brokvia. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
