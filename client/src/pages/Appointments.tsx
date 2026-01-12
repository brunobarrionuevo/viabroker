import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calendar, Plus, Clock, MapPin, User } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusOptions = [
  { value: "agendado", label: "Agendado", color: "bg-blue-100 text-blue-700" },
  { value: "confirmado", label: "Confirmado", color: "bg-green-100 text-green-700" },
  { value: "realizado", label: "Realizado", color: "bg-gray-100 text-gray-700" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-700" },
  { value: "reagendado", label: "Reagendado", color: "bg-yellow-100 text-yellow-700" },
];

export default function Appointments() {
  const { data: appointments, isLoading } = trpc.appointments.list.useQuery({});

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(s => s.value === status);
    return option ? (
      <Badge variant="secondary" className={option.color}>
        {option.label}
      </Badge>
    ) : null;
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatTime = (date: Date) => {
    return format(new Date(date), "HH:mm", { locale: ptBR });
  };

  // Agrupar por data
  const groupedAppointments = appointments?.reduce((acc, appointment) => {
    const dateKey = format(new Date(appointment.scheduledAt), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(appointment);
    return acc;
  }, {} as Record<string, typeof appointments>);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Agenda</h1>
            <p className="text-muted-foreground">Gerencie suas visitas e compromissos</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/appointments/new">
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Link>
          </Button>
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Card>
                  <CardContent className="py-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : groupedAppointments && Object.keys(groupedAppointments).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedAppointments)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([dateKey, dayAppointments]) => (
                <div key={dateKey}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                    {formatDate(new Date(dateKey))}
                  </h3>
                  <div className="space-y-3">
                    {dayAppointments?.map((appointment) => (
                      <Link key={appointment.id} href={`/dashboard/appointments/${appointment.id}`}>
                        <Card className="hover:border-primary transition-colors cursor-pointer">
                          <CardContent className="py-4">
                            <div className="flex items-start gap-4">
                              <div className="w-16 text-center">
                                <div className="text-2xl font-bold text-primary">
                                  {formatTime(appointment.scheduledAt)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {appointment.duration} min
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-semibold">{appointment.title}</h4>
                                  {getStatusBadge(appointment.status)}
                                </div>
                                {appointment.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                    {appointment.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  {appointment.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {appointment.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum agendamento</h3>
              <p className="text-muted-foreground mb-4">
                Comece agendando sua primeira visita
              </p>
              <Button asChild>
                <Link href="/dashboard/appointments/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Agendar Visita
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
