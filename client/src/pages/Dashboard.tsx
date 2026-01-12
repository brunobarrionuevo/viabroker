import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Home, Users, Calendar, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do seu negócio</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard/properties/new">
                <Plus className="w-4 h-4 mr-2" />
                Novo Imóvel
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Imóveis Ativos"
            value={stats?.totalProperties ?? 0}
            icon={Home}
            loading={isLoading}
            href="/dashboard/properties"
          />
          <StatsCard
            title="Leads Novos"
            value={stats?.newLeads ?? 0}
            icon={Users}
            loading={isLoading}
            href="/dashboard/leads"
            highlight
          />
          <StatsCard
            title="Visitas Agendadas"
            value={stats?.pendingAppointments ?? 0}
            icon={Calendar}
            loading={isLoading}
            href="/dashboard/appointments"
          />
          <StatsCard
            title="Total de Leads"
            value={stats?.totalLeads ?? 0}
            icon={TrendingUp}
            loading={isLoading}
            href="/dashboard/leads"
          />
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Acesse as principais funcionalidades</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link href="/dashboard/properties/new">
                  <Home className="w-5 h-5" />
                  <span className="text-sm">Novo Imóvel</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link href="/dashboard/leads/new">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">Novo Lead</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link href="/dashboard/appointments/new">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm">Agendar Visita</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link href="/dashboard/settings">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm">Relatórios</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <RecentLeadsCard />
        </div>

        {/* Recent Properties */}
        <RecentPropertiesCard />
      </div>
    </AppLayout>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  loading?: boolean;
  href: string;
  highlight?: boolean;
}

function StatsCard({ title, value, icon: Icon, loading, href, highlight }: StatsCardProps) {
  return (
    <Card className={highlight ? "border-primary/50 bg-primary/5" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`w-4 h-4 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <Link href={href}>
          <a className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
            Ver todos <ArrowRight className="w-3 h-3" />
          </a>
        </Link>
      </CardContent>
    </Card>
  );
}

function RecentLeadsCard() {
  const { data: leads, isLoading } = trpc.leads.list.useQuery({ limit: 5 });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Leads Recentes</CardTitle>
          <CardDescription>Últimos contatos recebidos</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/leads">
            Ver todos <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : leads && leads.length > 0 ? (
          <div className="space-y-3">
            {leads.map((lead) => (
              <Link key={lead.id} href={`/dashboard/leads/${lead.id}`}>
                <a className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.email || lead.phone}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    lead.stage === "novo" ? "bg-green-100 text-green-700" :
                    lead.stage === "qualificado" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {lead.stage}
                  </span>
                </a>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum lead ainda</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/dashboard/leads/new">Adicionar primeiro lead</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentPropertiesCard() {
  const { data: properties, isLoading } = trpc.properties.list.useQuery({ limit: 4 });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Imóveis Recentes</CardTitle>
          <CardDescription>Últimos imóveis cadastrados</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/properties">
            Ver todos <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {properties.map((property) => (
              <Link key={property.id} href={`/dashboard/properties/${property.id}`}>
                <a className="block p-4 rounded-lg border hover:border-primary transition-colors">
                  <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center">
                    <Home className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-sm line-clamp-1">{property.title}</h3>
                  <p className="text-xs text-muted-foreground">{property.city} - {property.state}</p>
                  <p className="text-sm font-semibold text-primary mt-1">
                    {property.salePrice ? `R$ ${Number(property.salePrice).toLocaleString('pt-BR')}` : 
                     property.rentPrice ? `R$ ${Number(property.rentPrice).toLocaleString('pt-BR')}/mês` : 
                     "Consulte"}
                  </p>
                </a>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Home className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum imóvel cadastrado</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/dashboard/properties/new">Cadastrar primeiro imóvel</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
