import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Building2, Globe, Palette, User } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { data: company, isLoading: loadingCompany } = trpc.company.get.useQuery();
  const { data: siteSettings, isLoading: loadingSettings } = trpc.siteSettings.get.useQuery();

  const [companyData, setCompanyData] = useState({
    name: "",
    personType: "juridica" as "fisica" | "juridica",
    cpf: "",
    cnpj: "",
    creci: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    description: "",
  });

  const [settingsData, setSettingsData] = useState({
    primaryColor: "#1e40af",
    secondaryColor: "#059669",
    fontFamily: "Inter",
    siteTitle: "",
    siteDescription: "",
    facebookUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
    whatsappDefaultMessage: "",
    googleAnalyticsId: "",
    facebookPixelId: "",
  });

  const updateCompanyMutation = trpc.company.update.useMutation({
    onSuccess: () => {
      toast.success("Dados da empresa atualizados!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar dados");
    },
  });

  const updateSettingsMutation = trpc.siteSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações do site atualizadas!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar configurações");
    },
  });

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

  useEffect(() => {
    if (company) {
      setCompanyData({
        name: company.name,
        personType: (company.personType as "fisica" | "juridica") || "juridica",
        cpf: company.cpf || "",
        cnpj: company.cnpj || "",
        creci: company.creci || "",
        email: company.email || "",
        phone: company.phone || "",
        whatsapp: company.whatsapp || "",
        address: company.address || "",
        city: company.city || "",
        state: company.state || "",
        zipCode: company.zipCode || "",
        description: company.description || "",
      });
    }
  }, [company]);

  useEffect(() => {
    if (siteSettings) {
      setSettingsData({
        primaryColor: siteSettings.primaryColor || "#1e40af",
        secondaryColor: siteSettings.secondaryColor || "#059669",
        fontFamily: siteSettings.fontFamily || "Inter",
        siteTitle: siteSettings.siteTitle || "",
        siteDescription: siteSettings.siteDescription || "",
        facebookUrl: siteSettings.facebookUrl || "",
        instagramUrl: siteSettings.instagramUrl || "",
        linkedinUrl: siteSettings.linkedinUrl || "",
        youtubeUrl: siteSettings.youtubeUrl || "",
        whatsappDefaultMessage: siteSettings.whatsappDefaultMessage || "",
        googleAnalyticsId: siteSettings.googleAnalyticsId || "",
        facebookPixelId: siteSettings.facebookPixelId || "",
      });
    }
  }, [siteSettings]);

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyMutation.mutate({
      name: companyData.name,
      personType: companyData.personType,
      cpf: companyData.personType === "fisica" ? companyData.cpf : undefined,
      cnpj: companyData.personType === "juridica" ? companyData.cnpj : undefined,
      creci: companyData.creci || undefined,
      email: companyData.email || undefined,
      phone: companyData.phone || undefined,
      whatsapp: companyData.whatsapp || undefined,
      address: companyData.address || undefined,
      city: companyData.city || undefined,
      state: companyData.state || undefined,
      zipCode: companyData.zipCode || undefined,
      description: companyData.description || undefined,
    });
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settingsData);
  };

  if (loadingCompany || loadingSettings) {
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações da sua empresa e site</p>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="site" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Site
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Aparência
            </TabsTrigger>
          </TabsList>

          {/* Company Tab */}
          <TabsContent value="company">
            <form onSubmit={handleCompanySubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Dados da Empresa</CardTitle>
                  <CardDescription>Informações básicas da sua imobiliária ou corretora</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tipo de Pessoa */}
                  <div>
                    <Label className="text-base font-semibold mb-4 block">Tipo de Cadastro</Label>
                    <RadioGroup
                      value={companyData.personType}
                      onValueChange={(value) => setCompanyData(prev => ({ 
                        ...prev, 
                        personType: value as "fisica" | "juridica"
                      }))}
                      className="flex gap-4"
                    >
                      <Label
                        htmlFor="settings-fisica"
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                          companyData.personType === "fisica" 
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value="fisica" id="settings-fisica" />
                        <User className="w-4 h-4" />
                        <span>Pessoa Física (CPF)</span>
                      </Label>
                      <Label
                        htmlFor="settings-juridica"
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                          companyData.personType === "juridica" 
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value="juridica" id="settings-juridica" />
                        <Building2 className="w-4 h-4" />
                        <span>Pessoa Jurídica (CNPJ)</span>
                      </Label>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="name">
                        {companyData.personType === "fisica" ? "Nome Completo" : "Razão Social / Nome Fantasia"}
                      </Label>
                      <Input
                        id="name"
                        value={companyData.name}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    {companyData.personType === "fisica" ? (
                      <div>
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          value={companyData.cpf}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                          placeholder="000.000.000-00"
                        />
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input
                          id="cnpj"
                          value={companyData.cnpj}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, cnpj: formatCNPJ(e.target.value) }))}
                          placeholder="00.000.000/0000-00"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="creci">CRECI</Label>
                      <Input
                        id="creci"
                        value={companyData.creci}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, creci: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={companyData.email}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={companyData.phone}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={companyData.whatsapp}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, whatsapp: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={companyData.address}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={companyData.city}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={companyData.state}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, state: e.target.value }))}
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input
                        id="zipCode"
                        value={companyData.zipCode}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, zipCode: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={companyData.description}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Sobre a sua empresa..."
                      rows={4}
                    />
                  </div>
                  <Button type="submit" disabled={updateCompanyMutation.isPending}>
                    {updateCompanyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* Site Tab */}
          <TabsContent value="site">
            <form onSubmit={handleSettingsSubmit}>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>SEO e Meta Tags</CardTitle>
                    <CardDescription>Configure como seu site aparece nos buscadores</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="siteTitle">Título do Site</Label>
                      <Input
                        id="siteTitle"
                        value={settingsData.siteTitle}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, siteTitle: e.target.value }))}
                        placeholder="Nome da sua imobiliária"
                        maxLength={70}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{settingsData.siteTitle.length}/70 caracteres</p>
                    </div>
                    <div>
                      <Label htmlFor="siteDescription">Descrição do Site</Label>
                      <Textarea
                        id="siteDescription"
                        value={settingsData.siteDescription}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, siteDescription: e.target.value }))}
                        placeholder="Descrição que aparecerá nos resultados de busca"
                        maxLength={160}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{settingsData.siteDescription.length}/160 caracteres</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Redes Sociais</CardTitle>
                    <CardDescription>Links para suas redes sociais</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="facebookUrl">Facebook</Label>
                        <Input
                          id="facebookUrl"
                          value={settingsData.facebookUrl}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, facebookUrl: e.target.value }))}
                          placeholder="https://facebook.com/sua-pagina"
                        />
                      </div>
                      <div>
                        <Label htmlFor="instagramUrl">Instagram</Label>
                        <Input
                          id="instagramUrl"
                          value={settingsData.instagramUrl}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, instagramUrl: e.target.value }))}
                          placeholder="https://instagram.com/seu-perfil"
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedinUrl">LinkedIn</Label>
                        <Input
                          id="linkedinUrl"
                          value={settingsData.linkedinUrl}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                          placeholder="https://linkedin.com/company/sua-empresa"
                        />
                      </div>
                      <div>
                        <Label htmlFor="youtubeUrl">YouTube</Label>
                        <Input
                          id="youtubeUrl"
                          value={settingsData.youtubeUrl}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                          placeholder="https://youtube.com/@seu-canal"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Integrações</CardTitle>
                    <CardDescription>Configure integrações com ferramentas de marketing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                        <Input
                          id="googleAnalyticsId"
                          value={settingsData.googleAnalyticsId}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
                          placeholder="G-XXXXXXXXXX"
                        />
                      </div>
                      <div>
                        <Label htmlFor="facebookPixelId">Facebook Pixel ID</Label>
                        <Input
                          id="facebookPixelId"
                          value={settingsData.facebookPixelId}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, facebookPixelId: e.target.value }))}
                          placeholder="000000000000000"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="whatsappDefaultMessage">Mensagem Padrão do WhatsApp</Label>
                      <Textarea
                        id="whatsappDefaultMessage"
                        value={settingsData.whatsappDefaultMessage}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, whatsappDefaultMessage: e.target.value }))}
                        placeholder="Olá! Tenho interesse em saber mais sobre os imóveis..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Button type="submit" disabled={updateSettingsMutation.isPending}>
                  {updateSettingsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Configurações
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <form onSubmit={handleSettingsSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Aparência do Site</CardTitle>
                  <CardDescription>Personalize as cores e fontes do seu site</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primaryColor">Cor Primária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={settingsData.primaryColor}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settingsData.primaryColor}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, primaryColor: e.target.value }))}
                          placeholder="#1e40af"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondaryColor">Cor Secundária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={settingsData.secondaryColor}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settingsData.secondaryColor}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          placeholder="#059669"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Pré-visualização</Label>
                    <div className="mt-2 p-6 border rounded-lg bg-muted/30">
                      <div className="flex gap-4 items-center">
                        <div 
                          className="w-20 h-20 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: settingsData.primaryColor }}
                        >
                          Primária
                        </div>
                        <div 
                          className="w-20 h-20 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: settingsData.secondaryColor }}
                        >
                          Secundária
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={updateSettingsMutation.isPending}>
                    {updateSettingsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar Aparência
                  </Button>
                </CardContent>
              </Card>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
