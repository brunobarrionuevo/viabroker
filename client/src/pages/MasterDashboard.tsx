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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Shield, Building2, Users, CreditCard, Activity, 
  LogOut, Search, RefreshCw, ChevronRight, DollarSign,
  TrendingUp, CheckCircle, XCircle, Clock, AlertCircle,
  Eye, Home, UserCheck
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
  const [showCreatePlanDialog, setShowCreatePlanDialog] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    slug: "",
    description: "",
    price: "0",
    maxProperties: -1,
    maxUsers: -1,
    maxPhotosPerProperty: 50,
    hasAI: true,
    aiCreditsPerDay: 100,
    hasWhatsappIntegration: true,
    hasPortalIntegration: true,
    hasCustomDomain: true,
    isCourtesy: false,
  });

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

  const { data: plans, isLoading: plansLoading, refetch: refetchPlans } = trpc.masterAdmin.listPlans.useQuery(
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

  const createPlanMutation = trpc.masterAdmin.createPlan.useMutation({
    onSuccess: () => {
      toast.success("Plano criado com sucesso!");
      setShowCreatePlanDialog(false);
      setNewPlan({
        name: "",
        slug: "",
        description: "",
        price: "0",
        maxProperties: -1,
        maxUsers: -1,
        maxPhotosPerProperty: 50,
        hasAI: true,
        aiCreditsPerDay: 100,
        hasWhatsappIntegration: true,
        hasPortalIntegration: true,
        hasCustomDomain: true,
        isCourtesy: false,
      });
      refetchPlans();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar plano");
    },
  });

  const handleCreatePlan = () => {
    if (!token) return;
    if (!newPlan.name || !newPlan.slug) {
      toast.error("Nome e slug são obrigatórios");
      return;
    }
    createPlanMutation.mutate({
      token,
      ...newPlan,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("masterToken");
    localStorage.removeItem("masterAdmin");
    setLocation("/master");
  };

  const handleToggleStatus = (companyId: number, currentStatus: boolean) => {
    if (!token) return;
    toggleStatusMutation.mutate({ token, companyId, isActive: !currentStatus });
  };

  const handleViewClient = (companyId: number) => {
    setLocation(`/master/client/${companyId}`);
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Viabroker Admin</h1>
              <p className="text-xs text-gray-500">Painel Master</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 font-medium">{admin?.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-gray-700 hover:text-gray-900 border-gray-300">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Clientes</CardTitle>
              <Building2 className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats?.totalCompanies || 0}</div>
              <p className="text-sm text-gray-500 mt-1">Corretores e imobiliárias</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Assinaturas Ativas</CardTitle>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats?.activeSubscriptions || 0}</div>
              <p className="text-sm text-gray-500 mt-1">Pagantes ativos</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Receita Total</CardTitle>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue)}</div>
              <p className="text-sm text-gray-500 mt-1">Pagamentos confirmados</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Usuários</CardTitle>
              <Users className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
              <p className="text-sm text-gray-500 mt-1">Usuários cadastrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="companies" className="space-y-4">
          <TabsList className="bg-white border border-gray-200 shadow-sm">
            <TabsTrigger value="companies" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700">
              <Building2 className="w-4 h-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="plans" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700">
              <CreditCard className="w-4 h-4 mr-2" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700">
              <DollarSign className="w-4 h-4 mr-2" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700">
              <Activity className="w-4 h-4 mr-2" />
              Atividades
            </TabsTrigger>
          </TabsList>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900 text-xl">Clientes</CardTitle>
                    <CardDescription className="text-gray-500">
                      Gerencie corretores e imobiliárias cadastradas
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchCompanies()} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
                <div className="flex gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome, email ou slug..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={activeFilter === undefined ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter(undefined)}
                      className={activeFilter === undefined ? "bg-blue-600 text-white" : "border-gray-300 text-gray-700"}
                    >
                      Todos
                    </Button>
                    <Button
                      variant={activeFilter === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter(true)}
                      className={activeFilter === true ? "bg-green-600 text-white" : "border-gray-300 text-gray-700"}
                    >
                      Ativos
                    </Button>
                    <Button
                      variant={activeFilter === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter(false)}
                      className={activeFilter === false ? "bg-red-600 text-white" : "border-gray-300 text-gray-700"}
                    >
                      Inativos
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-gray-700 font-semibold">Empresa</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Contato</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Assinatura</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Criado em</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                      <TableHead className="text-gray-700 font-semibold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companiesLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : companies?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          Nenhum cliente encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      companies?.map((company: any) => (
                        <TableRow key={company.id} className="border-gray-200 hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-semibold text-gray-900">{company.name}</p>
                              <p className="text-sm text-gray-500">{company.slug}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm text-gray-900">{company.email || "-"}</p>
                              <p className="text-sm text-gray-500">{company.phone || "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {company.subscription ? (
                              getStatusBadge(company.subscription.status)
                            ) : (
                              <Badge variant="outline" className="border-gray-300 text-gray-600">Sem assinatura</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {formatDate(company.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={company.isActive}
                                onCheckedChange={() => handleToggleStatus(company.id, company.isActive)}
                                disabled={toggleStatusMutation.isPending}
                              />
                              <span className={`font-medium ${company.isActive ? "text-green-600" : "text-red-600"}`}>
                                {company.isActive ? "Ativo" : "Inativo"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewClient(company.id)}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalhes
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
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900 text-xl">Planos</CardTitle>
                    <CardDescription className="text-gray-500">
                      Gerencie os planos de assinatura disponíveis
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowCreatePlanDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Novo Plano
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-gray-700 font-semibold">Plano</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Preço</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Imóveis</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Usuários</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Recursos</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plansLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : plans?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          Nenhum plano cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      plans?.map((plan: any) => (
                        <TableRow key={plan.id} className="border-gray-200 hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-semibold text-gray-900">{plan.name}</p>
                              <p className="text-sm text-gray-500">{plan.slug}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-900 font-semibold">
                            {formatCurrency(plan.price)}/mês
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {plan.maxProperties === -1 ? "Ilimitado" : plan.maxProperties}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {plan.maxUsers === -1 ? "Ilimitado" : plan.maxUsers}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {plan.hasAI && <Badge className="bg-purple-100 text-purple-700 text-xs">IA</Badge>}
                              {plan.hasWhatsappIntegration && <Badge className="bg-green-100 text-green-700 text-xs">WhatsApp</Badge>}
                              {plan.hasPortalIntegration && <Badge className="bg-blue-100 text-blue-700 text-xs">Portais</Badge>}
                              {plan.hasCustomDomain && <Badge className="bg-orange-100 text-orange-700 text-xs">Domínio</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Badge className={plan.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                {plan.isActive ? "Ativo" : "Inativo"}
                              </Badge>
                              {plan.isCourtesy && (
                                <Badge className="bg-yellow-100 text-yellow-700">
                                  Cortesia
                                </Badge>
                              )}
                            </div>
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
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 text-xl">Pagamentos</CardTitle>
                <CardDescription className="text-gray-500">
                  Histórico de pagamentos recebidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-gray-700 font-semibold">Cliente</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Valor</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Data</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Método</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : payments?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          Nenhum pagamento registrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments?.map((payment: any) => (
                        <TableRow key={payment.id} className="border-gray-200 hover:bg-gray-50">
                          <TableCell className="text-gray-900 font-medium">
                            {payment.companyName || `Empresa #${payment.companyId}`}
                          </TableCell>
                          <TableCell className="text-gray-900 font-semibold">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              payment.status === 'succeeded' ? "bg-green-100 text-green-700" :
                              payment.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }>
                              {payment.status === 'succeeded' ? 'Confirmado' :
                               payment.status === 'pending' ? 'Pendente' : payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {formatDate(payment.createdAt)}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {payment.paymentMethod || "Stripe"}
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
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 text-xl">Atividades</CardTitle>
                <CardDescription className="text-gray-500">
                  Registro de atividades do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-gray-700 font-semibold">Ação</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Ator</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Entidade</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Data</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : activityLogs?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          Nenhuma atividade registrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      activityLogs?.map((log: any) => (
                        <TableRow key={log.id} className="border-gray-200 hover:bg-gray-50">
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-700">
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-900">
                            {log.actorType === 'master_admin' ? 'Admin Master' : log.actorType}
                            {log.actorId && ` #${log.actorId}`}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {log.entityType ? `${log.entityType} #${log.entityId}` : "-"}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {formatDate(log.createdAt)}
                          </TableCell>
                          <TableCell className="text-gray-600 text-sm max-w-xs truncate">
                            {log.details ? JSON.stringify(log.details) : "-"}
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

      {/* Dialog para criar novo plano */}
      <Dialog open={showCreatePlanDialog} onOpenChange={setShowCreatePlanDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Criar Novo Plano</DialogTitle>
            <DialogDescription className="text-gray-500">
              Preencha as informações do novo plano de assinatura
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planName" className="text-gray-700">Nome do Plano *</Label>
                <Input
                  id="planName"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Cortesia Premium"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="planSlug" className="text-gray-700">Slug *</Label>
                <Input
                  id="planSlug"
                  value={newPlan.slug}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  placeholder="Ex: cortesia-premium"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="planDescription" className="text-gray-700">Descrição</Label>
              <Input
                id="planDescription"
                value={newPlan.description}
                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do plano"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="planPrice" className="text-gray-700">Preço (R$)</Label>
                <Input
                  id="planPrice"
                  type="number"
                  step="0.01"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="maxProperties" className="text-gray-700">Máx. Imóveis (-1 = ilimitado)</Label>
                <Input
                  id="maxProperties"
                  type="number"
                  value={newPlan.maxProperties}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, maxProperties: parseInt(e.target.value) || -1 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="maxUsers" className="text-gray-700">Máx. Usuários (-1 = ilimitado)</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  value={newPlan.maxUsers}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, maxUsers: parseInt(e.target.value) || -1 }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxPhotos" className="text-gray-700">Máx. Fotos por Imóvel</Label>
                <Input
                  id="maxPhotos"
                  type="number"
                  value={newPlan.maxPhotosPerProperty}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, maxPhotosPerProperty: parseInt(e.target.value) || 20 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="aiCredits" className="text-gray-700">Créditos IA/dia</Label>
                <Input
                  id="aiCredits"
                  type="number"
                  value={newPlan.aiCreditsPerDay}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, aiCreditsPerDay: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-gray-700 font-semibold mb-3 block">Recursos</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasAI"
                    checked={newPlan.hasAI}
                    onCheckedChange={(checked) => setNewPlan(prev => ({ ...prev, hasAI: !!checked }))}
                  />
                  <Label htmlFor="hasAI" className="text-gray-600">Inteligência Artificial</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasWhatsapp"
                    checked={newPlan.hasWhatsappIntegration}
                    onCheckedChange={(checked) => setNewPlan(prev => ({ ...prev, hasWhatsappIntegration: !!checked }))}
                  />
                  <Label htmlFor="hasWhatsapp" className="text-gray-600">Integração WhatsApp</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasPortal"
                    checked={newPlan.hasPortalIntegration}
                    onCheckedChange={(checked) => setNewPlan(prev => ({ ...prev, hasPortalIntegration: !!checked }))}
                  />
                  <Label htmlFor="hasPortal" className="text-gray-600">Integração Portais</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasCustomDomain"
                    checked={newPlan.hasCustomDomain}
                    onCheckedChange={(checked) => setNewPlan(prev => ({ ...prev, hasCustomDomain: !!checked }))}
                  />
                  <Label htmlFor="hasCustomDomain" className="text-gray-600">Domínio Personalizado</Label>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <Checkbox
                  id="isCourtesy"
                  checked={newPlan.isCourtesy}
                  onCheckedChange={(checked) => setNewPlan(prev => ({ ...prev, isCourtesy: !!checked, price: checked ? "0" : prev.price }))}
                />
                <div>
                  <Label htmlFor="isCourtesy" className="text-yellow-800 font-semibold">Plano de Cortesia</Label>
                  <p className="text-yellow-700 text-sm">Planos de cortesia não expiram e podem ser atribuídos/removidos a qualquer momento pelo admin master.</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePlanDialog(false)} className="text-gray-700">
              Cancelar
            </Button>
            <Button 
              onClick={handleCreatePlan} 
              disabled={createPlanMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createPlanMutation.isPending ? "Criando..." : "Criar Plano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
