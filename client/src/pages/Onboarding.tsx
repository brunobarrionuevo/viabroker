import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Building2, User, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    personType: "juridica" as "fisica" | "juridica",
    name: "",
    slug: "",
    cpf: "",
    cnpj: "",
    creci: "",
    email: user?.email || "",
    phone: "",
    whatsapp: "",
    city: "",
    state: "",
  });

  const utils = trpc.useUtils();

  const createCompanyMutation = trpc.company.create.useMutation({
    onSuccess: () => {
      toast.success("Cadastro realizado com sucesso!");
      utils.auth.me.invalidate();
      utils.company.get.invalidate();
      setStep(3);
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar cadastro");
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 14);
    return numbers
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Por favor, informe o nome");
      return;
    }

    if (formData.personType === "fisica" && !formData.cpf) {
      toast.error("Por favor, informe o CPF");
      return;
    }

    if (formData.personType === "juridica" && !formData.cnpj) {
      toast.error("Por favor, informe o CNPJ");
      return;
    }

    const slug = formData.slug || generateSlug(formData.name);

    createCompanyMutation.mutate({
      name: formData.name,
      slug,
      personType: formData.personType,
      cpf: formData.personType === "fisica" ? formData.cpf : undefined,
      cnpj: formData.personType === "juridica" ? formData.cnpj : undefined,
      creci: formData.creci || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      whatsapp: formData.whatsapp || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Bem-vindo ao ImobiPro!</CardTitle>
          <CardDescription>
            {step === 1 && "Vamos configurar seu perfil para começar"}
            {step === 2 && "Complete seus dados para finalizar o cadastro"}
            {step === 3 && "Cadastro concluído com sucesso!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-4 block">Você é:</Label>
                <RadioGroup
                  value={formData.personType}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    personType: value as "fisica" | "juridica",
                    cpf: "",
                    cnpj: ""
                  }))}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="fisica"
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.personType === "fisica" 
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="fisica" id="fisica" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Pessoa Física</p>
                        <p className="text-sm text-muted-foreground">Corretor Autônomo</p>
                      </div>
                    </div>
                  </Label>
                  <Label
                    htmlFor="juridica"
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.personType === "juridica" 
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="juridica" id="juridica" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Pessoa Jurídica</p>
                        <p className="text-sm text-muted-foreground">Imobiliária / Empresa</p>
                      </div>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">
                    {formData.personType === "fisica" ? "Nome Completo *" : "Razão Social / Nome Fantasia *"}
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        name,
                        slug: generateSlug(name)
                      }));
                    }}
                    placeholder={formData.personType === "fisica" ? "João da Silva" : "Imobiliária Exemplo"}
                  />
                </div>

                {formData.personType === "fisica" ? (
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                      placeholder="000.000.000-00"
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => setFormData(prev => ({ ...prev, cnpj: formatCNPJ(e.target.value) }))}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="creci">CRECI</Label>
                  <Input
                    id="creci"
                    value={formData.creci}
                    onChange={(e) => setFormData(prev => ({ ...prev, creci: e.target.value }))}
                    placeholder="CRECI-SP 123456"
                  />
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => {
                  if (!formData.name.trim()) {
                    toast.error("Por favor, informe o nome");
                    return;
                  }
                  if (formData.personType === "fisica" && !formData.cpf) {
                    toast.error("Por favor, informe o CPF");
                    return;
                  }
                  if (formData.personType === "juridica" && !formData.cnpj) {
                    toast.error("Por favor, informe o CNPJ");
                    return;
                  }
                  setStep(2);
                }}
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: formatPhone(e.target.value) }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase().slice(0, 2) }))}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="slug">URL do seu site</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">imobipro.com/</span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                      placeholder="sua-imobiliaria"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este será o endereço do seu site público
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Voltar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createCompanyMutation.isPending}
                >
                  {createCompanyMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      Finalizar Cadastro
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tudo pronto!</h3>
              <p className="text-muted-foreground mb-6">
                Seu cadastro foi concluído com sucesso. Você será redirecionado para o dashboard.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Redirecionando...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
