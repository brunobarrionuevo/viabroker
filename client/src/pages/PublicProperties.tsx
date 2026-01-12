import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Building2, 
  Search, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Maximize,
  ArrowLeft,
  Filter
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const typeOptions = [
  { value: "apartamento", label: "Apartamento" },
  { value: "casa", label: "Casa" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
  { value: "rural", label: "Rural" },
  { value: "cobertura", label: "Cobertura" },
  { value: "flat", label: "Flat" },
  { value: "kitnet", label: "Kitnet" },
  { value: "loft", label: "Loft" },
  { value: "sobrado", label: "Sobrado" },
];

const purposeOptions = [
  { value: "venda", label: "Venda" },
  { value: "aluguel", label: "Aluguel" },
  { value: "venda_aluguel", label: "Venda e Aluguel" },
];

export default function PublicProperties() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [purposeFilter, setPurposeFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: properties, isLoading } = trpc.properties.listPublic.useQuery({
    search: search || undefined,
    type: typeFilter || undefined,
    purpose: purposeFilter || undefined,
    city: cityFilter || undefined,
    isPublished: true,
  });

  const formatPrice = (price: string | null) => {
    if (!price) return "Consulte";
    const num = parseFloat(price);
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">ImobiPro</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Início
            </Link>
            <Link href="/imoveis" className="text-sm font-medium text-foreground">
              Imóveis
            </Link>
            <Link href="/#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contato
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Imóveis Disponíveis</h1>
          <p className="text-muted-foreground">
            Encontre o imóvel perfeito para você
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Main Search */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título, código ou bairro..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowFilters(!showFilters)}
                  className="sm:w-auto"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Tipo</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        {typeOptions.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Finalidade</label>
                    <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {purposeOptions.map((purpose) => (
                          <SelectItem key={purpose.value} value={purpose.value}>
                            {purpose.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Cidade</label>
                    <Input
                      placeholder="Digite a cidade"
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setTypeFilter("");
                        setPurposeFilter("");
                        setCityFilter("");
                        setSearch("");
                      }}
                      className="w-full"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        {properties && (
          <p className="text-sm text-muted-foreground mb-4">
            {properties.length} imóvel(is) encontrado(s)
          </p>
        )}

        {/* Properties Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardContent className="pt-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Link key={property.id} href={`/imovel/${property.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  {/* Image */}
                  <div className="relative h-48 bg-muted overflow-hidden">
                    {property.mainImageUrl ? (
                      <img
                        src={property.mainImageUrl}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-muted-foreground/50" />
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {property.isHighlight && (
                        <Badge className="bg-yellow-500 text-white">Destaque</Badge>
                      )}
                      <Badge variant="secondary" className="capitalize">
                        {property.purpose === "venda_aluguel" ? "Venda/Aluguel" : property.purpose}
                      </Badge>
                    </div>
                    {property.code && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="outline" className="bg-background/80">
                          {property.code}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="pt-4">
                    {/* Title */}
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                      {property.title}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">
                        {property.neighborhood}{property.city ? `, ${property.city}` : ""}
                      </span>
                    </div>

                    {/* Features */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
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

                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                      {(property.purpose === "venda" || property.purpose === "venda_aluguel") && property.salePrice && (
                        <span className="text-xl font-bold text-primary">
                          {formatPrice(property.salePrice)}
                        </span>
                      )}
                      {(property.purpose === "aluguel" || property.purpose === "venda_aluguel") && property.rentPrice && (
                        <span className={`${property.salePrice ? "text-sm text-muted-foreground" : "text-xl font-bold text-primary"}`}>
                          {property.salePrice ? `Aluguel: ${formatPrice(property.rentPrice)}/mês` : `${formatPrice(property.rentPrice)}/mês`}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum imóvel encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros de busca
              </p>
              <Button 
                variant="outline"
                onClick={() => {
                  setTypeFilter("");
                  setPurposeFilter("");
                  setCityFilter("");
                  setSearch("");
                }}
              >
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        )}
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
