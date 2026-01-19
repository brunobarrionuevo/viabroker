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
  X,
  Play,
  ZoomIn,
  Hand
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { formatPhone, displayPhone } from "@/lib/formatters";

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
  const [showVideo, setShowVideo] = useState(false);
  
  // Estados para controle de swipe
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50; // Mínimo de pixels para considerar um swipe
  
  // Estados para zoom
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const initialPinchDistance = useRef<number | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Estado para mostrar indicador de swipe
  const [showSwipeHint, setShowSwipeHint] = useState(true);

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
    // Formato brasileiro: R$ xxx.xxx.xxx,xx
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  // Handlers para gestos de swipe
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && !showVideo) {
      nextImage();
    }
    if (isRightSwipe && !showVideo) {
      prevImage();
    }
    
    // Reset
    touchStartX.current = null;
    touchEndX.current = null;
    
    // Esconder indicador de swipe após primeiro swipe
    if (showSwipeHint) setShowSwipeHint(false);
  }, [showVideo, images, showSwipeHint]);

  // Handler para navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!images || images.length <= 1) return;
      
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevImage();
        if (showSwipeHint) setShowSwipeHint(false);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextImage();
        if (showSwipeHint) setShowSwipeHint(false);
      } else if (e.key === "Escape" && showImageModal) {
        setShowImageModal(false);
        setZoomLevel(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images, showImageModal, showSwipeHint]);

  // Handlers para zoom com pinça
  const onPinchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistance.current = distance;
    }
  }, []);

  const onPinchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance.current) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = distance / initialPinchDistance.current;
      setZoomLevel(prev => Math.min(Math.max(prev * scale, 1), 4));
      initialPinchDistance.current = distance;
    }
  }, []);

  const onPinchEnd = useCallback(() => {
    initialPinchDistance.current = null;
  }, []);

  // Handler para duplo toque (zoom)
  const lastTapTime = useRef<number>(0);
  const onDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      // Duplo toque detectado
      setZoomLevel(prev => prev === 1 ? 2 : 1);
    }
    lastTapTime.current = now;
  }, []);

  // Reset zoom quando mudar de imagem
  useEffect(() => {
    setZoomLevel(1);
    setZoomPosition({ x: 0, y: 0 });
  }, [currentImageIndex]);

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

  // Função para extrair ID do vídeo do YouTube ou Vimeo
  const getVideoEmbedUrl = (url: string | null): string | null => {
    if (!url) return null;
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)([0-9]+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }
    
    return null;
  };

  const videoEmbedUrl = getVideoEmbedUrl(property.videoUrl);
  const hasVideo = !!videoEmbedUrl;

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
        {/* Gallery / Video Section */}
        <section className="bg-slate-900">
          <div className="container mx-auto">
            {/* Vídeo ou Galeria */}
            {showVideo && hasVideo ? (
              // Exibição do Vídeo
              <div className="relative aspect-[16/9] md:aspect-[21/9]">
                <iframe
                  src={videoEmbedUrl}
                  title="Vídeo do Imóvel"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              // Exibição da Galeria de Fotos
              <div 
                className="relative aspect-[16/9] md:aspect-[21/9] cursor-pointer group select-none touch-pan-y"
                onClick={() => hasImages && setShowImageModal(true)}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {hasImages && currentImage ? (
                  <>
                    <img
                      src={currentImage.url || ''}
                      alt={currentImage.caption || property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); prevImage(); }}
                          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-all hover:bg-black/70 z-10"
                        >
                          <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); nextImage(); }}
                          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-all hover:bg-black/70 z-10"
                        >
                          <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
                        </button>
                      </>
                    )}

                    <div className="absolute bottom-4 left-4 text-white flex items-center gap-2">
                      <span className="bg-black/50 px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {images.length} fotos
                      </span>
                      <span className="bg-black/50 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        <ZoomIn className="w-4 h-4" /> Clique para ampliar
                      </span>
                    </div>
                    
                    {/* Indicador de Swipe */}
                    {showSwipeHint && images.length > 1 && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse">
                        <div className="bg-black/70 backdrop-blur px-4 py-2 rounded-full text-white flex items-center gap-2">
                          <Hand className="w-5 h-5" />
                          <span className="text-sm">Deslize ou use as setas</span>
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    )}

                    {/* Botão para assistir vídeo (se houver) */}
                    {hasVideo && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowVideo(true); }}
                        className="absolute bottom-4 right-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full transition-all shadow-lg"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        <span className="font-medium">Assistir Vídeo</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <Home className="w-20 h-20 text-slate-600" />
                  </div>
                )}
              </div>
            )}

            {/* Thumbnails e Botões de Navegação */}
            {(hasImages || hasVideo) && (
              <div className="flex gap-2 p-4 overflow-x-auto bg-slate-800 items-center">
                {/* Thumbnails das Fotos */}
                {hasImages && images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => { setShowVideo(false); setCurrentImageIndex(idx); }}
                    className={`flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-all ${
                      !showVideo && idx === currentImageIndex ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url || ''} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                
                {/* Botão de Vídeo - Última posição */}
                {hasVideo && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className={`flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-all flex items-center justify-center ${
                      showVideo ? "border-red-500 bg-red-600" : "border-transparent bg-slate-700 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Play className="w-8 h-8 text-white fill-current" />
                  </button>
                )}
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
                    {/* Badge de status do imóvel */}
                    {property.status === 'reservado' && (
                      <Badge className="bg-yellow-500 text-white">Reservado</Badge>
                    )}
                    {property.status === 'vendido' && (
                      <Badge className="bg-red-500 text-white">Vendido</Badge>
                    )}
                    {property.status === 'alugado' && (
                      <Badge className="bg-blue-500 text-white">Alugado</Badge>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{property.title}</h1>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {!property.hideAddress && property.address && `${property.address}, ${property.number || ""} - `}
                    {property.neighborhood && `${property.neighborhood}, `}
                    {property.city} - {property.state}
                    {!property.hideAddress && property.zipCode && ` | CEP: ${property.zipCode}`}
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

                {/* Map */}
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" style={{ color: theme.primaryColor }} />
                      Localização
                    </h2>
                    {property.hideAddress ? (
                      <div className="bg-slate-100 rounded-lg p-6 text-center">
                        <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                        <p className="text-muted-foreground">
                          Localização aproximada: {property.neighborhood && `${property.neighborhood}, `}{property.city} - {property.state}
                        </p>
                        <p className="text-sm text-slate-400 mt-2">
                          Endereço completo disponível após contato com o corretor
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="aspect-video rounded-lg overflow-hidden border">
                          <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
                              `${property.address || ''} ${property.number || ''}, ${property.neighborhood || ''}, ${property.city}, ${property.state}, Brasil`
                            )}&zoom=16`}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {property.address && `${property.address}, ${property.number || ""}`}
                            {property.neighborhood && ` - ${property.neighborhood}`}
                          </p>
                          <p className="mt-1">
                            {property.city} - {property.state}
                            {property.zipCode && ` | CEP: ${property.zipCode}`}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          asChild
                        >
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${property.address || ''} ${property.number || ''}, ${property.neighborhood || ''}, ${property.city}, ${property.state}, Brasil`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MapPin className="w-4 h-4 mr-2" />
                            Abrir no Google Maps
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                            onChange={(e) => setContactForm(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
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

      {/* Image Modal com Zoom e Swipe */}
      {showImageModal && hasImages && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => { setShowImageModal(false); setZoomLevel(1); }}
        >
          <button
            onClick={() => { setShowImageModal(false); setZoomLevel(1); }}
            className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 rounded-full z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Botões de navegação */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 z-10"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 z-10"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}
          
          {/* Container da imagem com zoom */}
          <div 
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden touch-none"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              onTouchStart(e);
              onPinchStart(e);
              onDoubleTap();
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 2) {
                onPinchMove(e);
              } else if (zoomLevel === 1) {
                onTouchMove(e);
              }
            }}
            onTouchEnd={(e) => {
              if (zoomLevel === 1) {
                onTouchEnd();
              }
              onPinchEnd();
            }}
          >
            <img
              ref={imageRef}
              src={images[currentImageIndex].url || ''}
              alt=""
              className="max-h-[90vh] max-w-[90vw] object-contain transition-transform duration-200"
              style={{ 
                transform: `scale(${zoomLevel}) translate(${zoomPosition.x}px, ${zoomPosition.y}px)`,
                cursor: zoomLevel > 1 ? 'grab' : 'default'
              }}
              draggable={false}
            />
          </div>
          
          {/* Indicadores na parte inferior */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white">
            <span className="bg-black/50 px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {images.length}
            </span>
            {zoomLevel > 1 && (
              <span className="bg-black/50 px-3 py-1 rounded-full text-sm">
                Zoom: {Math.round(zoomLevel * 100)}%
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => prev === 1 ? 2 : 1); }}
              className="bg-black/50 px-3 py-1 rounded-full text-sm flex items-center gap-1 hover:bg-black/70"
            >
              <ZoomIn className="w-4 h-4" />
              {zoomLevel === 1 ? 'Ampliar' : 'Reduzir'}
            </button>
          </div>
          
          {/* Dica de navegação no modal */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            Use as setas do teclado ou deslize para navegar
          </div>
        </div>
      )}
    </div>
  );
}
