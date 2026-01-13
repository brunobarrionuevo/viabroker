import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { displayPhone } from "@/lib/formatters";
import { 
  Building2, 
  Search, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Maximize,
  Phone,
  Mail,
  MessageCircle,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Home,
  Filter,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useState, useMemo, useEffect } from "react";

// Tipos de imóvel
const propertyTypes = [
  { value: "", label: "Todos os tipos" },
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
  { value: "cobertura", label: "Cobertura" },
  { value: "flat", label: "Flat" },
  { value: "kitnet", label: "Kitnet" },
  { value: "sobrado", label: "Sobrado" },
  { value: "galpao", label: "Galpão" },
  { value: "sala_comercial", label: "Sala Comercial" },
  { value: "loja", label: "Loja" },
];

// Finalidades
const purposes = [
  { value: "", label: "Comprar ou Alugar" },
  { value: "venda", label: "Comprar" },
  { value: "aluguel", label: "Alugar" },
];

// Quartos
const bedroomOptions = [
  { value: "", label: "Quartos" },
  { value: "1", label: "1+ quarto" },
  { value: "2", label: "2+ quartos" },
  { value: "3", label: "3+ quartos" },
  { value: "4", label: "4+ quartos" },
  { value: "5", label: "5+ quartos" },
];

export default function RealtorSite() {
  const params = useParams<{ slug: string }>();
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("");
  const [minBedroomsFilter, setMinBedroomsFilter] = useState("");
  const [minPriceFilter, setMinPriceFilter] = useState<number | undefined>();
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | undefined>();
  const [parkingFilter, setParkingFilter] = useState("");

  // Formulário de Lead
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  // Mutation para criar lead
  const createLeadMutation = trpc.leads.createPublic.useMutation({
    onSuccess: () => {
      setLeadSubmitted(true);
      setLeadName("");
      setLeadEmail("");
      setLeadPhone("");
      setLeadMessage("");
      toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
      setTimeout(() => setLeadSubmitted(false), 5000);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar mensagem. Tente novamente.");
    },
  });

  // Buscar configurações do site
  const { data: siteData, isLoading: loadingSite, error: siteError } = trpc.siteSettings.getPublic.useQuery(
    { companySlug: params.slug || "" },
    { enabled: !!params.slug }
  );

  // Buscar imóveis
  const { data: properties, isLoading: loadingProperties } = trpc.properties.listPublic.useQuery({
    companySlug: params.slug,
    type: typeFilter || undefined,
    purpose: purposeFilter || undefined,
    city: cityFilter || undefined,
    neighborhood: neighborhoodFilter || undefined,
    minBedrooms: minBedroomsFilter ? parseInt(minBedroomsFilter) : undefined,
    minPrice: minPriceFilter,
    maxPrice: maxPriceFilter,
    parkingSpaces: parkingFilter ? parseInt(parkingFilter) : undefined,
    search: search || undefined,
    limit: 50,
  }, { enabled: !!params.slug });

  // Buscar imóveis em destaque
  const { data: featuredProperties } = trpc.properties.listPublic.useQuery({
    companySlug: params.slug,
    isHighlight: true,
    limit: 6,
  }, { enabled: !!params.slug && !!siteData?.settings?.showFeaturedProperties });

  // Extrair cidades únicas dos imóveis
  const cities = useMemo(() => {
    if (!properties) return [];
    const uniqueCities = Array.from(new Set(properties.map(p => p.city)));
    return uniqueCities.sort();
  }, [properties]);

  // Extrair bairros únicos
  const neighborhoods = useMemo(() => {
    if (!properties) return [];
    const uniqueNeighborhoods = Array.from(new Set(properties.map(p => p.neighborhood).filter(Boolean))) as string[];
    return uniqueNeighborhoods.sort();
  }, [properties]);

  const formatPrice = (price: string | null) => {
    if (!price) return "Consulte";
    const num = parseFloat(price);
    if (isNaN(num) || num === 0) return "Consulte";
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

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setPurposeFilter("");
    setCityFilter("");
    setNeighborhoodFilter("");
    setMinBedroomsFilter("");
    setMinPriceFilter(undefined);
    setMaxPriceFilter(undefined);
    setParkingFilter("");
  };

  const hasActiveFilters = search || typeFilter || purposeFilter || cityFilter || neighborhoodFilter || minBedroomsFilter || minPriceFilter || maxPriceFilter || parkingFilter;

  // Aplicar tema personalizado
  const theme = {
    primaryColor: siteData?.settings?.primaryColor || "#0F52BA",
    secondaryColor: siteData?.settings?.secondaryColor || "#50C878",
    accentColor: siteData?.settings?.accentColor || "#FF6B35",
    backgroundColor: siteData?.settings?.backgroundColor || "#FFFFFF",
    textColor: siteData?.settings?.textColor || "#1F2937",
    fontFamily: siteData?.settings?.fontFamily || "Inter",
  };

  // Atualizar título da página e favicon
  useEffect(() => {
    if (siteData?.settings?.siteTitle) {
      document.title = siteData.settings.siteTitle;
    } else if (siteData?.company?.name) {
      document.title = siteData.company.name;
    }

    // Atualizar favicon
    if (siteData?.settings?.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = siteData.settings.faviconUrl;
    }
  }, [siteData]);

  if (loadingSite) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.backgroundColor }}>
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: theme.primaryColor }} />
      </div>
    );
  }

  if (siteError || !siteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Site não encontrado</h1>
          <p className="text-slate-600 mb-6">O site que você está procurando não existe ou foi desativado.</p>
          <Button asChild>
            <Link href="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { company, settings } = siteData;
  const whatsappNumber = formatWhatsAppNumber(company.whatsapp || company.phone);

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor, fontFamily: theme.fontFamily }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b shadow-sm" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/site/${params.slug}`} className="flex items-center gap-3">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt={company.name} className="h-10 w-auto object-contain" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.primaryColor }}>
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl">{company.name}</span>
              </>
            )}
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#imoveis" className="text-sm hover:opacity-80 transition-opacity">Imóveis</a>
            {settings?.showAboutSection && (
              <a href="#sobre" className="text-sm hover:opacity-80 transition-opacity">Sobre</a>
            )}
            {settings?.showContactForm && (
              <a href="#contato" className="text-sm hover:opacity-80 transition-opacity">Contato</a>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {whatsappNumber && (
              <Button 
                size="sm" 
                asChild
                style={{ backgroundColor: "#25D366", color: "white" }}
              >
                <a 
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(settings?.whatsappDefaultMessage || "Olá! Gostaria de saber mais sobre os imóveis.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative py-20 md:py-32"
        style={{
          backgroundImage: settings?.heroImageUrl ? `url(${settings.heroImageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: settings?.heroImageUrl ? undefined : theme.primaryColor,
        }}
      >
        {settings?.heroImageUrl && (
          <div className="absolute inset-0 bg-black/50" />
        )}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {settings?.heroTitle || `Encontre o imóvel ideal com a ${company.name}`}
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              {settings?.heroSubtitle || "Os melhores imóveis da região com atendimento personalizado"}
            </p>

            {/* Search Box */}
            {settings?.showHeroSearch !== false && (
              <div className="bg-white rounded-xl p-4 shadow-xl max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                    <SelectTrigger className="text-slate-700">
                      <SelectValue placeholder="Comprar ou Alugar" />
                    </SelectTrigger>
                    <SelectContent>
                      {purposes.map((p) => (
                        <SelectItem key={p.value} value={p.value || "all"}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="text-slate-700">
                      <SelectValue placeholder="Tipo de imóvel" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value || "all"}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Cidade ou bairro..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="text-slate-700"
                  />

                  <Button 
                    className="w-full"
                    style={{ backgroundColor: theme.primaryColor }}
                    onClick={() => document.getElementById('imoveis')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      {settings?.showFeaturedProperties && featuredProperties && featuredProperties.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Imóveis em Destaque</h2>
              <p className="text-muted-foreground">Confira nossas melhores oportunidades</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <Link key={property.id} href={`/site/${params.slug}/imovel/${property.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group h-full">
                    <div className="aspect-video bg-slate-200 relative overflow-hidden">
                      {property.mainImageUrl ? (
                        <img 
                          src={property.mainImageUrl} 
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-12 h-12 text-slate-400" />
                        </div>
                      )}
                      <Badge 
                        className="absolute top-3 left-3"
                        style={{ backgroundColor: theme.accentColor }}
                      >
                        Destaque
                      </Badge>
                      <Badge 
                        className="absolute top-3 right-3"
                        variant="secondary"
                      >
                        {property.purpose === "aluguel" ? "Aluguel" : "Venda"}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {property.title}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4" />
                        {property.neighborhood ? `${property.neighborhood}, ` : ""}{property.city} - {property.state}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        {(property.bedrooms ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Bed className="w-4 h-4" />
                            {property.bedrooms}
                          </span>
                        )}
                        {(property.bathrooms ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Bath className="w-4 h-4" />
                            {property.bathrooms}
                          </span>
                        )}
                        {(property.parkingSpaces ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Car className="w-4 h-4" />
                            {property.parkingSpaces}
                          </span>
                        )}
                        {property.totalArea && (
                          <span className="flex items-center gap-1">
                            <Maximize className="w-4 h-4" />
                            {property.totalArea}m²
                          </span>
                        )}
                      </div>
                      <p className="text-xl font-bold mt-3" style={{ color: theme.primaryColor }}>
                        {property.purpose === "aluguel" 
                          ? formatPrice(property.rentPrice)
                          : formatPrice(property.salePrice)
                        }
                        {property.purpose === "aluguel" && <span className="text-sm font-normal">/mês</span>}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Properties Section */}
      <section id="imoveis" className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Todos os Imóveis</h2>
              <p className="text-muted-foreground">
                {properties?.length || 0} imóveis encontrados
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm mb-2 block">Finalidade</Label>
                    <Select value={purposeFilter} onValueChange={(v) => setPurposeFilter(v === "all" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Comprar ou Alugar" />
                      </SelectTrigger>
                      <SelectContent>
                        {purposes.map((p) => (
                          <SelectItem key={p.value || "all"} value={p.value || "all"}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm mb-2 block">Tipo de Imóvel</Label>
                    <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map((t) => (
                          <SelectItem key={t.value || "all"} value={t.value || "all"}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm mb-2 block">Cidade</Label>
                    <Select value={cityFilter} onValueChange={(v) => setCityFilter(v === "all" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as cidades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as cidades</SelectItem>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm mb-2 block">Bairro</Label>
                    <Select value={neighborhoodFilter} onValueChange={(v) => setNeighborhoodFilter(v === "all" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os bairros" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os bairros</SelectItem>
                        {neighborhoods.map((n) => (
                          <SelectItem key={n} value={n || ""}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm mb-2 block">Quartos</Label>
                    <Select value={minBedroomsFilter} onValueChange={(v) => setMinBedroomsFilter(v === "all" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Quartos" />
                      </SelectTrigger>
                      <SelectContent>
                        {bedroomOptions.map((b) => (
                          <SelectItem key={b.value || "all"} value={b.value || "all"}>{b.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm mb-2 block">Vagas</Label>
                    <Select value={parkingFilter} onValueChange={(v) => setParkingFilter(v === "all" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vagas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="1">1+ vaga</SelectItem>
                        <SelectItem value="2">2+ vagas</SelectItem>
                        <SelectItem value="3">3+ vagas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm mb-2 block">Preço Mínimo</Label>
                    <Input
                      type="number"
                      placeholder="R$ 0"
                      value={minPriceFilter || ""}
                      onChange={(e) => setMinPriceFilter(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>

                  <div>
                    <Label className="text-sm mb-2 block">Preço Máximo</Label>
                    <Input
                      type="number"
                      placeholder="Sem limite"
                      value={maxPriceFilter || ""}
                      onChange={(e) => setMaxPriceFilter(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <Button variant="ghost" onClick={clearFilters} className="text-sm">
                      <X className="w-4 h-4 mr-2" />
                      Limpar filtros
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Properties Grid */}
          {loadingProperties ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.primaryColor }} />
            </div>
          ) : properties && properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property) => (
                <Link key={property.id} href={`/site/${params.slug}/imovel/${property.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group h-full">
                    <div className="aspect-video bg-slate-200 relative overflow-hidden">
                      {property.mainImageUrl ? (
                        <img 
                          src={property.mainImageUrl} 
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-12 h-12 text-slate-400" />
                        </div>
                      )}
                      <Badge 
                        className="absolute top-3 right-3"
                        variant="secondary"
                      >
                        {property.purpose === "aluguel" ? "Aluguel" : "Venda"}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {property.title}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {property.neighborhood ? `${property.neighborhood}, ` : ""}{property.city}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {(property.bedrooms ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Bed className="w-3 h-3" />
                            {property.bedrooms}
                          </span>
                        )}
                        {(property.bathrooms ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Bath className="w-3 h-3" />
                            {property.bathrooms}
                          </span>
                        )}
                        {property.totalArea && (
                          <span className="flex items-center gap-1">
                            <Maximize className="w-3 h-3" />
                            {property.totalArea}m²
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-bold mt-2" style={{ color: theme.primaryColor }}>
                        {property.purpose === "aluguel" 
                          ? formatPrice(property.rentPrice)
                          : formatPrice(property.salePrice)
                        }
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Home className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum imóvel encontrado</h3>
              <p className="text-muted-foreground mb-4">Tente ajustar os filtros de busca</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      {settings?.showAboutSection && (
        <section id="sobre" className="py-16 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Sobre a {company.name}</h2>
              {settings?.aboutText ? (
                <p className="text-lg text-muted-foreground whitespace-pre-line">{settings.aboutText}</p>
              ) : company.description ? (
                <p className="text-lg text-muted-foreground">{company.description}</p>
              ) : (
                <p className="text-lg text-muted-foreground">
                  Somos especialistas em encontrar o imóvel perfeito para você. 
                  Com anos de experiência no mercado imobiliário, oferecemos atendimento 
                  personalizado e as melhores oportunidades da região.
                </p>
              )}
              {company.creci && (
                <p className="mt-4 text-sm text-muted-foreground">CRECI: {company.creci}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {settings?.showContactForm && (
        <section id="contato" className="py-16 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">Entre em Contato</h2>
              <p className="text-muted-foreground text-center mb-8">Preencha o formulário abaixo ou entre em contato diretamente</p>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Formulário de Lead */}
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    {leadSubmitted ? (
                      <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: theme.secondaryColor }} />
                        <h3 className="text-xl font-semibold mb-2">Mensagem Enviada!</h3>
                        <p className="text-muted-foreground">Entraremos em contato em breve.</p>
                      </div>
                    ) : (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!leadName || !leadEmail || !leadPhone) {
                          toast.error("Preencha todos os campos obrigatórios");
                          return;
                        }
                        createLeadMutation.mutate({
                          companySlug: params.slug || "",
                          name: leadName,
                          email: leadEmail,
                          phone: leadPhone,
                          message: leadMessage || "Contato via site",
                          source: "site",
                        });
                      }} className="space-y-4">
                        <div>
                          <Label htmlFor="leadName">Nome *</Label>
                          <Input
                            id="leadName"
                            value={leadName}
                            onChange={(e) => setLeadName(e.target.value)}
                            placeholder="Seu nome completo"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="leadEmail">E-mail *</Label>
                          <Input
                            id="leadEmail"
                            type="email"
                            value={leadEmail}
                            onChange={(e) => setLeadEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="leadPhone">Telefone *</Label>
                          <Input
                            id="leadPhone"
                            value={leadPhone}
                            onChange={(e) => setLeadPhone(e.target.value)}
                            placeholder="(11) 99999-9999"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="leadMessage">Mensagem</Label>
                          <Textarea
                            id="leadMessage"
                            value={leadMessage}
                            onChange={(e) => setLeadMessage(e.target.value)}
                            placeholder="Estou interessado em..."
                            rows={4}
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full"
                          style={{ backgroundColor: theme.primaryColor }}
                          disabled={createLeadMutation.isPending}
                        >
                          {createLeadMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Enviar Mensagem
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>

                {/* Informações de Contato */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Outras formas de contato</h3>
                  {(settings?.contactPhone || company.phone) && (
                    <a 
                      href={`tel:${settings?.contactPhone || company.phone}`}
                      className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.primaryColor}20` }}>
                        <Phone className="w-5 h-5" style={{ color: theme.primaryColor }} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <p className="font-medium">{displayPhone(settings?.contactPhone || company.phone)}</p>
                      </div>
                    </a>
                  )}
                  {(settings?.contactEmail || company.email) && (
                    <a 
                      href={`mailto:${settings?.contactEmail || company.email}`}
                      className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.primaryColor}20` }}>
                        <Mail className="w-5 h-5" style={{ color: theme.primaryColor }} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">E-mail</p>
                        <p className="font-medium">{settings?.contactEmail || company.email}</p>
                      </div>
                    </a>
                  )}
                  {whatsappNumber && (
                    <a 
                      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(settings?.whatsappDefaultMessage || "Olá!")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600">WhatsApp</p>
                        <p className="font-medium text-green-700">Clique para conversar</p>
                      </div>
                    </a>
                  )}
                  {(settings?.contactAddress || company.address) && (
                    <div className="flex items-center gap-3 p-4 bg-white border rounded-lg">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.primaryColor}20` }}>
                        <MapPin className="w-5 h-5" style={{ color: theme.primaryColor }} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Endereço</p>
                        <p className="font-medium">{settings?.contactAddress || `${company.address}, ${company.city} - ${company.state}`}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t" style={{ backgroundColor: theme.primaryColor }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-white">
            <div className="flex items-center gap-3">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={company.name} className="h-8 w-auto object-contain brightness-0 invert" />
              ) : (
                <span className="font-bold">{company.name}</span>
              )}
            </div>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {settings?.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings?.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings?.youtubeUrl && (
                <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                  <Youtube className="w-5 h-5" />
                </a>
              )}
              {settings?.linkedinUrl && (
                <a href={settings.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
            </div>

            <p className="text-sm opacity-80">
              © {new Date().getFullYear()} {company.name}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
