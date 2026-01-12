import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Shield, ArrowLeft, Building2, User, Mail, Phone, MapPin, 
  Calendar, CreditCard, Home, Users, FileText, Activity,
  ExternalLink, Eye, Edit, Trash2, RefreshCw
} from "lucide-react";

export default function MasterClientDetail() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const [token, setToken] = useState<string | null>(null);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  useEffect(() => {
    const storedToken = localStorage.getItem("masterToken");
    if (!storedToken) {
      setLocation("/master");
      return;
    }
    setToken(storedToken);
  }, [setLocation]);

  const { data: client, isLoading, refetch } = trpc.masterAdmin.getClientDetail.useQuery(
    { token: token || "", companyId: parseInt(id || "0") },
    { enabled: !!token && !!id }
  );

  const { data: plans } = trpc.masterAdmin.listPlans.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const toggleStatusMutation = trpc.masterAdmin.toggleCompanyStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const changePlanMutation = trpc.masterAdmin.changeClientPlan.useMutation({
    onSuccess: () => {
      toast.success("Plano alterado com sucesso!");
      setShowPlanDialog(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao alterar plano");
    },
  });

  const formatCurrency = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const formatDateTime = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCPFCNPJ = (value: string | null | undefined) => {
    if (!value) return "-";
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (cleaned.length === 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  const formatPhone = (value: string | null | undefined) => {
    if (!value) return "-";
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleToggleStatus = () => {
    if (!token || !client) return;
    toggleStatusMutation.mutate({ 
      token, 
      companyId: client.company.id, 
      isActive: !client.company.isActive 
    });
  };

  const handleChangePlan = () => {
    if (!token || !selectedPlan) return;
    changePlanMutation.mutate({
      token,
      companyId: parseInt(id || "0"),
      planId: parseInt(selectedPlan),
    });
  };

  if (!token) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">Cliente não encontrado</p>
          <Button onClick={() => setLocation("/master/dashboard")}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/master/dashboard">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-white">Detalhes do Cliente</h1>
              <p className="text-xs text-slate-400">{client.company.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="border-slate-600">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Company Info Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {client.company.name}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {client.company.personType === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={client.company.isActive}
                    onCheckedChange={handleToggleStatus}
                    disabled={toggleStatusMutation.isPending}
                  />
                  <span className={client.company.isActive ? "text-green-500" : "text-red-500"}>
                    {client.company.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dados Pessoais / Empresariais */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">Dados Cadastrais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">
                      {client.company.personType === 'juridica' ? 'CNPJ:' : 'CPF:'}
                    </span>
                    <span>{formatCPFCNPJ(client.company.personType === 'juridica' ? client.company.cnpj : client.company.cpf)}</span>
                  </div>
                  {client.company.creci && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">CRECI:</span>
                      <span>{client.company.creci}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">Email:</span>
                    <span>{client.company.email || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">Telefone:</span>
                    <span>{formatPhone(client.company.phone)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">WhatsApp:</span>
                    <span>{formatPhone(client.company.whatsapp)}</span>
                  </div>
                  {client.company.creci && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">CRECI:</span>
                      <span>{client.company.creci}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">Endereço</h3>
                <div className="flex items-start gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    {client.company.address ? (
                      <>
                        <p>{client.company.address}</p>
                        <p>{client.company.city}/{client.company.state}</p>
                        {client.company.zipCode && <p>CEP: {client.company.zipCode}</p>}
                      </>
                    ) : (
                      <p className="text-slate-400">Endereço não cadastrado</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Datas */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">Informações do Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">Cadastro:</span>
                    <span>{formatDateTime(client.company.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">Slug:</span>
                    <span>{client.company.slug}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-400" />
                  <span className="text-slate-300">Imóveis</span>
                </div>
                <span className="text-2xl font-bold text-white">{client.stats.totalProperties}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-400" />
                  <span className="text-slate-300">Leads</span>
                </div>
                <span className="text-2xl font-bold text-white">{client.stats.totalLeads}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-300">Usuários</span>
                </div>
                <span className="text-2xl font-bold text-white">{client.stats.totalUsers}</span>
              </div>

              {/* Plano Atual */}
              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Plano Atual</h4>
                {client.subscription ? (
                  <div className="space-y-2">
                    <Badge variant="default" className="text-sm">
                      {client.subscription.planName}
                    </Badge>
                    <p className="text-sm text-slate-400">
                      Status: {client.subscription.status === 'active' ? 'Ativo' : 
                               client.subscription.status === 'trialing' ? 'Trial' : client.subscription.status}
                    </p>
                    {client.subscription.currentPeriodEnd && (
                      <p className="text-sm text-slate-400">
                        Próxima cobrança: {formatDate(client.subscription.currentPeriodEnd)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400">Sem assinatura ativa</p>
                )}
                
                <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full mt-3 border-slate-600">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Alterar Plano
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Alterar Plano</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Selecione o novo plano para este cliente
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Selecione um plano" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {plans?.map((plan: any) => (
                            <SelectItem key={plan.id} value={plan.id.toString()} className="text-white">
                              {plan.name} - {formatCurrency(plan.price)}/mês
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowPlanDialog(false)} className="border-slate-600">
                        Cancelar
                      </Button>
                      <Button onClick={handleChangePlan} disabled={!selectedPlan || changePlanMutation.isPending}>
                        {changePlanMutation.isPending ? "Alterando..." : "Confirmar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Properties, Leads, Users */}
        <Tabs defaultValue="properties" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="properties" className="data-[state=active]:bg-slate-700">
              <Home className="w-4 h-4 mr-2" />
              Imóveis ({client.stats.totalProperties})
            </TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-slate-700">
              <Users className="w-4 h-4 mr-2" />
              Leads ({client.stats.totalLeads})
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
              <User className="w-4 h-4 mr-2" />
              Usuários ({client.stats.totalUsers})
            </TabsTrigger>
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Imóveis Cadastrados</CardTitle>
                <CardDescription className="text-slate-400">
                  Lista de todos os imóveis deste cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Título</TableHead>
                      <TableHead className="text-slate-300">Tipo</TableHead>
                      <TableHead className="text-slate-300">Finalidade</TableHead>
                      <TableHead className="text-slate-300">Preço</TableHead>
                      <TableHead className="text-slate-300">Cidade</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.properties.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-slate-400">
                          Nenhum imóvel cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      client.properties.map((property: any) => (
                        <TableRow key={property.id} className="border-slate-700">
                          <TableCell className="text-white font-medium">
                            {property.title}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {property.propertyType}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {property.purpose === 'sale' ? 'Venda' : 'Aluguel'}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {formatCurrency(property.price)}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {property.city}/{property.state}
                          </TableCell>
                          <TableCell>
                            <Badge variant={property.isPublished ? "default" : "secondary"}>
                              {property.isPublished ? "Publicado" : "Rascunho"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {formatDate(property.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Leads Capturados</CardTitle>
                <CardDescription className="text-slate-400">
                  Lista de todos os leads deste cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Nome</TableHead>
                      <TableHead className="text-slate-300">Email</TableHead>
                      <TableHead className="text-slate-300">Telefone</TableHead>
                      <TableHead className="text-slate-300">Origem</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-400">
                          Nenhum lead capturado
                        </TableCell>
                      </TableRow>
                    ) : (
                      client.leads.map((lead: any) => (
                        <TableRow key={lead.id} className="border-slate-700">
                          <TableCell className="text-white font-medium">
                            {lead.name}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {lead.email}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {formatPhone(lead.phone)}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {lead.source || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              lead.status === 'new' ? "default" :
                              lead.status === 'contacted' ? "secondary" :
                              lead.status === 'converted' ? "default" : "outline"
                            }>
                              {lead.status === 'new' ? 'Novo' :
                               lead.status === 'contacted' ? 'Contatado' :
                               lead.status === 'converted' ? 'Convertido' : lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {formatDateTime(lead.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Usuários</CardTitle>
                <CardDescription className="text-slate-400">
                  Lista de usuários vinculados a este cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Nome</TableHead>
                      <TableHead className="text-slate-300">Email</TableHead>
                      <TableHead className="text-slate-300">Função</TableHead>
                      <TableHead className="text-slate-300">Último Acesso</TableHead>
                      <TableHead className="text-slate-300">Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-400">
                          Nenhum usuário cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      client.users.map((user: any) => (
                        <TableRow key={user.id} className="border-slate-700">
                          <TableCell className="text-white font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                              {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {formatDateTime(user.lastLoginAt)}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {formatDate(user.createdAt)}
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
