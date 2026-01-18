import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Wand2, Search, Image, Sparkles, Upload, Trash2, Star, GripVertical } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

// Funções de formatação
const formatCurrency = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (!numbers) return "";
  const cents = parseInt(numbers, 10);
  const reais = cents / 100;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reais);
};

const parseCurrencyToNumber = (value: string): number => {
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
};

// Função para formatar número (do banco) para exibição em moeda brasileira
const formatNumberToCurrency = (value: string | number | null | undefined): string => {
  if (!value) return "";
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatCEP = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 8);
  return numbers.replace(/(\d{5})(\d)/, "$1-$2");
};

const propertyTypes = [
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
  { value: "rural", label: "Rural" },
  { value: "cobertura", label: "Cobertura" },
  { value: "flat", label: "Flat" },
  { value: "kitnet", label: "Kitnet" },
  { value: "sobrado", label: "Sobrado" },
  { value: "galpao", label: "Galpão" },
  { value: "sala_comercial", label: "Sala Comercial" },
  { value: "loja", label: "Loja" },
  { value: "outro", label: "Outro" },
];

const purposeOptions = [
  { value: "venda", label: "Venda" },
  { value: "aluguel", label: "Aluguel" },
  { value: "venda_aluguel", label: "Venda e Aluguel" },
];

const statusOptions = [
  { value: "disponivel", label: "Disponível" },
  { value: "reservado", label: "Reservado" },
  { value: "vendido", label: "Vendido" },
  { value: "alugado", label: "Alugado" },
  { value: "inativo", label: "Inativo" },
];

