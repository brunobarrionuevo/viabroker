import { useEffect, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const verifyMutation = trpc.customAuth.verifyEmail.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(data.message);
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error.message);
    },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    } else {
      setStatus("error");
      setMessage("Token de verificação não encontrado.");
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2">
              <img src="/viabroker-logo.png" alt="Viabroker" className="h-10 w-10" />
              <span className="text-2xl font-bold text-blue-900">Viabroker</span>
            </div>
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            {status === "loading" && (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Verificando seu email...</h2>
                <p className="text-gray-600">Aguarde um momento</p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Email verificado!</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-green-800">
                    🎉 Seu período de teste gratuito de <strong>7 dias</strong> começou! 
                    Aproveite todos os recursos da plataforma.
                  </p>
                </div>
                <Link href="/login">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Fazer Login
                  </Button>
                </Link>
              </>
            )}

            {status === "error" && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Erro na verificação</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="space-y-3">
                  <Link href="/reenviar-verificacao">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <Mail className="mr-2 h-4 w-4" />
                      Solicitar novo link
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      Voltar para o Login
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
