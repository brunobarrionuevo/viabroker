import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { 
  Building2, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Maximize,
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  Share2,
  Heart,
  Loader2
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function PublicPropertyDetail() {
  const params = useParams<{ id: string }>();
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const { data: property, isLoading, error } = trpc.properties.getPublic.useQuery(
    { id: Number(params.id) },
    { enabled: !!params.id }
  );

  const createLeadMutation = trpc.leads.createPublic.useMutation({
    onSuccess: () => {
      toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
      setContactForm({ name: "", email: "", phone: "", message: "" });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao enviar mensagem");
    },
  });

  const formatPrice = (price: string | null) => {
    if (!price) return "Consulte";
    const num = parseFloat(price);
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    
    createLeadMutation.mutate({
      ...contactForm,
      source: "site",
      sourceDetail: `Imóvel: ${property.title} (${property.code || property.id})`,
      propertyId: property.id,
      companyId: property.companyId,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Link href="/imoveis" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h1 className="text-2xl font-bold mb-2">Imóvel não encontrado</h1>
          <p className="text-muted-foreground mb-4">
            Este imóvel pode ter sido removido ou não está mais disponível.
          </p>
          <Button asChild>
            <Link href="/imoveis">Ver outros imóveis</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/imoveis" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Voltar para listagem
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Heart className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery Placeholder */}
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
              <Building2 className="w-16 h-16 text-muted-foreground/50" />
            </div>

            {/* Title and Location */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{property.title}</h1>
                {property.code && (
                  <Badge variant="outline">Cód: {property.code}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>
                  {property.neighborhood && `${property.neighborhood}, `}
                  {property.city} - {property.state}
                </span>
              </div>
            </div>

            {/* Price */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-baseline gap-4">
                  {(property.purpose === "venda" || property.purpose === "venda_aluguel") && property.salePrice && (
                    <div>
                      <span className="text-sm text-muted-foreground">Venda</span>
                      <p className="text-3xl font-bold text-primary">
                        {formatPrice(property.salePrice)}
                      </p>
                    </div>
                  )}
                  {(property.purpose === "aluguel" || property.purpose === "venda_aluguel") && property.rentPrice && (
                    <div>
                      <span className="text-sm text-muted-foreground">Aluguel</span>
                      <p className="text-3xl font-bold text-primary">
                        {formatPrice(property.rentPrice)}<span className="text-lg font-normal">/mês</span>
                      </p>
                    </div>
                  )}
                </div>
                {(property.condoFee || property.iptuAnnual) && (
                  <div className="flex gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                    {property.condoFee && (
                      <span>Condomínio: {formatPrice(property.condoFee)}/mês</span>
                    )}
                    {property.iptuAnnual && (
                      <span>IPTU: {formatPrice(property.iptuAnnual)}/ano</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold mb-4">Características</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(property.bedrooms ?? 0) > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bed className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{property.bedrooms}</p>
                        <p className="text-xs text-muted-foreground">Quartos</p>
                      </div>
                    </div>
                  )}
                  {(property.suites ?? 0) > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bed className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{property.suites}</p>
                        <p className="text-xs text-muted-foreground">Suítes</p>
                      </div>
                    </div>
                  )}
                  {(property.bathrooms ?? 0) > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bath className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{property.bathrooms}</p>
                        <p className="text-xs text-muted-foreground">Banheiros</p>
                      </div>
                    </div>
                  )}
                  {(property.parkingSpaces ?? 0) > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Car className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{property.parkingSpaces}</p>
                        <p className="text-xs text-muted-foreground">Vagas</p>
                      </div>
                    </div>
                  )}
                  {property.totalArea && (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Maximize className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{property.totalArea}m²</p>
                        <p className="text-xs text-muted-foreground">Área Total</p>
                      </div>
                    </div>
                  )}
                  {property.builtArea && (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Maximize className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{property.builtArea}m²</p>
                        <p className="text-xs text-muted-foreground">Área Construída</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {property.description && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold mb-4">Descrição</h2>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    {property.description.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Contact Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold mb-4">Entre em contato</h2>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Mensagem</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Olá, tenho interesse neste imóvel..."
                      rows={4}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createLeadMutation.isPending}>
                    {createLeadMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Enviar Mensagem
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t space-y-3">
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`https://wa.me/?text=Olá! Tenho interesse no imóvel: ${property.title}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 ImobiPro. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
