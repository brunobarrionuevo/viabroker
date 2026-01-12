import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BarChart3, Globe, LayoutTemplate, MessageSquare, ShieldCheck, Smartphone, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background z-10" />
          <img 
            src="/images/hero-bg.jpg" 
            alt="Modern Real Estate Office" 
            className="w-full h-full object-cover opacity-40"
          />
        </div>

        <div className="container mx-auto px-4 relative z-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
                O Futuro do Mercado Imobiliário Digital
              </span>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight text-foreground">
                A Plataforma Definitiva para <br />
                <span className="text-gradient">Corretores e Imobiliárias</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Sites profissionais, CRM inteligente e automação de marketing em uma única solução. Potencialize vendas e transforme a gestão imobiliária.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="neu-btn bg-primary text-white hover:bg-primary/90 text-lg px-8 py-6 h-auto w-full sm:w-auto">
                  Ver Apresentação
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="neu-flat bg-transparent border-primary/20 text-foreground hover:bg-background/50 text-lg px-8 py-6 h-auto w-full sm:w-auto">
                  Falar com Fundadores
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Market Stats Section */}
      <section id="mercado" className="py-20 bg-background relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { value: "R$ 41,90", label: "Preço Inicial Acessível", desc: "Democratizando o acesso à tecnologia de ponta" },
              { value: "+40", label: "Integrações", desc: "Conexão com os principais portais imobiliários" },
              { value: "2026", label: "Tendência de Crescimento", desc: "Foco em IA e Experiência do Cliente" }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="neu-card text-center group hover:-translate-y-2 transition-transform duration-300"
              >
                <h3 className="text-4xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300">{stat.value}</h3>
                <p className="text-lg font-semibold text-foreground mb-2">{stat.label}</p>
                <p className="text-sm text-muted-foreground">{stat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solucao" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Solução Completa e Integrada</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Resolvemos as dores do corretor moderno com ferramentas que automatizam o operacional e focam no estratégico.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl blur-3xl -z-10" />
              <img 
                src="/images/dashboard-mockup.jpg" 
                alt="Dashboard CRM" 
                className="rounded-2xl shadow-2xl border border-white/20 w-full"
              />
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: Globe, title: "Sites Profissionais", desc: "Modelos modernos, responsivos e otimizados para conversão." },
                { icon: BarChart3, title: "CRM Inteligente", desc: "Gestão completa de leads, pipeline de vendas e clientes." },
                { icon: Smartphone, title: "Mobile First", desc: "Gestão na palma da mão com app nativo para corretores." },
                { icon: Zap, title: "Automação com IA", desc: "Geração de descrições e posts automáticos para redes sociais." },
                { icon: LayoutTemplate, title: "Personalização", desc: "Editor visual intuitivo para deixar o site com a sua cara." },
                { icon: ShieldCheck, title: "Segurança Total", desc: "Certificado SSL gratuito e backups automáticos." }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="neu-card p-6 flex flex-col items-start hover:bg-white/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Business Model Section */}
      <section id="modelo" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Modelo de Negócio Escalável</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              SaaS com receita recorrente e planos adaptáveis para cada estágio do profissional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="neu-card relative overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-xl font-bold text-muted-foreground mb-2">Basic</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-foreground">R$ 41,90</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                    Até 180 imóveis
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                    1 Usuário
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                    Site Responsivo
                  </li>
                </ul>
                <Button className="w-full neu-flat hover:bg-muted transition-colors text-foreground">Selecionar</Button>
              </div>
            </motion.div>

            {/* Plus Plan - Featured */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="neu-card relative overflow-hidden border-primary/50 ring-2 ring-primary/20"
            >
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULAR
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-primary mb-2">Plus</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-bold text-foreground">R$ 57,90</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">✓</div>
                    Até 900 imóveis
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">✓</div>
                    Até 10 Usuários
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">✓</div>
                    IA para Descrições (5/dia)
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">✓</div>
                    Integração WhatsApp
                  </li>
                </ul>
                <Button className="w-full neu-btn bg-primary text-white hover:bg-primary/90">Selecionar</Button>
              </div>
            </motion.div>

            {/* Premium Plan */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="neu-card relative overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-xl font-bold text-muted-foreground mb-2">Premium</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-foreground">R$ 87,90</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                    Até 2000 imóveis
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                    15 Usuários
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                    IA Ilimitada
                  </li>
                </ul>
                <Button className="w-full neu-flat hover:bg-muted transition-colors text-foreground">Selecionar</Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Strategy & Future Section */}
      <section id="estrategia" className="py-24 bg-muted/30 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Estratégia de Crescimento e Inovação</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Nosso roadmap foca em capturar o mercado através de diferenciação tecnológica e excelência em UX.
              </p>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <span className="font-bold text-xl">1</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 text-foreground">Aquisição Agressiva</h4>
                    <p className="text-muted-foreground">Marketing de conteúdo, parcerias com CRECIs e programa de afiliados robusto.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <span className="font-bold text-xl">2</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 text-foreground">Retenção via Produto</h4>
                    <p className="text-muted-foreground">Ecossistema completo que torna a migração custosa e o uso diário indispensável.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <span className="font-bold text-xl">3</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 text-foreground">Expansão de Receita</h4>
                    <p className="text-muted-foreground">Marketplace de serviços (fotos, jurídico) e upsell de features premium de IA.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <img src="/images/feature-ai.jpg" alt="AI Feature" className="rounded-2xl shadow-lg neu-flat w-full h-64 object-cover" />
                <img src="/images/feature-mobile.jpg" alt="Mobile Feature" className="rounded-2xl shadow-lg neu-flat w-full h-64 object-cover mt-8" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-background/50 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="neu-card bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10 p-12 text-center max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">Pronto para revolucionar o mercado?</h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Junte-se a nós nessa jornada de transformação digital do setor imobiliário.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="neu-btn bg-primary text-white hover:bg-primary/90 text-lg px-10 py-6 h-auto">
                Solicitar Pitch Deck Completo
              </Button>
              <Button size="lg" variant="outline" className="neu-flat bg-transparent border-primary/20 text-foreground hover:bg-background/50 text-lg px-10 py-6 h-auto">
                Agendar Reunião
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
