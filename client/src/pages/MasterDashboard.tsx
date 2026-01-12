import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Shield, Building2, Users, CreditCard, Activity, 
  LogOut, Search, RefreshCw, ChevronRight, DollarSign,
  TrendingUp, CheckCircle, XCircle, Clock, AlertCircle
} from "lucide-react";

interface MasterAdmin {
  id: number;
  username: string;
  name: string;
  email: string | null;
}

export default function MasterDashboard() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<MasterAdmin | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const storedToken = localStorage.getItem("masterToken");
    const storedAdmin = localStorage.getItem("masterAdmin");
    
    if (!storedToken) {
      setLocation("/master");
      return;
    }
    
    setToken(storedToken);
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    }
  }, [setLocation]);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.masterAdmin.getStats.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const { data: companies, isLoading: companiesLoading, refetch: refetchCompanies } = trpc.masterAdmin.listCompanies.useQuery(
    { token: token || "", search: searchTerm || undefined, isActive: activeFilter, limit: 50 },
    { enabled: !!token }
  );

  const { data: plans, isLoading: plansLoading } = trpc.masterAdmin.listPlans.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const { data: payments, isLoading: paymentsLoading } = trpc.masterAdmin.listPayments.useQuery(
    { token: token || "", limit: 20 },
    { enabled: !!token }
  );

  const { data: activityLogs, isLoading: logsLoading } = trpc.masterAdmin.listActivityLogs.useQuery(
    { token: token || "", limit: 20 },
    { enabled: !!token }
  );

  const toggleStatusMutation = trpc.masterAdmin.toggleCompanyStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      refetchCompanies();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("masterToken");
    localStorage.removeItem("masterAdmin");
    setLocation("/master");
  };

  const handleToggleStatus = (companyId: number, currentStatus: boolean) => {
    if (!token) return;
    toggleStatusMutation.mutate({ token, companyId, isActive: !currentStatus });
  };

  const formatCurrency = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "Ativo", variant: "default" },
      trialing: { label: "Trial", variant: "secondary" },
      canceled: { label: "Cancelado", variant: "destructive" },
      past_due: { label: "Atrasado", variant: "destructive" },
      paused: { label: "Pausado", variant: "outline" },
      expired: { label: "Expirado", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-white">Brokvia Admin</h1>
              <p className="text-xs text-slate-400">Painel Master</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300">{admin?.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-300 hover:text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total de Clientes</CardTitle>
              <Building2 className="w-4 h-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.totalCompanies || 0}</div>
              <p className="text-xs text-slate-400">Corretores e imobiliárias</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Assinaturas Ativas</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.activeSubscriptions || 0}</div>
              <p className="text-xs text-slate-400">Pagantes ativos</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Receita Total</CardTitle>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(stats?.totalRevenue)}</div>
              <p className="text-xs text-slate-400">Pagamentos confirmados</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total de Usuários</CardTitle>
              <Users className="w-4 h-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-slate-400">Usuários cadastrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="companies" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="companies" className="data-[state=active]:bg-slate-700">
              <Building2 className="w-4 h-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="plans" className="data-[state=active]:bg-slate-700">
              <CreditCard className="w-4 h-4 mr-2" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-slate-700">
              <DollarSign className="w-4 h-4 mr-2" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-slate-700">
              <Activity className="w-4 h-4 mr-2" />
              Atividades
            </TabsTrigger>
          </TabsList>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Clientes</CardTitle>
                    <CardDescription className="text-slate-400">
                      Gerencie corretores e imobiliárias cadastradas
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchCompanies()} className="border-slate-600">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
                <div className="flex gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Buscar por nome, email ou slug..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={activeFilter === undefined ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter(undefined)}
                      className="border-slate-600"
                    >
                      Todos
                    </Button>
                    <Button
                      variant={activeFilter === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter(true)}
                      className="border-slate-600"
                    >
                      Ativos
                    </Button>
                    <Button
                      variant={activeFilter === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter(false)}
                      className="border-slate-600"
                    >
                      Inativos
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Empresa</TableHead>
                      <TableHead className="text-slate-300">Contato</TableHead>
                      <TableHead className="text-slate-300">Assinatura</TableHead>
                      <TableHead className="text-slate-300">Criado em</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companiesLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-400">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : companies?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-400">
                          Nenhum cliente encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      companies?.map((company: any) => (
                        <TableRow key={company.id} className="border-slate-700">
                          <TableCell>
                            <div>
                              <p className="font-medium text-white">{company.name}</p>
                              <p className="text-sm text-slate-400">{company.slug}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm text-slate-300">{company.email || "-"}</p>
                              <p className="text-sm text-slate-400">{company.phone || "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {company.subscription ? (
                              getStatusBadge(company.subscription.status)
                            ) : (
                              <Badge variant="outline">Sem assinatura</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {formatDate(company.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={company.isActive}
                                onCheckedChange={() => handleToggleStatus(company.id, company.isActive)}
                                disabled={toggleStatusMutation.isPending}
                              />
                              <span className={company.isActive ? "text-green-500" : "text-red-500"}>
                                {company.isActive ? "Ativo" : "Inativo"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Planos</CardTitle>
                <CardDescription className="text-slate-400">
                  Gerencie os planos de assinatura disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Plano</TableHead>
                      <TableHead className="text-slate-300">Preço</TableHead>
                      <TableHead className="text-slate-300">Imóveis</TableHead>
                      <TableHead className="text-slate-300">Usuários</TableHead>
                      <TableHead className="text-slate-300">Recursos</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plansLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-400">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : plans?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-400">
                          Nenhum plano cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      plans?.map((plan: any) => (
                        <TableRow key={plan.id} className="border-slate-700">
                          <TableCell>
                            <div>
                              <p className="font-medium text-white">{plan.name}</p>
                              <p className="text-sm text-slate-400">{plan.slug}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-white font-medium">
                            {formatCurrency(plan.price)}/mês
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {plan.maxProperties === -1 ? "Ilimitado" : plan.maxProperties}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {plan.maxUsers === -1 ? "Ilimitado" : plan.maxUsers}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {plan.hasAI && <Badge variant="secondary" className="text-xs">IA</Badge>}
                              {plan.hasWhatsappIntegration && <Badge variant="secondary" className="text-xs">WhatsApp</Badge>}
                              {plan.hasPortalIntegration && <Badge variant="secondary" className="text-xs">Portais</Badge>}
                              {plan.hasCustomDomain && <Badge variant="secondary" className="text-xs">Domínio</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={plan.isActive ? "default" : "destructive"}>
                              {plan.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Histórico de Pagamentos</CardTitle>
                <CardDescription className="text-slate-400">
                  Visualize todos os pagamentos realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">ID</TableHead>
                      <TableHead className="text-slate-300">Empresa</TableHead>
                      <TableHead className="text-slate-300">Valor</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-400">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : payments?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-400">
                          Nenhum pagamento encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments?.map((payment: any) => (
                        <TableRow key={payment.id} className="border-slate-700">
                          <TableCell className="text-slate-300">#{payment.id}</TableCell>
                          <TableCell className="text-slate-300">#{payment.companyId}</TableCell>
                          <TableCell className="text-white font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {formatDate(payment.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="logs">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Logs de Atividade</CardTitle>
                <CardDescription className="text-slate-400">
                  Histórico de ações realizadas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Ator</TableHead>
                      <TableHead className="text-slate-300">Ação</TableHead>
                      <TableHead className="text-slate-300">Entidade</TableHead>
                      <TableHead className="text-slate-300">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-400">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : activityLogs?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-400">
                          Nenhuma atividade registrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      activityLogs?.map((log: any) => (
                        <TableRow key={log.id} className="border-slate-700">
                          <TableCell>
                            <Badge variant="outline">{log.actorType}</Badge>
                          </TableCell>
                          <TableCell className="text-white">{log.action}</TableCell>
                          <TableCell className="text-slate-300">
                            {log.entityType ? `${log.entityType} #${log.entityId}` : "-"}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {formatDate(log.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