const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function PropertyForm() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const isEditing = !!params.id;

  const [cepLoading, setCepLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 20;

  const [formData, setFormData] = useState({
    title: "",
    code: "",
    description: "",
    type: "apartamento" as const,
    purpose: "venda" as "venda" | "aluguel" | "venda_aluguel",
    salePrice: "",
    rentPrice: "",
    condoFee: "",
    iptuAnnual: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    totalArea: "",
    builtArea: "",
    bedrooms: 0,
    suites: 0,
    bathrooms: 0,
    parkingSpaces: 0,
    status: "disponivel" as const,
    isHighlight: false,
    isPublished: true,
    metaTitle: "",
    metaDescription: "",
    videoUrl: "",
    hideAddress: false,
    // Detalhes do imóvel
    hasServiceArea: false,
    hasBedroomCloset: false,
    hasKitchenCabinets: false,
    isFurnished: false,
    hasAirConditioning: false,
    hasBarbecue: false,
    hasBalcony: false,
    hasGourmetBalcony: false,
    hasServiceRoom: false,
    // Detalhes do condomínio
    isGatedCommunity: false,
    hasElevator: false,
    has24hSecurity: false,
    hasLobby: false,
    allowsPets: false,
    hasGym: false,
    hasPool: false,
    hasPartyRoom: false,
    hasGourmetSpace: false,
    hasSauna: false,
    hasVisitorParking: false,
    hasLaundry: false,
  });

  const { data: property, isLoading: loadingProperty, isError: propertyError } = trpc.properties.get.useQuery(
    { id: Number(params.id) },
    { enabled: isEditing }
  );

  const { data: images, isLoading: loadingImages, refetch: refetchImages } = trpc.properties.getImages.useQuery(
    { propertyId: Number(params.id) },
    { enabled: isEditing && !!params.id }
  );

  // Redirecionar se o imóvel não for encontrado (pode ser imóvel de parceiro)
  useEffect(() => {
    if (isEditing && propertyError) {
      toast.error("Imóvel não encontrado ou você não tem permissão para editá-lo");
      navigate("/dashboard/properties");
    }
  }, [isEditing, propertyError, navigate]);

  const createMutation = trpc.properties.create.useMutation({
    onSuccess: () => {
      toast.success("Imóvel cadastrado com sucesso!");
      navigate("/dashboard/properties");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar imóvel");
    },
  });

  const updateMutation = trpc.properties.update.useMutation({
    onSuccess: () => {
      toast.success("Imóvel atualizado com sucesso!");
      navigate("/dashboard/properties");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar imóvel");
    },
  });

  const generateDescriptionMutation = trpc.properties.generateDescription.useMutation({
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, description: typeof data.description === 'string' ? data.description : '' }));
      toast.success("Descrição gerada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar descrição");
    },
  });

  const addImageMutation = trpc.properties.addImage.useMutation({
    onSuccess: () => {
      refetchImages();
      toast.success("Imagem adicionada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar imagem");
    },
  });

  const deleteImageMutation = trpc.properties.deleteImage.useMutation({
    onSuccess: () => {
      refetchImages();
      toast.success("Imagem removida!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover imagem");
    },
  });

  const setMainImageMutation = trpc.properties.setMainImage.useMutation({
    onSuccess: () => {
      refetchImages();
      toast.success("Imagem principal definida!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao definir imagem principal");
    },
  });

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title,
        code: property.code || "",
        description: property.description || "",
        type: property.type as any,
        purpose: property.purpose as any,
        salePrice: formatNumberToCurrency(property.salePrice),
        rentPrice: formatNumberToCurrency(property.rentPrice),
        condoFee: formatNumberToCurrency(property.condoFee),
        iptuAnnual: formatNumberToCurrency(property.iptuAnnual),
        address: property.address || "",
        number: property.number || "",
        complement: property.complement || "",
        neighborhood: property.neighborhood || "",
        city: property.city,
        state: property.state,
        zipCode: property.zipCode || "",
        totalArea: property.totalArea || "",
        builtArea: property.builtArea || "",
        bedrooms: property.bedrooms || 0,
        suites: property.suites || 0,
        bathrooms: property.bathrooms || 0,
        parkingSpaces: property.parkingSpaces || 0,
        status: property.status as any,
        isHighlight: property.isHighlight,
        isPublished: property.isPublished,
        metaTitle: property.metaTitle || "",
        metaDescription: property.metaDescription || "",
        videoUrl: property.videoUrl || "",
        hideAddress: property.hideAddress || false,
        // Detalhes do imóvel
        hasServiceArea: property.hasServiceArea || false,
        hasBedroomCloset: property.hasBedroomCloset || false,
        hasKitchenCabinets: property.hasKitchenCabinets || false,
        isFurnished: property.isFurnished || false,
        hasAirConditioning: property.hasAirConditioning || false,
        hasBarbecue: property.hasBarbecue || false,
        hasBalcony: property.hasBalcony || false,
        hasGourmetBalcony: property.hasGourmetBalcony || false,
        hasServiceRoom: property.hasServiceRoom || false,
        // Detalhes do condomínio
        isGatedCommunity: property.isGatedCommunity || false,
        hasElevator: property.hasElevator || false,
        has24hSecurity: property.has24hSecurity || false,
        hasLobby: property.hasLobby || false,
        allowsPets: property.allowsPets || false,
        hasGym: property.hasGym || false,
        hasPool: property.hasPool || false,
        hasPartyRoom: property.hasPartyRoom || false,
        hasGourmetSpace: property.hasGourmetSpace || false,
        hasSauna: property.hasSauna || false,
        hasVisitorParking: property.hasVisitorParking || false,
        hasLaundry: property.hasLaundry || false,
      });
    }
  }, [property]);

  // Função para converter valor formatado (1.000,00) para string numérica (1000.00)
  const parseCurrencyToString = (value: string): string => {
    if (!value) return "";
    const cleaned = value.replace(/\./g, "").replace(",", ".");
    return cleaned;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converter valores monetários formatados para formato numérico
    const dataToSubmit = {
      ...formData,
      salePrice: parseCurrencyToString(formData.salePrice),
      rentPrice: parseCurrencyToString(formData.rentPrice),
      condoFee: parseCurrencyToString(formData.condoFee),
      iptuAnnual: parseCurrencyToString(formData.iptuAnnual),
    };
    
    if (isEditing) {
      updateMutation.mutate({ id: Number(params.id), ...dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleGenerateDescription = () => {
    generateDescriptionMutation.mutate({
      title: formData.title,
      type: formData.type,
      purpose: formData.purpose,
      city: formData.city,
      state: formData.state,
      neighborhood: formData.neighborhood,
      bedrooms: formData.bedrooms,
      suites: formData.suites,
      bathrooms: formData.bathrooms,
      parkingSpaces: formData.parkingSpaces,
      totalArea: formData.totalArea,
      builtArea: formData.builtArea,
    });
  };

  // Função para buscar endereço pelo CEP
  const searchCEP = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, "");
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
        address: data.logradouro || prev.address,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
      toast.success("Endereço preenchido automaticamente!");
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  // Funções de gerenciamento de imagens
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = images?.length || 0;
    const remainingSlots = MAX_IMAGES - currentCount;
    
    if (remainingSlots <= 0) {
      toast.error(`Limite de ${MAX_IMAGES} fotos atingido`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    if (files.length > remainingSlots) {
      toast.warning(`Apenas ${remainingSlots} fotos serão enviadas (limite de ${MAX_IMAGES})`);
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));

        // Validar tipo de arquivo
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} não é uma imagem válida`);
          continue;
        }

        // Validar tamanho (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} excede o limite de 10MB`);
          continue;
        }

        // Fazer upload para S3
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Erro no upload");
        }

        const { url, key } = await response.json();

        // Salvar referência no banco
        await addImageMutation.mutateAsync({
          propertyId: Number(params.id),
          url,
          fileKey: key,
          order: currentCount + i,
          isMain: currentCount === 0 && i === 0, // Primeira imagem é a principal
        });
      }

      toast.success(`${filesToUpload.length} imagem(ns) enviada(s) com sucesso!`);
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao enviar imagens");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteImage = (imageId: number) => {
    if (confirm("Tem certeza que deseja remover esta imagem?")) {
      deleteImageMutation.mutate({ id: imageId });
    }
  };

  const handleSetMainImage = (imageId: number) => {
    setMainImageMutation.mutate({ propertyId: Number(params.id), imageId });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingProperty) {
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" asChild>
            <Link href="/dashboard/properties">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Editar Imóvel" : "Novo Imóvel"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Atualize as informações do imóvel" : "Preencha os dados do imóvel"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Localização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">CEP</Label>
                    <div className="flex gap-2">
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => {
                          const formatted = formatCEP(e.target.value);
                          setFormData(prev => ({ ...prev, zipCode: formatted }));
                          // Auto-buscar quando tiver 8 dígitos
                          if (formatted.replace(/\D/g, "").length === 8) {
                            searchCEP(formatted);
                          }
                        }}
                        placeholder="00000-000"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => searchCEP(formData.zipCode)}
                        disabled={cepLoading}
                      >
                        {cepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Rua, Avenida..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={formData.complement}
                      onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                      placeholder="Apto, Bloco..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Select 
                      key={`state-${formData.state}`}
                      value={formData.state} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, state: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {brazilianStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Apartamento 3 quartos no Centro"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">Código</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Ex: APT-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo *</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="purpose">Finalidade *</Label>
                    <Select value={formData.purpose} onValueChange={(v) => setFormData(prev => ({ ...prev, purpose: v as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a finalidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {purposeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateDescription}
                      disabled={generateDescriptionMutation.isPending}
                    >
                      {generateDescriptionMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Gerar com IA
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o imóvel..."
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Para gerar uma descrição mais completa com IA, recomendamos preencher todos os campos do cadastro antes.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Characteristics */}
            <Card>
              <CardHeader>
                <CardTitle>Características</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Quartos</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min="0"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="suites">Suítes</Label>
                    <Input
                      id="suites"
                      type="number"
                      min="0"
                      value={formData.suites}
                      onChange={(e) => setFormData(prev => ({ ...prev, suites: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Banheiros</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min="0"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parkingSpaces">Vagas</Label>
                    <Input
                      id="parkingSpaces"
                      type="number"
                      min="0"
                      value={formData.parkingSpaces}
                      onChange={(e) => setFormData(prev => ({ ...prev, parkingSpaces: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalArea">Área Total (m²)</Label>
                    <Input
                      id="totalArea"
                      value={formData.totalArea}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalArea: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="builtArea">Área Construída (m²)</Label>
                    <Input
                      id="builtArea"
                      value={formData.builtArea}
                      onChange={(e) => setFormData(prev => ({ ...prev, builtArea: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detalhes do Imóvel */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Imóvel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasServiceArea"
                      checked={formData.hasServiceArea}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasServiceArea: checked }))}
                    />
                    <Label htmlFor="hasServiceArea" className="cursor-pointer">Area de Serviço</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasBedroomCloset"
                      checked={formData.hasBedroomCloset}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasBedroomCloset: checked }))}
                    />
                    <Label htmlFor="hasBedroomCloset" className="cursor-pointer">Armário no Quarto</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasKitchenCabinets"
                      checked={formData.hasKitchenCabinets}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasKitchenCabinets: checked }))}
                    />
                    <Label htmlFor="hasKitchenCabinets" className="cursor-pointer">Armário na Cozinha</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isFurnished"
                      checked={formData.isFurnished}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFurnished: checked }))}
                    />
                    <Label htmlFor="isFurnished" className="cursor-pointer">Mobiliado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasAirConditioning"
                      checked={formData.hasAirConditioning}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasAirConditioning: checked }))}
                    />
                    <Label htmlFor="hasAirConditioning" className="cursor-pointer">Ar Condicionado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasBarbecue"
                      checked={formData.hasBarbecue}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasBarbecue: checked }))}
                    />
                    <Label htmlFor="hasBarbecue" className="cursor-pointer">Churrasqueira</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasBalcony"
                      checked={formData.hasBalcony}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasBalcony: checked }))}
                    />
                    <Label htmlFor="hasBalcony" className="cursor-pointer">Varanda</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasGourmetBalcony"
                      checked={formData.hasGourmetBalcony}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasGourmetBalcony: checked }))}
                    />
                    <Label htmlFor="hasGourmetBalcony" className="cursor-pointer">Varanda Gourmet</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasServiceRoom"
                      checked={formData.hasServiceRoom}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasServiceRoom: checked }))}
                    />
                    <Label htmlFor="hasServiceRoom" className="cursor-pointer">Quarto de Serviço</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detalhes do Condomínio */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Condomínio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isGatedCommunity"
                      checked={formData.isGatedCommunity}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isGatedCommunity: checked }))}
                    />
                    <Label htmlFor="isGatedCommunity" className="cursor-pointer">Condomínio Fechado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasElevator"
                      checked={formData.hasElevator}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasElevator: checked }))}
                    />
                    <Label htmlFor="hasElevator" className="cursor-pointer">Elevador</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has24hSecurity"
                      checked={formData.has24hSecurity}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has24hSecurity: checked }))}
                    />
                    <Label htmlFor="has24hSecurity" className="cursor-pointer">Segurança 24h</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasLobby"
                      checked={formData.hasLobby}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasLobby: checked }))}
                    />
                    <Label htmlFor="hasLobby" className="cursor-pointer">Portaria 24h</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowsPets"
                      checked={formData.allowsPets}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowsPets: checked }))}
                    />
                    <Label htmlFor="allowsPets" className="cursor-pointer">Permite Animais</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasGym"
                      checked={formData.hasGym}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasGym: checked }))}
                    />
                    <Label htmlFor="hasGym" className="cursor-pointer">Academia</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasPool"
                      checked={formData.hasPool}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasPool: checked }))}
                    />
                    <Label htmlFor="hasPool" className="cursor-pointer">Piscina</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasPartyRoom"
                      checked={formData.hasPartyRoom}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasPartyRoom: checked }))}
                    />
                    <Label htmlFor="hasPartyRoom" className="cursor-pointer">Salão de Festa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasGourmetSpace"
                      checked={formData.hasGourmetSpace}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasGourmetSpace: checked }))}
                    />
                    <Label htmlFor="hasGourmetSpace" className="cursor-pointer">Espaço Gourmet</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasSauna"
                      checked={formData.hasSauna}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasSauna: checked }))}
                    />
                    <Label htmlFor="hasSauna" className="cursor-pointer">Sauna</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasVisitorParking"
                      checked={formData.hasVisitorParking}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasVisitorParking: checked }))}
                    />
                    <Label htmlFor="hasVisitorParking" className="cursor-pointer">Estacionamento Visitantes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasLaundry"
                      checked={formData.hasLaundry}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasLaundry: checked }))}
                    />
                    <Label htmlFor="hasLaundry" className="cursor-pointer">Lavanderia</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Valores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(formData.purpose === "venda" || formData.purpose === "venda_aluguel") && (
                  <div>
                    <Label htmlFor="salePrice">Preço de Venda</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <Input
                        id="salePrice"
                        value={formData.salePrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, salePrice: formatCurrency(e.target.value) }))}
                        placeholder="0,00"
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}
                {(formData.purpose === "aluguel" || formData.purpose === "venda_aluguel") && (
                  <div>
                    <Label htmlFor="rentPrice">Valor do Aluguel</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <Input
                        id="rentPrice"
                        value={formData.rentPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, rentPrice: formatCurrency(e.target.value) }))}
                        placeholder="0,00"
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="condoFee">Condomínio</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="condoFee"
                      value={formData.condoFee}
                      onChange={(e) => setFormData(prev => ({ ...prev, condoFee: formatCurrency(e.target.value) }))}
                      placeholder="0,00"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="iptuAnnual">IPTU Anual</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="iptuAnnual"
                      value={formData.iptuAnnual}
                      onChange={(e) => setFormData(prev => ({ ...prev, iptuAnnual: formatCurrency(e.target.value) }))}
                      placeholder="0,00"
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mídia - Vídeo */}
            <Card>
              <CardHeader>
                <CardTitle>Vídeo do Imóvel</CardTitle>
                <CardDescription>Cole o link do YouTube ou Vimeo</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="videoUrl">URL do Vídeo</Label>
                  <Input
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Suporta YouTube e Vimeo
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isPublished">Publicado</Label>
                    <p className="text-xs text-muted-foreground">Visível no site</p>
                  </div>
                  <Switch
                    id="isPublished"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isHighlight">Destaque</Label>
                    <p className="text-xs text-muted-foreground">Exibir na home</p>
                  </div>
                  <Switch
                    id="isHighlight"
                    checked={formData.isHighlight}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isHighlight: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="hideAddress">Ocultar Endereço</Label>
                    <p className="text-xs text-muted-foreground">Não mostrar endereço completo no site</p>
                  </div>
                  <Switch
                    id="hideAddress"
                    checked={formData.hideAddress}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hideAddress: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {isEditing ? (
                <Button type="button" variant="secondary" asChild>
                  <Link href={`/dashboard/properties/${params.id}/images`}>
                    <Image className="w-4 h-4 mr-2" />
                    Gerenciar Fotos
                  </Link>
                </Button>
              ) : (
                <Button 
                  type="button" 
                  variant="secondary" 
                  disabled
                  title="Salve o imóvel primeiro para adicionar fotos"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Gerenciar Fotos (disponível após salvar)
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? "Salvar Alterações" : "Cadastrar Imóvel"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/properties">Cancelar</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}
