import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/lib/trpc";
import { Building2, User, Loader2, ArrowRight, CheckCircle, Search, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

// Funções de validação de CPF/CNPJ
function cleanDocument(doc: string): string {
  return doc.replace(/\D/g, '');
}

function isInvalidSequence(doc: string): boolean {
  const invalidSequences = [
    '00000000000', '11111111111', '22222222222', '33333333333',
    '44444444444', '55555555555', '66666666666', '77777777777',
    '88888888888', '99999999999', '00000000000000', '11111111111111',
    '22222222222222', '33333333333333', '44444444444444', '55555555555555',
    '66666666666666', '77777777777777', '88888888888888', '99999999999999',
  ];
  return invalidSequences.includes(doc);
}

function validateCPF(cpf: string): boolean {
  const cleaned = cleanDocument(cpf);
  if (cleaned.length !== 11 || isInvalidSequence(cleaned)) return false;
  
  const digits = cleaned.split('').map(Number);
  
  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  let remainder = sum % 11;
  const firstVerifier = remainder < 2 ? 0 : 11 - remainder;
  if (digits[9] !== firstVerifier) return false;
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
  remainder = sum % 11;
  const secondVerifier = remainder < 2 ? 0 : 11 - remainder;
  if (digits[10] !== secondVerifier) return false;
  
  return true;
}

function validateCNPJ(cnpj: string): boolean {
  const cleaned = cleanDocument(cnpj);
  if (cleaned.length !== 14 || isInvalidSequence(cleaned)) return false;
  
  const digits = cleaned.split('').map(Number);
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += digits[i] * weights1[i];
  let remainder = sum % 11;
  const firstVerifier = remainder < 2 ? 0 : 11 - remainder;
  if (digits[12] !== firstVerifier) return false;
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 13; i++) sum += digits[i] * weights2[i];
  remainder = sum % 11;
  const secondVerifier = remainder < 2 ? 0 : 11 - remainder;
  if (digits[13] !== secondVerifier) return false;
  
  return true;
}

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
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
    cep: "",
    address: "",
    neighborhood: "",
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

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 8);
    return numbers.replace(/(\d{5})(\d)/, "$1-$2");
  };

  // Validar documento ao sair do campo
  const handleDocumentBlur = () => {
    setDocumentError(null);
    
    if (formData.personType === "fisica" && formData.cpf) {
      if (!validateCPF(formData.cpf)) {
        setDocumentError("CPF inválido. Verifique os dígitos informados.");
      }
    } else if (formData.personType === "juridica" && formData.cnpj) {
      if (!validateCNPJ(formData.cnpj)) {
        setDocumentError("CNPJ inválido. Verifique os dígitos informados.");
      }
    }
  };

  // Buscar endereço pelo CEP
  const searchCEP = async () => {
    const cleanedCep = formData.cep.replace(/\D/g, "");
    if (cleanedCep.length !== 8) {
      toast.error("CEP deve ter 8 dígitos");
      return;
    }

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      setFormData(prev => ({
        ...prev,
        address: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
      }));
      toast.success("Endereço preenchido automaticamente!");
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  // Auto-buscar CEP quando tiver 8 dígitos
  useEffect(() => {
    const cleanedCep = formData.cep.replace(/\D/g, "");
    if (cleanedCep.length === 8) {
      searchCEP();
    }
  }, [formData.cep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Por favor, informe o nome");
      return;
    }

    if (formData.personType === "fisica") {
      if (!formData.cpf) {
        toast.error("Por favor, informe o CPF");
        return;
      }
      if (!validateCPF(formData.cpf)) {
        toast.error("CPF inválido. Verifique os dígitos informados.");
        return;
      }
    }

    if (formData.personType === "juridica") {
      if (!formData.cnpj) {
        toast.error("Por favor, informe o CNPJ");
        return;
      }
      if (!validateCNPJ(formData.cnpj)) {
        toast.error("CNPJ inválido. Verifique os dígitos informados.");
        return;
      }
    }

    const slug = formData.slug || generateSlug(formData.name);

    createCompanyMutation.mutate({
      name: formData.name,
      slug,
      personType: formData.personType,
      cpf: formData.personType === "fisica" ? formData.cpf.replace(/\D/g, "") : undefined,
      cnpj: formData.personType === "juridica" ? formData.cnpj.replace(/\D/g, "") : undefined,
      creci: formData.creci || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      whatsapp: formData.whatsapp || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.cep.replace(/\D/g, "") || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <img src="/viabroker-logo.png" alt="Viabroker" className="w-10 h-10 object-contain" />
          </div>
          <CardTitle className="text-2xl">Bem-vindo ao Viabroker!</CardTitle>
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
                  onValueChange={(value) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      personType: value as "fisica" | "juridica",
                      cpf: "",
                      cnpj: ""
                    }));
                    setDocumentError(null);
                  }}
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
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }));
                        setDocumentError(null);
                      }}
                      onBlur={handleDocumentBlur}
                      placeholder="000.000.000-00"
                      className={documentError ? "border-red-500" : ""}
                    />
                    {documentError && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {documentError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, cnpj: formatCNPJ(e.target.value) }));
                        setDocumentError(null);
                      }}
                      onBlur={handleDocumentBlur}
                      placeholder="00.000.000/0000-00"
                      className={documentError ? "border-red-500" : ""}
                    />
                    {documentError && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {documentError}
                      </p>
                    )}
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
                  if (formData.personType === "fisica") {
                    if (!formData.cpf) {
                      toast.error("Por favor, informe o CPF");
                      return;
                    }
                    if (!validateCPF(formData.cpf)) {
                      toast.error("CPF inválido. Verifique os dígitos informados.");
                      return;
                    }
                  }
                  if (formData.personType === "juridica") {
                    if (!formData.cnpj) {
                      toast.error("Por favor, informe o CNPJ");
                      return;
                    }
                    if (!validateCNPJ(formData.cnpj)) {
                      toast.error("CNPJ inválido. Verifique os dígitos informados.");
                      return;
                    }
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

                {/* CEP com busca automática */}
                <div className="sm:col-span-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => setFormData(prev => ({ ...prev, cep: formatCEP(e.target.value) }))}
                      placeholder="00000-000"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={searchCEP}
                      disabled={cepLoading}
                    >
                      {cepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Digite o CEP para preencher o endereço automaticamente
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua, Avenida, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                    placeholder="Bairro"
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
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="slug">URL do seu site</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">viabroker.app/</span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
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
                Seu cadastro foi realizado com sucesso. Você será redirecionado para o dashboard em instantes...
              </p>
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
