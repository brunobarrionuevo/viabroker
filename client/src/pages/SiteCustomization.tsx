import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  Loader2, 
  Palette, 
  Image, 
  Globe, 
  Eye,
  Upload,
  ExternalLink,
  Copy,
  Check,
  Layout,
  Type,
  Share2,
  Settings
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { X, ImagePlus } from "lucide-react";
import { DNSPropagationStatus } from "@/components/DNSPropagationStatus";

const fontOptions = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Poppins", label: "Poppins" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Raleway", label: "Raleway" },
];

export default function SiteCustomization() {
  const { data: company, isLoading: loadingCompany, refetch: refetchCompany } = trpc.company.get.useQuery();
  const { data: siteSettings, isLoading: loadingSettings, refetch } = trpc.siteSettings.get.useQuery();
  const [copied, setCopied] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [slugInput, setSlugInput] = useState('');
  const [updatingSlug, setUpdatingSlug] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const [settingsData, setSettingsData] = useState({
    // Cores
    primaryColor: "#0F52BA",
    secondaryColor: "#50C878",
    accentColor: "#FF6B35",
    backgroundColor: "#FFFFFF",
    textColor: "#1F2937",
    // Tipografia
    fontFamily: "Inter",
    // Imagens e branding
    logoUrl: "",
    faviconUrl: "",
    heroImageUrl: "",
    heroTitle: "",
    heroSubtitle: "",
    // SEO
    siteTitle: "",
    siteDescription: "",
    // Redes sociais
    facebookUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
    tiktokUrl: "",
    // WhatsApp
    whatsappDefaultMessage: "",
    // Domínio
    customDomain: "",
    // Layout
    showHeroSearch: true,
    showFeaturedProperties: true,
    showTestimonials: false,
    showAboutSection: true,
    aboutText: "",
    // Contato
    showContactForm: true,
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
  });

  const updateSettingsMutation = trpc.siteSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar configurações");
    },
  });

  const verifyDomainMutation = trpc.siteSettings.verifyDomain.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        refetch();
      } else {
        toast.warning(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao verificar domínio");
    },
  });
  
  const removeDomainMutation = trpc.siteSettings.removeDomain.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setSettingsData(prev => ({ ...prev, customDomain: "" }));
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover domínio");
    },
  });
  
  // Hooks para automação de domínio via Cloudflare
  const { data: cloudflareStatus } = trpc.siteSettings.checkCloudflareStatus.useQuery();
  
  const setupDomainMutation = trpc.siteSettings.setupDomain.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        if (data.automated && data.nameServers) {
          toast.success(
            `Domínio configurado automaticamente! Configure os nameservers no seu registrador: ${data.nameServers.join(", ")}`,
            { duration: 10000 }
          );
        } else {
          toast.success(data.message);
        }
        refetch();
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao configurar domínio");
    },
  });
  
  const checkDomainCloudflareMutation = trpc.siteSettings.checkDomainCloudflare.useMutation({
    onSuccess: (data) => {
      if (data.status === 'active') {
        toast.success('Domínio ativo e funcionando!');
        refetch();
      } else if (data.status === 'pending') {
        toast.warning(`Aguardando ativação. Configure os nameservers: ${data.nameServers?.join(", ") || "Verifique no Cloudflare"}`);
      } else {
        toast.info(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao verificar domínio");
    },
  });
  
  const updateCompanyMutation = trpc.company.update.useMutation({
    onSuccess: () => {
      toast.success("URL do site atualizada com sucesso!");
      refetchCompany();
      setUpdatingSlug(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar URL do site");
      setUpdatingSlug(false);
    },
  });
  
  const handleUpdateSlug = () => {
    if (!slugInput || slugInput === company?.slug) return;
    setUpdatingSlug(true);
    updateCompanyMutation.mutate({ slug: slugInput });
  };
  
  // Inicializar slug quando company carregar
  useEffect(() => {
    if (company?.slug) {
      setSlugInput(company.slug);
    }
  }, [company?.slug]);

  useEffect(() => {
    if (siteSettings) {
      setSettingsData({
        primaryColor: siteSettings.primaryColor || "#0F52BA",
        secondaryColor: siteSettings.secondaryColor || "#50C878",
        accentColor: siteSettings.accentColor || "#FF6B35",
        backgroundColor: siteSettings.backgroundColor || "#FFFFFF",
        textColor: siteSettings.textColor || "#1F2937",
        fontFamily: siteSettings.fontFamily || "Inter",
        logoUrl: siteSettings.logoUrl || "",
        faviconUrl: siteSettings.faviconUrl || "",
        heroImageUrl: siteSettings.heroImageUrl || "",
        heroTitle: siteSettings.heroTitle || "",
        heroSubtitle: siteSettings.heroSubtitle || "",
        siteTitle: siteSettings.siteTitle || "",
        siteDescription: siteSettings.siteDescription || "",
        facebookUrl: siteSettings.facebookUrl || "",
        instagramUrl: siteSettings.instagramUrl || "",
        linkedinUrl: siteSettings.linkedinUrl || "",
        youtubeUrl: siteSettings.youtubeUrl || "",
        tiktokUrl: siteSettings.tiktokUrl || "",
        whatsappDefaultMessage: siteSettings.whatsappDefaultMessage || "",
        customDomain: siteSettings.customDomain || "",
        showHeroSearch: siteSettings.showHeroSearch ?? true,
        showFeaturedProperties: siteSettings.showFeaturedProperties ?? true,
        showTestimonials: siteSettings.showTestimonials ?? false,
        showAboutSection: siteSettings.showAboutSection ?? true,
        aboutText: siteSettings.aboutText || "",
        showContactForm: siteSettings.showContactForm ?? true,
        contactEmail: siteSettings.contactEmail || "",
        contactPhone: siteSettings.contactPhone || "",
        contactAddress: siteSettings.contactAddress || "",
      });
    }
  }, [siteSettings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settingsData);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/site/logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erro no upload");

      const data = await response.json();
      setSettingsData(prev => ({ ...prev, logoUrl: data.url }));
      toast.success("Logo enviado com sucesso!");
    } catch (error) {
      toast.error("Erro ao enviar logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFavicon(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/site/favicon", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erro no upload");

      const data = await response.json();
      setSettingsData(prev => ({ ...prev, faviconUrl: data.url }));
      toast.success("Favicon enviado com sucesso!");
    } catch (error) {
      toast.error("Erro ao enviar favicon");
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHero(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/site/hero", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erro no upload");

      const data = await response.json();
      setSettingsData(prev => ({ ...prev, heroImageUrl: data.url }));
      toast.success("Imagem de capa enviada com sucesso!");
    } catch (error) {
      toast.error("Erro ao enviar imagem de capa");
    } finally {
      setUploadingHero(false);
    }
  };

  const siteUrl = company?.slug 
    ? `${window.location.origin}/site/${company.slug}`
    : null;

  const handleCopyUrl = () => {
    if (siteUrl) {
      navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Personalização do Site</h1>
            <p className="text-muted-foreground">Configure a aparência e funcionalidades do seu site público</p>
          </div>
          {siteUrl && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                Copiar Link
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar Site
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* URL do Site */}
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <Label className="text-sm font-medium text-muted-foreground">Seu site está disponível em:</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Globe className="w-5 h-5 text-primary" />
                  <code className="text-lg font-mono bg-background px-3 py-1 rounded border">
                    {siteUrl || "Configure o slug da empresa"}
                  </code>
                </div>
              </div>
              {settingsData.customDomain && (
                <div className="flex-1">
                  <Label className="text-sm font-medium text-muted-foreground">Domínio personalizado:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <ExternalLink className="w-5 h-5 text-secondary" />
                    <code className="text-lg font-mono bg-background px-3 py-1 rounded border">
                      {settingsData.customDomain}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="colors" className="space-y-6">
            <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full">
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Cores</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                <span className="hidden sm:inline">Imagens</span>
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                <span className="hidden sm:inline">Layout</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger value="domain" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Domínio</span>
              </TabsTrigger>
            </TabsList>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Cores do Tema
                  </CardTitle>
                  <CardDescription>Personalize as cores do seu site para combinar com sua marca</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Cor Primária */}
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Cor Primária</Label>
                      <p className="text-xs text-muted-foreground">Usada em botões e destaques principais</p>
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
                          placeholder="#0F52BA"
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>

                    {/* Cor Secundária */}
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Cor Secundária</Label>
                      <p className="text-xs text-muted-foreground">Usada em elementos de suporte</p>
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
                          placeholder="#50C878"
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>

                    {/* Cor de Destaque */}
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Cor de Destaque</Label>
                      <p className="text-xs text-muted-foreground">Usada em badges e alertas</p>
                      <div className="flex gap-2">
                        <Input
                          id="accentColor"
                          type="color"
                          value={settingsData.accentColor}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settingsData.accentColor}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, accentColor: e.target.value }))}
                          placeholder="#FF6B35"
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>

                    {/* Cor de Fundo */}
                    <div className="space-y-2">
                      <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                      <p className="text-xs text-muted-foreground">Cor de fundo do site</p>
                      <div className="flex gap-2">
                        <Input
                          id="backgroundColor"
                          type="color"
                          value={settingsData.backgroundColor}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settingsData.backgroundColor}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                          placeholder="#FFFFFF"
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>

                    {/* Cor do Texto */}
                    <div className="space-y-2">
                      <Label htmlFor="textColor">Cor do Texto</Label>
                      <p className="text-xs text-muted-foreground">Cor principal dos textos</p>
                      <div className="flex gap-2">
                        <Input
                          id="textColor"
                          type="color"
                          value={settingsData.textColor}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, textColor: e.target.value }))}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settingsData.textColor}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, textColor: e.target.value }))}
                          placeholder="#1F2937"
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>

                    {/* Fonte */}
                    <div className="space-y-2">
                      <Label htmlFor="fontFamily">Fonte</Label>
                      <p className="text-xs text-muted-foreground">Tipografia do site</p>
                      <Select
                        value={settingsData.fontFamily}
                        onValueChange={(value) => setSettingsData(prev => ({ ...prev, fontFamily: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma fonte" />
                        </SelectTrigger>
                        <SelectContent>
                          {fontOptions.map((font) => (
                            <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-6">
                    <Label>Pré-visualização</Label>
                    <div 
                      className="mt-2 p-6 border rounded-lg"
                      style={{ backgroundColor: settingsData.backgroundColor }}
                    >
                      <div className="flex flex-wrap gap-4 items-center mb-4">
                        <div 
                          className="w-24 h-16 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: settingsData.primaryColor }}
                        >
                          Primária
                        </div>
                        <div 
                          className="w-24 h-16 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: settingsData.secondaryColor }}
                        >
                          Secundária
                        </div>
                        <div 
                          className="w-24 h-16 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: settingsData.accentColor }}
                        >
                          Destaque
                        </div>
                      </div>
                      <p 
                        className="text-lg"
                        style={{ color: settingsData.textColor, fontFamily: settingsData.fontFamily }}
                      >
                        Exemplo de texto com a fonte {settingsData.fontFamily}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Imagens e Branding
                  </CardTitle>
                  <CardDescription>Faça upload do logo, favicon e imagem de capa do seu site</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Logo Upload */}
                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <p className="text-xs text-muted-foreground">Recomendado: 200x60px, PNG ou JPG</p>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      {settingsData.logoUrl ? (
                        <div className="relative p-4 bg-muted rounded-lg border-2 border-dashed">
                          <img 
                            src={settingsData.logoUrl} 
                            alt="Logo preview" 
                            className="max-h-16 object-contain mx-auto"
                          />
                          <div className="flex gap-2 mt-3 justify-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => logoInputRef.current?.click()}
                              disabled={uploadingLogo}
                            >
                              {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                              <span className="ml-1">Alterar</span>
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => setSettingsData(prev => ({ ...prev, logoUrl: "" }))}
                            >
                              <X className="w-4 h-4" />
                              <span className="ml-1">Remover</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="p-8 bg-muted rounded-lg border-2 border-dashed cursor-pointer hover:bg-muted/80 transition-colors flex flex-col items-center justify-center gap-2"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          {uploadingLogo ? (
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <ImagePlus className="w-8 h-8 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Clique para enviar o logo</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Favicon Upload */}
                    <div className="space-y-2">
                      <Label>Favicon</Label>
                      <p className="text-xs text-muted-foreground">Recomendado: 32x32px, PNG ou ICO</p>
                      <input
                        ref={faviconInputRef}
                        type="file"
                        accept="image/*,.ico"
                        onChange={handleFaviconUpload}
                        className="hidden"
                      />
                      {settingsData.faviconUrl ? (
                        <div className="relative p-4 bg-muted rounded-lg border-2 border-dashed">
                          <img 
                            src={settingsData.faviconUrl} 
                            alt="Favicon preview" 
                            className="w-8 h-8 object-contain mx-auto"
                          />
                          <div className="flex gap-2 mt-3 justify-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => faviconInputRef.current?.click()}
                              disabled={uploadingFavicon}
                            >
                              {uploadingFavicon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                              <span className="ml-1">Alterar</span>
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => setSettingsData(prev => ({ ...prev, faviconUrl: "" }))}
                            >
                              <X className="w-4 h-4" />
                              <span className="ml-1">Remover</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="p-8 bg-muted rounded-lg border-2 border-dashed cursor-pointer hover:bg-muted/80 transition-colors flex flex-col items-center justify-center gap-2"
                          onClick={() => faviconInputRef.current?.click()}
                        >
                          {uploadingFavicon ? (
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <ImagePlus className="w-8 h-8 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Clique para enviar o favicon</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hero Image Upload */}
                  <div className="space-y-2">
                    <Label>Imagem de Capa (Hero)</Label>
                    <p className="text-xs text-muted-foreground">Recomendado: 1920x800px, JPG ou PNG</p>
                    <input
                      ref={heroInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleHeroUpload}
                      className="hidden"
                    />
                    {settingsData.heroImageUrl ? (
                      <div className="relative rounded-lg overflow-hidden border-2 border-dashed">
                        <img 
                          src={settingsData.heroImageUrl} 
                          alt="Hero preview" 
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => heroInputRef.current?.click()}
                            disabled={uploadingHero}
                          >
                            {uploadingHero ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            <span className="ml-1">Alterar</span>
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setSettingsData(prev => ({ ...prev, heroImageUrl: "" }))}
                          >
                            <X className="w-4 h-4" />
                            <span className="ml-1">Remover</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="p-12 bg-muted rounded-lg border-2 border-dashed cursor-pointer hover:bg-muted/80 transition-colors flex flex-col items-center justify-center gap-2"
                        onClick={() => heroInputRef.current?.click()}
                      >
                        {uploadingHero ? (
                          <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <ImagePlus className="w-10 h-10 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Clique para enviar a imagem de capa</span>
                            <span className="text-xs text-muted-foreground">Esta imagem aparecerá no topo do seu site</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hero Text */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="heroTitle">Título do Hero</Label>
                      <Input
                        id="heroTitle"
                        value={settingsData.heroTitle}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, heroTitle: e.target.value }))}
                        placeholder="Encontre o imóvel dos seus sonhos"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heroSubtitle">Subtítulo do Hero</Label>
                      <Input
                        id="heroSubtitle"
                        value={settingsData.heroSubtitle}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                        placeholder="Os melhores imóveis da região"
                      />
                    </div>
                  </div>

                  {/* SEO */}
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      SEO (Otimização para Buscadores)
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="siteTitle">Título do Site</Label>
                        <p className="text-xs text-muted-foreground">Aparece na aba do navegador e resultados do Google (máx. 70 caracteres)</p>
                        <Input
                          id="siteTitle"
                          value={settingsData.siteTitle}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, siteTitle: e.target.value }))}
                          placeholder="Imobiliária XYZ - Imóveis em São Paulo"
                          maxLength={70}
                        />
                        <p className="text-xs text-muted-foreground text-right">{settingsData.siteTitle.length}/70</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="siteDescription">Descrição do Site</Label>
                        <p className="text-xs text-muted-foreground">Aparece nos resultados do Google (máx. 160 caracteres)</p>
                        <Textarea
                          id="siteDescription"
                          value={settingsData.siteDescription}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, siteDescription: e.target.value }))}
                          placeholder="Encontre casas, apartamentos e terrenos para compra e aluguel. Atendimento personalizado e os melhores imóveis da região."
                          maxLength={160}
                          rows={2}
                        />
                        <p className="text-xs text-muted-foreground text-right">{settingsData.siteDescription.length}/160</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="w-5 h-5" />
                    Layout e Seções
                  </CardTitle>
                  <CardDescription>Configure quais seções aparecem no seu site</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {/* Toggle Sections */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">Busca no Hero</Label>
                        <p className="text-sm text-muted-foreground">Exibir campo de busca na seção principal</p>
                      </div>
                      <Switch
                        checked={settingsData.showHeroSearch}
                        onCheckedChange={(checked) => setSettingsData(prev => ({ ...prev, showHeroSearch: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">Imóveis em Destaque</Label>
                        <p className="text-sm text-muted-foreground">Exibir seção com imóveis destacados</p>
                      </div>
                      <Switch
                        checked={settingsData.showFeaturedProperties}
                        onCheckedChange={(checked) => setSettingsData(prev => ({ ...prev, showFeaturedProperties: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">Seção Sobre</Label>
                        <p className="text-sm text-muted-foreground">Exibir seção sobre a empresa</p>
                      </div>
                      <Switch
                        checked={settingsData.showAboutSection}
                        onCheckedChange={(checked) => setSettingsData(prev => ({ ...prev, showAboutSection: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">Depoimentos</Label>
                        <p className="text-sm text-muted-foreground">Exibir seção de depoimentos de clientes</p>
                      </div>
                      <Switch
                        checked={settingsData.showTestimonials}
                        onCheckedChange={(checked) => setSettingsData(prev => ({ ...prev, showTestimonials: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="font-medium">Formulário de Contato</Label>
                        <p className="text-sm text-muted-foreground">Exibir formulário de contato no rodapé</p>
                      </div>
                      <Switch
                        checked={settingsData.showContactForm}
                        onCheckedChange={(checked) => setSettingsData(prev => ({ ...prev, showContactForm: checked }))}
                      />
                    </div>
                  </div>

                  {/* About Text */}
                  {settingsData.showAboutSection && (
                    <div className="space-y-2 pt-4 border-t">
                      <Label htmlFor="aboutText">Texto Sobre a Empresa</Label>
                      <Textarea
                        id="aboutText"
                        value={settingsData.aboutText}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, aboutText: e.target.value }))}
                        placeholder="Conte um pouco sobre sua imobiliária, sua história, valores e diferenciais..."
                        rows={4}
                      />
                    </div>
                  )}

                  {/* Contact Info */}
                  {settingsData.showContactForm && (
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-semibold">Informações de Contato</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contactEmail">E-mail de Contato</Label>
                          <Input
                            id="contactEmail"
                            type="email"
                            value={settingsData.contactEmail}
                            onChange={(e) => setSettingsData(prev => ({ ...prev, contactEmail: e.target.value }))}
                            placeholder="contato@suaimobiliaria.com.br"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactPhone">Telefone de Contato</Label>
                          <Input
                            id="contactPhone"
                            value={settingsData.contactPhone}
                            onChange={(e) => setSettingsData(prev => ({ ...prev, contactPhone: e.target.value }))}
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactAddress">Endereço</Label>
                        <Textarea
                          id="contactAddress"
                          value={settingsData.contactAddress}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, contactAddress: e.target.value }))}
                          placeholder="Rua Exemplo, 123 - Bairro - Cidade/UF"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Redes Sociais
                  </CardTitle>
                  <CardDescription>Configure os links das suas redes sociais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagramUrl">Instagram</Label>
                      <Input
                        id="instagramUrl"
                        value={settingsData.instagramUrl}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, instagramUrl: e.target.value }))}
                        placeholder="https://instagram.com/seu-perfil"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebookUrl">Facebook</Label>
                      <Input
                        id="facebookUrl"
                        value={settingsData.facebookUrl}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, facebookUrl: e.target.value }))}
                        placeholder="https://facebook.com/sua-pagina"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtubeUrl">YouTube</Label>
                      <Input
                        id="youtubeUrl"
                        value={settingsData.youtubeUrl}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                        placeholder="https://youtube.com/@seu-canal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktokUrl">TikTok</Label>
                      <Input
                        id="tiktokUrl"
                        value={settingsData.tiktokUrl}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, tiktokUrl: e.target.value }))}
                        placeholder="https://tiktok.com/@seu-perfil"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedinUrl">LinkedIn</Label>
                      <Input
                        id="linkedinUrl"
                        value={settingsData.linkedinUrl}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                        placeholder="https://linkedin.com/company/sua-empresa"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="whatsappDefaultMessage">Mensagem Padrão do WhatsApp</Label>
                      <p className="text-xs text-muted-foreground">Mensagem pré-preenchida quando o cliente clicar no botão do WhatsApp</p>
                      <Textarea
                        id="whatsappDefaultMessage"
                        value={settingsData.whatsappDefaultMessage}
                        onChange={(e) => setSettingsData(prev => ({ ...prev, whatsappDefaultMessage: e.target.value }))}
                        placeholder="Olá! Gostaria de saber mais sobre os imóveis disponíveis..."
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Domain Tab */}
            <TabsContent value="domain" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Domínio Personalizado
                  </CardTitle>
                  <CardDescription>Configure um domínio próprio para seu site imobiliário</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Free Domain */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      Domínio Gratuito Ativo
                    </h3>
                    <p className="text-sm text-green-700 mb-3">
                      Seu site já está disponível gratuitamente em:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-3 py-2 rounded border text-green-800 font-mono flex-1">
                        {siteUrl || "Configure o slug da empresa"}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (siteUrl) {
                            window.open(siteUrl, '_blank');
                          }
                        }}
                        title="Abrir site"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Edição do Slug */}
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <Label htmlFor="slug" className="text-sm font-medium text-green-800">Personalizar URL do site</Label>
                      <p className="text-xs text-green-600 mb-2">
                        Escolha um nome único para a URL do seu site (apenas letras minúsculas, números e hífens)
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-700 font-mono whitespace-nowrap">{window.location.origin}/site/</span>
                        <Input
                          id="slug"
                          value={slugInput}
                          onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="sua-imobiliaria"
                          className="flex-1 font-mono bg-white"
                          maxLength={100}
                        />
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          disabled={!slugInput || slugInput === company?.slug || updatingSlug}
                          onClick={handleUpdateSlug}
                        >
                          {updatingSlug ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Salvar"
                          )}
                        </Button>
                      </div>
                      {slugInput && slugInput !== company?.slug && (
                        <p className="text-xs text-green-600 mt-1">
                          Nova URL: {window.location.origin}/site/{slugInput}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Custom Domain */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customDomain" className="text-base font-semibold">Domínio Próprio (Opcional)</Label>
                      <p className="text-sm text-muted-foreground">
                        Conecte seu próprio domínio para profissionalizar ainda mais seu site. 
                        {cloudflareStatus?.configured && cloudflareStatus?.connected && (
                          <span className="text-green-600 font-medium"> A configuração será feita automaticamente!</span>
                        )}
                      </p>
                      <div className="flex gap-2">
                        <Input
                          id="customDomain"
                          value={settingsData.customDomain}
                          onChange={(e) => setSettingsData(prev => ({ ...prev, customDomain: e.target.value.toLowerCase().trim() }))}
                          placeholder="www.suaimobiliaria.com.br"
                          className="font-mono flex-1"
                        />
                        {cloudflareStatus?.configured && cloudflareStatus?.connected && settingsData.customDomain && !siteSettings?.domainVerified && (
                          <Button
                            type="button"
                            variant="default"
                            disabled={setupDomainMutation.isPending}
                            onClick={() => {
                              setupDomainMutation.mutate({ domain: settingsData.customDomain });
                            }}
                          >
                            {setupDomainMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Configurando...
                              </>
                            ) : (
                              <>
                                <Globe className="w-4 h-4 mr-2" />
                                Configurar Automaticamente
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      
                      {/* Instruções Detalhadas de Configuração */}
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <Globe className="w-5 h-5" />
                          Como configurar seu domínio personalizado
                        </h4>
                        
                        <div className="space-y-4 text-sm">
                          {/* Passo 1 */}
                          <div className="flex gap-3">
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                              1
                            </div>
                            <div>
                              <p className="font-medium text-blue-900">Registre seu domínio</p>
                              <p className="text-blue-700 text-xs mt-1">
                                Se ainda não tem um domínio, registre em sites como <a href="https://registro.br" target="_blank" rel="noopener" className="underline font-medium">Registro.br</a>, <a href="https://godaddy.com" target="_blank" rel="noopener" className="underline font-medium">GoDaddy</a> ou <a href="https://hostgator.com.br" target="_blank" rel="noopener" className="underline font-medium">HostGator</a>.
                              </p>
                            </div>
                          </div>
                          
                          {/* Passo 2 */}
                          <div className="flex gap-3">
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                              2
                            </div>
                            <div>
                              <p className="font-medium text-blue-900">Acesse o painel DNS do seu provedor</p>
                              <p className="text-blue-700 text-xs mt-1">
                                Entre no site onde registrou o domínio e procure por "Gerenciar DNS", "Zona DNS" ou "Configurações de DNS".
                              </p>
                            </div>
                          </div>
                          
                          {/* Passo 3 - Configuração DNS */}
                          <div className="flex gap-3">
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                              3
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-blue-900 mb-2">Configure os registros DNS</p>
                              
                              {/* Nameservers Cloudflare */}
                              <div className="bg-white p-3 rounded border border-blue-300 mb-3">
                                <p className="text-xs font-bold text-blue-900 mb-2">✅ OPÇÃO RECOMENDADA: Alterar Nameservers para Cloudflare</p>
                                <p className="text-xs text-blue-700 mb-2">Substitua os nameservers atuais pelos do Cloudflare:</p>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <code className="bg-blue-100 px-2 py-1 rounded font-mono text-xs text-blue-900 flex-1">meg.ns.cloudflare.com</code>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => {
                                        navigator.clipboard.writeText('meg.ns.cloudflare.com');
                                        toast.success('Copiado!');
                                      }}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <code className="bg-blue-100 px-2 py-1 rounded font-mono text-xs text-blue-900 flex-1">julian.ns.cloudflare.com</code>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => {
                                        navigator.clipboard.writeText('julian.ns.cloudflare.com');
                                        toast.success('Copiado!');
                                      }}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-xs text-blue-600 mt-2">
                                  💡 Com essa opção, o SSL e todas as configurações são feitas automaticamente!
                                </p>
                              </div>
                              

                            </div>
                          </div>
                          
                          {/* Passo 4 */}
                          <div className="flex gap-3">
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                              4
                            </div>
                            <div>
                              <p className="font-medium text-blue-900">Salve e aguarde a propagação</p>
                              <p className="text-blue-700 text-xs mt-1">
                                Após salvar, digite seu domínio acima e clique em "Salvar Configurações". A propagação pode levar de <strong>15 minutos até 48 horas</strong>.
                              </p>
                            </div>
                          </div>
                          
                          {/* Aviso importante */}
                          <div className="bg-amber-50 border border-amber-300 rounded p-3 mt-3">
                            <p className="text-xs text-amber-800">
                              <strong>⚠️ Importante:</strong> Após configurar o DNS, entre em contato com nosso suporte para ativarmos seu domínio. Envie um email para <a href="mailto:suporte@viabroker.app" className="underline font-medium">suporte@viabroker.app</a> com o domínio que deseja ativar.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Domínio já configurado e verificado */}
                    {siteSettings?.customDomain && siteSettings?.domainVerified && (
                      <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                          <Check className="w-5 h-5" />
                          Domínio Personalizado Ativo
                        </h4>
                        <p className="text-sm text-green-700 mb-3">
                          Seu site está disponível em:
                        </p>
                        <div className="flex items-center gap-2 mb-4">
                          <code className="bg-white px-3 py-2 rounded border text-green-800 font-mono flex-1">
                            https://{siteSettings.customDomain}
                          </code>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(`https://${siteSettings.customDomain}`, '_blank')}
                            title="Abrir site"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-green-200">
                          <p className="text-xs text-green-600">
                            Também disponível em: viabroker.app/site/{company?.slug}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={removeDomainMutation.isPending}
                            onClick={() => {
                              if (confirm('Tem certeza que deseja remover o domínio personalizado? Seu site continuará disponível em viabroker.app.')) {
                                removeDomainMutation.mutate();
                              }
                            }}
                          >
                            {removeDomainMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Removendo...
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                Remover Domínio
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Indicador de Propagação DNS - Mostra quando há domínio configurado e automação ativa */}
                    {siteSettings?.customDomain && cloudflareStatus?.configured && (
                      <div className="space-y-3">
                        <DNSPropagationStatus 
                          domain={siteSettings.customDomain}
                          onStatusChange={(status) => {
                            if (status === 'active') {
                              refetch();
                            }
                          }}
                        />
                        
                        {/* Botão para remover domínio */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div>
                            <p className="text-sm text-gray-600">
                              Deseja voltar para o domínio padrão da plataforma?
                            </p>
                            <p className="text-xs text-gray-500">
                              Seu site continuará disponível em: viabroker.app/site/{company?.slug}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                            disabled={removeDomainMutation.isPending}
                            onClick={() => {
                              if (confirm('Tem certeza que deseja remover o domínio personalizado? Seu site continuará disponível em viabroker.app.')) {
                                removeDomainMutation.mutate();
                              }
                            }}
                          >
                            {removeDomainMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Removendo...
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                Remover Domínio
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Domínio configurado mas não verificado (sem automação) */}
                    {siteSettings?.customDomain && !siteSettings?.domainVerified && !cloudflareStatus?.configured && (
                      <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Aguardando Ativação
                        </h4>
                        <p className="text-sm text-yellow-700 mb-3">
                          O domínio <strong>{siteSettings.customDomain}</strong> foi configurado, mas ainda está aguardando ativação.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={checkDomainCloudflareMutation.isPending || verifyDomainMutation.isPending}
                            onClick={() => {
                              if (cloudflareStatus?.configured) {
                                checkDomainCloudflareMutation.mutate();
                              } else {
                                verifyDomainMutation.mutate();
                              }
                            }}
                          >
                            {(checkDomainCloudflareMutation.isPending || verifyDomainMutation.isPending) ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Verificando...
                              </>
                            ) : (
                              <>
                                <Globe className="w-4 h-4 mr-2" />
                                Verificar Status
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Instruções manuais (mostrar apenas se automação não estiver configurada) */}
                    {settingsData.customDomain && !cloudflareStatus?.configured && (
                      <div className="space-y-4">
                        {/* Instruções Detalhadas - Apenas Nameservers */}
                        <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                              1
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-blue-900 mb-2">Acesse o painel do seu provedor de domínio</h4>
                              <p className="text-sm text-blue-800 mb-2">
                                Entre no site onde você registrou seu domínio e faça login.
                              </p>
                              <div className="bg-white/70 p-3 rounded border border-blue-300 text-xs">
                                <p className="font-medium text-blue-900 mb-1">Provedores comuns no Brasil:</p>
                                <ul className="list-disc list-inside text-blue-800 space-y-0.5">
                                  <li><a href="https://registro.br" target="_blank" rel="noopener" className="underline font-medium">Registro.br</a></li>
                                  <li><a href="https://godaddy.com" target="_blank" rel="noopener" className="underline font-medium">GoDaddy</a></li>
                                  <li><a href="https://hostgator.com.br" target="_blank" rel="noopener" className="underline font-medium">HostGator</a></li>
                                  <li><a href="https://locaweb.com.br" target="_blank" rel="noopener" className="underline font-medium">Locaweb</a></li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                              2
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-blue-900 mb-2">Localize a seção de Nameservers (DNS)</h4>
                              <p className="text-sm text-blue-800 mb-2">
                                Procure por opções como: "Alterar Nameservers", "Servidores DNS", "DNS Servers" ou "Nameservers".
                              </p>
                              <p className="text-xs text-blue-600">
                                💡 No Registro.br, vá em "Meus Domínios" &gt; clique no domínio &gt; "Alterar servidores DNS"
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                              3
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-blue-900 mb-2">Altere os Nameservers para Cloudflare</h4>
                              <p className="text-sm text-blue-800 mb-3">
                                Substitua os nameservers atuais pelos seguintes:
                              </p>
                              
                              <div className="bg-white p-4 rounded border-2 border-blue-400 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-blue-600 mb-1">Nameserver 1:</p>
                                    <code className="bg-blue-100 px-3 py-2 rounded font-mono text-blue-900 font-bold text-lg">meg.ns.cloudflare.com</code>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText('meg.ns.cloudflare.com');
                                      toast.success('Copiado!');
                                    }}
                                  >
                                    <Copy className="w-4 h-4 mr-1" />
                                    Copiar
                                  </Button>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-blue-600 mb-1">Nameserver 2:</p>
                                    <code className="bg-blue-100 px-3 py-2 rounded font-mono text-blue-900 font-bold text-lg">julian.ns.cloudflare.com</code>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText('julian.ns.cloudflare.com');
                                      toast.success('Copiado!');
                                    }}
                                  >
                                    <Copy className="w-4 h-4 mr-1" />
                                    Copiar
                                  </Button>
                                </div>
                              </div>
                              
                              <p className="text-xs text-green-700 mt-3 bg-green-50 p-2 rounded border border-green-200">
                                ✅ Com os nameservers do Cloudflare, o SSL e todas as configurações são feitas automaticamente!
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                              4
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-blue-900 mb-2">Salve e aguarde a propagação</h4>
                              <p className="text-sm text-blue-800 mb-2">
                                Após salvar os nameservers, digite seu domínio acima e clique em "Salvar Configurações".
                              </p>
                              <div className="bg-amber-50 border border-amber-300 rounded p-3 text-xs text-amber-800">
                                <p className="font-medium mb-1">⏳ Tempo de propagação:</p>
                                <p>A propagação dos nameservers pode levar de <strong>15 minutos até 48 horas</strong>. 
                                Na maioria dos casos, funciona em 1-4 horas.</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                              5
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-green-900 mb-2">Entre em contato para ativação</h4>
                              <p className="text-sm text-green-800 mb-2">
                                Após configurar os nameservers, envie um email para ativarmos seu domínio:
                              </p>
                              <a 
                                href="mailto:suporte@viabroker.app?subject=Ativação de Domínio Personalizado&body=Olá! Gostaria de ativar meu domínio personalizado.%0A%0ADomínio: %0AEmail da conta: "
                                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                                suporte@viabroker.app
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            disabled={verifyDomainMutation.isPending || !settingsData.customDomain}
                            onClick={() => {
                              verifyDomainMutation.mutate();
                            }}
                          >
                            {verifyDomainMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Verificando...
                              </>
                            ) : (
                              <>
                                <Globe className="w-4 h-4 mr-2" />
                                Verificar Status
                              </>
                            )}
                          </Button>
                          
                          {settingsData.customDomain && (
                            <Button
                              type="button"
                              variant="destructive"
                              disabled={removeDomainMutation.isPending}
                              onClick={() => {
                                if (confirm('Tem certeza que deseja remover o domínio personalizado?')) {
                                  removeDomainMutation.mutate();
                                }
                              }}
                            >
                              {removeDomainMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Removendo...
                                </>
                              ) : (
                                <>
                                  <X className="w-4 h-4 mr-2" />
                                  Remover Domínio
                                </>
                              )}
                            </Button>
                          )}
                          
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              const helpUrl = 'https://help.manus.im';
                              window.open(helpUrl, '_blank');
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ajuda
                          </Button>
                        </div>

                        {/* Troubleshooting */}
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Problemas Comuns
                          </h4>
                          <ul className="text-sm text-gray-700 space-y-2">
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 font-bold flex-shrink-0">•</span>
                              <div>
                                <strong>Erro "Domínio não encontrado":</strong> Verifique se digitou o domínio corretamente e se o registro DNS foi salvo.
                              </div>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 font-bold flex-shrink-0">•</span>
                              <div>
                                <strong>Demora na propagação:</strong> DNS pode levar até 48h. Teste em <a href="https://dnschecker.org" target="_blank" rel="noopener" className="underline text-blue-600">dnschecker.org</a>
                              </div>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 font-bold flex-shrink-0">•</span>
                              <div>
                                <strong>Registro.br não aceita CNAME em @:</strong> Use um subdomínio como <code className="text-xs">www</code> ou configure redirecionamento.
                              </div>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-500 font-bold flex-shrink-0">•</span>
                              <div>
                                <strong>Já tenho um site no domínio:</strong> O CNAME substituirá o apontamento atual. Considere usar um subdomínio (ex: <code className="text-xs">imoveis.seudominio.com.br</code>).
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end pt-6">
            <Button type="submit" size="lg" disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Todas as Configurações
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
