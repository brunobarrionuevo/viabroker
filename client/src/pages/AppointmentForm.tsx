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
import { format } from "date-fns";

const statusOptions = [
  { value: "agendado", label: "Agendado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "realizado", label: "Realizado" },
  { value: "cancelado", label: "Cancelado" },
  { value: "reagendado", label: "Reagendado" },
];

const durationOptions = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h 30min" },
  { value: 120, label: "2 horas" },
];

export default function AppointmentForm() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const isEditing = !!params.id;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "10:00",
    duration: 60,
    location: "",
    notes: "",
    status: "agendado" as const,
  });

  const { data: appointment, isLoading: loadingAppointment } = trpc.appointments.get.useQuery(
    { id: Number(params.id) },
    { enabled: isEditing }
  );

  const createMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("Agendamento criado com sucesso!");
      navigate("/dashboard/appointments");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar agendamento");
    },
  });

  const updateMutation = trpc.appointments.update.useMutation({
    onSuccess: () => {
      toast.success("Agendamento atualizado com sucesso!");
      navigate("/dashboard/appointments");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar agendamento");
    },
  });

  useEffect(() => {
    if (appointment) {
      const scheduledAt = new Date(appointment.scheduledAt);
      setFormData({
        title: appointment.title,
        description: appointment.description || "",
        date: format(scheduledAt, "yyyy-MM-dd"),
        time: format(scheduledAt, "HH:mm"),
        duration: appointment.duration,
        location: appointment.location || "",
        notes: appointment.notes || "",
        status: appointment.status as any,
      });
    }
  }, [appointment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const scheduledAt = new Date(`${formData.date}T${formData.time}`);
    
    const data = {
      title: formData.title,
      description: formData.description || undefined,
      scheduledAt,
      duration: formData.duration,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
    };
    
    if (isEditing) {
      updateMutation.mutate({ 
        id: Number(params.id), 
        ...data,
        status: formData.status as any,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingAppointment) {
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
            <Link href="/dashboard/appointments">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Editar Agendamento" : "Novo Agendamento"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Atualize as informações do agendamento" : "Agende uma nova visita ou compromisso"}
            </p>
          </div>
        </div>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Visita ao apartamento"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes sobre o agendamento..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">Horário *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration">Duração</Label>
                <Select 
                  value={String(formData.duration)} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, duration: Number(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Endereço ou local do encontro"
              />
            </div>
            {isEditing && (
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Anotações internas..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? "Salvar Alterações" : "Criar Agendamento"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/appointments">Cancelar</Link>
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
