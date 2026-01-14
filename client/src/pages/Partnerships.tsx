import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "../lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Users, UserPlus, Check, X, Share2, Building2, Home, Clock, CheckCircle, XCircle, AlertCircle, Copy, ArrowUpRight, ArrowDownLeft, Eye, MapPin, BedDouble, Bath, Car, Star, Power, Trash2 } from "lucide-react";

export default function Partnerships() {
  const queryClient = useQueryClient();
  const [partnerCode, setPartnerCode] = useState("");
  const [shareAll, setShareAll] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [previewPropertyId, setPreviewPropertyId] = useState<number | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Query para obter dados da empresa (incluindo partnerCode)
  const { data: company } = trpc.company.get.useQuery();

  // Queries
  const { data: partnerships = [], isLoading: loadingPartnerships } = trpc.partnerships.list.useQuery();
  const { data: pendingPartnerships = [] } = trpc.partnerships.pending.useQuery();
  const { data: acceptedPartnerships = [] } = trpc.partnerships.accepted.useQuery();
  const { data: sentShares = [] } = trpc.propertyShares.sentList.useQuery();
  const { data: receivedShares = [] } = trpc.propertyShares.receivedList.useQuery();
  const { data: pendingShares = [] } = trpc.propertyShares.pending.useQuery();
  const { data: properties = [] } = trpc.properties.list.useQuery({});
  const { data: activityLogs = [] } = trpc.partnershipActivity.list.useQuery();

  // Query para preview do imóvel
  const { data: previewProperty } = trpc.properties.getPublic.useQuery(
    { id: previewPropertyId! },
    { enabled: !!previewPropertyId }
  );

  // Mutations
  const requestPartnership = trpc.partnerships.request.useMutation({
    onSuccess: () => {
      toast.success("Solicitação enviada - Aguardando aprovação do parceiro");
      queryClient.invalidateQueries({ queryKey: ["partnerships"] });
      setShowRequestDialog(false);
      setPartnerCode("");
      setShareAll(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const acceptPartnership = trpc.partnerships.accept.useMutation({
    onSuccess: () => {
      toast.success("Parceria aceita - Vocês agora são parceiros!");
      // Invalidar todas as queries relacionadas a parcerias
      queryClient.invalidateQueries({ queryKey: ["partnerships"] });
      queryClient.invalidateQueries({ queryKey: [["partnerships", "list"]] });
      queryClient.invalidateQueries({ queryKey: [["partnerships", "pending"]] });
      queryClient.invalidateQueries({ queryKey: [["partnerships", "accepted"]] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const rejectPartnership = trpc.partnerships.reject.useMutation({
    onSuccess: () => {
      toast.success("Parceria rejeitada");
      queryClient.invalidateQueries({ queryKey: ["partnerships"] });
      queryClient.invalidateQueries({ queryKey: [["partnerships", "list"]] });
      queryClient.invalidateQueries({ queryKey: [["partnerships", "pending"]] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const cancelPartnership = trpc.partnerships.cancel.useMutation({
    onSuccess: () => {
      toast.success("Parceria cancelada");
      queryClient.invalidateQueries({ queryKey: ["partnerships"] });
      queryClient.invalidateQueries({ queryKey: [["partnerships", "list"]] });
      queryClient.invalidateQueries({ queryKey: [["partnerships", "accepted"]] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const shareProperty = trpc.propertyShares.share.useMutation({
    onSuccess: () => {
      toast.success("Imóvel compartilhado - Aguardando aceitação do parceiro");
      queryClient.invalidateQueries({ queryKey: ["propertyShares"] });
      queryClient.invalidateQueries({ queryKey: [["propertyShares", "sentList"]] });
      setShowShareDialog(false);
      setSelectedPropertyId(null);
      setSelectedPartnerId(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const acceptShare = trpc.propertyShares.accept.useMutation({
    onSuccess: () => {
      toast.success("Compartilhamento aceito - O imóvel agora aparece no seu site e na sua listagem");
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["propertyShares"] });
      queryClient.invalidateQueries({ queryKey: [["propertyShares", "receivedList"]] });
      queryClient.invalidateQueries({ queryKey: [["propertyShares", "pending"]] });
      queryClient.invalidateQueries({ queryKey: [["propertyShares", "sharedProperties"]] });
      queryClient.invalidateQueries({ queryKey: [["properties", "list"]] });
      setShowPreviewDialog(false);
      setPreviewPropertyId(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const rejectShare = trpc.propertyShares.reject.useMutation({
    onSuccess: () => {
      toast.success("Compartilhamento rejeitado");
      queryClient.invalidateQueries({ queryKey: ["propertyShares"] });
      queryClient.invalidateQueries({ queryKey: [["propertyShares", "receivedList"]] });
      queryClient.invalidateQueries({ queryKey: [["propertyShares", "pending"]] });
      setShowPreviewDialog(false);
      setPreviewPropertyId(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const revokeShare = trpc.propertyShares.revoke.useMutation({
    onSuccess: () => {
      toast.success("Compartilhamento revogado");
      queryClient.invalidateQueries({ queryKey: ["propertyShares"] });
      queryClient.invalidateQueries({ queryKey: [["propertyShares", "sentList"]] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const toggleHighlight = trpc.propertyShares.toggleHighlight.useMutation({
    onSuccess: (data) => {
      toast.success(data.isHighlight ? "Imóvel marcado como destaque" : "Destaque removido");
      queryClient.invalidateQueries({ queryKey: ["propertyShares"] });
      queryClient.invalidateQueries({ queryKey: [["propertyShares", "receivedList"]] });
      queryClient.invalidateQueries({ queryKey: [["propertyShares", "listReceived"]] });
      queryClient.invalidateQueries({ queryKey: [["properties", "list"]] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const toggleStatus = trpc.propertyShares.toggleStatus.useMutation({
    onSuccess: (data) => {
      toast.success(data.status === 'inactive' ? "Imóvel inativado - Não aparecerá mais no seu site" : "Imóvel ativado - Voltará a aparecer no seu site");
      queryClient.invalidateQueries({ queryKey: ["propertyShares"] });
      queryClient.invalidateQueries({ queryKey: [["propertyShares", "receivedList"]] });
      queryClient.invalidateQueries({ queryKey: [["propertyShares", "listReceived"]] });
      queryClient.invalidateQueries({ queryKey: [["properties", "list"]] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteShare = trpc.propertyShares.deleteShare.useMutation({
    onSuccess: () => {
      toast.success("Compartilhamento excluído - O imóvel foi removido da sua lista");
      queryClient.invalidateQueries({ queryKey: ["propertyShares"] });
      queryClient.invalidateQueries({ queryKey: [["propertyShares", "receivedList"]] });
      queryClient.invalidateQueries({ queryKey: [["propertyShares", "listReceived"]] });
      queryClient.invalidateQueries({ queryKey: [["properties", "list"]] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const copyPartnerCode = () => {
    if (company?.partnerCode) {
      navigator.clipboard.writeText(company.partnerCode);
      toast.success("Código copiado para a área de transferência");
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "Sob consulta";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 whitespace-nowrap"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 whitespace-nowrap"><CheckCircle className="w-3 h-3 mr-1" /> Aceita</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 whitespace-nowrap"><XCircle className="w-3 h-3 mr-1" /> Rejeitada</Badge>;
      case "canceled":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 whitespace-nowrap"><AlertCircle className="w-3 h-3 mr-1" /> Cancelada</Badge>;
      case "revoked":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 whitespace-nowrap"><AlertCircle className="w-3 h-3 mr-1" /> Revogado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openPreview = (propertyId: number) => {
    setPreviewPropertyId(propertyId);
    setShowPreviewDialog(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parcerias</h1>
            <p className="text-gray-500 text-sm">Gerencie suas parcerias e compartilhe imóveis com outros corretores</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={acceptedPartnerships.length === 0} size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Compartilhar</span> Imóvel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Compartilhar Imóvel</DialogTitle>
                  <DialogDescription>
                    Selecione um imóvel e um parceiro para compartilhar
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Imóvel</Label>
                    <Select value={selectedPropertyId?.toString() || ""} onValueChange={(v) => setSelectedPropertyId(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um imóvel" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((p: any) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.code} - {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Parceiro</Label>
                    <Select value={selectedPartnerId?.toString() || ""} onValueChange={(v) => setSelectedPartnerId(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um parceiro" />
                      </SelectTrigger>
                      <SelectContent>
                        {acceptedPartnerships.map((p: any) => {
                          const isRequester = p.requesterId === company?.id;
                          const partnerId = isRequester ? p.partnerId : p.requesterId;
                          const partnerName = isRequester ? p.partnerName : p.requesterName;
                          return (
                            <SelectItem key={p.id} value={partnerId.toString()}>
                              {partnerName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => {
                      if (selectedPropertyId && selectedPartnerId) {
                        shareProperty.mutate({ propertyId: selectedPropertyId, partnerCompanyId: selectedPartnerId });
                      }
                    }}
                    disabled={!selectedPropertyId || !selectedPartnerId || shareProperty.isPending}
                  >
                    Compartilhar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nova Parceria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Solicitar Parceria</DialogTitle>
                  <DialogDescription>
                    Digite o código de parceiro do corretor para enviar uma solicitação
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Código do Parceiro</Label>
                    <Input
                      placeholder="ex: BRK123ABC"
                      value={partnerCode}
                      onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                    />
                    <p className="text-xs text-gray-500">
                      Solicite o código de parceiro ao corretor que deseja adicionar
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Compartilhar todos os imóveis</p>
                      <p className="text-xs text-gray-500">
                        Novos imóveis serão compartilhados automaticamente
                      </p>
                    </div>
                    <Switch checked={shareAll} onCheckedChange={setShareAll} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => requestPartnership.mutate({ partnerCode, shareAllProperties: shareAll })}
                    disabled={!partnerCode || requestPartnership.isPending}
                  >
                    Enviar Solicitação
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Meu código de parceiro */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">Meu Código de Parceiro</p>
                  <p className="text-xl sm:text-2xl font-mono font-bold text-blue-900">{company?.partnerCode || "Carregando..."}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={copyPartnerCode} className="border-blue-300 text-blue-700 hover:bg-blue-100 w-full sm:w-auto">
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Compartilhe este código com outros corretores para que eles possam solicitar parceria com você
            </p>
          </CardContent>
        </Card>

        {/* Notificações de pendências */}
        {(pendingPartnerships.length > 0 || pendingShares.length > 0) && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm">
                  Você tem {pendingPartnerships.length + pendingShares.length} solicitação(ões) pendente(s)
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="partnerships" className="space-y-4">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="partnerships" className="flex-1 min-w-[120px] text-xs sm:text-sm px-2 py-2">
              <Users className="w-4 h-4 mr-1 shrink-0" />
              <span className="truncate">Parcerias</span>
              {pendingPartnerships.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs px-1.5">{pendingPartnerships.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex-1 min-w-[120px] text-xs sm:text-sm px-2 py-2">
              <ArrowUpRight className="w-4 h-4 mr-1 shrink-0" />
              <span className="truncate">Compartilhados</span>
            </TabsTrigger>
            <TabsTrigger value="received" className="flex-1 min-w-[120px] text-xs sm:text-sm px-2 py-2">
              <ArrowDownLeft className="w-4 h-4 mr-1 shrink-0" />
              <span className="truncate">Recebidos</span>
              {pendingShares.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs px-1.5">{pendingShares.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 min-w-[120px] text-xs sm:text-sm px-2 py-2">
              <Clock className="w-4 h-4 mr-1 shrink-0" />
              <span className="truncate">Histórico</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="partnerships" className="space-y-4">
            {/* Solicitações Pendentes */}
            {pendingPartnerships.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Solicitações Pendentes</CardTitle>
                  <CardDescription>Parcerias aguardando sua aprovação</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingPartnerships.map((p: any) => (
                      <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-white gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{p.requesterName}</p>
                            <p className="text-sm text-gray-500 truncate">
                              Código: {p.requesterCode} • {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectPartnership.mutate({ id: p.id })}
                            disabled={rejectPartnership.isPending}
                            className="flex-1 sm:flex-none"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => acceptPartnership.mutate({ id: p.id })}
                            disabled={acceptPartnership.isPending}
                            className="flex-1 sm:flex-none"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aceitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Todas as Parcerias */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Minhas Parcerias</CardTitle>
                <CardDescription>Histórico de todas as parcerias</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPartnerships ? (
                  <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : partnerships.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma parceria ainda</p>
                    <p className="text-sm">Clique em "Nova Parceria" para começar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {partnerships.map((p: any) => {
                      const isRequester = p.requesterId === company?.id;
                      const partnerName = isRequester ? p.partnerName : p.requesterName;
                      const partnerCodeDisplay = isRequester ? p.partnerCode : p.requesterCode;
                      return (
                        <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-white gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{partnerName}</p>
                              <p className="text-sm text-gray-500 truncate">
                                Código: {partnerCodeDisplay} • {p.shareAllProperties ? "Auto" : "Manual"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {getStatusBadge(p.status)}
                            {p.status === "accepted" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelPartnership.mutate({ id: p.id })}
                                disabled={cancelPartnership.isPending}
                              >
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {/* Imóveis que eu compartilhei */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Imóveis que Compartilhei</CardTitle>
                <CardDescription>Imóveis que você compartilhou com parceiros</CardDescription>
              </CardHeader>
              <CardContent>
                {sentShares.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Share2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum imóvel compartilhado</p>
                    <p className="text-sm">Clique em "Compartilhar Imóvel" para começar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentShares.map((s: any) => (
                      <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-white gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Home className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{s.propertyCode} - {s.propertyTitle}</p>
                            <p className="text-sm text-gray-500 truncate">
                              Para: <span className="font-medium">{s.partnerName}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {getStatusBadge(s.status)}
                          {s.status === "accepted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => revokeShare.mutate({ id: s.id })}
                              disabled={revokeShare.isPending}
                            >
                              Revogar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            {/* Compartilhamentos Pendentes */}
            {pendingShares.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Imóveis Aguardando Aceitação</CardTitle>
                  <CardDescription>Imóveis compartilhados com você que precisam de aprovação</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingShares.map((s: any) => (
                      <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-white gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <Home className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{s.propertyCode} - {s.propertyTitle}</p>
                            <p className="text-sm text-gray-500 truncate">
                              De: <span className="font-medium">{s.ownerName}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPreview(s.propertyId)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectShare.mutate({ id: s.id })}
                            disabled={rejectShare.isPending}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => acceptShare.mutate({ id: s.id })}
                            disabled={acceptShare.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aceitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Imóveis recebidos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Imóveis Recebidos de Parceiros</CardTitle>
                <CardDescription>Imóveis que parceiros compartilharam com você</CardDescription>
              </CardHeader>
              <CardContent>
                {receivedShares.filter((s: any) => s.status === 'accepted' || s.status === 'inactive').length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Home className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum imóvel recebido</p>
                    <p className="text-sm">Imóveis aceitos de parceiros aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receivedShares.filter((s: any) => s.status === 'accepted' || s.status === 'inactive').map((s: any) => (
                      <div key={s.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3 ${s.status === 'inactive' ? 'bg-gray-50 border-gray-300 opacity-70' : s.isHighlight ? 'border-yellow-400 bg-yellow-50' : 'bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.status === 'inactive' ? 'bg-gray-200' : s.isHighlight ? 'bg-yellow-100' : 'bg-purple-100'}`}>
                            {s.status === 'inactive' ? <Power className="w-5 h-5 text-gray-500" /> : s.isHighlight ? <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" /> : <Home className="w-5 h-5 text-purple-600" />}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-medium truncate ${s.status === 'inactive' ? 'text-gray-500' : ''}`}>
                              {s.partnerPropertyCode || s.propertyCode} - {s.propertyTitle}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              De: <span className="font-medium">{s.ownerName}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {s.status === 'accepted' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleHighlight.mutate({ id: s.id })}
                              className={s.isHighlight ? 'border-yellow-400 text-yellow-700 hover:bg-yellow-100' : ''}
                              title={s.isHighlight ? 'Remover destaque' : 'Marcar como destaque'}
                            >
                              <Star className={`w-4 h-4 ${s.isHighlight ? 'fill-yellow-500' : ''}`} />
                              <span className="ml-1 hidden sm:inline">{s.isHighlight ? 'Destaque' : 'Destacar'}</span>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStatus.mutate({ id: s.id })}
                            className={s.status === 'inactive' ? 'border-green-400 text-green-700 hover:bg-green-100' : 'border-orange-400 text-orange-700 hover:bg-orange-100'}
                            title={s.status === 'inactive' ? 'Ativar imóvel' : 'Inativar imóvel'}
                          >
                            <Power className="w-4 h-4" />
                            <span className="ml-1 hidden sm:inline">{s.status === 'inactive' ? 'Ativar' : 'Inativar'}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir este compartilhamento? Esta ação não pode ser desfeita.')) {
                                deleteShare.mutate({ id: s.id });
                              }
                            }}
                            className="border-red-400 text-red-700 hover:bg-red-100"
                            title="Excluir compartilhamento"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="ml-1 hidden sm:inline">Excluir</span>
                          </Button>
                          <Badge variant="outline" className={`whitespace-nowrap shrink-0 ${s.status === 'inactive' ? 'bg-gray-50 text-gray-600 border-gray-300' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            {s.status === 'inactive' ? <><Power className="w-3 h-3 mr-1" /> Inativo</> : <><CheckCircle className="w-3 h-3 mr-1" /> Ativo</>}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Histórico de Atividades */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Histórico de Atividades</CardTitle>
                <CardDescription>Registro de ações relacionadas às suas parcerias</CardDescription>
              </CardHeader>
              <CardContent>
                {activityLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma atividade registrada</p>
                    <p className="text-sm">As ações de parcerias aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activityLogs.map((log: any) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          log.action === 'partnership_requested' ? 'bg-blue-100' :
                          log.action === 'partnership_accepted' ? 'bg-green-100' :
                          log.action === 'property_shared' ? 'bg-purple-100' :
                          log.action === 'property_share_accepted' ? 'bg-emerald-100' :
                          'bg-gray-100'
                        }`}>
                          {log.action === 'partnership_requested' && <UserPlus className="w-4 h-4 text-blue-600" />}
                          {log.action === 'partnership_accepted' && <Check className="w-4 h-4 text-green-600" />}
                          {log.action === 'property_shared' && <Share2 className="w-4 h-4 text-purple-600" />}
                          {log.action === 'property_share_accepted' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {log.action === 'partnership_requested' && 'Solicitação de parceria enviada'}
                            {log.action === 'partnership_accepted' && 'Parceria aceita'}
                            {log.action === 'property_shared' && 'Imóvel compartilhado'}
                            {log.action === 'property_share_accepted' && 'Compartilhamento aceito'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.details?.partnerName && `Parceiro: ${log.details.partnerName}`}
                            {log.details?.propertyTitle && ` | Imóvel: ${log.details.propertyTitle}`}
                            {log.details?.partnerPropertyCode && ` | Código: ${log.details.partnerPropertyCode}`}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(log.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Preview do Imóvel */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Visualizar Imóvel</DialogTitle>
              <DialogDescription>
                Confira os detalhes do imóvel antes de aceitar o compartilhamento
              </DialogDescription>
            </DialogHeader>
            {previewProperty ? (
              <div className="space-y-4">
                {/* Imagem principal */}
                {(previewProperty as any).mainImageUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={(previewProperty as any).mainImageUrl} 
                      alt={previewProperty.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Informações básicas */}
                <div>
                  <h3 className="text-xl font-bold">{previewProperty.title}</h3>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {formatPrice(Number(previewProperty.salePrice || previewProperty.rentPrice))}
                    {previewProperty.purpose === 'aluguel' && <span className="text-sm font-normal text-gray-500">/mês</span>}
                  </p>
                </div>

                {/* Localização */}
                {(previewProperty.neighborhood || previewProperty.city) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {[previewProperty.neighborhood, previewProperty.city, previewProperty.state].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                {/* Características */}
                <div className="flex flex-wrap gap-4 py-3 border-y">
                  {previewProperty.bedrooms && (
                    <div className="flex items-center gap-2">
                      <BedDouble className="w-5 h-5 text-gray-500" />
                      <span>{previewProperty.bedrooms} quartos</span>
                    </div>
                  )}
                  {previewProperty.bathrooms && (
                    <div className="flex items-center gap-2">
                      <Bath className="w-5 h-5 text-gray-500" />
                      <span>{previewProperty.bathrooms} banheiros</span>
                    </div>
                  )}
                  {previewProperty.parkingSpaces && (
                    <div className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-gray-500" />
                      <span>{previewProperty.parkingSpaces} vagas</span>
                    </div>
                  )}
                  {previewProperty.totalArea && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">m²</span>
                      <span>{previewProperty.totalArea} m²</span>
                    </div>
                  )}
                </div>

                {/* Descrição */}
                {previewProperty.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Descrição</h4>
                    <p className="text-gray-600 text-sm whitespace-pre-line line-clamp-4">
                      {previewProperty.description}
                    </p>
                  </div>
                )}

                {/* Informação do parceiro */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Proprietário do anúncio:</strong> {pendingShares.find((s: any) => s.propertyId === previewPropertyId)?.ownerName}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Ao aceitar, este imóvel aparecerá na sua listagem de imóveis e no seu site público.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                Fechar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const share = pendingShares.find((s: any) => s.propertyId === previewPropertyId);
                  if (share) rejectShare.mutate({ id: share.id });
                }}
                disabled={rejectShare.isPending}
              >
                <X className="w-4 h-4 mr-1" />
                Rejeitar
              </Button>
              <Button
                onClick={() => {
                  const share = pendingShares.find((s: any) => s.propertyId === previewPropertyId);
                  if (share) acceptShare.mutate({ id: share.id });
                }}
                disabled={acceptShare.isPending}
              >
                <Check className="w-4 h-4 mr-1" />
                Aceitar Imóvel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
