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
  Eye, Home, UserCheck, Trash2, Power, Edit
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
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
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

  const changePasswordMutation = trpc.masterAdmin.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao alterar senha");
    },
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<any>(null);

  const deleteCompanyMutation = trpc.masterAdmin.deleteCompany.useMutation({
    onSuccess: () => {
      toast.success("Empresa excluída com sucesso!");
      setShowDeleteDialog(false);
      setCompanyToDelete(null);
      refetchCompanies();
      refetchStats();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir empresa");
    },
  });

  const handleDeleteCompany = (company: any) => {
    setCompanyToDelete(company);
    setShowDeleteDialog(true);
  };

  const confirmDeleteCompany = () => {
    if (!token || !companyToDelete) return;
    deleteCompanyMutation.mutate({ token, companyId: companyToDelete.id });
  };

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

  const handleChangePassword = () => {
    if (!token) return;
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }
    changePasswordMutation.mutate({
      token,
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
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
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700">
              <Edit className="w-4 h-4 mr-2" />
              Configurações
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
                      placeholder="Buscar por nome ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="flex gap-2">
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
                      className={activeFilter === true ? "bg-blue-600 text-white" : "border-gray-300 text-gray-700"}
                    >
                      Ativos
                    </Button>
                    <Button
                      variant={activeFilter === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter(false)}
                      className={activeFilter === false ? "bg-blue-600 text-white" : "border-gray-300 text-gray-700"}
                    >
                      Inativos
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {companiesLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : !companies || companies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhum cliente encontrado</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-700">Cliente</TableHead>
                        <TableHead className="text-gray-700">Plano</TableHead>
                        <TableHead className="text-gray-700">Status</TableHead>
                        <TableHead className="text-gray-700">Cadastro</TableHead>
                        <TableHead className="text-gray-700 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company: any) => (
                        <TableRow key={company.id} className="border-gray-200">
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">{company.name}</div>
                              <div className="text-sm text-gray-500">{company.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-gray-900">{company.planName || "-"}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={company.isActive}
                                onCheckedChange={() => handleToggleStatus(company.id, company.isActive)}
                              />
                              <span className="text-sm text-gray-700">{company.isActive ? "Ativo" : "Inativo"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-700">{formatDate(company.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewClient(company.id)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Detalhes
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCompany(company)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
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
                  <Button onClick={() => setShowCreatePlanDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Criar Novo Plano
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {plansLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : !plans || plans.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhum plano cadastrado</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plans.map((plan: any) => (
                      <Card key={plan.id} className="border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-gray-900">{plan.name}</CardTitle>
                          <CardDescription className="text-gray-500">{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-3xl font-bold text-gray-900">{formatCurrency(plan.price)}</div>
                            <div className="text-sm text-gray-500">por mês</div>
                            <div className="pt-4 space-y-2 text-sm text-gray-700">
                              <div>• {plan.maxProperties === -1 ? "Imóveis ilimitados" : `Até ${plan.maxProperties} imóveis`}</div>
                              <div>• {plan.maxUsers === -1 ? "Usuários ilimitados" : `Até ${plan.maxUsers} usuários`}</div>
                              {plan.hasAI && <div>• IA para descrições</div>}
                              {plan.hasWhatsappIntegration && <div>• Integração WhatsApp</div>}
                              {plan.hasPortalIntegration && <div>• Integração com portais</div>}
                              {plan.hasCustomDomain && <div>• Domínio personalizado</div>}
                              {plan.isCourtesy && <Badge variant="secondary" className="mt-2">Cortesia</Badge>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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
                {paymentsLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : !payments || payments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhum pagamento registrado</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-700">Cliente</TableHead>
                        <TableHead className="text-gray-700">Valor</TableHead>
                        <TableHead className="text-gray-700">Status</TableHead>
                        <TableHead className="text-gray-700">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment: any) => (
                        <TableRow key={payment.id} className="border-gray-200">
                          <TableCell className="text-gray-900">{payment.companyName}</TableCell>
                          <TableCell className="text-gray-900 font-medium">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>
                            {payment.status === "succeeded" ? (
                              <Badge variant="default" className="bg-green-600">Pago</Badge>
                            ) : (
                              <Badge variant="destructive">Falhou</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-700">{formatDate(payment.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 text-xl">Atividades</CardTitle>
                <CardDescription className="text-gray-500">
                  Log de atividades do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : !activityLogs || activityLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhuma atividade registrada</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-700">Ação</TableHead>
                        <TableHead className="text-gray-700">Ator</TableHead>
                        <TableHead className="text-gray-700">Detalhes</TableHead>
                        <TableHead className="text-gray-700">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityLogs.map((log: any) => (
                        <TableRow key={log.id} className="border-gray-200">
                          <TableCell className="text-gray-900 font-medium">{log.action}</TableCell>
                          <TableCell className="text-gray-700">{log.actorType}</TableCell>
                          <TableCell className="text-gray-500 text-sm">{JSON.stringify(log.details)}</TableCell>
                          <TableCell className="text-gray-700">{formatDate(log.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 text-xl">Usuários</CardTitle>
                <CardDescription className="text-gray-500">
                  Gestão de usuários do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Funcionalidade em desenvolvimento
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 text-xl">Configurações do Admin Master</CardTitle>
                <CardDescription className="text-gray-500">
                  Gerencie sua conta de administrador
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Alterar Senha */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-4">Alterar Senha</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword" className="text-gray-700">Senha Atual</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="Digite sua senha atual"
                        className="border-gray-300 text-gray-900"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword" className="text-gray-700">Nova Senha</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Digite sua nova senha"
                        className="border-gray-300 text-gray-900"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-gray-700">Confirmar Nova Senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirme sua nova senha"
                        className="border-gray-300 text-gray-900"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      />
                    </div>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleChangePassword}
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
                    </Button>
                  </div>
                </div>

                {/* Configurações de IA */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-4">Configurações de IA</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure o modelo e prompts usados para geração de descrições de imóveis com IA
                  </p>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="aiModel" className="text-gray-700">Modelo de IA</Label>
                      <Input
                        id="aiModel"
                        type="text"
                        placeholder="gpt-4o-mini"
                        className="border-gray-300 text-gray-900"
                        defaultValue="gpt-4o-mini"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Modelo OpenAI usado para geração de texto</p>
                    </div>
                    <div>
                      <Label htmlFor="systemPrompt" className="text-gray-700">Prompt do Sistema</Label>
                      <Input
                        id="systemPrompt"
                        type="text"
                        placeholder="Você é um copywriter especializado em imóveis..."
                        className="border-gray-300 text-gray-900"
                        defaultValue="Você é um copywriter especializado em imóveis de alto padrão."
                      />
                      <p className="text-xs text-gray-500 mt-1">Define o papel da IA na conversa</p>
                    </div>
                    <div>
                      <Label htmlFor="descriptionPrompt" className="text-gray-700">Prompt de Descrição</Label>
                      <textarea
                        id="descriptionPrompt"
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                        defaultValue={`Crie uma descrição imobiliária profissional e persuasiva para o seguinte imóvel:\n\n{propertyInfo}\n\nDiretrizes para a descrição:\n1. Escreva 2-3 parágrafos fluidos e bem conectados\n2. Comece destacando o principal diferencial do imóvel\n3. Descreva a localização e suas vantagens\n4. Destaque os ambientes e características\n5. Mencione diferenciais de forma natural\n6. Use linguagem persuasiva mas honesta\n7. Transmita exclusividade e qualidade\n8. Finalize com convite à visita\n9. Não use emojis\n10. Não invente informações`}
                      />
                      <p className="text-xs text-gray-500 mt-1">Template usado para gerar descrições. Use {'{propertyInfo}'} onde as informações do imóvel serão inseridas</p>
                    </div>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                    >
                      Salvar Configurações de IA
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Plan Dialog */}
      <Dialog open={showCreatePlanDialog} onOpenChange={setShowCreatePlanDialog}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Criar Novo Plano</DialogTitle>
            <DialogDescription className="text-gray-500">
              Preencha os detalhes do novo plano de assinatura
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planName" className="text-gray-700">Nome do Plano</Label>
                <Input
                  id="planName"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  className="border-gray-300 text-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="planSlug" className="text-gray-700">Slug</Label>
                <Input
                  id="planSlug"
                  value={newPlan.slug}
                  onChange={(e) => setNewPlan({ ...newPlan, slug: e.target.value })}
                  className="border-gray-300 text-gray-900"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="planDescription" className="text-gray-700">Descrição</Label>
              <Input
                id="planDescription"
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                className="border-gray-300 text-gray-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planPrice" className="text-gray-700">Preço (R$)</Label>
                <Input
                  id="planPrice"
                  type="number"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                  className="border-gray-300 text-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="planMaxProperties" className="text-gray-700">Máx. Imóveis (-1 = ilimitado)</Label>
                <Input
                  id="planMaxProperties"
                  type="number"
                  value={newPlan.maxProperties}
                  onChange={(e) => setNewPlan({ ...newPlan, maxProperties: parseInt(e.target.value) })}
                  className="border-gray-300 text-gray-900"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planMaxUsers" className="text-gray-700">Máx. Usuários (-1 = ilimitado)</Label>
                <Input
                  id="planMaxUsers"
                  type="number"
                  value={newPlan.maxUsers}
                  onChange={(e) => setNewPlan({ ...newPlan, maxUsers: parseInt(e.target.value) })}
                  className="border-gray-300 text-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="planMaxPhotos" className="text-gray-700">Máx. Fotos por Imóvel</Label>
                <Input
                  id="planMaxPhotos"
                  type="number"
                  value={newPlan.maxPhotosPerProperty}
                  onChange={(e) => setNewPlan({ ...newPlan, maxPhotosPerProperty: parseInt(e.target.value) })}
                  className="border-gray-300 text-gray-900"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasAI"
                  checked={newPlan.hasAI}
                  onCheckedChange={(checked) => setNewPlan({ ...newPlan, hasAI: checked as boolean })}
                />
                <Label htmlFor="hasAI" className="text-gray-700">IA para descrições</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasWhatsapp"
                  checked={newPlan.hasWhatsappIntegration}
                  onCheckedChange={(checked) => setNewPlan({ ...newPlan, hasWhatsappIntegration: checked as boolean })}
                />
                <Label htmlFor="hasWhatsapp" className="text-gray-700">Integração WhatsApp</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPortal"
                  checked={newPlan.hasPortalIntegration}
                  onCheckedChange={(checked) => setNewPlan({ ...newPlan, hasPortalIntegration: checked as boolean })}
                />
                <Label htmlFor="hasPortal" className="text-gray-700">Integração com portais</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasCustomDomain"
                  checked={newPlan.hasCustomDomain}
                  onCheckedChange={(checked) => setNewPlan({ ...newPlan, hasCustomDomain: checked as boolean })}
                />
                <Label htmlFor="hasCustomDomain" className="text-gray-700">Domínio personalizado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isCourtesy"
                  checked={newPlan.isCourtesy}
                  onCheckedChange={(checked) => setNewPlan({ ...newPlan, isCourtesy: checked as boolean })}
                />
                <Label htmlFor="isCourtesy" className="text-gray-700">Plano de cortesia</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
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

      {/* Delete Company Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-gray-500">
              Tem certeza que deseja excluir a empresa {companyToDelete?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800 mb-2">Esta ação é irreversível!</p>
                  <p className="text-sm text-red-700 mb-2">Todos os dados relacionados serão excluídos permanentemente:</p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    <li>Todos os imóveis cadastrados</li>
                    <li>Todos os leads e clientes</li>
                    <li>Todos os usuários da empresa</li>
                    <li>Todas as configurações e personalizações</li>
                    <li>Todo o histórico de atividades</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDeleteCompany}
              disabled={deleteCompanyMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteCompanyMutation.isPending ? "Excluindo..." : "Sim, Excluir Empresa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
