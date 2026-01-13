import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Home, Plus, Search, MapPin, Bed, Car, Maximize } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const propertyTypes = [
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
  { value: "cobertura", label: "Cobertura" },
  { value: "sobrado", label: "Sobrado" },
];

const statusOptions = [
  { value: "disponivel", label: "Disponível", color: "bg-green-100 text-green-700" },
  { value: "reservado", label: "Reservado", color: "bg-yellow-100 text-yellow-700" },
  { value: "vendido", label: "Vendido", color: "bg-blue-100 text-blue-700" },
  { value: "alugado", label: "Alugado", color: "bg-purple-100 text-purple-700" },
  { value: "inativo", label: "Inativo", color: "bg-gray-100 text-gray-700" },
];

export default function Properties() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: properties, isLoading } = trpc.properties.list.useQuery({
    search: search || undefined,
    type: typeFilter && typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
  });

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(s => s.value === status);
    return option ? (
      <Badge variant="secondary" className={option.color}>
        {option.label}
      </Badge>
    ) : null;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Imóveis</h1>
            <p className="text-muted-foreground">Gerencie seu portfólio de imóveis</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/properties/new">
              <Plus className="w-4 h-4 mr-2" />
              Novo Imóvel
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, código ou endereço..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i}>
                <Skeleton className="aspect-video w-full" />
                <CardContent className="pt-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {properties.map((property) => (
              <Link key={property.id} href={`/dashboard/properties/${property.id}/edit`}>
                <Card className="overflow-hidden hover:border-primary transition-colors cursor-pointer group">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {property.mainImageUrl ? (
                      <img 
                        src={property.mainImageUrl} 
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Home className="w-12 h-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(property.status)}
                    </div>
                    {property.isHighlight && (
                      <Badge className="absolute top-2 left-2 bg-primary">
                        Destaque
                      </Badge>
                    )}
                  </div>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {property.title}
                      </h3>
                      {property.code && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {property.code}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {property.neighborhood ? `${property.neighborhood}, ` : ""}{property.city} - {property.state}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      {property.bedrooms ? (
                        <span className="flex items-center gap-1">
                          <Bed className="w-3 h-3" /> {property.bedrooms}
                        </span>
                      ) : null}
                      {property.parkingSpaces ? (
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3" /> {property.parkingSpaces}
                        </span>
                      ) : null}
                      {property.totalArea ? (
                        <span className="flex items-center gap-1">
                          <Maximize className="w-3 h-3" /> {property.totalArea}m²
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <p className="text-lg font-bold text-primary">
                        {property.salePrice ? (
                          <>R$ {Number(property.salePrice).toLocaleString('pt-BR')}</>
                        ) : property.rentPrice ? (
                          <>R$ {Number(property.rentPrice).toLocaleString('pt-BR')}<span className="text-xs font-normal text-muted-foreground">/mês</span></>
                        ) : (
                          "Consulte"
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Home className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum imóvel encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {search || typeFilter || statusFilter 
                  ? "Tente ajustar os filtros de busca"
                  : "Comece cadastrando seu primeiro imóvel"}
              </p>
              <Button asChild>
                <Link href="/dashboard/properties/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Imóvel
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
