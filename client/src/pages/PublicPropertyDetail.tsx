import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  Play,
  X,
  Home,
  Ruler,
  DollarSign,
  Calendar,
  Check,
  Copy,
  ExternalLink
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

// Função para extrair ID do vídeo do YouTube ou Vimeo
function getVideoEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  
  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  return null;
}

// Função para formatar telefone para WhatsApp
function formatWhatsAppNumber(phone: string | null): string {
  if (!phone) return "5511999999999";
  // Remove tudo que não é número
  const numbers = phone.replace(/\D/g, "");
  // Se não começar com 55, adiciona
  if (!numbers.startsWith("55")) {
    return "55" + numbers;
  }
  return numbers;
}

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

export default function PublicPropertyDetail() {
  const params = useParams<{ id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
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

  const { data: images } = trpc.properties.getImagesPublic.useQuery(
    { propertyId: Number(params.id) },
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
    if (!price) return null;
    const num = parseFloat(price);
    if (isNaN(num) || num === 0) return null;
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
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  const videoEmbedUrl = property?.videoUrl ? getVideoEmbedUrl(property.videoUrl) : null;
  const whatsappNumber = formatWhatsAppNumber(property?.company?.whatsapp ?? property?.company?.phone ?? null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando imóvel...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b shadow-sm">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Link href="/imoveis" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowLeft className="w-5 h-5" />
              Voltar para listagem
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Imóvel não encontrado</h1>
            <p className="text-muted-foreground mb-8">
              Este imóvel pode ter sido removido ou não está mais disponível para visualização.
            </p>
            <Button asChild size="lg">
              <Link href="/imoveis">
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/imoveis" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Voltar para listagem</span>
          </Link>
          
          {property.company && (
            <div className="flex items-center gap-3">
              {property.company.logoUrl ? (
                <img 
                  src={property.company.logoUrl} 
                  alt={property.company.name}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  {property.company.name}
                </span>
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
        {/* Hero Gallery Section */}
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
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30 hover:scale-110"
                      >
                        <ChevronLeft className="w-7 h-7" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30 hover:scale-110"
                      >
                        <ChevronRight className="w-7 h-7" />
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter & Actions */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div className="flex gap-2">
                      <Badge className="bg-black/60 backdrop-blur text-white border-0">
                        {currentImageIndex + 1} / {images.length} fotos
                      </Badge>
                      {videoEmbedUrl && (
                        <Badge 
                          className="bg-red-600 text-white border-0 cursor-pointer hover:bg-red-700"
                          onClick={(e) => { e.stopPropagation(); setShowVideoModal(true); }}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Vídeo
                        </Badge>
                      )}
                    </div>
                    <Badge className="bg-black/60 backdrop-blur text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      Clique para ampliar
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                  <div className="text-center text-slate-400">
                    <Building2 className="w-20 h-20 mx-auto mb-4 opacity-50" />
                    <p>Sem fotos disponíveis</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Thumbnails */}
        {hasImages && images.length > 1 && (
          <section className="bg-slate-100 border-b">
            <div className="container mx-auto px-4 py-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? "border-primary ring-2 ring-primary/30 scale-105" 
                        : "border-transparent hover:border-primary/50 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.caption || `Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {videoEmbedUrl && (
                  <button
                    onClick={() => setShowVideoModal(true)}
                    className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 border-transparent hover:border-red-500 bg-slate-800 relative group"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Main Content */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Property Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title and Location */}
              <div>
                <div className="flex flex-wrap items-start gap-3 mb-3">
                  <Badge variant="secondary" className="text-sm">
                    {propertyTypeLabels[property.type] || property.type}
                  </Badge>
                  {property.purpose === "venda" && (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Venda</Badge>
                  )}
                  {property.purpose === "aluguel" && (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aluguel</Badge>
                  )}
                  {property.purpose === "venda_aluguel" && (
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Venda ou Aluguel</Badge>
                  )}
                  {property.code && (
                    <Badge variant="outline" className="text-xs">
                      Cód: {property.code}
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
                  {property.title}
                </h1>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="text-lg">
                    {property.address && `${property.address}${property.number ? `, ${property.number}` : ""} - `}
                    {property.neighborhood && `${property.neighborhood}, `}
                    {property.city} - {property.state}
                    {property.zipCode && ` | CEP: ${property.zipCode}`}
                  </span>
                </div>
              </div>

              {/* Price Card */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-6">
                    {salePrice && (
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          Valor de Venda
                        </span>
                        <p className="text-3xl md:text-4xl font-bold text-primary">
                          {salePrice}
                        </p>
                      </div>
                    )}
                    {rentPrice && (
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Aluguel Mensal
                        </span>
                        <p className="text-3xl md:text-4xl font-bold text-primary">
                          {rentPrice}<span className="text-lg font-normal text-muted-foreground">/mês</span>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {(condoFee || iptuAnnual) && (
                    <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-primary/10">
                      {condoFee && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Condomínio:</span>
                          <span className="font-semibold ml-1">{condoFee}/mês</span>
                        </div>
                      )}
                      {iptuAnnual && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">IPTU:</span>
                          <span className="font-semibold ml-1">{iptuAnnual}/ano</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Features Grid */}
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-primary" />
                    Características
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {(property.bedrooms ?? 0) > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Bed className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">{property.bedrooms}</p>
                          <p className="text-xs text-muted-foreground">Quartos</p>
                        </div>
                      </div>
                    )}
                    {(property.suites ?? 0) > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Bed className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">{property.suites}</p>
                          <p className="text-xs text-muted-foreground">Suítes</p>
                        </div>
                      </div>
                    )}
                    {(property.bathrooms ?? 0) > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Bath className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">{property.bathrooms}</p>
                          <p className="text-xs text-muted-foreground">Banheiros</p>
                        </div>
                      </div>
                    )}
                    {(property.parkingSpaces ?? 0) > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Car className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">{property.parkingSpaces}</p>
                          <p className="text-xs text-muted-foreground">Vagas</p>
                        </div>
                      </div>
                    )}
                    {property.totalArea && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Maximize className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">{property.totalArea}</p>
                          <p className="text-xs text-muted-foreground">m² Total</p>
                        </div>
                      </div>
                    )}
                    {property.builtArea && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Home className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">{property.builtArea}</p>
                          <p className="text-xs text-muted-foreground">m² Construído</p>
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
                    <h2 className="text-xl font-semibold mb-4">Descrição do Imóvel</h2>
                    <div className="prose prose-slate max-w-none">
                      {property.description.split('\n').map((paragraph, i) => (
                        paragraph.trim() && <p key={i} className="text-muted-foreground leading-relaxed">{paragraph}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Video Section */}
              {videoEmbedUrl && (
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Play className="w-5 h-5 text-primary" />
                      Vídeo do Imóvel
                    </h2>
                    <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
                      <iframe
                        src={videoEmbedUrl}
                        title="Vídeo do imóvel"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Location Map Placeholder */}
              {(property.address || property.city) && (
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Localização
                    </h2>
                    <div className="aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
                          <p className="font-medium text-slate-700">
                            {property.neighborhood && `${property.neighborhood}, `}
                            {property.city} - {property.state}
                          </p>
                          {property.address && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {property.address}{property.number ? `, ${property.number}` : ""}
                            </p>
                          )}
                          <Button variant="outline" className="mt-4" asChild>
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${property.address || ""} ${property.number || ""} ${property.neighborhood || ""} ${property.city} ${property.state}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Ver no Google Maps
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Contact Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Quick Contact Buttons */}
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                  <CardContent className="pt-6">
                    <h2 className="text-lg font-semibold mb-4 text-center">Fale com o corretor</h2>
                    
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-lg mb-3"
                      asChild
                    >
                      <a 
                        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                          `Olá! Vi o imóvel "${property.title}"${property.code ? ` (Cód: ${property.code})` : ""} no site e gostaria de mais informações.\n\n${window.location.href}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="w-6 h-6 mr-2" />
                        WhatsApp
                      </a>
                    </Button>
                    
                    {property.company?.phone && (
                      <Button variant="outline" className="w-full h-12" asChild>
                        <a href={`tel:${property.company.phone}`}>
                          <Phone className="w-5 h-5 mr-2" />
                          {property.company.phone}
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Contact Form */}
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-lg font-semibold mb-4">Enviar mensagem</h2>
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome completo *</Label>
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
                          placeholder={`Olá, tenho interesse no imóvel "${property.title}". Gostaria de agendar uma visita.`}
                          rows={4}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={createLeadMutation.isPending}>
                        {createLeadMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4 mr-2" />
                        )}
                        Enviar mensagem
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Share Card */}
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-sm font-medium mb-3">Compartilhar imóvel</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={handleShare}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar link
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={`flex-1 ${isFavorite ? "text-red-500 border-red-200" : ""}`}
                        onClick={() => {
                          setIsFavorite(!isFavorite);
                          toast.success(isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
                        }}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${isFavorite ? "fill-current" : ""}`} />
                        Favoritar
                      </Button>
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
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-7 h-7" />
          </button>
          
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}
          
          <img
            src={currentImage?.url}
            alt={currentImage?.caption || property.title}
            className="max-w-[95vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
            {currentImage?.caption && (
              <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm max-w-md truncate">
                {currentImage.caption}
              </div>
            )}
          </div>
          
          {/* Thumbnail strip */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto p-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentImageIndex 
                    ? "border-white scale-110" 
                    : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                <img
                  src={image.url}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && videoEmbedUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <button
            onClick={() => setShowVideoModal(false)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-7 h-7" />
          </button>
          
          <div 
            className="w-full max-w-5xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={videoEmbedUrl}
              title="Vídeo do imóvel"
              className="w-full h-full rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
