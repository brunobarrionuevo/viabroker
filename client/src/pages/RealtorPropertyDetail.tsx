import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Loader2,
  ChevronLeft,
  ChevronRight,
  Home,
  Check,
  X
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// Mapeamento de tipos de imóvel
const propertyTypeLabels: Record<string, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  terreno: "Terreno",
  comercial: "Comercial",
  rural: "Rural",
  cobertura: "Cobertura",
  flat: "Flat",
  kitnet: "Kitnet",
  sobrado: "Sobrado",
  galpao: "Galpão",
  sala_comercial: "Sala Comercial",
  loja: "Loja",
  outro: "Outro",
};

export default function RealtorPropertyDetail() {
  const params = useParams<{ slug: string; id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  // Buscar configurações do site
  const { data: siteData, isLoading: loadingSite } = trpc.siteSettings.getPublic.useQuery(
    { companySlug: params.slug || "" },
    { enabled: !!params.slug }
  );

  // Buscar imóvel
  const { data: property, isLoading: loadingProperty, error } = trpc.properties.getPublic.useQuery(
    { id: Number(params.id) },
    { enabled: !!params.id }
  );

  // Buscar imagens
  const { data: images } = trpc.properties.getImagesPublic.useQuery(
    { propertyId: Number(params.id) },
    { enabled: !!params.id }
  );

  // Mutation para criar lead
  const createLeadMutation = trpc.leads.createPublic.useMutation({
    onSuccess: () => {
      toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
      setContactForm({ name: "", email: "", phone: "", message: "" });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao enviar mensagem");
    },
  });

  const theme = {
    primaryColor: siteData?.settings?.primaryColor || "#0F52BA",
    secondaryColor: siteData?.settings?.secondaryColor || "#50C878",
    accentColor: siteData?.settings?.accentColor || "#FF6B35",
    backgroundColor: siteData?.settings?.backgroundColor || "#FFFFFF",
    textColor: siteData?.settings?.textColor || "#1F2937",
    fontFamily: siteData?.settings?.fontFamily || "Inter",
  };

  const formatPrice = (price: string | null) => {
    if (!price) return null;
    const num = parseFloat(price);
    if (isNaN(num) || num === 0) return null;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatWhatsAppNumber = (phone: string | null) => {
    if (!phone) return "";
    const numbers = phone.replace(/\D/g, "");
    if (!numbers.startsWith("55")) {
      return "55" + numbers;
    }
    return numbers;
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

  const nextImage = () => {
    if (images && images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images && images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title || "Imóvel",
          text: `Confira este imóvel: ${property?.title}`,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  // Atualizar título da página
  useEffect(() => {
    if (property) {
      document.title = `${property.title} | ${siteData?.company?.name || "Imóveis"}`;
    }
  }, [property, siteData]);

  if (loadingSite || loadingProperty) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.backgroundColor }}>
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: theme.primaryColor }} />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor }}>
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b shadow-sm">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Link href={`/site/${params.slug}`} className="flex items-center gap-2 hover:opacity-80">
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto">
            <Building2 className="w-24 h-24 text-slate-300 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-3">Imóvel não encontrado</h1>
            <p className="text-muted-foreground mb-8">
              Este imóvel pode ter sido removido ou não está mais disponível.
            </p>
            <Button asChild style={{ backgroundColor: theme.primaryColor }}>
              <Link href={`/site/${params.slug}`}>
                <Home className="w-4 h-4 mr-2" />
                Ver outros imóveis
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const hasImages = images && images.length > 0;
  const currentImage = hasImages ? images[currentImageIndex] : null;
  const salePrice = formatPrice(property.salePrice);
  const rentPrice = formatPrice(property.rentPrice);
  const condoFee = formatPrice(property.condoFee);
  const iptuAnnual = formatPrice(property.iptuAnnual);
  const whatsappNumber = formatWhatsAppNumber(property.company?.whatsapp || property.company?.phone || null);
  const defaultMessage = siteData?.settings?.whatsappDefaultMessage || 
    `Olá! Tenho interesse no imóvel "${property.title}". Gostaria de mais informações.`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor, fontFamily: theme.fontFamily }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b shadow-sm" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/site/${params.slug}`} className="flex items-center gap-2 hover:opacity-80">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Voltar para listagem</span>
          </Link>
          
          {siteData?.company && (
            <div className="flex items-center gap-3">
              {siteData.settings?.logoUrl ? (
                <img 
                  src={siteData.settings.logoUrl} 
                  alt={siteData.company.name}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <span className="text-sm font-medium">{siteData.company.name}</span>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setIsFavorite(!isFavorite);
                toast.success(isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
              }}
              className={isFavorite ? "text-red-500" : ""}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Gallery */}
        <section className="bg-slate-900">
          <div className="container mx-auto">
            <div 
              className="relative aspect-[16/9] md:aspect-[21/9] cursor-pointer group"
              onClick={() => hasImages && setShowImageModal(true)}
            >
              {hasImages && currentImage ? (
                <>
                  <img
                    src={currentImage.url}
                    alt={currentImage.caption || property.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30"
                      >
                        <ChevronLeft className="w-7 h-7" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30"
                      >
                        <ChevronRight className="w-7 h-7" />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-4 left-4 text-white">
                    <span className="bg-black/50 px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {images.length} fotos
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                  <Home className="w-20 h-20 text-slate-600" />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {hasImages && images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto bg-slate-800">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Title and Location */}
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge style={{ backgroundColor: theme.primaryColor }}>
                      {propertyTypeLabels[property.type] || property.type}
                    </Badge>
                    <Badge variant="outline">
                      {property.purpose === "aluguel" ? "Aluguel" : property.purpose === "venda_aluguel" ? "Venda/Aluguel" : "Venda"}
                    </Badge>
                    {property.code && (
                      <Badge variant="secondary">Cód: {property.code}</Badge>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{property.title}</h1>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {property.address && `${property.address}, ${property.number || ""} - `}
                    {property.neighborhood && `${property.neighborhood}, `}
                    {property.city} - {property.state}
                    {property.zipCode && ` | CEP: ${property.zipCode}`}
                  </p>
                </div>

                {/* Price */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {salePrice && (
                        <div>
                          <p className="text-sm text-muted-foreground">Valor de Venda</p>
                          <p className="text-2xl font-bold" style={{ color: theme.primaryColor }}>{salePrice}</p>
                        </div>
                      )}
                      {rentPrice && (
                        <div>
                          <p className="text-sm text-muted-foreground">Valor do Aluguel</p>
                          <p className="text-2xl font-bold" style={{ color: theme.primaryColor }}>{rentPrice}<span className="text-sm font-normal">/mês</span></p>
                        </div>
                      )}
                    </div>
                    {(condoFee || iptuAnnual) && (
                      <div className="flex gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                        {condoFee && <span>Condomínio: {condoFee}/mês</span>}
                        {iptuAnnual && <span>IPTU: {iptuAnnual}/ano</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Features */}
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="font-semibold mb-4">Características</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {(property.bedrooms ?? 0) > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <Bed className="w-5 h-5" style={{ color: theme.primaryColor }} />
                          <div>
                            <p className="font-semibold">{property.bedrooms}</p>
                            <p className="text-xs text-muted-foreground">Quartos</p>
                          </div>
                        </div>
                      )}
                      {(property.suites ?? 0) > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <Bed className="w-5 h-5" style={{ color: theme.secondaryColor }} />
                          <div>
                            <p className="font-semibold">{property.suites}</p>
                            <p className="text-xs text-muted-foreground">Suítes</p>
                          </div>
                        </div>
                      )}
                      {(property.bathrooms ?? 0) > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <Bath className="w-5 h-5" style={{ color: theme.primaryColor }} />
                          <div>
                            <p className="font-semibold">{property.bathrooms}</p>
                            <p className="text-xs text-muted-foreground">Banheiros</p>
                          </div>
                        </div>
                      )}
                      {(property.parkingSpaces ?? 0) > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <Car className="w-5 h-5" style={{ color: theme.primaryColor }} />
                          <div>
                            <p className="font-semibold">{property.parkingSpaces}</p>
                            <p className="text-xs text-muted-foreground">Vagas</p>
                          </div>
                        </div>
                      )}
                      {property.totalArea && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <Maximize className="w-5 h-5" style={{ color: theme.primaryColor }} />
                          <div>
                            <p className="font-semibold">{property.totalArea}m²</p>
                            <p className="text-xs text-muted-foreground">Área Total</p>
                          </div>
                        </div>
                      )}
                      {property.builtArea && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <Home className="w-5 h-5" style={{ color: theme.primaryColor }} />
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
                      <h2 className="font-semibold mb-4">Descrição</h2>
                      <p className="text-muted-foreground whitespace-pre-line">{property.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Amenities */}
                {property.amenities && property.amenities.length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <h2 className="font-semibold mb-4">Comodidades</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {property.amenities.map((amenity, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4" style={{ color: theme.secondaryColor }} />
                            {amenity}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Card */}
                <Card className="sticky top-20">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Fale com o corretor</h3>
                    
                    {/* Quick Contact */}
                    <div className="space-y-3 mb-6">
                      {whatsappNumber && (
                        <Button 
                          className="w-full" 
                          style={{ backgroundColor: "#25D366" }}
                          asChild
                        >
                          <a 
                            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                          </a>
                        </Button>
                      )}
                      {property.company?.phone && (
                        <Button variant="outline" className="w-full" asChild>
                          <a href={`tel:${property.company.phone}`}>
                            <Phone className="w-4 h-4 mr-2" />
                            {property.company.phone}
                          </a>
                        </Button>
                      )}
                    </div>

                    {/* Contact Form */}
                    <div className="border-t pt-6">
                      <h4 className="text-sm font-medium mb-4">Enviar mensagem</h4>
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
                          <Label htmlFor="phone">Telefone *</Label>
                          <Input
                            id="phone"
                            value={contactForm.phone}
                            onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="(11) 99999-9999"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="message">Mensagem</Label>
                          <Textarea
                            id="message"
                            value={contactForm.message}
                            onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                            placeholder={`Olá, tenho interesse no imóvel "${property.title}".`}
                            rows={3}
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full"
                          style={{ backgroundColor: theme.primaryColor }}
                          disabled={createLeadMutation.isPending}
                        >
                          {createLeadMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Mail className="w-4 h-4 mr-2" />
                          )}
                          Enviar mensagem
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Image Modal */}
      {showImageModal && hasImages && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          
          <img
            src={images[currentImageIndex].url}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
