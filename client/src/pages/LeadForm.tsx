import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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

const stageOptions = [
  { value: "novo", label: "Novo" },
  { value: "contato_inicial", label: "Contato Inicial" },
  { value: "qualificado", label: "Qualificado" },
  { value: "visita_agendada", label: "Visita Agendada" },
  { value: "proposta", label: "Proposta" },
  { value: "negociacao", label: "Negociação" },
  { value: "fechado_ganho", label: "Fechado (Ganho)" },
  { value: "fechado_perdido", label: "Fechado (Perdido)" },
];

const interestOptions = [
  { value: "compra", label: "Compra" },
  { value: "aluguel", label: "Aluguel" },
  { value: "investimento", label: "Investimento" },
  { value: "outro", label: "Outro" },
];

export default function LeadForm() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const isEditing = !!params.id;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    source: "site" as const,
    sourceDetail: "",
    interestType: "" as "compra" | "aluguel" | "investimento" | "outro" | "",
    budget: "",
    message: "",
    notes: "",
    stage: "novo" as const,
  });

  const { data: lead, isLoading: loadingLead } = trpc.leads.get.useQuery(
    { id: Number(params.id) },
    { enabled: isEditing }
  );

  const createMutation = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Lead adicionado com sucesso!");
      navigate("/dashboard/leads");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar lead");
    },
  });

  const updateMutation = trpc.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Lead atualizado com sucesso!");
      navigate("/dashboard/leads");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar lead");
    },
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name,
        email: lead.email || "",
        phone: lead.phone || "",
        whatsapp: lead.whatsapp || "",
        source: lead.source as any,
        sourceDetail: lead.sourceDetail || "",
        interestType: (lead.interestType as any) || "",
        budget: lead.budget || "",
        message: lead.message || "",
        notes: lead.notes || "",
        stage: lead.stage as any,
      });
    }
  }, [lead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      interestType: formData.interestType || undefined,
    };
    
    if (isEditing) {
      updateMutation.mutate({ id: Number(params.id), ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingLead) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" asChild>
            <Link href="/dashboard/leads">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Editar Lead" : "Novo Lead"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Atualize as informações do lead" : "Adicione um novo contato"}
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Lead</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="source">Origem *</Label>
                <Select value={formData.source} onValueChange={(v) => setFormData(prev => ({ ...prev, source: v as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sourceDetail">Detalhe da Origem</Label>
                <Input
                  id="sourceDetail"
                  value={formData.sourceDetail}
                  onChange={(e) => setFormData(prev => ({ ...prev, sourceDetail: e.target.value }))}
                  placeholder="Ex: Campanha X, Portal Y"
                />
              </div>
              {isEditing && (
                <div>
                  <Label htmlFor="stage">Estágio</Label>
                  <Select value={formData.stage} onValueChange={(v) => setFormData(prev => ({ ...prev, stage: v as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stageOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor="interestType">Interesse</Label>
                <Select value={formData.interestType || "none"} onValueChange={(v) => setFormData(prev => ({ ...prev, interestType: v === "none" ? "" : v as any }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não informado</SelectItem>
                    {interestOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="budget">Orçamento</Label>
                <Input
                  id="budget"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="message">Mensagem Inicial</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Mensagem enviada pelo lead..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="notes">Observações Internas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Anotações sobre o lead..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? "Salvar Alterações" : "Adicionar Lead"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/leads">Cancelar</Link>
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
