import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "../lib/trpc";
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
import { Users, UserPlus, Check, X, Share2, Building2, Home, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function Partnerships() {
  const queryClient = useQueryClient();
  const [partnerSlug, setPartnerSlug] = useState("");
  const [shareAll, setShareAll] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);

  // Queries
  const { data: partnerships = [], isLoading: loadingPartnerships } = trpc.partnerships.list.useQuery();

  const { data: pendingPartnerships = [] } = trpc.partnerships.pending.useQuery();
  const { data: acceptedPartnerships = [] } = trpc.partnerships.accepted.useQuery();
  const { data: sentShares = [] } = trpc.propertyShares.sentList.useQuery();
  const { data: receivedShares = [] } = trpc.propertyShares.receivedList.useQuery();
  const { data: pendingShares = [] } = trpc.propertyShares.pending.useQuery();
  const { data: properties = [] } = trpc.properties.list.useQuery({});

  // Mutations
  const requestPartnership = trpc.partnerships.request.useMutation({
    onSuccess: () => {
      toast.success("Solicitação enviada - Aguardando aprovação do parceiro");
      queryClient.invalidateQueries({ queryKey: ["partnerships"] });
      setShowRequestDialog(false);
      setPartnerSlug("");
      setShareAll(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const acceptPartnership = trpc.partnerships.accept.useMutation({
    onSuccess: () => {
      toast.success("Parceria aceita - Vocês agora são parceiros!");
      queryClient.invalidateQueries({ queryKey: ["partnerships"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const rejectPartnership = trpc.partnerships.reject.useMutation({
    onSuccess: () => {
      toast.success("Parceria rejeitada");
      queryClient.invalidateQueries({ queryKey: ["partnerships"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const cancelPartnership = trpc.partnerships.cancel.useMutation({
    onSuccess: () => {
      toast.success("Parceria cancelada");
      queryClient.invalidateQueries({ queryKey: ["partnerships"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const shareProperty = trpc.propertyShares.share.useMutation({
    onSuccess: () => {
      toast.success("Imóvel compartilhado - Aguardando aceitação do parceiro");
      queryClient.invalidateQueries({ queryKey: ["propertyShares"] });
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
      toast.success("Compartilhamento aceito - O imóvel agora aparece no seu site");
      queryClient.invalidateQueries({ queryKey: ["propertyShares"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const rejectShare = trpc.propertyShares.reject.useMutation({
    onSuccess: () => {
      toast.success("Compartilhamento rejeitado");
      queryClient.invalidateQueries({ queryKey: ["propertyShares"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const revokeShare = trpc.propertyShares.revoke.useMutation({
    onSuccess: () => {
      toast.success("Compartilhamento revogado");
      queryClient.invalidateQueries({ queryKey: ["propertyShares"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Aceita</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Rejeitada</Badge>;
      case "canceled":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><AlertCircle className="w-3 h-3 mr-1" /> Cancelada</Badge>;
      case "revoked":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><AlertCircle className="w-3 h-3 mr-1" /> Revogado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parcerias</h1>
          <p className="text-gray-500">Gerencie suas parcerias e compartilhe imóveis com outros corretores</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={acceptedPartnerships.length === 0}>
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar Imóvel
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
                        const partnerId = p.requesterId === properties[0]?.companyId ? p.partnerId : p.requesterId;
                        return (
                          <SelectItem key={p.id} value={partnerId.toString()}>
                            Parceiro #{partnerId}
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
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Nova Parceria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar Parceria</DialogTitle>
                <DialogDescription>
                  Digite o slug do corretor para enviar uma solicitação de parceria
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Slug do Corretor</Label>
                  <Input
                    placeholder="ex: joao-silva"
                    value={partnerSlug}
                    onChange={(e) => setPartnerSlug(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    O slug é a parte final da URL do site do corretor (ex: /site/joao-silva)
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compartilhar todos os imóveis</Label>
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
                  onClick={() => requestPartnership.mutate({ partnerSlug, shareAllProperties: shareAll })}
                  disabled={!partnerSlug || requestPartnership.isPending}
                >
                  Enviar Solicitação
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Notificações de pendências */}
      {(pendingPartnerships.length > 0 || pendingShares.length > 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">
                Você tem {pendingPartnerships.length + pendingShares.length} solicitação(ões) pendente(s)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="partnerships" className="space-y-4">
        <TabsList>
          <TabsTrigger value="partnerships" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Parcerias
            {pendingPartnerships.length > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingPartnerships.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Imóveis Compartilhados
            {pendingShares.length > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingShares.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="partnerships" className="space-y-4">
          {/* Solicitações Pendentes */}
          {pendingPartnerships.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Solicitações Pendentes</CardTitle>
                <CardDescription>Parcerias aguardando sua aprovação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingPartnerships.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Corretor #{p.requesterId}</p>
                          <p className="text-sm text-gray-500">
                            Solicitou parceria em {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectPartnership.mutate(p.id)}
                          disabled={rejectPartnership.isPending}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => acceptPartnership.mutate(p.id)}
                          disabled={acceptPartnership.isPending}
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
            <CardHeader>
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
                  {partnerships.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            Corretor #{p.requesterId === properties[0]?.companyId ? p.partnerId : p.requesterId}
                          </p>
                          <p className="text-sm text-gray-500">
                            {p.shareAllProperties ? "Compartilhamento automático" : "Compartilhamento manual"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(p.status)}
                        {p.status === "accepted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelPartnership.mutate(p.id)}
                            disabled={cancelPartnership.isPending}
                          >
                            Cancelar
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

        <TabsContent value="shared" className="space-y-4">
          {/* Compartilhamentos Pendentes */}
          {pendingShares.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Imóveis Aguardando Aceitação</CardTitle>
                <CardDescription>Imóveis compartilhados com você que precisam de aprovação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingShares.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Home className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Imóvel #{s.propertyId}</p>
                          <p className="text-sm text-gray-500">
                            Compartilhado por Corretor #{s.ownerCompanyId}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectShare.mutate(s.id)}
                          disabled={rejectShare.isPending}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => acceptShare.mutate(s.id)}
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

          {/* Imóveis que eu compartilhei */}
          <Card>
            <CardHeader>
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
                    <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Home className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Imóvel #{s.propertyId}</p>
                          <p className="text-sm text-gray-500">
                            Compartilhado com Corretor #{s.partnerCompanyId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(s.status)}
                        {s.status === "accepted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => revokeShare.mutate(s.id)}
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

          {/* Imóveis recebidos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Imóveis Recebidos de Parceiros</CardTitle>
              <CardDescription>Imóveis que parceiros compartilharam com você</CardDescription>
            </CardHeader>
            <CardContent>
              {receivedShares.filter((s: any) => s.status === 'accepted').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Home className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum imóvel recebido</p>
                  <p className="text-sm">Imóveis aceitos de parceiros aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receivedShares.filter((s: any) => s.status === 'accepted').map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Home className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {s.partnerPropertyCode || `Imóvel #${s.propertyId}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            De Corretor #{s.ownerCompanyId}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" /> Ativo no seu site
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
