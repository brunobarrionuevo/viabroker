import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertTriangle, Crown, X } from "lucide-react";
import { useState } from "react";

export default function TrialBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { data: trialStatus, isLoading } = trpc.customAuth.getTrialStatus.useQuery();

  if (isLoading || dismissed) return null;
  
  // Se tem assinatura ativa, não mostra nada
  if (trialStatus?.hasActiveSubscription) return null;
  
  // Se trial expirou
  if (trialStatus?.isTrialExpired || trialStatus?.needsSubscription) {
    return (
      <Alert className="bg-red-50 border-red-200 mb-4">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="flex items-center justify-between w-full">
          <span className="text-red-800">
            <strong>Seu período de teste expirou.</strong> Escolha um plano para continuar usando a plataforma.
          </span>
          <Link href="/planos">
            <Button size="sm" className="bg-red-600 hover:bg-red-700 ml-4">
              <Crown className="h-4 w-4 mr-2" />
              Ver Planos
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // Se trial está ativo
  if (trialStatus?.isTrialActive && trialStatus.daysLeft !== undefined) {
    const isUrgent = trialStatus.daysLeft <= 3;
    
    return (
      <Alert className={`${isUrgent ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"} mb-4`}>
        <Clock className={`h-4 w-4 ${isUrgent ? "text-amber-600" : "text-blue-600"}`} />
        <AlertDescription className="flex items-center justify-between w-full">
          <span className={isUrgent ? "text-amber-800" : "text-blue-800"}>
            {isUrgent ? (
              <>
                <strong>Restam apenas {trialStatus.daysLeft} dia{trialStatus.daysLeft !== 1 ? "s" : ""} de teste!</strong> Assine agora para não perder acesso.
              </>
            ) : (
              <>
                Você está no período de teste gratuito. <strong>{trialStatus.daysLeft} dias restantes.</strong>
              </>
            )}
          </span>
          <div className="flex items-center gap-2 ml-4">
            <Link href="/planos">
              <Button size="sm" variant={isUrgent ? "default" : "outline"} className={isUrgent ? "bg-amber-600 hover:bg-amber-700" : ""}>
                Ver Planos
              </Button>
            </Link>
            {!isUrgent && (
              <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
