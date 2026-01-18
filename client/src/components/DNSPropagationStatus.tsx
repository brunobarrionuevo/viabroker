import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  Clock,
  Globe,
  Loader2,
  RefreshCw,
  Server,
  Shield,
  Wifi,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DNSPropagationStatusProps {
  domain: string;
  onStatusChange?: (status: string) => void;
}

interface Step {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

export function DNSPropagationStatus({ domain, onStatusChange }: DNSPropagationStatusProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { data: propagation, isLoading, refetch, isFetching } = trpc.siteSettings.checkDNSPropagation.useQuery(
    undefined,
    {
      enabled: !!domain,
      refetchInterval: autoRefresh ? 30000 : false, // Atualiza a cada 30 segundos se autoRefresh ativo
      staleTime: 10000,
    }
  );

  useEffect(() => {
    if (propagation?.status && onStatusChange) {
      onStatusChange(propagation.status);
    }
    
    // Desativar auto-refresh quando domínio estiver ativo
    if (propagation?.status === "active") {
      setAutoRefresh(false);
    }
  }, [propagation?.status, onStatusChange]);

  if (!domain) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-blue-700">Verificando status do domínio...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!propagation) {
    return null;
  }

  const steps: Step[] = [
    {
      key: "zoneCreated",
      label: "Zona DNS Criada",
      description: "Zona DNS configurada no Cloudflare",
      icon: <Server className="h-4 w-4" />,
      completed: propagation.steps?.zoneCreated || false,
    },
    {
      key: "dnsRecordsCreated",
      label: "Registros DNS",
      description: "Registros CNAME configurados",
      icon: <Globe className="h-4 w-4" />,
      completed: propagation.steps?.dnsRecordsCreated || false,
    },
    {
      key: "workerRouteActive",
      label: "Rota do Worker",
      description: "Proxy reverso configurado",
      icon: <Wifi className="h-4 w-4" />,
      completed: propagation.steps?.workerRouteActive || false,
    },
    {
      key: "nameserversConfigured",
      label: "Nameservers",
      description: "Nameservers apontando para Cloudflare",
      icon: <Server className="h-4 w-4" />,
      completed: propagation.steps?.nameserversConfigured || false,
    },
    {
      key: "sslActive",
      label: "Certificado SSL",
      description: "HTTPS ativo e funcionando",
      icon: <Shield className="h-4 w-4" />,
      completed: propagation.steps?.sslActive || false,
    },
    {
      key: "domainReachable",
      label: "Domínio Acessível",
      description: "Site respondendo corretamente",
      icon: <CheckCircle2 className="h-4 w-4" />,
      completed: propagation.steps?.domainReachable || false,
    },
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  const getStatusConfig = () => {
    switch (propagation.status) {
      case "active":
        return {
          color: "green",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-700",
          icon: <CheckCircle2 className="h-6 w-6 text-green-500" />,
          badge: <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>,
          title: "Domínio Totalmente Configurado!",
        };
      case "propagating":
        return {
          color: "yellow",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-700",
          icon: <Clock className="h-6 w-6 text-yellow-500 animate-pulse" />,
          badge: <Badge className="bg-yellow-500 hover:bg-yellow-600">Propagando</Badge>,
          title: "DNS em Propagação",
        };
      case "configuring":
        return {
          color: "blue",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-700",
          icon: <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />,
          badge: <Badge className="bg-blue-500 hover:bg-blue-600">Configurando</Badge>,
          title: "Aguardando Configuração",
        };
      case "not_configured":
        return {
          color: "gray",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-700",
          icon: <Circle className="h-6 w-6 text-gray-400" />,
          badge: <Badge variant="secondary">Não Configurado</Badge>,
          title: "Domínio Não Configurado",
        };
      case "error":
      default:
        return {
          color: "red",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-700",
          icon: <XCircle className="h-6 w-6 text-red-500" />,
          badge: <Badge variant="destructive">Erro</Badge>,
          title: "Erro na Configuração",
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Card className={cn(statusConfig.bgColor, statusConfig.borderColor, "border-2")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusConfig.icon}
            <div>
              <CardTitle className={cn("text-lg", statusConfig.textColor)}>
                {statusConfig.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {propagation.message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusConfig.badge}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="ml-2"
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso da configuração</span>
            <span className={statusConfig.textColor}>{completedSteps} de {steps.length} etapas</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Lista de etapas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {steps.map((step) => (
            <div
              key={step.key}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border",
                step.completed
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-gray-200"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-full",
                  step.completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                )}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  step.icon
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-xs font-medium truncate",
                    step.completed ? "text-green-700" : "text-gray-600"
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tempo estimado */}
        {propagation.estimatedTime && propagation.status !== "active" && (
          <div className="flex items-center gap-2 p-3 bg-white/50 rounded-lg border border-dashed">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {propagation.estimatedTime}
            </span>
          </div>
        )}

        {/* Nameservers */}
        {propagation.nameServers && propagation.nameServers.length > 0 && !propagation.steps?.nameserversConfigured && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Configure os nameservers no seu registrador:
                </p>
                <div className="mt-2 space-y-1">
                  {propagation.nameServers.map((ns, i) => (
                    <code
                      key={i}
                      className="block text-xs bg-amber-100 px-2 py-1 rounded text-amber-900"
                    >
                      {ns}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-refresh indicator */}
        {autoRefresh && propagation.status !== "active" && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Atualizando automaticamente a cada 30 segundos</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
