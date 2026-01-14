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
import { Loader2, Building2, Globe, Palette, User, Lock, CreditCard, Eye, EyeOff, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatPhone } from "@/lib/formatters";

export default function Settings() {
  const { data: company, isLoading: loadingCompany } = trpc.company.get.useQuery();
  const { data: siteSettings, isLoading: loadingSettings } = trpc.siteSettings.get.useQuery();
  const { data: plans, isLoading: loadingPlans } = trpc.plans.list.useQuery();

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

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao alterar senha");
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

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As senhas não correspondem");
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  // Validações de senha
  const hasMinLength = passwordData.newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword);
  const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length > 0;

  const currentPlan = plans?.find(p => p.id === company?.planId);

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
          <TabsList className="flex-wrap h-auto">
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
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Senha
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Plano
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
                        placeholder="CRECI 12345-F"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={companyData.email}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="contato@empresa.com.br"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={companyData.phone}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={companyData.whatsapp}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, whatsapp: formatPhone(e.target.value) }))}
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        value={companyData.address}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Rua, número, complemento"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={companyData.city}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="São Paulo"
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={companyData.state}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, state: e.target.value.toUpperCase().slice(0, 2) }))}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input
                        id="zipCode"
                        value={companyData.zipCode}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, zipCode: e.target.value }))}
                        placeholder="00000-000"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={companyData.description}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva sua empresa..."
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateCompanyMutation.isPending}>
                      {updateCompanyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar Alterações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* Site Tab */}
          <TabsContent value="site">
            <form onSubmit={handleSettingsSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Site</CardTitle>
                  <CardDescription>Personalize as informações e integrações do seu site</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="siteTitle">Título do Site</Label>
                      <Input
                        id="siteTitle"
                        value={settingsData.siteTitle}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, siteTitle: e.target.value }))}
                        placeholder="Imobiliária XYZ"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="siteDescription">Descrição do Site</Label>
                      <Textarea
                        id="siteDescription"
                        value={settingsData.siteDescription}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, siteDescription: e.target.value }))}
                        placeholder="Descrição para SEO..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="facebookUrl">Facebook</Label>
                      <Input
                        id="facebookUrl"
                        value={settingsData.facebookUrl}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, facebookUrl: e.target.value }))}
                        placeholder="https://facebook.com/..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="instagramUrl">Instagram</Label>
                      <Input
                        id="instagramUrl"
                        value={settingsData.instagramUrl}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, instagramUrl: e.target.value }))}
                        placeholder="https://instagram.com/..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="linkedinUrl">LinkedIn</Label>
                      <Input
                        id="linkedinUrl"
                        value={settingsData.linkedinUrl}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                        placeholder="https://linkedin.com/..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="youtubeUrl">YouTube</Label>
                      <Input
                        id="youtubeUrl"
                        value={settingsData.youtubeUrl}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                        placeholder="https://youtube.com/..."
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="whatsappDefaultMessage">Mensagem Padrão WhatsApp</Label>
                      <Textarea
                        id="whatsappDefaultMessage"
                        value={settingsData.whatsappDefaultMessage}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, whatsappDefaultMessage: e.target.value }))}
                        placeholder="Olá! Tenho interesse em um imóvel..."
                        rows={3}
                      />
                    </div>

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
                        placeholder="123456789012345"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateSettingsMutation.isPending}>
                      {updateSettingsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar Alterações
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                          className="w-20 h-10"
                        />
                        <Input
                          value={settingsData.primaryColor}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, primaryColor: e.target.value }))}
                          placeholder="#1e40af"
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
                          className="w-20 h-10"
                        />
                        <Input
                          value={settingsData.secondaryColor}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          placeholder="#059669"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="fontFamily">Fonte</Label>
                      <Input
                        id="fontFamily"
                        value={settingsData.fontFamily}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, fontFamily: e.target.value }))}
                        placeholder="Inter, Roboto, Arial..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateSettingsMutation.isPending}>
                      {updateSettingsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar Alterações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password">
            <form onSubmit={handlePasswordSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                  <CardDescription>Mantenha sua conta segura atualizando sua senha regularmente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Senha Atual</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Digite sua senha atual"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Digite sua nova senha"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Digite novamente sua nova senha"
                          className={passwordData.confirmPassword.length > 0 ? (passwordsMatch ? "border-green-500" : "border-red-500") : ""}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Requisitos de senha */}
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-semibold mb-2">Requisitos da senha:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        {hasMinLength ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className={hasMinLength ? "text-green-600" : "text-muted-foreground"}>
                          Mínimo de 8 caracteres
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {hasUpperCase ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className={hasUpperCase ? "text-green-600" : "text-muted-foreground"}>
                          Pelo menos 1 letra maiúscula
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {hasSpecialChar ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className={hasSpecialChar ? "text-green-600" : "text-muted-foreground"}>
                          Pelo menos 1 caractere especial (!@#$%^&*...)
                        </span>
                      </div>
                      {passwordData.confirmPassword.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          {passwordsMatch ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-red-600" />
                          )}
                          <span className={passwordsMatch ? "text-green-600" : "text-red-600"}>
                            As senhas correspondem
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={
                        changePasswordMutation.isPending || 
                        !hasMinLength || 
                        !hasUpperCase || 
                        !hasSpecialChar || 
                        !passwordsMatch ||
                        !passwordData.currentPassword
                      }
                    >
                      {changePasswordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Alterar Senha
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* Plan Tab */}
          <TabsContent value="plan">
            <Card>
              <CardHeader>
                <CardTitle>Meu Plano</CardTitle>
                <CardDescription>Visualize seu plano atual e faça upgrade quando necessário</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plano Atual */}
                {currentPlan && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                        {currentPlan.isCourtesy && (
                          <Badge variant="secondary" className="mt-2">Plano Cortesia</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">
                          {currentPlan.isCourtesy ? "Gratuito" : `R$ ${parseFloat(currentPlan.price).toFixed(2)}`}
                        </p>
                        {!currentPlan.isCourtesy && <p className="text-sm text-muted-foreground">/mês</p>}
                      </div>
                    </div>
                    
                    {currentPlan.description && (
                      <p className="text-muted-foreground mb-4">{currentPlan.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Até {currentPlan.maxProperties} imóveis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Até {currentPlan.maxUsers} usuários</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{currentPlan.maxPhotosPerProperty} fotos por imóvel</span>
                      </div>
                      {currentPlan.hasAI && (
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm">IA para descrições ({currentPlan.aiCreditsPerDay > 0 ? `${currentPlan.aiCreditsPerDay}/dia` : "Ilimitado"})</span>
                        </div>
                      )}
                      {currentPlan.hasWhatsappIntegration && (
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Integração WhatsApp</span>
                        </div>
                      )}
                      {currentPlan.hasPortalIntegration && (
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Integração com portais</span>
                        </div>
                      )}
                      {currentPlan.hasCustomDomain && (
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Domínio personalizado</span>
                        </div>
                      )}
                    </div>


                  </div>
                )}

                {/* Outros Planos Disponíveis */}
                {!currentPlan?.isCourtesy && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Outros Planos Disponíveis</h3>
                    {loadingPlans ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans?.filter(p => p.id !== company?.planId && !p.isCourtesy).map((plan) => (
                          <Card key={plan.id} className="hover:border-primary/50 transition-colors">
                            <CardHeader>
                              <CardTitle className="text-lg">{plan.name}</CardTitle>
                              <div className="text-2xl font-bold">
                                R$ {parseFloat(plan.price).toFixed(2)}
                                <span className="text-sm font-normal text-muted-foreground">/mês</span>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {plan.description && (
                                <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                              )}
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span>Até {plan.maxProperties} imóveis</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span>Até {plan.maxUsers} usuários</span>
                                </div>
                                {plan.hasAI && (
                                  <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-600" />
                                    <span>IA para descrições</span>
                                  </div>
                                )}
                              </div>
                              <Button 
                                className="w-full mt-4" 
                                variant={parseFloat(plan.price) > parseFloat(currentPlan?.price || "0") ? "default" : "outline"}
                                onClick={() => {
                                  toast.info("Entre em contato com o suporte para alterar seu plano");
                                }}
                              >
                                {parseFloat(plan.price) > parseFloat(currentPlan?.price || "0") ? "Fazer Upgrade" : "Selecionar Plano"}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {currentPlan?.isCourtesy && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Você está em um plano cortesia com funcionalidades completas. 
                      Entre em contato com o suporte para mais informações sobre planos pagos.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
