import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Eye, EyeOff, Mail, Lock, User, Building2, Phone, 
  Loader2, AlertCircle, CheckCircle, Gift, Shield, Zap 
} from "lucide-react";
import { toast } from "sonner";
import { isValidCPF, isValidCNPJ } from "@/lib/formatters";

export default function Register() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    companyName: "",
    personType: "fisica" as "fisica" | "juridica",
    cpf: "",
    cnpj: "",
    creci: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [cpfCnpjError, setCpfCnpjError] = useState("");
  const [success, setSuccess] = useState(false);

  const registerMutation = trpc.customAuth.register.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Conta criada! Verifique seu email para ativar.");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const validateStep1 = () => {
    if (!formData.name || formData.name.length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres");
      return false;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Email inválido");
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      setError("Senha deve ter pelo menos 8 caracteres");
      return false;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError("Senha deve conter pelo menos 1 letra maiúscula (A-Z)");
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError("Senha deve conter pelo menos 1 caractere especial (!@#$%^&*(),.?\":{}|<>)");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return false;
    }
    return true;
  };

  // Funções auxiliares para verificar requisitos de senha
  const hasMinLength = formData.password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(formData.password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

  const validateStep2 = () => {
    if (!formData.companyName || formData.companyName.length < 2) {
      setError("Nome da empresa/corretor deve ter pelo menos 2 caracteres");
      return false;
    }
    
    // Validação obrigatória de CPF ou CNPJ
    if (formData.personType === "fisica") {
      if (!formData.cpf || formData.cpf.replace(/\D/g, "").length < 11) {
        setCpfCnpjError("CPF é obrigatório. Digite os 11 dígitos.");
        return false;
      }
      if (!isValidCPF(formData.cpf)) {
        setCpfCnpjError("CPF inválido. Verifique os números digitados.");
        return false;
      }
    } else {
      if (!formData.cnpj || formData.cnpj.replace(/\D/g, "").length < 14) {
        setCpfCnpjError("CNPJ é obrigatório. Digite os 14 dígitos.");
        return false;
      }
      if (!isValidCNPJ(formData.cnpj)) {
        setCpfCnpjError("CNPJ inválido. Verifique os números digitados.");
        return false;
      }
    }
    
    setCpfCnpjError("");
    return true;
  };

  const handleNextStep = () => {
    setError("");
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!validateStep2()) return;

    registerMutation.mutate({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone || undefined,
      companyName: formData.companyName,
      personType: formData.personType,
      cpf: formData.personType === "fisica" ? formData.cpf || undefined : undefined,
      cnpj: formData.personType === "juridica" ? formData.cnpj || undefined : undefined,
      creci: formData.creci || undefined,
    });
  };

  const handleGoogleSignup = () => {
    window.location.href = "/api/auth/google";
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Conta criada com sucesso!</h2>
            <p className="text-gray-600 mb-6">
              Enviamos um link de confirmação para <strong>{formData.email}</strong>. 
              Verifique sua caixa de entrada e spam.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                Após confirmar seu email, você terá acesso a <strong>7 dias de teste grátis</strong> com todos os recursos da plataforma.
              </p>
            </div>
            <Link href="/login">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Ir para o Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/">
            <div className="inline-flex flex-col items-center gap-2">
              <img 
                src="/images/viabroker-logo-full-transparent.png" 
                alt="Viabroker" 
                className="h-12 w-auto"
              />
            </div>
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Criar conta grátis</CardTitle>
            <CardDescription className="text-center">
              {step === 1 ? "Dados de acesso" : "Dados da empresa/corretor"}
            </CardDescription>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? "bg-blue-600" : "bg-gray-200"}`} />
              <div className={`w-12 h-1 ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`} />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      placeholder="Seu nome completo"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Indicadores de requisitos de senha */}
                  {formData.password && (
                    <div className="space-y-1.5 text-xs mt-2">
                      <div className={`flex items-center gap-2 ${hasMinLength ? "text-green-600" : "text-gray-500"}`}>
                        {hasMinLength ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
                        )}
                        <span>Mínimo 8 caracteres</span>
                      </div>
                      <div className={`flex items-center gap-2 ${hasUpperCase ? "text-green-600" : "text-gray-500"}`}>
                        {hasUpperCase ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
                        )}
                        <span>Pelo menos 1 letra maiúscula (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-2 ${hasSpecialChar ? "text-green-600" : "text-gray-500"}`}>
                        {hasSpecialChar ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
                        )}
                        <span>Pelo menos 1 caractere especial (!@#$%^&*)</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Digite a senha novamente"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`pl-10 pr-10 ${
                        formData.confirmPassword && formData.password === formData.confirmPassword
                          ? "border-green-500 focus-visible:ring-green-500"
                          : formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleNextStep}
                >
                  Continuar
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Imobiliária ou Corretor</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="companyName"
                      name="companyName"
                      placeholder="Nome que aparecerá no seu site"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de pessoa</Label>
                  <RadioGroup
                    value={formData.personType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, personType: value as "fisica" | "juridica" }))}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fisica" id="fisica" />
                      <Label htmlFor="fisica" className="cursor-pointer">Pessoa Física (CPF)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="juridica" id="juridica" />
                      <Label htmlFor="juridica" className="cursor-pointer">Pessoa Jurídica (CNPJ)</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.personType === "fisica" ? (
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, cpf: formatCPF(e.target.value) }));
                        setCpfCnpjError("");
                      }}
                      maxLength={14}
                      className={cpfCnpjError ? "border-red-500" : ""}
                      required
                    />
                    {cpfCnpjError && formData.personType === "fisica" && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {cpfCnpjError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      name="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={formData.cnpj}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, cnpj: formatCNPJ(e.target.value) }));
                        setCpfCnpjError("");
                      }}
                      maxLength={18}
                      className={cpfCnpjError ? "border-red-500" : ""}
                      required
                    />
                    {cpfCnpjError && formData.personType === "juridica" && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {cpfCnpjError}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="creci">CRECI (opcional)</Label>
                  <Input
                    id="creci"
                    name="creci"
                    placeholder="Número do CRECI"
                    value={formData.creci}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone/WhatsApp (opcional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: formatPhone(e.target.value) }))}
                      className="pl-10"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar conta"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-0">
            <div className="text-center text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Fazer login
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Benefits */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <Gift className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <span className="text-xs text-gray-600">7 dias grátis</span>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <Shield className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <span className="text-xs text-gray-600">Sem cartão</span>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <Zap className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
            <span className="text-xs text-gray-600">Acesso total</span>
          </div>
        </div>
      </div>
    </div>
  );
}
