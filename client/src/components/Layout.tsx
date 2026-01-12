import { ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg">
                M
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                MigMídia<span className="text-primary">.pitch</span>
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#mercado" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Mercado</a>
            <a href="#solucao" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Solução</a>
            <a href="#modelo" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Modelo de Negócio</a>
            <a href="#estrategia" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Estratégia</a>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:flex text-muted-foreground hover:text-primary">
              Login
            </Button>
            <Button className="neu-btn bg-primary text-white hover:bg-primary/90 border-none shadow-lg hover:shadow-xl transition-all">
              Investir Agora
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-white/20 py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                  M
                </div>
                <span className="text-lg font-bold text-foreground">MigMídia</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Transformando o mercado imobiliário com tecnologia, design e inteligência de dados.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-foreground">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Sites Imobiliários</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">CRM Integrado</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Inteligência Artificial</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrações</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-foreground">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-muted pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 MigMídia. Todos os direitos reservados.
            </p>
            <div className="flex gap-4">
              {/* Social Icons placeholders */}
              <div className="w-8 h-8 rounded-full neu-flat flex items-center justify-center text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                <span className="sr-only">LinkedIn</span>
                in
              </div>
              <div className="w-8 h-8 rounded-full neu-flat flex items-center justify-center text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                <span className="sr-only">Twitter</span>
                𝕏
              </div>
              <div className="w-8 h-8 rounded-full neu-flat flex items-center justify-center text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                <span className="sr-only">Instagram</span>
                ig
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
