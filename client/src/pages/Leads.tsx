import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Users, Plus, Search, Phone, Mail, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const stageOptions = [
  { value: "novo", label: "Novo", color: "bg-green-100 text-green-700" },
  { value: "contato_inicial", label: "Contato Inicial", color: "bg-blue-100 text-blue-700" },
  { value: "qualificado", label: "Qualificado", color: "bg-purple-100 text-purple-700" },
  { value: "visita_agendada", label: "Visita Agendada", color: "bg-orange-100 text-orange-700" },
  { value: "proposta", label: "Proposta", color: "bg-yellow-100 text-yellow-700" },
  { value: "negociacao", label: "Negociação", color: "bg-pink-100 text-pink-700" },
  { value: "fechado_ganho", label: "Fechado (Ganho)", color: "bg-emerald-100 text-emerald-700" },
  { value: "fechado_perdido", label: "Fechado (Perdido)", color: "bg-gray-100 text-gray-700" },
];

const sourceOptions = [
  { value: "site", label: "Site" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telefone", label: "Telefone" },
  { value: "indicacao", label: "Indicação" },
  { value: "portal", label: "Portal" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "google", label: "Google" },
  { value: "outro", label: "Outro" },
];

export default function Leads() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");

  const { data: leads, isLoading } = trpc.leads.list.useQuery({
    search: search || undefined,
    stage: stageFilter || undefined,
    source: sourceFilter || undefined,
  });

  const getStageBadge = (stage: string) => {
    const option = stageOptions.find(s => s.value === stage);
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
            <h1 className="text-2xl font-bold">Leads</h1>
            <p className="text-muted-foreground">Gerencie seus contatos e oportunidades</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/leads/new">
              <Plus className="w-4 h-4 mr-2" />
              Novo Lead
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
                  placeholder="Buscar por nome, email ou telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Estágio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estágios</SelectItem>
                  {stageOptions.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as origens</SelectItem>
                  {sourceOptions.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : leads && leads.length > 0 ? (
          <div className="space-y-3">
            {leads.map((lead) => (
              <Link key={lead.id} href={`/dashboard/leads/${lead.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {lead.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{lead.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {lead.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3" />
                              {lead.email}
                            </span>
                          )}
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </span>
                          )}
                          {lead.whatsapp && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              WhatsApp
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground capitalize">
                          {sourceOptions.find(s => s.value === lead.source)?.label || lead.source}
                        </span>
                        {getStageBadge(lead.stage)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum lead encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {search || stageFilter || sourceFilter 
                  ? "Tente ajustar os filtros de busca"
                  : "Comece adicionando seu primeiro lead"}
              </p>
              <Button asChild>
                <Link href="/dashboard/leads/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Lead
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
