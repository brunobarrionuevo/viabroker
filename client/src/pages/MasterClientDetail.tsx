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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-700 text-lg">Carregando...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 mb-4 text-lg">Cliente não encontrado</p>
          <Button onClick={() => setLocation("/master/dashboard")}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/master/dashboard">
              <Button variant="outline" size="sm" className="text-gray-700 hover:text-gray-900 border-gray-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Detalhes do Cliente</h1>
              <p className="text-xs text-gray-500">{client.company.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Company Info Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-gray-200 shadow-sm lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 flex items-center gap-2 text-xl">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    {client.company.name}
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    {client.company.personType === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={client.company.isActive}
                    onCheckedChange={handleToggleStatus}
                    disabled={toggleStatusMutation.isPending}
                  />
                  <span className={`font-semibold ${client.company.isActive ? "text-green-600" : "text-red-600"}`}>
                    {client.company.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dados Pessoais / Empresariais */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Dados Cadastrais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-500 font-medium">
                      {client.company.personType === 'juridica' ? 'CNPJ:' : 'CPF:'}
                    </span>
                    <span className="text-gray-900 font-semibold">{formatCPFCNPJ(client.company.personType === 'juridica' ? client.company.cnpj : client.company.cpf)}</span>
                  </div>
                  {client.company.creci && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-500 font-medium">CRECI:</span>
                      <span className="text-gray-900 font-semibold">{client.company.creci}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-500 font-medium">Email:</span>
                    <span className="text-gray-900">{client.company.email || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-500 font-medium">Telefone:</span>
                    <span className="text-gray-900">{formatPhone(client.company.phone)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span className="text-gray-500 font-medium">WhatsApp:</span>
                    <span className="text-gray-900">{formatPhone(client.company.whatsapp)}</span>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Endereço</h3>
                <div className="flex items-start gap-2 bg-gray-50 p-4 rounded-lg">
                  <MapPin className="w-4 h-4 text-blue-600 mt-1" />
                  <div className="text-gray-900">
                    {client.company.address ? (
                      <>
                        <p className="font-medium">{client.company.address}</p>
                        {client.company.city && client.company.state && (
                          <p className="text-gray-600">{client.company.city} - {client.company.state}</p>
                        )}
                        {client.company.zipCode && <p className="text-gray-500">CEP: {client.company.zipCode}</p>}
                      </>
                    ) : (
                      <p className="text-gray-500">Endereço não cadastrado</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Datas */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Informações do Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-500 font-medium">Cadastro:</span>
                    <span className="text-gray-900">{formatDateTime(client.company.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-500 font-medium">Slug:</span>
                    <span className="text-gray-900 font-mono bg-gray-200 px-2 py-0.5 rounded">{client.company.slug}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700 font-medium">Imóveis</span>
                </div>
                <span className="text-3xl font-bold text-blue-600">{client.stats.totalProperties}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700 font-medium">Leads</span>
                </div>
                <span className="text-3xl font-bold text-green-600">{client.stats.totalLeads}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700 font-medium">Usuários</span>
                </div>
                <span className="text-3xl font-bold text-purple-600">{client.stats.totalUsers}</span>
              </div>

              {/* Plano Atual */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Plano Atual</h4>
                {client.subscription ? (
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                    <Badge className="bg-blue-600 text-white text-sm px-3 py-1">
                      {client.subscription.planName}
                    </Badge>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Status:</span> {client.subscription.status === 'active' ? 'Ativo' : 
                               client.subscription.status === 'trialing' ? 'Trial' : client.subscription.status}
                    </p>
                    {client.subscription.currentPeriodEnd && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Próxima cobrança:</span> {formatDate(client.subscription.currentPeriodEnd)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">Sem assinatura ativa</p>
                )}
                
                <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full mt-3 border-blue-300 text-blue-600 hover:bg-blue-50">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Alterar Plano
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-gray-200">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900">Alterar Plano</DialogTitle>
                      <DialogDescription className="text-gray-500">
                        Selecione o novo plano para este cliente
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                        <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                          <SelectValue placeholder="Selecione um plano" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200">
                          {plans?.map((plan: any) => (
                            <SelectItem key={plan.id} value={plan.id.toString()} className="text-gray-900">
                              {plan.name} - {formatCurrency(plan.price)}/mês
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowPlanDialog(false)} className="border-gray-300 text-gray-700">
                        Cancelar
                      </Button>
                      <Button onClick={handleChangePlan} disabled={!selectedPlan || changePlanMutation.isPending} className="bg-blue-600 text-white hover:bg-blue-700">
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
          <TabsList className="bg-white border border-gray-200 shadow-sm">
            <TabsTrigger value="properties" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700">
              <Home className="w-4 h-4 mr-2" />
              Imóveis ({client.stats.totalProperties})
            </TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700">
              <Users className="w-4 h-4 mr-2" />
              Leads ({client.stats.totalLeads})
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700">
              <User className="w-4 h-4 mr-2" />
              Usuários ({client.stats.totalUsers})
            </TabsTrigger>
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 text-xl">Imóveis Cadastrados</CardTitle>
                <CardDescription className="text-gray-500">
                  Lista de todos os imóveis deste cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-gray-700 font-semibold">Título</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Tipo</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Finalidade</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Preço</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Cidade</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.properties.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                          Nenhum imóvel cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      client.properties.map((property: any) => (
                        <TableRow key={property.id} className="border-gray-200 hover:bg-gray-50">
                          <TableCell className="text-gray-900 font-semibold">
                            {property.title}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {property.propertyType}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            <Badge className={property.purpose === 'sale' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}>
                              {property.purpose === 'sale' ? 'Venda' : 'Aluguel'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-900 font-semibold">
                            {formatCurrency(property.price)}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {property.city}/{property.state}
                          </TableCell>
                          <TableCell>
                            <Badge className={property.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                              {property.isPublished ? "Publicado" : "Rascunho"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
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
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 text-xl">Leads Capturados</CardTitle>
                <CardDescription className="text-gray-500">
                  Lista de todos os leads deste cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-gray-700 font-semibold">Nome</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Email</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Telefone</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Origem</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          Nenhum lead capturado
                        </TableCell>
                      </TableRow>
                    ) : (
                      client.leads.map((lead: any) => (
                        <TableRow key={lead.id} className="border-gray-200 hover:bg-gray-50">
                          <TableCell className="text-gray-900 font-semibold">
                            {lead.name}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {lead.email}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {formatPhone(lead.phone)}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {lead.source || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              lead.status === 'new' ? "bg-blue-100 text-blue-700" :
                              lead.status === 'contacted' ? "bg-yellow-100 text-yellow-700" :
                              lead.status === 'converted' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                            }>
                              {lead.status === 'new' ? 'Novo' :
                               lead.status === 'contacted' ? 'Contatado' :
                               lead.status === 'converted' ? 'Convertido' : lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
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
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 text-xl">Usuários</CardTitle>
                <CardDescription className="text-gray-500">
                  Lista de usuários vinculados a este cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50">
                      <TableHead className="text-gray-700 font-semibold">Nome</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Email</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Função</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Último Acesso</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          Nenhum usuário cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      client.users.map((user: any) => (
                        <TableRow key={user.id} className="border-gray-200 hover:bg-gray-50">
                          <TableCell className="text-gray-900 font-semibold">
                            {user.name}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Badge className={user.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}>
                              {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {formatDateTime(user.lastLoginAt)}
                          </TableCell>
                          <TableCell className="text-gray-600">
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
