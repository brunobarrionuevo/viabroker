import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ResendVerification() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const resendMutation = trpc.customAuth.resendVerification.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success("Email enviado! Verifique sua caixa de entrada.");
    },
    onError: (error: { message: string }) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Digite seu email");
      return;
    }
    resendMutation.mutate({ email });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email Enviado!</CardTitle>
            <CardDescription>
              Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link de verificação em instantes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-2">Não recebeu o email?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Verifique sua pasta de spam/lixo eletrônico</li>
                <li>Aguarde alguns minutos e tente novamente</li>
                <li>Certifique-se de que digitou o email correto</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsSubmitted(false)}
                className="w-full"
              >
                Tentar outro email
              </Button>
              <Button asChild className="w-full">
                <Link href="/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary">
            <img src="/brokvia-logo.png" alt="Brokvia" className="h-8 w-8" />
            Brokvia
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Reenviar Email de Verificação</CardTitle>
            <CardDescription>
              Digite seu email para receber um novo link de verificação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={resendMutation.isPending}
              >
                {resendMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Link de Verificação
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <Link href="/login" className="text-primary hover:underline">
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Voltar para Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
