import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface DNSPropagationStatusProps {
  domain: string;
  onStatusChange?: (status: string) => void;
}

export function DNSPropagationStatus({ domain, onStatusChange }: DNSPropagationStatusProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { data: propagation, isLoading, refetch, isFetching } = trpc.siteSettings.checkDNSPropagation.useQuery(
    undefined,
    {
      enabled: !!domain,
      refetchInterval: autoRefresh ? 30000 : false,
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

  // Se o domínio está ativo, mostra mensagem de sucesso
  if (propagation.status === "active") {
    return (
      <Card className="border-green-300 bg-green-50 border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800">
                  Domínio Configurado com Sucesso!
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  Seu site está funcionando corretamente em <strong>https://{domain}</strong>
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-green-300 text-green-700 hover:bg-green-100"
              onClick={() => window.open(`https://${domain}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Acessar Site
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se ainda está em propagação ou configuração, mostra mensagem de aguardando
  return (
    <Card className="border-amber-300 bg-amber-50 border-2">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-800">
                Aguardando Configuração do Domínio
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                O domínio <strong>{domain}</strong> está sendo configurado. Isso pode levar de 15 minutos até 48 horas.
              </p>
              {propagation.nameServers && propagation.nameServers.length > 0 && (
                <p className="text-xs text-amber-600 mt-2">
                  Certifique-se de que os nameservers estão configurados corretamente no seu registrador.
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
